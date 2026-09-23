import time
import asyncio
import random
from common.config import settings
from aiogram import types
from backend.models.pet import Pet as PetModel
from backend.services.pet import update_pet_stats
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


async def send_telegram_message(pet, text):
    current_time = int(time.time())

    last_interaction_int = int(pet.last_interaction) if hasattr(pet, 'last_interaction') and pet.last_interaction else 0

    if last_interaction_int and (current_time - last_interaction_int) < 35:
        return False  # Игрок в сети, сообщение не отправлено

    try:
        await bot.send_message(pet.tg_id, text, reply_markup=keyboard, parse_mode="HTML")
        await asyncio.sleep(1.5)
        return True  # Успешно ушло!
    except Exception as e:
        print(f"Ошибка отправки сообщения: {e}")
        return False


addiction_timers = {}


async def schedule_addiction_reminder(tg_id):
    """Ждет случайное время (20, 30 или 40 минут) и отправляет сообщение, если зависимость все еще есть."""
    try:
        while True:  # Запускаем в цикле, чтобы таймер пересоздавался, если игрок в сети
            delay_minutes = random.choice([20, 25, 30])
            delay_seconds = delay_minutes * 60

            await asyncio.sleep(delay_seconds)

            pet = await PetModel.get_or_none(tg_id=tg_id)
            if not pet or pet.addiction_streak <= 0:
                break  # Если питомец пропал или избавился от зависимости — выходим из цикла

            # Проверяем активность
            current_time = int(time.time())
            last_interaction_int = int(pet.last_interaction) if hasattr(pet,'last_interaction') and pet.last_interaction else 0

            if last_interaction_int and (current_time - last_interaction_int) < 35:
                continue

            messages = [
                "Трубка сама себя не покурит!",
            ]
            await bot.send_message(tg_id, random.choice(messages), reply_markup=keyboard, parse_mode="HTML")
            break  # Успешно отправили — выходим

    except asyncio.CancelledError:
        raise
    finally:
        if tg_id in addiction_timers:
            del addiction_timers[tg_id]


async def check_pets_loop():
    while True:
        try:
            await asyncio.sleep(60)

            pets = await PetModel.all()
            for pet in pets:
                # 1. Обновляем статы (эта функция сама считает дельту, сохраняет в базу и двигает last_update)
                await update_pet_stats(pet)
                await pet.refresh_from_db()
                # Флаг для отслеживания уведомлений (чтобы сделать pet.save() строго 1 раз в конце, если что-то изменилось)
                is_notified_changed = False

                # Логика таймера зависимости
                if pet.addiction_streak > 0:
                    if pet.tg_id not in addiction_timers:
                        addiction_timers[pet.tg_id] = asyncio.create_task(
                            schedule_addiction_reminder(pet.tg_id)
                        )
                else:
                    if pet.tg_id in addiction_timers:
                        addiction_timers[pet.tg_id].cancel()
                        del addiction_timers[pet.tg_id]

                # 1. Проверка на смерть (0 жизней)
                if pet.lives <= 0:
                    if not pet.game_over_notified:
                        success = await send_telegram_message(
                            pet,
                            "💀 Питомец погиб из-за плохих условий!"
                        )
                        if success:
                            pet.game_over_notified = True
                            pet.low_lives_notified = False
                            pet.critical_life_notified = False
                            is_notified_changed = True
                else:
                    if pet.game_over_notified:
                        pet.game_over_notified = False
                        is_notified_changed = True

                    # 2. Предупреждение (2 жизни)
                    if pet.lives == 2:
                        if not pet.low_lives_notified:
                            success = await send_telegram_message(
                                pet,
                                "❤️ У питомца осталось всего жизней: <b>2</b>!"
                            )
                            if success:
                                pet.low_lives_notified = True
                                is_notified_changed = True
                    else:
                        if pet.low_lives_notified:
                            pet.low_lives_notified = False
                            is_notified_changed = True

                    # 3. Предупреждение (1 жизнь)
                    if pet.lives == 1:
                        if not pet.critical_life_notified:
                            success = await send_telegram_message(
                                pet,
                                "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!"
                            )
                            if success:
                                pet.critical_life_notified = True
                                is_notified_changed = True
                    else:
                        if pet.critical_life_notified:
                            pet.critical_life_notified = False
                            is_notified_changed = True

                    # 4. Уведомление о голоде
                    if pet.food_level < 20:
                        if not pet.hungry_notified:
                            success = await send_telegram_message(pet, "🍽️ Питомец проголодался!")
                            if success:
                                pet.hungry_notified = True
                                is_notified_changed = True
                    else:
                        if pet.hungry_notified:
                            pet.hungry_notified = False
                            is_notified_changed = True

                    # 5. Уведомление об энергии
                    if pet.energy < 20:
                        if not pet.energy_notified:
                            success = await send_telegram_message(pet, "😴 Питомец сильно устал и хочет спать!")
                            if success:
                                pet.energy_notified = True
                                is_notified_changed = True
                    else:
                        if pet.energy_notified:
                            pet.energy_notified = False
                            is_notified_changed = True

                    # 6. Уведомление о какашке
                    if pet.is_pooped:
                        if not pet.poop_notified:
                            success = await send_telegram_message(pet, "💩 Питомец тут набедокурил... Надо убрать!")
                            if success:
                                pet.poop_notified = True
                                is_notified_changed = True
                    else:
                        if pet.poop_notified:
                            pet.poop_notified = False
                            is_notified_changed = True

                    # 7. Уведомление о вони
                    if pet.stinky:
                        if not pet.stinky_notified:
                            success = await send_telegram_message(pet,
                                                                  "🤢 Питомец начал сильно вонять! Пора его помыть!")
                            if success:
                                pet.stinky_notified = True
                                is_notified_changed = True
                    else:
                        if pet.stinky_notified:
                            pet.stinky_notified = False
                            is_notified_changed = True

                    # 8. Уведомление о болезни
                    if pet.sick:
                        if not pet.sick_notified:
                            success = await send_telegram_message(pet, "🤒 Питомец заболел нужно его подлечить!")
                            if success:
                                pet.sick_notified = True
                                is_notified_changed = True
                    else:
                        if pet.sick_notified:
                            pet.sick_notified = False
                            is_notified_changed = True

                # Если поменялись только флаги уведомлений — сохраняем их отдельно
                if is_notified_changed:
                    await pet.save()

        except Exception as e:
            print(f"Ошибка в фоновой рассылке: {e}")
