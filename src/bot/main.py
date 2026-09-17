import asyncio
from aiogram import Bot, Dispatcher
from tortoise import Tortoise
from common.config import settings
from bot.handlers.user_handler import user_router

bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
dp = Dispatcher()


async def main():
    # 👉 1. Инициализируем подключение к базе данных ПЕРЕД запуском бота
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["backend.models.pet"]}
    )
    print("✅ База данных успешно подключена в боте!")

    dp.include_router(user_router)

    try:
        await dp.start_polling(bot)
    finally:
        # Корректно закрываем соединения при выходе
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())