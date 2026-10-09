import asyncio
import logging
import time
from aiogram import types
from aiogram.exceptions import TelegramAPIError, TelegramForbiddenError
from backend.models.pet import Pet as PetModel
from bot.main import bot
from common.config import settings

logger = logging.getLogger(__name__)

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

# Ограничитель отправки: максимум 25 параллельных запросов к Telegram
SEMAPHORE = asyncio.Semaphore(25)


async def send_telegram_message(tg_id: int, text: str, last_interaction: int) -> bool:
    current_time = int(time.time())

    # Защита: если игрок был активен менее 35 секунд назад, пуш не отправляем
    if last_interaction and (current_time - last_interaction) < 35:
        return False

    async with SEMAPHORE:
        try:
            await bot.send_message(tg_id, text, reply_markup=keyboard, parse_mode="HTML")
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

    # --- 1. ПРОВЕРКА ЗАВИСИМОСТИ ---
    if pet.addiction_streak > 0:
        if pet.addiction_time > 0 and (now - pet.addiction_time) >= 1200:
            if not getattr(pet, "addiction_notified", False):
                if await send_telegram_message(pet.tg_id, "🚬 Трубка сама себя не покурит!", last_act):
                    pet.addiction_notified = True
                    is_notified_changed = True
    else:
        if getattr(pet, "addiction_notified", False):
            pet.addiction_notified = False
            is_notified_changed = True

    # --- 2. ПРОВЕРКА НА ГИБЕЛЬ ---
    if pet.lives <= 0:
        if not pet.game_over_notified:
            if await send_telegram_message(pet.tg_id, "💀 Питомец погиб из-за плохих условий!", last_act):
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
                if await send_telegram_message(pet.tg_id, "❤️ У питомца осталось всего жизней: <b>2</b>!", last_act):
                    pet.low_lives_notified = True
                    is_notified_changed = True
        else:
            if pet.low_lives_notified:
                pet.low_lives_notified = False
                is_notified_changed = True

        if pet.lives == 1:
            if not pet.critical_life_notified:
                if await send_telegram_message(
                    pet.tg_id, "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!", last_act
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
                if await send_telegram_message(pet.tg_id, "🍽️ Питомец проголодался!", last_act):
                    pet.hungry_notified = True
                    is_notified_changed = True
        else:
            if pet.hungry_notified:
                pet.hungry_notified = False
                is_notified_changed = True

        if pet.energy < 20:
            if not pet.energy_notified:
                if await send_telegram_message(pet.tg_id, "😴 Питомец сильно устал и хочет спать!", last_act):
                    pet.energy_notified = True
                    is_notified_changed = True
        else:
            if pet.energy_notified:
                pet.energy_notified = False
                is_notified_changed = True

        # --- 5. ГРЯЗЬ И БОЛЕЗНЬ ---
        if pet.is_pooped:
            if not pet.poop_notified:
                if await send_telegram_message(pet.tg_id, "💩 Питомец тут набедокурил... Надо убрать!", last_act):
                    pet.poop_notified = True
                    is_notified_changed = True
        else:
            if pet.poop_notified:
                pet.poop_notified = False
                is_notified_changed = True

        if pet.stinky:
            if not pet.stinky_notified:
                if await send_telegram_message(pet.tg_id, "🤢 Питомец начал сильно вонять! Пора его помыть!", last_act):
                    pet.stinky_notified = True
                    is_notified_changed = True
        else:
            if pet.stinky_notified:
                pet.stinky_notified = False
                is_notified_changed = True

        if pet.sick:
            if not pet.sick_notified:
                if await send_telegram_message(pet.tg_id, "🤒 Питомец заболел, нужно его подлечить!", last_act):
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
                        "🎰 <b>Бесплатный спин готов!</b> Заходи и крути Колесо Фортуны!",
                        last_act
                ):
                    pet.fortune_notified = True
                    is_notified_changed = True
        else:
            # Если игрок уже прокрутил колесо (last_spin обновился), сбрасываем флаг
            if getattr(pet, "fortune_notified", False):
                pet.fortune_notified = False
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
        ]
        if hasattr(pet, "addiction_notified"):
            update_fields.append("addiction_notified")

        await pet.save(update_fields=update_fields)


async def check_pet_notifications_job():
    """Фоновая проверка условий для отправки пушей."""
    try:
        now = time.time()
        # Выгружаем питомцев (в будущем при росте базы лучше использовать пагинацию .limit().offset())
        pets = await PetModel.all()

        # Запускаем обработку питомцев параллельно
        tasks = [process_pet_notifications(pet, now) for pet in pets]
        await asyncio.gather(*tasks)

    except Exception as e:
        logger.error(f"Ошибка в рассылке уведомлений: {e}")