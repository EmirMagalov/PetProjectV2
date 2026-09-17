from aiogram import Router, F, types
from aiogram.filters import CommandStart, Command
from common.config import settings
from backend.models.pet import Pet as PetModel
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

    # Клавиатура с кнопкой получения бонуса
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🎁 Забрать 100 монет!",
                    callback_data="claim_bonus_100"
                )
            ]
        ]
    )

    text = (
        "🎉 Просим прощения за временные неудобства связанные с многочисленной отправкой сообщений!\n\n"
        "Нажми на кнопку ниже, чтобы получить +150 монет на свой баланс!"
    )

    # Получаем всех питомцев (у каждого есть свой tg_id) из базы
    pets = await PetModel.all()

    success_count = 0
    for pet in pets:
        try:
            await message.bot.send_message(
                chat_id=pet.tg_id,
                text=text,
                reply_markup=keyboard
            )
            success_count += 1
        except Exception as e:
            # Пользователь мог заблокировать бота, просто пропускаем его
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
    pet.coins += 100
    await pet.save()

    # Убираем кнопку у сообщения, чтобы нельзя было нажать повторно, и меняем текст
    await callback.message.edit_text(
        f"✅ Успешно! Вам начислено +100 монет.\n💰 Текущий баланс: {pet.coins} монет."
    )
    await callback.answer("Бонус успешно получен! 🎉")