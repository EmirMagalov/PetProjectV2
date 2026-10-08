from aiogram import Router, types,F
from aiogram.filters import Command
from common.config import settings
from aiogram.types import FSInputFile
from aiogram.utils.media_group import MediaGroupBuilder
from common.config import ADMIN_IDS
user_router = Router()

PHOTO_CACHE = {
    "photo1": None,
    "photo2": None
}


@user_router.message(Command("start"))
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

    # media_group = MediaGroupBuilder(
    #     caption="Привет! 👋 Добро пожаловать в нашу уютную игру!\n\nЗдесь ты сможешь заботиться о своем питомце... 🐾"
    # )
    text = "Добро пожаловать в нашу уютную игру!\n\nЗдесь ты сможешь заботиться о своем питомце... 🐾"
    # Если file_id еще не сохранен — загружаем с диска, иначе берем из кэша
    # p1 = PHOTO_CACHE["photo1"] or FSInputFile("bot/photo/instructions1.jpg")
    # p2 = PHOTO_CACHE["photo2"] or FSInputFile("bot/photo/instructions2.jpg")

    # media_group.add_photo(media=p1)
    # media_group.add_photo(media=p2)

    # Отправляем альбом и забираем ответ от Telegram, чтобы сохранить file_id
    # sent_messages = await message.answer_media_group(media=media_group.build())

    # Если мы отправляли файлы с диска, Telegram пришлет нам объекты с уже готовыми file_id
    # if not PHOTO_CACHE["photo1"] and sent_messages:
    #     PHOTO_CACHE["photo1"] = sent_messages[0].photo[-1].file_id
    #     PHOTO_CACHE["photo2"] = sent_messages[1].photo[-1].file_id

    await message.answer(
        f"{text}\n\nНажимай кнопку ниже, чтобы запустить приложение и начать приключение! 👇",
        reply_markup=keyboard
    )


@user_router.message(F.text.lower().startswith("отзыв"))
async def feedback_handler(message: types.Message):
    # Извлекаем сам текст отзыва (убираем слово "Отзыв:")
    feedback_text = message.text[6:].strip()

    if not feedback_text:
        await message.answer("⚠️ Вы написали «Отзыв:», но забыли добавить сам текст. Попробуйте еще раз!")
        return

    # Формируем информацию об отправителе
    user_info = (
        f"📩 **Новый отзыв!**\n\n"
        f"👤 **От:** {message.from_user.full_name} "
        f"(@{message.from_user.username or 'без_юзернейма'})\n"
        f"🆔 **ID:** `{message.from_user.id}`\n\n"
        f"💬 **Текст:**\n{feedback_text}"
    )

    try:
        # Отправляем сообщение администратору
        for admin in ADMIN_IDS:
            await message.bot.send_message(
                chat_id=admin,
                text=user_info,
                parse_mode="Markdown"
            )

        # Подтверждаем пользователю отправку
        await message.answer("✨ Спасибо за отзыв!")

    except Exception as e:
        await message.answer("❌ Произошла ошибка при отправке отзыва. Попробуйте позже.")
        print(f"Ошибка отправки отзыва админу: {e}")
