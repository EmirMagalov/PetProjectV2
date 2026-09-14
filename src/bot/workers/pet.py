import asyncio
import random
from common.config import settings
from aiogram import types
from backend.models.pet import Pet as PetModel
from backend.services.pet import update_pet_stats
from common.config import settings
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
async def send_telegram_message(chat_id, text):
    await bot.send_message(chat_id, text,reply_markup=keyboard,parse_mode="HTML")


addiction_timers = {}


async def schedule_addiction_reminder(tg_id):
    """Ждет случайное время (20, 30 или 40 минут) и отправляет сообщение, если зависимость все еще есть."""
    try:
        # Выбираем случайное время в минутах: 20, 30 или 40
        delay_minutes = random.choice([20, 30, 40])
        # Переводим в секунды (для тестов можно временно уменьшить, например, до random.choice([10, 15, 20]))
        delay_seconds = delay_minutes * 60

        await asyncio.sleep(delay_seconds)

        # Проверяем актуальное состояние питомца из базы данных перед отправкой
        pet = await PetModel.get_or_none(tg_id=tg_id)
        if pet and pet.addiction_streak > 0:
            messages = [
                "Трубка сама себя не покурит!",

            ]
            await send_telegram_message(tg_id, random.choice(messages))

    except asyncio.CancelledError:
        # Таймер был отменен (например, питомец вылечился или поел фруктов)
        raise
    finally:
        # Очищаем ссылку на таймер, когда он завершился
        if tg_id in addiction_timers:
            del addiction_timers[tg_id]


async def check_pets_loop():
    # Множества в памяти для защиты от спама
    hungry_notified = set()
    energy_notified = set()
    game_over_notified = set()
    low_lives_notified = set()  # Для предупреждений об оставшихся 1-2 жизнях
    critical_life_notified = set()
    while True:
        try:
            await asyncio.sleep(60)

            pets = await PetModel.all()
            for pet in pets:
                await update_pet_stats(pet)

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
                    if pet.tg_id not in game_over_notified:
                        game_over_notified.add(pet.tg_id)
                        # Очищаем флаги предупреждений жизней при смерти
                        low_lives_notified.discard(pet.tg_id)
                        critical_life_notified.discard(pet.tg_id)
                        await send_telegram_message(
                            pet.tg_id,
                            "💀 Питомец погиб из-за плохих условий!"
                        )
                else:
                    # Если питомец воскрес / ожил
                    if pet.tg_id in game_over_notified:
                        game_over_notified.remove(pet.tg_id)

                    # 2. Предупреждение, когда осталось ровно 2 жизни
                    if pet.lives == 2:
                        if pet.tg_id not in low_lives_notified:
                            low_lives_notified.add(pet.tg_id)
                            await send_telegram_message(
                                pet.tg_id,
                                "❤️ У питомца осталось всего жизней: <b>2</b>!"
                            )
                    else:
                        if pet.tg_id in low_lives_notified:
                            low_lives_notified.remove(pet.tg_id)

                    # 3. Предупреждение, когда осталась ровно 1 жизнь (критическое состояние)
                    if pet.lives == 1:
                        if pet.tg_id not in critical_life_notified:
                            critical_life_notified.add(pet.tg_id)
                            await send_telegram_message(
                                pet.tg_id,
                                "🚨 <b>Внимание!</b> У питомца осталась всего <b>1 жизнь</b>! Он на грани гибели!"
                            )
                    else:
                        if pet.tg_id in critical_life_notified:
                            critical_life_notified.remove(pet.tg_id)

                # 4. Уведомление о голоде
                if pet.food_level < 45:
                    if pet.tg_id not in hungry_notified:
                        await send_telegram_message(
                            pet.tg_id,
                            "🍽️ Питомец начинает голодать!"
                        )
                        hungry_notified.add(pet.tg_id)
                else:
                    if pet.tg_id in hungry_notified:
                        hungry_notified.remove(pet.tg_id)

                # 5. Уведомление об энергии
                if pet.energy < 40:
                    if pet.tg_id not in energy_notified:
                        await send_telegram_message(
                            pet.tg_id,
                            "😴 Питомец сильно устал и хочет спать!"
                        )
                        energy_notified.add(pet.tg_id)
                else:
                    if pet.tg_id in energy_notified:
                        energy_notified.remove(pet.tg_id)

        except Exception as e:
            print(f"Ошибка в фоновой рассылке: {e}")