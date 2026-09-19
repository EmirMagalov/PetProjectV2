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

    # Превращаем last_update в целое число (int), отбрасывая хвост .831037
    last_update_int = int(pet.last_update) if pet.last_update else 0

    if last_update_int and (current_time - last_update_int) < 35:
        return

    await bot.send_message(pet.tg_id, text, reply_markup=keyboard, parse_mode="HTML")

addiction_timers = {}

async def schedule_addiction_reminder(tg_id):
    """Ждет случайное время (20, 30 или 40 минут) и отправляет сообщение, если зависимость все еще есть."""
    try:
        delay_minutes = random.choice([20, 30, 40])
        delay_seconds = delay_minutes * 60

        await asyncio.sleep(delay_seconds)

        pet = await PetModel.get_or_none(tg_id=tg_id)
        if pet and pet.addiction_streak > 0:
            # Проверяем активность и для зависимости тоже
            current_time = int(time.time())
            if pet.last_update and (current_time - pet.last_update) < 35:
                return

            messages = [
                "Трубка сама себя не покурит!",
            ]
            await bot.send_message(tg_id, random.choice(messages), reply_markup=keyboard, parse_mode="HTML")

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
                await update_pet_stats(pet)

                # Флаг для отслеживания, нужно ли сохранять изменения в БД в конце итерации
                is_updated = False

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
                        await send_telegram_message(
                            pet,
                            "💀 Питомец погиб из-за плохих условий!"
                        )
                        pet.game_over_notified = True
                        pet.low_lives_notified = False
                        pet.critical_life_notified = False
                        is_updated = True
                else:
                    # Если питомец воскрес / ожил
                    if pet.game_over_notified:
                        pet.game_over_notified = False
                        is_updated = True

                    # 2. Предупреждение, когда осталось ровно 2 жизни
                    if pet.lives == 2:
                        if not pet.low_lives_notified:
                            await send_telegram_message(
                                pet,
                                "❤️ У питомца осталось всего жизней: <b>2</b>!"
                            )
                            pet.low_lives_notified = True
                            is_updated = True
                    else:
                        if pet.low_lives_notified:
                            pet.low_lives_notified = False
                            is_updated = True

                    # 3. Предупреждение, когда осталась ровно 1 жизнь (критическое состояние)
                    if pet.lives == 1:
                        if not pet.critical_life_notified:
                            await send_telegram_message(
                                pet,
                                "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!"
                            )
                            pet.critical_life_notified = True
                            is_updated = True
                    else:
                        if pet.critical_life_notified:
                            pet.critical_life_notified = False
                            is_updated = True

                # 4. Уведомление о голоде
                if pet.food_level < 20:
                    if not pet.hungry_notified:
                        await send_telegram_message(
                            pet,
                            "🍽️ Питомец проголодался!"
                        )
                        pet.hungry_notified = True
                        is_updated = True
                else:
                    if pet.hungry_notified:
                        pet.hungry_notified = False
                        is_updated = True

                # 5. Уведомление об энергии
                if pet.energy < 20:
                    if not pet.energy_notified:
                        await send_telegram_message(
                            pet,
                            "😴 Питомец сильно устал и хочет спать!"
                        )
                        pet.energy_notified = True
                        is_updated = True
                else:
                    if pet.energy_notified:
                        pet.energy_notified = False
                        is_updated = True

                # 6. Уведомление о какашке
                if pet.is_pooped:
                    if not pet.poop_notified:
                        await send_telegram_message(
                            pet,
                            "💩 Питомец тут набедокурил... Надо убрать!"
                        )
                        pet.poop_notified = True
                        is_updated = True
                else:
                    if pet.poop_notified:
                        pet.poop_notified = False
                        is_updated = True

                # 7. Уведомление о вони
                if pet.stinky:
                    if not pet.stinky_notified:
                        await send_telegram_message(
                            pet,
                            "🤢 Питомец начал сильно вонять! Пора его помыть!"
                        )
                        pet.stinky_notified = True
                        is_updated = True
                else:
                    if pet.stinky_notified:
                        pet.stinky_notified = False
                        is_updated = True

                # Сохраняем изменения в базу только если какой-то флаг реально изменился
                if is_updated:
                    await pet.save()

        except Exception as e:
            print(f"Ошибка в фоновой рассылке: {e}")