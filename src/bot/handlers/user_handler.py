from aiogram import Router, F, types
from aiogram.filters import CommandStart, Command
from common.config import settings
from backend.models.pet import Pet as PetModel
user_router = Router()


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
    text = (
        "Привет! 👋 Добро пожаловать в нашу уютную игру!\n\n"
        "Здесь ты сможешь заботиться о своем питомце, кормить его вкусняшками из холодильника, купать и играть.🎮\n\n"
        "Нажимай кнопку ниже, чтобы запустить приложение и начать приключение! 🐾"
    )
    await message.answer(text, reply_markup=keyboard)




# ⚠️ Замени на свой Telegram ID, чтобы только ты мог делать рассылку
ADMIN_IDS = [1059422557]


@user_router.message(Command("broadcast"))
async def broadcast_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    # Извлекаем текст сообщения после команды /broadcast
    # Например, если написать "/broadcast Привет всем!", то в переменной text окажется "Привет всем!"
    command_parts = message.text.split(maxsplit=1)
    if len(command_parts) < 2:
        await message.answer("❌ Укажи текст для рассылки! Пример:\n<code>/broadcast Текст сообщения</code>", parse_mode="HTML")
        return

    custom_text = command_parts[1]

    # Клавиатура с кнопкой получения бонуса
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🎁 Забрать 150 монет!",
                    callback_data="claim_bonus_100"
                )
            ]
        ]
    )

    # Получаем всех питомцев из базы
    pets = await PetModel.all()

    success_count = 0
    for pet in pets:
        try:
            await message.bot.send_message(
                chat_id=pet.tg_id,
                text=custom_text,  # Отправляем твой кастомный текст
                reply_markup=keyboard,
                parse_mode="HTML"   # Поддерживает HTML-разметку в твоем тексте (жирный, курсив и т.д.)
            )
            success_count += 1
        except Exception as e:
            print(f"Не удалось отправить сообщение для {pet.tg_id}: {e}")

    await message.answer(f"✅ Рассылка завершена. Успешно отправлено: {success_count}")


# Обработчик нажатия на кнопку бонуса
@user_router.callback_query(F.data == "claim_bonus_100")
async def claim_bonus_handler(callback: types.CallbackQuery):
    tg_id = callback.from_user.id

    # Ищем питомца в базе
    pet = await PetModel.filter(tg_id=tg_id).first()

    if not pet:
        await callback.answer("❌ Питомец не найден! Сначала запусти игру в главном меню.", show_alert=True)
        return

    # Начисляем 100 монет
    pet.coins += 150
    await pet.save()

    # Убираем кнопку у сообщения, чтобы нельзя было нажать повторно, и меняем текст
    await callback.message.edit_text(
        f"✅ Успешно! Вам начислено +150 монет.\n💰 Текущий баланс: {pet.coins} монет."
    )
    await callback.answer("Бонус успешно получен! 🎉")