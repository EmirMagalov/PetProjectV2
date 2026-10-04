import time
import asyncio
import random
from common.config import settings
from aiogram import types
from backend.models.pet import Pet as PetModel
from bot.main import bot

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


async def send_telegram_message(pet, text: str) -> bool:
    """Отправляет уведомление в Telegram, если игрок оффлайн (>35 сек с последнего действия)."""
    current_time = int(time.time())
    last_interaction = int(pet.last_interaction) if pet.last_interaction else 0

    # Если игрок прямо сейчас в игре — не спамим ему в личку
    if last_interaction and (current_time - last_interaction) < 35:
        return False

    try:
        await bot.send_message(pet.tg_id, text, reply_markup=keyboard, parse_mode="HTML")
        await asyncio.sleep(0.05)  # Небольшая пауза, чтобы не упереться в лимиты Telegram API
        return True
    except Exception as e:
        print(f"Ошибка отправки сообщения для tg_id={pet.tg_id}: {e}")
        return False


async def check_pet_notifications_job():
    """Фоновая проверка условий для отправки пушей.

    Запускается планировщиком APScheduler раз в 1 минуту.
    """
    try:
        now = time.time()
        pets = await PetModel.all()

        for pet in pets:
            is_notified_changed = False

            # --- 1. ПРОВЕРКА ЗАВИСИМОСТИ (без asyncio.create_task и утечек памяти) ---
            if pet.addiction_streak > 0:
                # Если прошло от 20 до 30 минут с момента получения зависимости
                if pet.addiction_time > 0 and (now - pet.addiction_time) >= 1200:
                    if not getattr(pet, "addiction_notified", False):
                        if await send_telegram_message(pet, "🚬 Трубка сама себя не покурит!"):
                            pet.addiction_notified = True
                            is_notified_changed = True
            else:
                if getattr(pet, "addiction_notified", False):
                    pet.addiction_notified = False
                    is_notified_changed = True

            # --- 2. ПРОВЕРКА НА ГИБЕЛЬ (0 жизней) ---
            if pet.lives <= 0:
                if not pet.game_over_notified:
                    if await send_telegram_message(pet, "💀 Питомец погиб из-за плохих условий!"):
                        pet.game_over_notified = True
                        pet.low_lives_notified = False
                        pet.critical_life_notified = False
                        is_notified_changed = True
            else:
                if pet.game_over_notified:
                    pet.game_over_notified = False
                    is_notified_changed = True

                # --- 3. ПРЕДУПРЕЖДЕНИЯ О ЖИЗНЯХ ---
                # 2 жизни
                if pet.lives == 2:
                    if not pet.low_lives_notified:
                        if await send_telegram_message(pet, "❤️ У питомца осталось всего жизней: <b>2</b>!"):
                            pet.low_lives_notified = True
                            is_notified_changed = True
                else:
                    if pet.low_lives_notified:
                        pet.low_lives_notified = False
                        is_notified_changed = True

                # 1 жизнь
                if pet.lives == 1:
                    if not pet.critical_life_notified:
                        if await send_telegram_message(
                            pet, "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!"
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
                        if await send_telegram_message(pet, "🍽️ Питомец проголодался!"):
                            pet.hungry_notified = True
                            is_notified_changed = True
                else:
                    if pet.hungry_notified:
                        pet.hungry_notified = False
                        is_notified_changed = True

                if pet.energy < 20:
                    if not pet.energy_notified:
                        if await send_telegram_message(pet, "😴 Питомец сильно устал и хочет спать!"):
                            pet.energy_notified = True
                            is_notified_changed = True
                else:
                    if pet.energy_notified:
                        pet.energy_notified = False
                        is_notified_changed = True

                # --- 5. ГРЯЗЬ И БОЛЕЗНЬ ---
                if pet.is_pooped:
                    if not pet.poop_notified:
                        if await send_telegram_message(pet, "💩 Питомец тут набедокурил... Надо убрать!"):
                            pet.poop_notified = True
                            is_notified_changed = True
                else:
                    if pet.poop_notified:
                        pet.poop_notified = False
                        is_notified_changed = True

                if pet.stinky:
                    if not pet.stinky_notified:
                        if await send_telegram_message(pet, "🤢 Питомец начал сильно вонять! Пора его помыть!"):
                            pet.stinky_notified = True
                            is_notified_changed = True
                else:
                    if pet.stinky_notified:
                        pet.stinky_notified = False
                        is_notified_changed = True

                if pet.sick:
                    if not pet.sick_notified:
                        if await send_telegram_message(pet, "🤒 Питомец заболел, нужно его подлечить!"):
                            pet.sick_notified = True
                            is_notified_changed = True
                else:
                    if pet.sick_notified:
                        pet.sick_notified = False
                        is_notified_changed = True

            # Сохраняем модель ТОЛЬКО если изменились статусы отправленных уведомлений
            if is_notified_changed:
                await pet.save()

    except Exception as e:
        print(f"Ошибка в рассылке уведомлений: {e}")