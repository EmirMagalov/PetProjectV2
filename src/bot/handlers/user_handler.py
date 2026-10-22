from urllib.parse import quote
from aiogram import Router, types, F, Bot
import time
from tortoise.expressions import F as db_f
from aiogram import Router, types, Bot
from aiogram.filters import Command, CommandObject
from common.config import settings
from backend.models.pet import Pet as PetModel
from common.config import ADMIN_IDS

user_router = Router()

PHOTO_CACHE = {"photo1": None, "photo2": None}


user_router = Router()


@user_router.message(Command("start"))
async def start_handler(message: types.Message, command: CommandObject, bot: Bot):
    tg_id = message.from_user.id
    first_name = message.from_user.first_name or "Игрок"
    username = message.from_user.username

    args = command.args
    start_param = args if (args and args.startswith("ref_")) else None

    # 1. Проверяем, есть ли уже такой питомец в базе
    pet = await PetModel.filter(tg_id=tg_id).first()
    is_new = False
    bonus_coins = 0
    referrer_id = None

    if not pet:
        is_new = True

        # Обрабатываем реферал, если передан параметр
        if start_param:
            try:
                parsed_id = int(start_param.split("_")[1])
                if parsed_id != tg_id:  # Защита от самоприглашения
                    # Проверяем, существует ли пригласивший
                    if await PetModel.filter(tg_id=parsed_id).exists():
                        referrer_id = parsed_id
                        bonus_coins = 150  # Бонус новичку

                        # Начисляем бонус другу (пригласившему)
                        REFERRER_BONUS = 200
                        await PetModel.filter(tg_id=referrer_id).update(
                            coins=db_f("coins") + REFERRER_BONUS
                        )
            except ValueError:
                pass


    else:
        # Если пользователь уже существовал, просто обновляем время взаимодействия
        pet.last_interaction = int(time.time())
        await pet.save(update_fields=["last_interaction"])

    # 2. Кнопка открытия игры
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🎮 Открыть игру",
                    web_app=types.WebAppInfo(url=f"{settings.DOMAIN}/?coins={bonus_coins if is_new and bonus_coins > 0 and start_param else 0}")
                )
            ]
        ]
    )

    text = "Добро пожаловать в нашу уютную игру!\n\nЗдесь ты сможешь заботиться о своем питомце... 🐾"

    # Если новичок зарегистрировался по рефералке
    if is_new and bonus_coins > 0 and start_param:
        text += f"\n\n🎁 Вы активировали реферальную ссылку и получили бонус +{bonus_coins} монет!"
        coins_amount = 1500
        callback_data_str = f"claim_bonus_{coins_amount}"

        ref_keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text=f"🎁 Забрать {coins_amount} монет!",
                        callback_data=callback_data_str,
                    )
                ]
            ]
        )
        try:
            referrer_tg_id = int(start_param.split("_")[1])
            user_link = f"<a href='tg://user?id={tg_id}'>{first_name}</a>"
            if username:
                user_link += f" (@{username})"

            # Отправляем уведомление другу
            await bot.send_message(
                chat_id=referrer_tg_id,
                text=f"🎉 По вашей реферальной ссылке зарегистрировался пользователь {user_link}!",
                parse_mode="HTML",
                reply_markup=ref_keyboard,
            )
        except Exception as e:
            print(f"Не удалось отправить уведомление рефереру: {e}")
    text += "\n\nПригласи друга 🎁 - /ref"
    await message.answer(text, reply_markup=keyboard)


@user_router.message(F.text.lower().startswith("отзыв"))
async def feedback_handler(message: types.Message):
    # Извлекаем сам текст отзыва (убираем слово "Отзыв:")
    feedback_text = message.text[6:].strip()

    if not feedback_text:
        await message.answer(
            "⚠️ Вы написали «Отзыв:», но забыли добавить сам текст. Попробуйте еще раз!"
        )
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
                chat_id=admin, text=user_info, parse_mode="Markdown"
            )

        # Подтверждаем пользователю отправку
        await message.answer("✨ Спасибо за отзыв!")

    except Exception as e:
        await message.answer(
            "❌ Произошла ошибка при отправке отзыва. Попробуйте позже."
        )
        print(f"Ошибка отправки отзыва админу: {e}")


@user_router.message(Command("ref"))
async def ref_link_handler(message: types.Message):
    bot_info = await message.bot.get_me()
    ref_link = f"https://t.me/{bot_info.username}?start=ref_{message.from_user.id}"

    # Считаем, сколько людей пригласил этот пользователь
    invited_count = await PetModel.filter(referred_by=message.from_user.id).count()

    # Текст, который автоматически подставится при шаринге
    share_text = "🐾 Заботься о своем питомце в классной игре!"

    # Формируем специальную ссылку для шэринга в Telegram
    share_url = f"https://t.me/share/url?url={quote(ref_link)}&text={quote(share_text)}"

    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="📤 Поделиться с другом",
                    url=share_url,  # 👈 Теперь здесь ссылка для шаринга
                )
            ]
        ]
    )

    await message.answer(
        f"👥 <b>Пригласи друга 🎁</b>\n\n"
        f"Приглашайте друзей по своей ссылке и получайте бонусы!\n"
        f"👤 Приглашено друзей: <b>{invited_count}</b>\n\n"
        f"🔗 Ваша ссылка:\n<code>{ref_link}</code>",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
