from aiogram import Router, F as aiogram_F, types
from aiogram.filters import CommandStart, Command
from common.config import settings
from backend.models.pet import Pet as PetModel
from tortoise.expressions import F as db_f
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



@user_router.message(Command("give_coins"))
async def give_me_coins_handler(message: types.Message):
    # Проверяем, что команду вызываешь именно ты (можно по твоему ID или через ADMIN_IDS)
    if message.from_user.id not in ADMIN_IDS:
        return

    # Разбираем сообщение: /give_coins 150 (текст опционален, но пусть будет для красоты)
    command_parts = message.text.split(maxsplit=2)
    if len(command_parts) < 2:
        await message.answer(
            "❌ Неверный формат! Пример:\n<code>/give_coins 150</code>",
            parse_mode="HTML"
        )
        return

    try:
        coins_amount = int(command_parts[1])
    except ValueError:
        await message.answer("❌ Количество монет должно быть числом! Пример:\n<code>/give_coins 150</code>", parse_mode="HTML")
        return

    # Текст сообщения, которое бот пришлет лично тебе
    custom_text = command_parts[2] if len(command_parts) > 2 else f"🎁 Бонус от администратора: +{coins_amount} монет!"

    # Динамический callback, который подхватится твоим же обработчиком claim_bonus_handler
    callback_data_str = f"claim_bonus_{coins_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=f"🎁 Забрать {coins_amount} монет!",
                    callback_data=callback_data_str
                )
            ]
        ]
    )

    # Отправляем сообщение ТОЛЬКО тебе (используем message.from_user.id вместо цикла по всем)
    try:
        await message.bot.send_message(
            chat_id=message.from_user.id,
            text=custom_text,
            reply_markup=keyboard,
            parse_mode="HTML"
        )
    except Exception as e:
        await message.answer(f"❌ Не удалось отправить бонус: {e}")




@user_router.message(Command("broadcast_coins"))
async def broadcast_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    # Разбираем сообщение на части: команда, количество монет, текст
    # Пример: /broadcast 150 Привет всем!
    command_parts = message.text.split(maxsplit=2)
    if len(command_parts) < 3:
        await message.answer(
            "❌ Неверный формат! Пример:\n<code>/broadcast_coins 150 Текст сообщения</code>",
            parse_mode="HTML"
        )
        return

    # Проверяем, что вторым аргументом передано число (монеты)
    try:
        coins_amount = int(command_parts[1])
    except ValueError:
        await message.answer("❌ Второе слово должно быть числом (количеством монет)! Пример:\n<code>/broadcast_coins 150 Текст</code>", parse_mode="HTML")
        return

    custom_text = command_parts[2]

    # Создаем динамический callback_data, в который зашиваем сумму монет
    # Например: "claim_bonus_150", "claim_bonus_500" и т.д.
    callback_data_str = f"claim_bonus_{coins_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=f"🎁 Забрать {coins_amount} монет!",
                    callback_data=callback_data_str
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
                text=custom_text,
                reply_markup=keyboard,
                parse_mode="HTML"
            )
            success_count += 1
        except Exception as e:
            print(f"Не удалось отправить сообщение для {pet.tg_id}: {e}")

    await message.answer(f"✅ Рассылка завершена. Успешно отправлено: {success_count}")


# Обработчик нажатия на кнопку бонуса


# Обработчик нажатия на любую кнопку бонуса из рассылки
@user_router.callback_query(aiogram_F.data.startswith("claim_bonus_"))
async def claim_bonus_handler(callback: types.CallbackQuery):
    tg_id = callback.from_user.id

    try:
        coins_amount = int(callback.data.split("_")[2])
    except (IndexError, ValueError):
        await callback.answer("❌ Ошибка обработки бонуса.", show_alert=True)
        return

    # Атомарно прибавляем монеты прямо в базе данных, исключая любые затирки
    # Было:
    # updated_count = await PetModel.filter(tg_id=tg_id).update(coins=PetModel.coins + coins_amount)

    # Стало:
    updated_count = await PetModel.filter(tg_id=tg_id).update(coins=db_f("coins") + coins_amount)

    if updated_count == 0:
        await callback.answer("❌ Питомец не найден! Сначала запусти игру.", show_alert=True)
        return

    # Достаем свежий актуальный баланс из базы
    pet = await PetModel.filter(tg_id=tg_id).first()

    try:
        await callback.message.edit_text(
            f"✅ Успешно! Вам начислено +{coins_amount} монет.\n💰 Текущий баланс: {pet.coins} монет."
        )
    except Exception:
        pass

    await callback.answer("Бонус успешно получен! 🎉", show_alert=True)





@user_router.message(Command("broadcast_lives"))
async def broadcast_lives_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    # Разбираем сообщение на части: команда, количество жизней, текст
    # Пример: /broadcast_lives 1 Получите жизнь в подарок!
    command_parts = message.text.split(maxsplit=2)
    if len(command_parts) < 3:
        await message.answer(
            "❌ Неверный формат! Пример:\n<code>/broadcast_lives 1 Текст сообщения</code>",
            parse_mode="HTML"
        )
        return

    # Проверяем, что вторым аргументом передано число (жизни)
    try:
        lives_amount = int(command_parts[1])
    except ValueError:
        await message.answer("❌ Второе слово должно быть числом (количеством жизней)! Пример:\n<code>/broadcast_lives 1 Текст</code>", parse_mode="HTML")
        return

    custom_text = command_parts[2]

    # Уникальный callback_data для жизней
    callback_data_str = f"claim_lives_{lives_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=f"❤️ Забрать +{lives_amount} жизнь!",
                    callback_data=callback_data_str
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
                text=custom_text,
                reply_markup=keyboard,
                parse_mode="HTML"
            )
            success_count += 1
        except Exception as e:
            print(f"Не удалось отправить сообщение для {pet.tg_id}: {e}")

    await message.answer(f"✅ Рассылка жизней завершена. Успешно отправлено: {success_count}")


# Обработчик нажатия на кнопку получения жизней
@user_router.callback_query(aiogram_F.data.startswith("claim_lives_"))
async def claim_lives_handler(callback: types.CallbackQuery):
    tg_id = callback.from_user.id

    try:
        lives_amount = int(callback.data.split("_")[2])
    except (IndexError, ValueError):
        await callback.answer("❌ Ошибка обработки бонуса.", show_alert=True)
        return

    # Атомарно прибавляем жизни прямо в базе данных
    updated_count = await PetModel.filter(tg_id=tg_id).update(lives=db_f("lives") + lives_amount)

    if updated_count == 0:
        await callback.answer("❌ Питомец не найден! Сначала запусти игру.", show_alert=True)
        return

    # Достаем свежие данные из базы, чтобы показать актуальное количество жизней
    pet = await PetModel.filter(tg_id=tg_id).first()

    try:
        await callback.message.edit_text(
            f"✅ Успешно! Вам начислено +{lives_amount} жизнь.\n❤️ Текущие жизни: {pet.lives}."
        )
    except Exception:
        pass

    await callback.answer("Жизнь успешно получена! 🎉", show_alert=True)




@user_router.message(Command("reset_flags"))
async def cmd_reset_flags(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    updated_count = await PetModel.all().update(
        hungry_notified=False,
        energy_notified=False,
        poop_notified=False,
        stinky_notified=False,
        game_over_notified=False,
        low_lives_notified=False,
        critical_life_notified=False
    )

    await message.answer(f"✅ Успешно сброшены флаги уведомлений для всех питомцев (затронуто: {updated_count}).")