import random
import time
from datetime import date

from fastapi import APIRouter, HTTPException
from backend.models.pet import Pet as PetModel, get_fresh_daily_tasks, TASKS_CONFIG
from bot.workers.pet import check_pet_notifications_job

pet_router = APIRouter(prefix="/api", tags=["api"])


def check_and_reset_tasks(pet) -> bool:
    """
    Проверяет, наступил ли новый день.
    Если да — сбрасывает задания и возвращает True (значит, нужно сохранить питомца).
    """
    today_str = str(date.today())
    if pet.tasks_reset_date != today_str or not pet.daily_tasks:
        pet.tasks_reset_date = today_str
        pet.daily_tasks = get_fresh_daily_tasks()
        pet.daily_tasks_notified = False
        return True
    return False

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
                "feed_count": 9,
                "bad_stats_minutes": 0,
                "poop_bad_minutes": 0,
                "cart": {"burger": 1, "shampoo": 1},
                "last_update": time.time(),
                "last_interaction": int(time.time()),
                "last_fortune_spin": 0,
                "paid_spin_count": 0,
            },
        )
    else:
        pet.last_interaction = int(time.time())
        updated_fields = ["last_interaction"]
        if check_and_reset_tasks(pet):
            updated_fields.extend(["tasks_reset_date", "daily_tasks"])

        await pet.save(update_fields=updated_fields)
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
    updated_fields = {
        "last_interaction",
        "last_update",
        "bad_stats_minutes",
        "poop_bad_minutes",
    }

    # 🔄 Общая проверка смены дня при обновлении
    if check_and_reset_tasks(pet):
        updated_fields.update(["tasks_reset_date", "daily_tasks"])

    if "stinky" in data:
        if pet.stinky and data["stinky"] is False:
            pet.last_washed_time = current_ts
            updated_fields.add("last_washed_time")

    if "is_pooped" in data:
        if pet.is_pooped and data["is_pooped"] is False:
            pet.last_poop_cleaned_time = current_ts
            updated_fields.add("last_poop_cleaned_time")

    valid_fields = set(pet._meta.fields_map.keys())

    for key, value in data.items():
        if key in valid_fields and key != "tg_id":
            # Защита: если прилетели старые задания от прошлого дня,
            # мы их перезапишем свежими сброшенными (опционально,
            # но безопаснее доверять фронту только если дата совпадает)
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


def get_spin_price(paid_count: int) -> int:
    return min(1000, 100 + (paid_count * 100))


@pet_router.post("/pet/spin-fortune/{tg_id}")
async def spin_fortune(tg_id: int):
    NOW = int(time.time())
    COOLDOWN = 86400  # 24 часа

    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    is_free_spin = (NOW - pet.last_fortune_spin) >= COOLDOWN

    if is_free_spin:
        pet.paid_spin_count = 0
    else:
        current_spin_price = get_spin_price(pet.paid_spin_count)
        if pet.coins < current_spin_price:
            remaining_seconds = COOLDOWN - (NOW - pet.last_fortune_spin)
            return {
                "success": False,
                "message": f"Недостаточно монет! Платный спин стоит {current_spin_price} монет.",
                "retry_in": remaining_seconds,
            }
        pet.coins -= current_spin_price
        pet.paid_spin_count += 1

    updated_fields = ["coins", "cart", "paid_spin_count"]

    if is_free_spin:
        pet.last_fortune_spin = NOW
        pet.fortune_notified = False
        updated_fields.extend(["last_fortune_spin", "fortune_notified"])

    rewards = [
        {"id": 0, "type": "coins", "amount": 50, "name": "50 Монет", "weight": 35},
        {"id": 1, "type": "coins", "amount": 100, "name": "100 Монет", "weight": 25},
        {"id": 2, "type": "coins", "amount": 500, "name": "500 Монет", "weight": 10},
        {"id": 3, "type": "coins", "amount": 1500, "name": "1500 Монет", "weight": 5},
        {"id": 4, "type": "coins", "amount": 5000, "name": "5000 Монет", "weight": 1},
        {
            "id": 5,
            "type": "serum",
            "amount": 1,
            "item_id": "health_serum",
            "name": "Сыворотка здоровья",
            "weight": 5,
        },
        {
            "id": 6,
            "type": "food",
            "amount": 1,
            "item_id": "burger",
            "name": "Бургер",
            "weight": 10,
        },
        {"id": 7, "type": "nothing", "amount": 0, "name": "Ничего", "weight": 10},
    ]

    weights = [int(r["weight"]) for r in rewards]
    selected_reward = random.choices(rewards, weights=weights, k=1)[0]
    reward = {k: v for k, v in selected_reward.items() if k != "weight"}

    if reward["type"] == "coins":
        pet.coins += reward["amount"]
    elif reward["type"] == "nothing":
        pass
    elif "item_id" in reward:
        item_id = reward["item_id"]
        amount = reward.get("amount", 1)
        current_cart = dict(pet.cart) if pet.cart else {}
        current_cart[item_id] = current_cart.get(item_id, 0) + amount
        pet.cart = current_cart

    await pet.save(update_fields=updated_fields)

    next_spin_at = pet.last_fortune_spin + COOLDOWN
    # Считаем точную цену следующего спина прямо на сервере
    next_spin_price = get_spin_price(pet.paid_spin_count)

    return {
        "success": True,
        "reward": reward,
        "is_free": is_free_spin,
        "coins_left": pet.coins,
        "next_spin_at": next_spin_at,
        "paid_spin_count": pet.paid_spin_count,
        "next_spin_price": next_spin_price,  # 👈 Сервер сам говорит фронту цену
    }


@pet_router.post("/pet/claim-task/{tg_id}")
async def claim_task(tg_id: int, data: dict):
    task_key = data.get("task_key")

    if not task_key or task_key not in TASKS_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid task key")

    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    tasks = dict(pet.daily_tasks) if pet.daily_tasks else {}
    task_data = tasks.get(task_key, {"progress": 0, "claimed": False})

    target = TASKS_CONFIG[task_key]["target"]
    reward = TASKS_CONFIG[task_key]["reward"]

    # Проверки безопасности
    if task_data["progress"] < target:
        raise HTTPException(status_code=400, detail="Task not completed yet")
    if task_data.get("claimed"):
        raise HTTPException(status_code=400, detail="Reward already claimed")

    # Помечаем задание как «получено» и насыпаем монеты
    task_data["claimed"] = True
    tasks[task_key] = task_data
    pet.daily_tasks = tasks

    pet.coins += reward
    await pet.save(update_fields=["daily_tasks", "coins"])

    return {
        "success": True,
        "coins": pet.coins,
        "daily_tasks": pet.daily_tasks
    }








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
