from aiogram import Router, F, types
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
    text = '''Привет! 👋 Добро пожаловать в нашу уютную игру!

            Здесь ты сможешь заботиться о своем питомце, кормить его вкусняшками из холодильника, купать и играть.

            Нажимай кнопку ниже, чтобы запустить приложение и начать приключение! 🐾'''
    await message.answer(text, reply_markup=keyboard)
