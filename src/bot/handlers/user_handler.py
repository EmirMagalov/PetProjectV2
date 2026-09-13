from aiogram import Router,F,types
from aiogram.filters import CommandStart, Command
from common.config import settings
user_router = Router()

@user_router.message(CommandStart)
async def start_handler(message: types.Message):
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="Открыть игру",
                    web_app=types.WebAppInfo(url=settings.DOMAIN)
                )
            ]
        ]
    )
    await message.answer('Привет!',reply_markup=keyboard)
