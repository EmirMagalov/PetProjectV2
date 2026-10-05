import asyncio
import time
from backend.models.pet import Pet as PetModel
from bot.workers.pet import check_pet_notifications_job, send_telegram_message  # укажите ваши импорты
from tortoise import Tortoise
from common.config import settings


async def test():
    # 1. Инициализируем БД
    await Tortoise.init(
        db_url=settings.DATABASE_URL,  # ваша строка подключения
        modules={'models': ['backend.models.pet']}
    )

    MY_TG_ID = 1059422557  # <--- Вставьте ваш Telegram ID

    print("--- ТЕСТ 1: Прямая отправка сообщения ---")
    res = await send_telegram_message(MY_TG_ID, "🔔 <b>Тест:</b> Ручная проверка бота!")
    print(f"Результат прямой отправки: {res}")

    print("\n--- ТЕСТ 2: Имитация условий для пуша ---")
    pet = await PetModel.get_or_none(tg_id=MY_TG_ID)
    if pet:
        # Искусственно ухудшаем параметры для теста
        pet.hungry_notified = False
        pet.food_level = 10.0  # Низкая еда (должен сработать пуш "Питомец проголодался!")

        # Делаем вид, что игрок был оффлайн больше 35 секунд
        pet.last_interaction = int(time.time()) - 100
        await pet.save()

        # Запускаем джоб проверки
        await check_pet_notifications_job()
        print("Проверка джоба завершена. Проверьте сообщения в Telegram!")
    else:
        print("Питомец с таким tg_id не найден в БД!")

    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(test())