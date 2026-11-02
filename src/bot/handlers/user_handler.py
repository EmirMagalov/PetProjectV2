from urllib.parse import quote
from aiogram import F
import time
from aiogram import Router, types, Bot
from aiogram.filters import Command, CommandObject
from common.config import settings
from backend.models.pet import Pet as PetModel
from common.config import ADMIN_IDS

user_router = Router()

PHOTO_CACHE = {"photo1": None, "photo2": None}

# Словарь локализации для бэкенда (теперь по умолчанию en)
MESSAGES = {
    "en": {
        "default_name": "Player",
        "welcome": "Welcome to our cozy game!\n\nHere you can take care of your pet... 🐾",
        "open_game": "🎮 Open Game",
        "ref_bonus_text": "\n\n🎁 You activated a referral link and received a bonus of +{bonus_coins} coins!",
        "ref_invite_hint": "\n\nInvite a friend 🎁 /ref",
        "friend_notif": "🎉 User {user_link} registered using your referral link!",
        "claim_btn": "🎁 Claim {coins_amount} coins!",

        "feedback_missing": "⚠️ You wrote «Feedback:», but forgot to add the text itself. Try again!",
        "feedback_new": "📩 **New feedback!**\n\n👤 **From:** {full_name} (@{username})\n🆔 **ID:** `{user_id}`\n\n💬 **Text:**\n{feedback_text}",
        "feedback_success": "✨ Thank you for your feedback!",
        "feedback_error": "❌ An error occurred while sending feedback. Please try again later.",

        "ref_share_text": "🐾 Take care of your pet in an awesome game!",
        "ref_share_btn": "📤 Share with a friend",
        "ref_info": (
            "👥 <b>Invite a friend 🎁</b>\n\n"
            "Invite friends via your link and get bonuses!\n"
            "👤 Friends invited: <b>{invited_count}</b>\n\n"
            "🔗 Your link:\n<code>{ref_link}</code>"
        )
    },
    "ru": {
        "default_name": "Игрок",
        "welcome": "Добро пожаловать в нашу уютную игру!\n\nЗдесь ты сможешь заботиться о своем питомце... 🐾",
        "open_game": "🎮 Открыть игру",
        "ref_bonus_text": "\n\n🎁 Вы активировали реферальную ссылку и получили бонус +{bonus_coins} монет!",
        "ref_invite_hint": "\n\nПригласи друга 🎁 /ref",
        "friend_notif": "🎉 По вашей реферальной ссылке зарегистрировался пользователь {user_link}!",
        "claim_btn": "🎁 Забрать {coins_amount} монет!",

        "feedback_missing": "⚠️ Вы написали «Отзыв:», но забыли добавить сам текст. Попробуйте еще раз!",
        "feedback_new": "📩 **Новый отзыв!**\n\n👤 **От:** {full_name} (@{username})\n🆔 **ID:** `{user_id}`\n\n💬 **Текст:**\n{feedback_text}",
        "feedback_success": "✨ Спасибо за отзыв!",
        "feedback_error": "❌ Произошла ошибка при отправке отзыва. Попробуйте позже.",

        "ref_share_text": "🐾 Заботься о своем питомце в классной игре!",
        "ref_share_btn": "📤 Поделиться с другом",
        "ref_info": (
            "👥 <b>Пригласи друга 🎁</b>\n\n"
            "Приглашайте друзей по своей ссылке и получайте бонусы!\n"
            "👤 Приглашено друзей: <b>{invited_count}</b>\n\n"
            "🔗 Ваша ссылка:\n<code>{ref_link}</code>"
        )
    }
}


def get_lang(pet: PetModel, message: types.Message) -> str:
    """Определяем язык пользователя: из базы, из Telegram, либо ставим 'en' по умолчанию"""
    if pet and hasattr(pet, "language") and pet.language in MESSAGES:
        return pet.language

    tg_lang = message.from_user.language_code
    if tg_lang in MESSAGES:
        return tg_lang
    return "en"  # 👈 Английский по умолчанию


def bonus(coins_amount, callback_data_str, lang="en"):
    text_template = MESSAGES[lang]["claim_btn"]
    ref_keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=text_template.format(coins_amount=coins_amount),
                    callback_data=callback_data_str,
                )
            ]
        ]
    )
    return ref_keyboard


@user_router.message(Command("start"))
async def start_handler(message: types.Message, command: CommandObject, bot: Bot):
    tg_id = message.from_user.id
    first_name = message.from_user.first_name or "Player"
    username = message.from_user.username

    # Определяем язык из телеграма или ставим 'en'
    tg_lang = message.from_user.language_code if message.from_user.language_code in MESSAGES else "en"

    args = command.args
    start_param = args if (args and args.startswith("ref_")) else None

    # 1. Проверяем, есть ли уже такой питомец в базе
    pet = await PetModel.filter(tg_id=tg_id).first()
    is_new = False
    bonus_coins = 0

    if not pet:
        is_new = True
        # Если создаете питомца в базе, можно сразу прописывать language=tg_lang

        # Обрабатываем реферал, если передан параметр
        if start_param:
            try:
                parsed_id = int(start_param.split("_")[1])
                if parsed_id != tg_id:  # Защита от самоприглашения
                    if await PetModel.filter(tg_id=parsed_id).exists():
                        bonus_coins = 1000  # Бонус новичку
            except ValueError:
                pass
    else:
        # Обновляем время взаимодействия
        pet.last_interaction = int(time.time())
        await pet.save(update_fields=["last_interaction"])

    # Определяем язык для ответов (по умолчанию 'en')
    lang = get_lang(pet, message)
    webapp_url = f"{settings.DOMAIN}?lang={lang}"
    # 2. Кнопка открытия игры
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=MESSAGES[lang]["open_game"],
                    web_app=types.WebAppInfo(url=webapp_url)
                )
            ]
        ]
    )

    text = MESSAGES[lang]["welcome"]

    # Если новичок зарегистрировался по рефералке
    if is_new and bonus_coins > 0 and start_param:
        coins_amount = 1000
        callback_data_str = f"claim_bonus_{coins_amount}"

        try:
            referrer_tg_id = int(start_param.split("_")[1])

            # Получаем язык реферера из базы (с фоллбэком на 'en')
            referrer_pet = await PetModel.filter(tg_id=referrer_tg_id).first()
            ref_lang = referrer_pet.language if (referrer_pet and hasattr(referrer_pet,
                                                                          "language") and referrer_pet.language in MESSAGES) else "en"

            user_link = f"<a href='tg://user?id={tg_id}'>{first_name}</a>"
            if username:
                user_link += f" (@{username})"

            # Отправляем уведомление другу на его языке
            await bot.send_message(
                chat_id=referrer_tg_id,
                text=MESSAGES[ref_lang]["friend_notif"].format(user_link=user_link),
                parse_mode="HTML",
                reply_markup=bonus(coins_amount, callback_data_str, lang=ref_lang),
            )
        except Exception as e:
            print(f"Не удалось отправить уведомление рефереру: {e}")

    text += MESSAGES[lang]["ref_invite_hint"]

    await message.answer(text, reply_markup=keyboard)

    if is_new and bonus_coins > 0 and start_param:
        bonus_text = MESSAGES[lang]["ref_bonus_text"].format(bonus_coins=bonus_coins)
        callback_data_str = f"claim_bonus_{bonus_coins}"
        await message.answer(bonus_text, reply_markup=bonus(bonus_coins, callback_data_str, lang=lang))


@user_router.message(F.text.lower().startswith(("отзыв", "feedback")))
async def feedback_handler(message: types.Message):
    pet = await PetModel.filter(tg_id=message.from_user.id).first()
    lang = get_lang(pet, message)

    feedback_text = message.text[6:].strip()

    if not feedback_text:
        await message.answer(MESSAGES[lang]["feedback_missing"])
        return

    user_info = MESSAGES[lang]["feedback_new"].format(
        full_name=message.from_user.full_name,
        username=message.from_user.username or 'no_username',
        user_id=message.from_user.id,
        feedback_text=feedback_text
    )

    try:
        for admin in ADMIN_IDS:
            await message.bot.send_message(
                chat_id=admin, text=user_info, parse_mode="Markdown"
            )

        await message.answer(MESSAGES[lang]["feedback_success"])

    except Exception as e:
        await message.answer(MESSAGES[lang]["feedback_error"])
        print(f"Ошибка отправки отзыва админу: {e}")


@user_router.message(Command("ref"))
async def ref_link_handler(message: types.Message):
    pet = await PetModel.filter(tg_id=message.from_user.id).first()
    lang = get_lang(pet, message)

    bot_info = await message.bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{message.from_user.id}"

    invited_count = await PetModel.filter(referred_by=message.from_user.id).count()
    share_text = MESSAGES[lang]["ref_share_text"]
    share_url = f"https://t.me/share/url?url={quote(ref_link)}&text={quote(share_text)}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=MESSAGES[lang]["ref_share_btn"],
                    url=share_url,
                )
            ]
        ]
    )

    await message.answer(
        MESSAGES[lang]["ref_info"].format(invited_count=invited_count, ref_link=ref_link),
        parse_mode="HTML",
        reply_markup=keyboard,
    )