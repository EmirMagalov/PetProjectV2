import random
import time
from fastapi import APIRouter, HTTPException
from backend.models.pet import Pet as PetModel
from bot.workers.pet import check_pet_notifications_job

pet_router = APIRouter(prefix="/api", tags=["api"])


@pet_router.get("/{tg_id}")
async def get_pet(tg_id: int):
    pet = await PetModel.filter(tg_id=tg_id).first()

    if not pet:
        pet, created = await PetModel.get_or_create(
            tg_id=tg_id,
            defaults={
                "coins": 50,
                "food_level": 50.0,
                "energy": 50.0,
                "lives": 3,
                "feed_count": 3,
                "bad_stats_minutes": 0,
                "poop_bad_minutes": 0,
                "cart": {"burger": 1, "shampoo": 1},
                "last_update": time.time(),
                "last_interaction": int(time.time()),
            },
        )
    else:
        pet.last_interaction = int(time.time())
        await pet.save(update_fields=["last_interaction"])
    return pet


@pet_router.post("/update")
async def update_pet(data: dict):
    tg_id = data.get("tg_id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="tg_id is required")

    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    current_ts = int(time.time())
    updated_fields = {"last_interaction", "last_update", "bad_stats_minutes", "poop_bad_minutes"}
    if "stinky" in data:
        # Если в БД питомец вонял, а с фронтенда пришел False (его помыли)
        if pet.stinky and data["stinky"] is False:
            pet.last_washed_time = current_ts
            updated_fields.add("last_washed_time")

        # --- 2. Фиксируем время уборки какахи ---
    if "is_pooped" in data:
        # Если в БД была кучка, а с фронтенда пришел False (ее убрали)
        if pet.is_pooped and data["is_pooped"] is False:
            pet.last_poop_cleaned_time = current_ts
            updated_fields.add("last_poop_cleaned_time")
    # Валидные поля модели
    valid_fields = set(pet._meta.fields_map.keys())

    # Применяем входящие данные
    for key, value in data.items():
        if key in valid_fields and key != "tg_id":
            setattr(pet, key, value)
            updated_fields.add(key)

    pet.last_interaction = current_ts
    pet.last_update = current_ts
    pet.clean_up_stats()

    await pet.save(update_fields=list(updated_fields))
    return {"status": "success", "pet": pet}


@pet_router.post("/reset")
async def reset_pet(data: dict):
    tg_id = data.get("tg_id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="tg_id is required")

    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet.name = None
    pet.level = 1
    pet.exp = 0
    pet.lives = 3
    pet.food_level = 50.0
    pet.energy = 50.0
    pet.stinky = False
    pet.sleep = False
    pet.sleep_end_time = 0.0
    pet.fastfood_streak = 0
    pet.is_fat = False
    pet.sick = False
    pet.is_pooped = False
    pet.addiction_streak = 0
    pet.bad_stats_minutes = 0
    pet.poop_bad_minutes = 0
    pet.cart = {"burger": 1}
    pet.last_update = time.time()
    pet.last_interaction = int(time.time())

    pet.game_over_notified = False
    pet.low_lives_notified = False
    pet.critical_life_notified = False
    pet.hungry_notified = False
    pet.energy_notified = False
    pet.poop_notified = False
    pet.stinky_notified = False
    pet.sick_notified = False
    if hasattr(pet, "addiction_notified"):
        pet.addiction_notified = False

    await pet.save()
    return {"status": "success", "pet": pet}


@pet_router.post("/test-notification/{tg_id}")
async def test_notification(tg_id: int):
    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    pet.hungry_notified = False
    pet.food_level = 5.0
    pet.last_interaction = int(time.time()) - 100
    await pet.save()

    await check_pet_notifications_job()

    return {"status": "ok", "message": "Проверка запущена, проверьте Telegram"}


@pet_router.post("/pet/spin-fortune/{tg_id}")
async def spin_fortune(tg_id: int):
    NOW = int(time.time())
    COOLDOWN = 86400  # 24 часа в секундах
    SPIN_PRICE = 100  # Стоимость платного спина

    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    is_free_spin = (NOW - pet.last_fortune_spin) >= COOLDOWN

    # Если бесплатный спин НЕ доступен — проверяем баланс монет
    if not is_free_spin:
        if pet.coins < SPIN_PRICE:
            remaining_seconds = COOLDOWN - (NOW - pet.last_fortune_spin)
            return {
                "success": False,
                "message": f"Недостаточно монет! Платный спин стоит {SPIN_PRICE} монет.",
                "retry_in": remaining_seconds
            }
        # Списываем монеты за платный спин
        pet.coins -= SPIN_PRICE
    else:
        # Если спин бесплатный — обновляем таймер бесплатного спина
        pet.last_fortune_spin = NOW
        pet.fortune_notified = False

    # Массив наград с настроенными весами (шансами в %)
    rewards = [
        {"id": 0, "type": "coins", "amount": 50, "name": "50 Монет", "weight": 35},
        {"id": 1, "type": "coins", "amount": 100, "name": "100 Монет", "weight": 25},
        {"id": 2, "type": "coins", "amount": 500, "name": "500 Монет", "weight": 10},
        {"id": 3, "type": "coins", "amount": 1500, "name": "1500 Монет", "weight": 5},  # Редкий джекпот 5%
        {"id": 4, "type": "coins", "amount": 5000, "name": "5000 Монет", "weight": 1},  # Редкий джекпот 1%
        {"id": 5, "type": "potion", "amount": 1, "item_id": "healthPotion", "name": "Зелье здоровья", "weight": 7},
        {"id": 6, "type": "food", "amount": 1, "item_id": "burger", "name": "Бургер", "weight": 15},
        {"id": 7, "type": "nothing", "amount": 0, "name": "Ничего", "weight": 10},
    ]

    # Выбор одной награды с учетом весов
    weights = [int(r["weight"]) for r in rewards]
    selected_reward = random.choices(rewards, weights=weights, k=1)[0]

    # Создаем чистую копию словаря награды (без служебного поля weight для ответа)
    reward = {k: v for k, v in selected_reward.items() if k != "weight"}

    # Начисление выигрыша
    if reward["type"] == "coins":
        pet.coins += reward["amount"]
    elif reward["type"] == "nothing":
        # Ничего не начисляем
        pass
    elif "item_id" in reward:
        item_id = reward["item_id"]
        amount = reward.get("amount", 1)

        current_cart = dict(pet.cart) if pet.cart else {}
        current_cart[item_id] = current_cart.get(item_id, 0) + amount
        pet.cart = current_cart

    # Сохраняем обновлённые данные
    await pet.save(update_fields=["last_fortune_spin", "fortune_notified", "coins", "cart"])

    # Время следующего бесплатного спина
    next_spin_at = pet.last_fortune_spin + COOLDOWN

    return {
        "success": True,
        "reward": reward,
        "is_free": is_free_spin,
        "coins_left": pet.coins,
        "next_spin_at": next_spin_at
    }
