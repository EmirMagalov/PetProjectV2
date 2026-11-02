import asyncio
import logging
import time
from datetime import date
from aiogram import types
from aiogram.exceptions import TelegramAPIError, TelegramForbiddenError
from backend.models.pet import Pet as PetModel, get_fresh_daily_tasks
from bot.main import bot
from common.config import settings

logger = logging.getLogger(__name__)

# Словарь локализации для пуш-уведомлений и кнопок
NOTIF_MESSAGES = {
    "en": {
        "open_game": "Open Game",
        "addiction": "🚬 The pipe won't smoke itself!",
        "game_over": "💀 The pet has died due to poor conditions!",
        "low_lives": "❤️ The pet only has <b>2</b> lives left!",
        "critical_life": "🚨 <b>Warning!</b> The pet has only <b>1 life</b> left! It's on the verge of death!",
        "hungry": "🍽️ The pet is hungry!",
        "energy": "😴 The pet is very tired and wants to sleep!",
        "poop": "💩 The pet made a mess... Needs cleaning!",
        "stinky": "🤢 The pet is starting to smell badly! Time to wash it!",
        "sick": "🤒 The pet is sick, needs treatment!",
        "fortune": "🎰 <b>Free spin is ready!</b> Come and spin the Wheel of Fortune!",
        "daily_tasks": "📆 Daily tasks have updated — log into the game!"
    },
    "ru": {
        "open_game": "Открыть игру",
        "addiction": "🚬 Трубка сама себя не покурит!",
        "game_over": "💀 Питомец погиб из-за плохих условий!",
        "low_lives": "❤️ У питомца осталось всего жизней: <b>2</b>!",
        "critical_life": "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!",
        "hungry": "🍽️ Питомец проголодался!",
        "energy": "😴 Питомец сильно устал и хочет спать!",
        "poop": "💩 Питомец тут набедокурил... Надо убрать!",
        "stinky": "🤢 Питомец начал сильно вонять! Пора его помыть!",
        "sick": "🤒 Питомец заболел, нужно его подлечить!",
        "fortune": "🎰 <b>Бесплатный спин готов!</b> Заходи и крути Колесо Фортуны!",
        "daily_tasks": "📆 Ежедневные задания обновились — заходи в игру!"
    }
}

def get_notif_lang(pet: PetModel) -> str:
    """Определяем язык питомца для уведомлений (по умолчанию 'en')"""
    if pet and hasattr(pet, "language") and pet.language in NOTIF_MESSAGES:
        return pet.language
    return "en"

def get_keyboard(lang: str = "en") -> types.InlineKeyboardMarkup:
    btn_text = NOTIF_MESSAGES[lang]["open_game"]
    return types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text=btn_text, web_app=types.WebAppInfo(url=settings.DOMAIN)
                )
            ]
        ]
    )

# Ограничитель отправки: максимум 25 параллельных запросов к Telegram
SEMAPHORE = asyncio.Semaphore(25)


async def send_telegram_message(tg_id: int, text: str, last_interaction: int, lang: str = "en") -> bool:
    current_time = int(time.time())

    # Защита: если игрок был активен менее 35 секунд назад, пуш не отправляем
    if last_interaction and (current_time - last_interaction) < 35:
        return False

    async with SEMAPHORE:
        try:
            await bot.send_message(
                tg_id, text, reply_markup=get_keyboard(lang), parse_mode="HTML"
            )
            await asyncio.sleep(0.04)  # Небольшая пауза для соблюдения RPS Telegram
            return True
        except TelegramForbiddenError:
            # Пользователь заблокировал бота
            logger.warning(f"Пользователь tg_id={tg_id} заблокировал бота.")
            return False
        except TelegramAPIError as e:
            logger.error(f"Ошибка Telegram API для tg_id={tg_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Непредвиденная ошибка для tg_id={tg_id}: {e}")
            return False


async def process_pet_notifications(pet: PetModel, now: float):
    """Обработка одного питомца."""
    is_notified_changed = False
    last_act = pet.last_interaction or 0
    lang = get_notif_lang(pet)
    m = NOTIF_MESSAGES[lang]

    # --- 0. АВТОМАТИЧЕСКИЙ СБРОС ЗАДАНИЙ НА НОВЫЙ ДЕНЬ ---
    today_str = str(date.today())
    if pet.tasks_reset_date != today_str:
        pet.tasks_reset_date = today_str
        pet.daily_tasks = get_fresh_daily_tasks()
        pet.daily_tasks_notified = False  # Сбрасываем флаг, чтобы пришло уведомление
        is_notified_changed = True

    # --- 1. ПРОВЕРКА ЗАВИСИМОСТИ ---
    if pet.addiction_streak > 0:
        if pet.addiction_time > 0 and (now - pet.addiction_time) >= 1200:
            if not getattr(pet, "addiction_notified", False):
                if await send_telegram_message(
                    pet.tg_id, m["addiction"], last_act, lang
                ):
                    pet.addiction_notified = True
                    is_notified_changed = True
    else:
        if getattr(pet, "addiction_notified", False):
            pet.addiction_notified = False
            is_notified_changed = True

    # --- 2. ПРОВЕРКА НА ГИБЕЛЬ ---
    if pet.lives <= 0:
        if not pet.game_over_notified:
            if await send_telegram_message(
                pet.tg_id, m["game_over"], last_act, lang
            ):
                pet.game_over_notified = True
                pet.low_lives_notified = False
                pet.critical_life_notified = False
                is_notified_changed = True
    else:
        if pet.game_over_notified:
            pet.game_over_notified = False
            is_notified_changed = True

        # --- 3. ПРЕДУПРЕЖДЕНИЯ О ЖИЗНЯХ ---
        if pet.lives == 2:
            if not pet.low_lives_notified:
                if await send_telegram_message(
                    pet.tg_id, m["low_lives"], last_act, lang
                ):
                    pet.low_lives_notified = True
                    is_notified_changed = True
        else:
            if pet.low_lives_notified:
                pet.low_lives_notified = False
                is_notified_changed = True

        if pet.lives == 1:
            if not pet.critical_life_notified:
                if await send_telegram_message(
                    pet.tg_id,
                    m["critical_life"],
                    last_act,
                    lang
                ):
                    pet.critical_life_notified = True
                    is_notified_changed = True
        else:
            if pet.critical_life_notified:
                pet.critical_life_notified = False
                is_notified_changed = True

        # --- 4. ГОЛОД И ЭНЕРГИЯ ---
        if pet.food_level < 20:
            if not pet.hungry_notified:
                if await send_telegram_message(
                    pet.tg_id, m["hungry"], last_act, lang
                ):
                    pet.hungry_notified = True
                    is_notified_changed = True
        else:
            if pet.hungry_notified:
                pet.hungry_notified = False
                is_notified_changed = True

        if pet.energy < 20:
            if not pet.energy_notified:
                if await send_telegram_message(
                    pet.tg_id, m["energy"], last_act, lang
                ):
                    pet.energy_notified = True
                    is_notified_changed = True
        else:
            if pet.energy_notified:
                pet.energy_notified = False
                is_notified_changed = True

        # --- 5. ГРЯЗЬ И БОЛЕЗНЬ ---
        if pet.is_pooped:
            if not pet.poop_notified:
                if await send_telegram_message(
                    pet.tg_id, m["poop"], last_act, lang
                ):
                    pet.poop_notified = True
                    is_notified_changed = True
        else:
            if pet.poop_notified:
                pet.poop_notified = False
                is_notified_changed = True

        if pet.stinky:
            if not pet.stinky_notified:
                if await send_telegram_message(
                    pet.tg_id,
                    m["stinky"],
                    last_act,
                    lang
                ):
                    pet.stinky_notified = True
                    is_notified_changed = True
        else:
            if pet.stinky_notified:
                pet.stinky_notified = False
                is_notified_changed = True

        if pet.sick:
            if not pet.sick_notified:
                if await send_telegram_message(
                    pet.tg_id, m["sick"], last_act, lang
                ):
                    pet.sick_notified = True
                    is_notified_changed = True
        else:
            if pet.sick_notified:
                pet.sick_notified = False
                is_notified_changed = True

        last_spin = getattr(pet, "last_fortune_spin", 0)
        time_since_spin = now - last_spin

        if time_since_spin >= 86400:
            if not getattr(pet, "fortune_notified", False):
                if await send_telegram_message(
                    pet.tg_id,
                    m["fortune"],
                    last_act,
                    lang
                ):
                    pet.fortune_notified = True
                    is_notified_changed = True
        else:
            if getattr(pet, "fortune_notified", False):
                pet.fortune_notified = False
                is_notified_changed = True

        if not getattr(pet, "daily_tasks_notified", False):
            if await send_telegram_message(
                    pet.tg_id,
                    m["daily_tasks"],
                    last_act,
                    lang
            ):
                pet.daily_tasks_notified = True
                is_notified_changed = True

    # Сохраняем измененные состояния
    if is_notified_changed:
        update_fields = [
            "game_over_notified",
            "low_lives_notified",
            "critical_life_notified",
            "hungry_notified",
            "energy_notified",
            "poop_notified",
            "stinky_notified",
            "sick_notified",
            "fortune_notified",
            "daily_tasks_notified",
            "tasks_reset_date",
            "daily_tasks"
        ]
        if hasattr(pet, "addiction_notified"):
            update_fields.append("addiction_notified")

        await pet.save(update_fields=update_fields)


async def check_pet_notifications_job():
    """Фоновая проверка условий для отправки пушей."""
    try:
        now = time.time()
        pets = await PetModel.all()

        tasks = [process_pet_notifications(pet, now) for pet in pets]
        await asyncio.gather(*tasks)

    except Exception as e:
        logger.error(f"Ошибка в рассылке уведомлений: {e}")