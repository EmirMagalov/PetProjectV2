from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from backend.routers.pet import pet_router

from bot.workers.pet import check_pets_loop
from common.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker_task = asyncio.create_task(check_pets_loop())
    print("🚀 Background worker successfully started ")

    yield  # В этот момент приложение работает и обрабатывает запросы

    # --- КОД ПРИ ВЫКЛЮЧЕНИИ СЕРВЕРА (если нужно корректно остановить воркер) ---
    worker_task.cancel()
    try:
        print('ok')
        await worker_task
    except asyncio.CancelledError:
        print("🛑 Фоновый воркер остановлен.")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене лучше указать конкретный домен, но для разработки "*" идеально
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

)
register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={"models": ["backend.models.pet"]}, # Указываем весь пакет models, чтобы подтянулись все файлы внутри (включая pet.py)
    generate_schemas=True,
    add_exception_handlers=True,
)

TORTOISE_ORM = {
    "connections": {
        "default": settings.DATABASE_URL,
    },
    "apps": {
        "models": {
            "models": ["backend.models.pet"], # Должно совпадать с тем, что выше
            "default_connection": "default",
            "migrations": "backend.migrations", # Лучше назвать папку осмысленно, например, backend.migrations вместо myapp.migrations
        },
    },
}

app.include_router(pet_router)
