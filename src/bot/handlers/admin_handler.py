import asyncio
import datetime
import math
from zoneinfo import ZoneInfo
from aiogram import Router, F as aiogram_F, types, Bot
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from backend.models.pet import Pet as PetModel
from tortoise.expressions import F as db_f
from common.config import ADMIN_IDS

admin_router = Router()

# Словарь локализации для админ-панели
ADMIN_MESSAGES = {
    "en": {
        "list_empty": "The list is empty.",
        "stats_header": "📊 <b>Total users:</b> {total_count} (Page {page})\n\n{statistics}",
        "user_label": "User",
        "pet_name_label": "Pet name",
        "clicks_label": "Clicks",
        "level_label": "Level",
        "coins_label": "Coins",
        "deaths_label": "Deaths",
        "lives_label": "Lives",
        "heads_label": "Headwear",
        "clothes_label": "Clothes",
        "last_action_label": "Last action",
        "unknown": "Unknown",

        # Give coins
        "give_coins_format": "❌ Invalid format! Example:\n<code>/give_coins 150</code>",
        "give_coins_number": "❌ Coin amount must be a number! Example:\n<code>/give_coins 150</code>",
        "give_coins_default_text": "🎁 Bonus from administrator: +{coins_amount} coins!",
        "give_coins_btn": "🎁 Claim {coins_amount} coins!",
        "give_coins_error": "❌ Failed to send bonus: {e}",

        # Broadcast coins
        "broadcast_coins_format": "❌ Invalid format! Example:\n<code>/broadcast_coins 150 Message text</code>",
        "broadcast_coins_number": "❌ The second word must be a number (coin amount)! Example:\n<code>/broadcast_coins 150 Text</code>",
        "broadcast_coins_success": "✅ Broadcast completed. Successfully sent: {success_count}",

        # Claim bonus / lives callbacks & actions
        "claim_error": "❌ Error processing bonus.",
        "pet_not_found": "❌ Pet not found! Start the game first.",
        "bonus_success": "✅ Success! You received +{coins_amount} coins.\n💰 Current balance: {pet.coins} coins.",
        "bonus_claimed_toast": "Bonus successfully received! 🎉",

        # Broadcast lives
        "broadcast_lives_format": "❌ Invalid format! Example:\n<code>/broadcast_lives TG_ID LIVES Message text</code>",
        "broadcast_lives_id_number": "❌ TG_ID must be a number! Example:\n<code>/broadcast_lives 123456789 1 Text</code>",
        "broadcast_lives_amount_number": "❌ Lives amount must be a number! Example:\n<code>/broadcast_lives 123456789 1 Text</code>",
        "lives_btn": "❤️ Claim +{lives_amount} life!",
        "pet_not_found_id": "❌ Pet with tg_id <code>{target_tg_id}</code> not found in database.",
        "lives_sent_success": "✅ Lives message successfully sent to user <code>{target_tg_id}</code>!",
        "lives_sent_error": "❌ Failed to send message to user <code>{target_tg_id}</code>.\nError: {e}",

        # Claim lives callbacks
        "lives_max": "❌ You already have the maximum number of lives (3/3)! ❤️",
        "lives_success_text": "✅ Success! You received +{actual_add} life.\n❤️ Current lives: {pet.lives}/{MAX_LIVES}.",
        "lives_claimed_toast": "Life successfully received! 🎉",

        # Reset flags
        "reset_flags_success": "✅ Notification flags successfully reset for all pets (affected: {updated_count}).",

        # Send coins
        "send_coins_format": "❌ Invalid format! Example:\n<code>/send_coins 123456789 150 [Text]</code>",
        "send_coins_number": "❌ User ID and coin amount must be numbers!\nExample: <code>/send_coins 123456789 150 Hello!</code>",
        "send_coins_default_text": "🎁 Personal gift from administrator: +{coins_amount} coins!",
        "send_coins_not_found": "❌ User with ID <code>{target_tg_id}</code> not found in database!",
        "send_coins_success": "✅ Reward successfully sent to user <code>{target_tg_id}</code>!",
        "send_coins_error": "❌ Failed to send message to user {target_tg_id}: {e}",

        # Clean users
        "clean_start": "🔄 Starting database check and cleanup... This may take a while.",
        "clean_complete": "✅ Cleanup complete!\n\n👥 Users checked: {total_checked}\n🗑 Deleted inactive/blocked: {deleted_count}",

        # Buttons
        "btn_forward": "Forward ➡️",
        "btn_backward": "⬅️ Back"
    },
    "ru": {
        "list_empty": "Список пуст.",
        "stats_header": "📊 <b>Всего пользователей:</b> {total_count} (Стр. {page})\n\n{statistics}",
        "user_label": "Пользователь",
        "pet_name_label": "Имя питомца",
        "clicks_label": "Кликов",
        "level_label": "Уровень",
        "coins_label": "Монет",
        "deaths_label": "Смертей",
        "lives_label": "Жизней",
        "heads_label": "Головные уборы",
        "clothes_label": "Одежда",
        "last_action_label": "Последнее действие",
        "unknown": "Неизвестен",

        # Give coins
        "give_coins_format": "❌ Неверный формат! Пример:\n<code>/give_coins 150</code>",
        "give_coins_number": "❌ Количество монет должно быть числом! Пример:\n<code>/give_coins 150</code>",
        "give_coins_default_text": "🎁 Бонус от администратора: +{coins_amount} монет!",
        "give_coins_btn": "🎁 Забрать {coins_amount} монет!",
        "give_coins_error": "❌ Не удалось отправить бонус: {e}",

        # Broadcast coins
        "broadcast_coins_format": "❌ Неверный формат! Пример:\n<code>/broadcast_coins 150 Текст сообщения</code>",
        "broadcast_coins_number": "❌ Второе слово должно быть числом (количеством монет)! Пример:\n<code>/broadcast_coins 150 Текст</code>",
        "broadcast_coins_success": "✅ Рассылка завершена. Успешно отправлено: {success_count}",

        # Claim bonus / lives callbacks & actions
        "claim_error": "❌ Ошибка обработки бонуса.",
        "pet_not_found": "❌ Питомец не найден! Сначала запусти игру.",
        "bonus_success": "✅ Успешно! Вам начислено +{coins_amount} монет.\n💰 Текущий баланс: {pet.coins} монет.",
        "bonus_claimed_toast": "Бонус успешно получен! 🎉",

        # Broadcast lives
        "broadcast_lives_format": "❌ Неверный формат! Пример:\n<code>/broadcast_lives TG_ID ЖИЗНИ Текст сообщения</code>",
        "broadcast_lives_id_number": "❌ TG_ID должен быть числом! Пример:\n<code>/broadcast_lives 123456789 1 Текст</code>",
        "broadcast_lives_amount_number": "❌ Количество жизней должно быть числом! Пример:\n<code>/broadcast_lives 123456789 1 Текст</code>",
        "lives_btn": "❤️ Забрать +{lives_amount} жизнь!",
        "pet_not_found_id": "❌ Питомец с tg_id <code>{target_tg_id}</code> не найден в базе данных.",
        "lives_sent_success": "✅ Сообщение с жизнями успешно отправлено пользователю <code>{target_tg_id}</code>!",
        "lives_sent_error": "❌ Не удалось отправить сообщение пользователю <code>{target_tg_id}</code>.\nОшибка: {e}",

        # Claim lives callbacks
        "lives_max": "❌ У вас уже максимальное количество жизней (3/3)! ❤️",
        "lives_success_text": "✅ Успешно! Вам начислено +{actual_add} жизнь.\n❤️ Текущие жизни: {pet.lives}/{MAX_LIVES}.",
        "lives_claimed_toast": "Жизнь успешно получена! 🎉",

        # Reset flags
        "reset_flags_success": "✅ Успешно сброшены флаги уведомлений для всех питомцев (затронуто: {updated_count}).",

        # Send coins
        "send_coins_format": "❌ Неверный формат! Пример:\n<code>/send_coins 123456789 150 [Текст]</code>",
        "send_coins_number": "❌ ID пользователя и количество монет должны быть числами!\nПример: <code>/send_coins 123456789 150 Привет!</code>",
        "send_coins_default_text": "🎁 Персональный подарок от администратора: +{coins_amount} монет!",
        "send_coins_not_found": "❌ Пользователь с ID <code>{target_tg_id}</code> не найден в базе!",
        "send_coins_success": "✅ Награда успешно отправлена пользователю <code>{target_tg_id}</code>!",
        "send_coins_error": "❌ Не удалось отправить сообщение пользователю {target_tg_id}: {e}",

        # Clean users
        "clean_start": "🔄 Начинаю проверку и очистку базы данных... Это может занять некоторое время.",
        "clean_complete": "✅ Очистка завершена!\n\n👥 Проверено пользователей: {total_checked}\n🗑 Удалено неактивных/заблокированных: {deleted_count}",

        # Buttons
        "btn_forward": "Вперед ➡️",
        "btn_backward": "⬅️ Назад"
    }
}


async def get_admin_lang(user_id: int, message_lang_code: str = None) -> str:
    """Сначала проверяем язык в базе данных для этого администратора, затем в Telegram"""
    pet = await PetModel.filter(tg_id=user_id).first()

    # Если у питомца в базе сохранен язык и он есть в словаре админки
    if pet and hasattr(pet, "language") and pet.language in ADMIN_MESSAGES:
        return pet.language

    # Иначе берем из настроек Telegram
    if message_lang_code in ADMIN_MESSAGES:
        return message_lang_code

    # По умолчанию английский
    return "en"

def keyboard_callback(callback: dict[str, str]):
    keyboard = InlineKeyboardBuilder()
    for key, value in callback.items():
        keyboard.add(InlineKeyboardButton(text=key, callback_data=value))
    return keyboard.as_markup()


async def static_text(page: int, per_page: int = 5, bot=None, lang: str = "en"):
    offset = (page - 1) * per_page
    total_count = await PetModel.all().count()
    tz = ZoneInfo("Asia/Baku")
    pets = await PetModel.all().offset(offset).limit(per_page)
    m = ADMIN_MESSAGES[lang]

    if not pets:
        return m["list_empty"], total_count

    statistics = ""
    for pet in pets:
        tg_id = pet.tg_id
        name = pet.name or "None"
        click_counter = pet.click_counter
        level = pet.level
        coins = pet.coins
        lives = pet.lives
        unlocked_heads = " ,".join(pet.unlocked_heads)
        unlocked_clothes = " ,".join(pet.unlocked_clothes)
        deaths_count = pet.deaths_count
        last_interaction = datetime.datetime.fromtimestamp(pet.last_interaction, tz)
        try:
            chat_info = await bot.get_chat(tg_id)
            user_name = f"@{chat_info.username}" if chat_info.username else m["unknown"]
            first_name = chat_info.first_name or m["unknown"]
        except Exception:
            user_name = m["unknown"]
            first_name = m["unknown"]
        statistics += (
            f"{m['user_label']}: {user_name}({first_name})\n"
            f"{m['pet_name_label']}: {name}\n"
            f"{m['clicks_label']}: {click_counter}\n"
            f"{m['level_label']}: {level}\n"
            f"{m['coins_label']}: {coins}\n"
            f"{m['deaths_label']}: {deaths_count}\n"
            f"{m['lives_label']}: {lives}\n"
            f"{m['heads_label']}: {unlocked_heads}\n"
            f"{m['clothes_label']}: {unlocked_clothes}\n"
            f"{m['last_action_label']}: {last_interaction}\n---------\n"
        )

    return (
        m["stats_header"].format(total_count=total_count, page=page, statistics=statistics),
        total_count,
    )


@admin_router.message(Command("statistics"))
async def statistics_handler(message: types.Message, bot: Bot):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]
    page = 1
    per_page = 5

    text, total_count = await static_text(page=page, per_page=per_page, bot=bot, lang=lang)

    buttons = {}
    if total_count > per_page:
        buttons[m["btn_forward"]] = f"page_{page + 1}"

    keyboard = keyboard_callback(buttons) if buttons else None

    await message.answer(text, parse_mode="HTML", reply_markup=keyboard)


@admin_router.callback_query(aiogram_F.data.startswith("page_"))
async def pagination_handler(call: types.CallbackQuery, bot: Bot):
    if call.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(call.from_user.id, call.from_user.language_code)
    m = ADMIN_MESSAGES[lang]
    page = int(call.data.split("_")[1])
    per_page = 5

    text, total_count = await static_text(page=page, per_page=per_page, bot=bot, lang=lang)

    buttons = {}

    if page > 1:
        buttons[m["btn_backward"]] = f"page_{page - 1}"

    max_pages = math.ceil(total_count / per_page) if total_count > 0 else 1

    if page < max_pages:
        buttons[m["btn_forward"]] = f"page_{page + 1}"

    await call.message.edit_text(
        text, parse_mode="HTML", reply_markup=keyboard_callback(buttons)
    )


@admin_router.message(Command("give_coins"))
async def give_me_coins_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    command_parts = message.text.split(maxsplit=2)
    if len(command_parts) < 2:
        await message.answer(m["give_coins_format"], parse_mode="HTML")
        return

    try:
        coins_amount = int(command_parts[1])
    except ValueError:
        await message.answer(m["give_coins_number"], parse_mode="HTML")
        return

    custom_text = (
        command_parts[2]
        if len(command_parts) > 2
        else m["give_coins_default_text"].format(coins_amount=coins_amount)
    )

    callback_data_str = f"claim_bonus_{coins_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=m["give_coins_btn"].format(coins_amount=coins_amount),
                    callback_data=callback_data_str,
                )
            ]
        ]
    )

    try:
        await message.bot.send_message(
            chat_id=message.from_user.id,
            text=custom_text,
            reply_markup=keyboard,
            parse_mode="HTML",
        )
    except Exception as e:
        await message.answer(m["give_coins_error"].format(e=e))


@admin_router.message(Command("broadcast_coins"))
async def broadcast_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    command_parts = message.text.split(maxsplit=2)
    if len(command_parts) < 3:
        await message.answer(m["broadcast_coins_format"], parse_mode="HTML")
        return

    try:
        coins_amount = int(command_parts[1])
    except ValueError:
        await message.answer(m["broadcast_coins_number"], parse_mode="HTML")
        return

    custom_text = command_parts[2]
    callback_data_str = f"claim_bonus_{coins_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=m["give_coins_btn"].format(coins_amount=coins_amount),
                    callback_data=callback_data_str,
                )
            ]
        ]
    )

    pets = await PetModel.all()
    success_count = 0
    for pet in pets:
        try:
            await message.bot.send_message(
                chat_id=pet.tg_id,
                text=custom_text,
                reply_markup=keyboard,
                parse_mode="HTML",
            )
            success_count += 1
        except Exception as e:
            print(f"Failed to send message to {pet.tg_id}: {e}")

    await message.answer(m["broadcast_coins_success"].format(success_count=success_count))


@admin_router.callback_query(aiogram_F.data.startswith("claim_bonus_"))
async def claim_bonus_handler(callback: types.CallbackQuery):
    tg_id = callback.from_user.id
    lang = await get_admin_lang(tg_id, callback.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    try:
        coins_amount = int(callback.data.split("_")[2])
    except (IndexError, ValueError):
        await callback.answer(m["claim_error"], show_alert=True)
        return

    updated_count = await PetModel.filter(tg_id=tg_id).update(
        coins=db_f("coins") + coins_amount
    )

    if updated_count == 0:
        await callback.answer(m["pet_not_found"], show_alert=True)
        return

    pet = await PetModel.filter(tg_id=tg_id).first()

    try:
        await callback.message.edit_text(
            m["bonus_success"].format(coins_amount=coins_amount, pet=pet)
        )
    except Exception:
        pass

    await callback.answer(m["bonus_claimed_toast"], show_alert=True)


@admin_router.message(Command("broadcast_lives"))
async def broadcast_lives_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    command_parts = message.text.split(maxsplit=3)
    if len(command_parts) < 4:
        await message.answer(m["broadcast_lives_format"], parse_mode="HTML")
        return

    try:
        target_tg_id = int(command_parts[1])
    except ValueError:
        await message.answer(m["broadcast_lives_id_number"], parse_mode="HTML")
        return

    try:
        lives_amount = int(command_parts[2])
    except ValueError:
        await message.answer(m["broadcast_lives_amount_number"], parse_mode="HTML")
        return

    custom_text = command_parts[3]
    callback_data_str = f"claim_lives_{lives_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=m["lives_btn"].format(lives_amount=lives_amount),
                    callback_data=callback_data_str,
                )
            ]
        ]
    )

    pet = await PetModel.filter(tg_id=target_tg_id).first()
    if not pet:
        await message.answer(m["pet_not_found_id"].format(target_tg_id=target_tg_id), parse_mode="HTML")
        return

    try:
        await message.bot.send_message(
            chat_id=target_tg_id,
            text=custom_text,
            reply_markup=keyboard,
            parse_mode="HTML",
        )
        await message.answer(
            m["lives_sent_success"].format(target_tg_id=target_tg_id),
            parse_mode="HTML"
        )
    except Exception as e:
        await message.answer(
            m["lives_sent_error"].format(target_tg_id=target_tg_id, e=e),
            parse_mode="HTML"
        )


@admin_router.callback_query(aiogram_F.data.startswith("claim_lives_"))
async def claim_lives_handler(callback: types.CallbackQuery):
    tg_id = callback.from_user.id
    lang = await get_admin_lang(tg_id, callback.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    try:
        lives_amount = int(callback.data.split("_")[2])
    except (IndexError, ValueError):
        await callback.answer(m["claim_error"], show_alert=True)
        return

    pet = await PetModel.filter(tg_id=tg_id).first()
    if not pet:
        await callback.answer(m["pet_not_found"], show_alert=True)
        return

    MAX_LIVES = 3
    if pet.lives >= MAX_LIVES:
        await callback.answer(m["lives_max"], show_alert=True)
        return

    actual_add = min(lives_amount, MAX_LIVES - pet.lives)
    await PetModel.filter(tg_id=tg_id).update(lives=db_f("lives") + actual_add)
    pet.lives += actual_add

    try:
        await callback.message.edit_text(
            m["lives_success_text"].format(actual_add=actual_add, pet=pet, MAX_LIVES=MAX_LIVES)
        )
    except Exception:
        pass

    await callback.answer(m["lives_claimed_toast"], show_alert=True)


@admin_router.message(Command("reset_flags"))
async def cmd_reset_flags(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    updated_count = await PetModel.all().update(
        hungry_notified=False,
        energy_notified=False,
        poop_notified=False,
        stinky_notified=False,
        game_over_notified=False,
        low_lives_notified=False,
        critical_life_notified=False,
    )

    await message.answer(m["reset_flags_success"].format(updated_count=updated_count))


@admin_router.message(Command("send_coins"))
async def send_coins_to_user_handler(message: types.Message):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    command_parts = message.text.split(maxsplit=3)
    if len(command_parts) < 3:
        await message.answer(m["send_coins_format"], parse_mode="HTML")
        return

    try:
        target_tg_id = int(command_parts[1])
        coins_amount = int(command_parts[2])
    except ValueError:
        await message.answer(m["send_coins_number"], parse_mode="HTML")
        return

    custom_text = (
        command_parts[3]
        if len(command_parts) > 3
        else m["send_coins_default_text"].format(coins_amount=coins_amount)
    )

    pet_exists = await PetModel.filter(tg_id=target_tg_id).exists()
    if not pet_exists:
        await message.answer(m["send_coins_not_found"].format(target_tg_id=target_tg_id), parse_mode="HTML")
        return

    callback_data_str = f"claim_bonus_{coins_amount}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=m["give_coins_btn"].format(coins_amount=coins_amount),
                    callback_data=callback_data_str,
                )
            ]
        ]
    )

    try:
        await message.bot.send_message(
            chat_id=target_tg_id,
            text=custom_text,
            reply_markup=keyboard,
            parse_mode="HTML",
        )
        await message.answer(
            m["send_coins_success"].format(target_tg_id=target_tg_id),
            parse_mode="HTML",
        )
    except Exception as e:
        await message.answer(m["send_coins_error"].format(target_tg_id=target_tg_id, e=e))


@admin_router.message(Command("clean_users"))
async def clean_users_handler(message: types.Message, bot: Bot):
    if message.from_user.id not in ADMIN_IDS:
        return

    lang = await  get_admin_lang(message.from_user.id, message.from_user.language_code)
    m = ADMIN_MESSAGES[lang]

    status_msg = await message.answer(m["clean_start"])

    pets = await PetModel.all()
    total_checked = len(pets)
    deleted_count = 0

    for pet in pets:
        try:
            await bot.get_chat(pet.tg_id)
        except Exception as e:
            error_text = str(e).lower()
            if any(
                    err in error_text
                    for err in [
                        "bot was blocked",
                        "user is deactivated",
                        "chat not found",
                        "is blocked",
                        "PEER_ID_INVALID",
                    ]
            ):
                await PetModel.filter(tg_id=pet.tg_id).delete()
                deleted_count += 1
        await asyncio.sleep(0.05)

    await status_msg.edit_text(
        m["clean_complete"].format(total_checked=total_checked, deleted_count=deleted_count)
    )