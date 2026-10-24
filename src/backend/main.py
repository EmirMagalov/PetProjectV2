from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from backend.routers.pet import pet_router
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from backend.services.pet import pet_tick_job
from bot.workers.pet import check_pet_notifications_job

from common.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- СТАРТ ПРИЛОЖЕНИЯ ---
    scheduler.add_job(
        pet_tick_job, "interval", minutes=1, max_instances=1, coalesce=True
    )
    scheduler.add_job(
        check_pet_notifications_job,
        "interval",
        minutes=1,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    print("🚀 APScheduler successfully started")

    yield  # В этот момент приложение работает и принимает запросы

    # --- ЗАВЕРШЕНИЕ РАБОТЫ ПРИЛОЖЕНИЯ ---
    print("🛑 Остановка APScheduler...")
    # wait=False позволяет завершить процесс быстро, не дожидаясь выполнения текущих минутных задач
    scheduler.shutdown(wait=False)


app = FastAPI(lifespan=lifespan)
scheduler = AsyncIOScheduler()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL
    ],  # В продакшене лучше указать конкретный домен, но для разработки "*" идеально
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_tortoise(
    app,
    db_url=settings.DATABASE_URL,
    modules={
        "models": ["backend.models.pet"]
    },  # Указываем весь пакет models, чтобы подтянулись все файлы внутри (включая pet.py)
    generate_schemas=False,
    add_exception_handlers=True,
)

TORTOISE_ORM = {
    "connections": {
        "default": settings.DATABASE_URL,
    },
    "apps": {
        "models": {
            "models": [
                "backend.models.pet",
                "aerich.models",
            ],  # Должно совпадать с тем, что выше
            "default_connection": "default",
            "migrations": "backend.migrations",  # Лучше назвать папку осмысленно, например, backend.migrations вместо myapp.migrations
        },
    },
}

app.include_router(pet_router)
