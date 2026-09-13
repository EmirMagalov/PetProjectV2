import asyncio
from common.config import settings
from aiogram import Bot, Dispatcher
from bot.handlers.user_handler import user_router
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
dp = Dispatcher()

async def main():
   await dp.start_polling(bot)

dp.include_router(user_router)
if __name__ == "__main__":
   asyncio.run(main())