import random
import time
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Query
from backend.models.pet import Pet as PetModel, get_fresh_daily_tasks, TASKS_CONFIG
from bot.workers.pet import check_pet_notifications_job

pet_router = APIRouter(prefix="/api", tags=["api"])


# Словарь локализации для эндпоинтов питомца
MESSAGES = {
    "en": {
        "already_open": "ALREADY_OPEN_ON_ANOTHER_DEVICE",
        "tg_id_required": "tg_id is required",
        "pet_not_found": "Pet not found",
        "not_enough_coins": "Not enough coins! Paid spin costs {price} coins.",
        "invalid_task": "Invalid task key",
        "task_not_completed": "Task not completed yet",
        "reward_claimed": "Reward already claimed",
        "test_notification_ok": "Check initiated, please check Telegram",

        "reward_coins": "{amount} Coins",
        "reward_serum": "Health Serum",
        "reward_burger": "Burger",
        "reward_nothing": "Nothing",
    },
    "ru": {
        "already_open": "ALREADY_OPEN_ON_ANOTHER_DEVICE",
        "tg_id_required": "tg_id is required",
        "pet_not_found": "Питомец не найден",
        "not_enough_coins": "Недостаточно монет! Платный спин стоит {price} монет.",
        "invalid_task": "Неверный ключ задачи",
        "task_not_completed": "Задание еще не выполнено",
        "reward_claimed": "Награда уже получена",
        "test_notification_ok": "Проверка запущена, проверьте Telegram",
        "reward_coins": "{amount} Монет",
        "reward_serum": "Сыворотка здоровья",
        "reward_burger": "Бургер",
        "reward_nothing": "Ничего",
    }
}


def get_pet_lang(pet) -> str:
    """Определяем язык питомца (по умолчанию 'en')"""
    if pet and hasattr(pet, "language") and pet.language in MESSAGES:
        return pet.language
    return "en"


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


def get_current_season():
    month = datetime.now().month

    if month in [12, 1, 2]:
        return 'winter'
    elif month in [3, 4, 5]:
        return 'spring'
    elif month in [6, 7, 8]:
        return 'summer'
    elif month in [9, 10, 11]:
        return 'autumn'

    return 'summer'
@pet_router.get("/{tg_id}")
async def get_pet(tg_id: int, device_id: str = Query(None)):
    pet = await PetModel.filter(tg_id=tg_id).first()
    current_time = time.time()
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
                "language": "en",
                "cart": {"burger": 1, "shampoo": 1},
                "last_update": time.time(),
                "last_interaction": int(time.time()),
                "last_fortune_spin": 0,
                "paid_spin_count": 0,
                "active_device_id": device_id,
            },
        )
    else:
        lang = get_pet_lang(pet)
        if pet.active_device_id and pet.active_device_id != device_id:
            time_diff = current_time - pet.last_update
            if time_diff < 0: #20
                raise HTTPException(
                    status_code=403,
                    detail=MESSAGES[lang]["already_open"]
                )
        pet.active_device_id = device_id
        pet.last_interaction = int(current_time)
        updated_fields = ["last_interaction", "active_device_id"]

        if check_and_reset_tasks(pet):
            updated_fields.extend(["tasks_reset_date", "daily_tasks"])

        await pet.save(update_fields=updated_fields)
    pet.season = get_current_season()
    return pet


@pet_router.post("/update")
async def update_pet(data: dict):
    tg_id = data.get("tg_id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="tg_id is required")

    pet = await PetModel.get_or_none(tg_id=tg_id)
    lang = get_pet_lang(pet)
    if not pet:
        raise HTTPException(status_code=404, detail=MESSAGES[lang]["pet_not_found"])

    current_ts = int(time.time())
    updated_fields = {
        "last_interaction",
        "last_update",
        "bad_stats_minutes",
        "poop_bad_minutes",
    }

    if check_and_reset_tasks(pet):
        updated_fields.update(["tasks_reset_date", "daily_tasks"])

    # if "stinky" in data:
    #     if pet.stinky and data["stinky"] is False:
    #         pet.last_washed_time = current_ts
    #         updated_fields.add("last_washed_time")

    if "is_pooped" in data:
        if pet.is_pooped and data["is_pooped"] is False:
            pet.last_poop_cleaned_time = current_ts
            updated_fields.add("last_poop_cleaned_time")

    valid_fields = set(pet._meta.fields_map.keys())

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
    lang = get_pet_lang(pet)
    if not pet:
        raise HTTPException(status_code=404, detail=MESSAGES[lang]["pet_not_found"])

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
    lang = get_pet_lang(pet)
    if not pet:
        raise HTTPException(status_code=404, detail=MESSAGES[lang]["pet_not_found"])

    is_free_spin = (NOW - pet.last_fortune_spin) >= COOLDOWN

    if is_free_spin:
        pet.paid_spin_count = 0
    else:
        current_spin_price = get_spin_price(pet.paid_spin_count)
        if pet.coins < current_spin_price:
            remaining_seconds = COOLDOWN - (NOW - pet.last_fortune_spin)
            return {
                "success": False,
                "message": MESSAGES[lang]["not_enough_coins"].format(price=current_spin_price),
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
        {"id": 0, "type": "coins", "amount": 50, "name": MESSAGES[lang]["reward_coins"].format(amount=50),
         "weight": 35},
        {"id": 1, "type": "coins", "amount": 100, "name": MESSAGES[lang]["reward_coins"].format(amount=100),
         "weight": 25},
        {"id": 2, "type": "coins", "amount": 500, "name": MESSAGES[lang]["reward_coins"].format(amount=500),
         "weight": 10},
        {"id": 3, "type": "coins", "amount": 1500, "name": MESSAGES[lang]["reward_coins"].format(amount=1500),
         "weight": 5},
        {"id": 4, "type": "coins", "amount": 5000, "name": MESSAGES[lang]["reward_coins"].format(amount=5000),
         "weight": 1},
        {
            "id": 5,
            "type": "serum",
            "amount": 1,
            "item_id": "health_serum",
            "name": MESSAGES[lang]["reward_serum"],
            "weight": 5,
        },
        {
            "id": 6,
            "type": "food",
            "amount": 1,
            "item_id": "burger",
            "name": MESSAGES[lang]["reward_burger"],
            "weight": 10,
        },
        {"id": 7, "type": "nothing", "amount": 0, "name": MESSAGES[lang]["reward_nothing"], "weight": 10},
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
    next_spin_price = get_spin_price(pet.paid_spin_count)

    return {
        "success": True,
        "reward": reward,
        "is_free": is_free_spin,
        "coins_left": pet.coins,
        "next_spin_at": next_spin_at,
        "paid_spin_count": pet.paid_spin_count,
        "next_spin_price": next_spin_price,
    }


@pet_router.post("/pet/claim-task/{tg_id}")
async def claim_task(tg_id: int, data: dict):
    task_key = data.get("task_key")

    pet = await PetModel.get_or_none(tg_id=tg_id)
    lang = get_pet_lang(pet)

    if not pet:
        raise HTTPException(status_code=404, detail=MESSAGES[lang]["pet_not_found"])

    if not task_key or task_key not in TASKS_CONFIG:
        raise HTTPException(status_code=400, detail=MESSAGES[lang]["invalid_task"])

    tasks = dict(pet.daily_tasks) if pet.daily_tasks else {}
    task_data = tasks.get(task_key, {"progress": 0, "claimed": False})

    target = TASKS_CONFIG[task_key]["target"]
    reward = TASKS_CONFIG[task_key]["reward"]
    exp = TASKS_CONFIG[task_key]["exp"]

    if task_data["progress"] < target:
        raise HTTPException(status_code=400, detail=MESSAGES[lang]["task_not_completed"])
    if task_data.get("claimed"):
        raise HTTPException(status_code=400, detail=MESSAGES[lang]["reward_claimed"])

    task_data["claimed"] = True
    tasks[task_key] = task_data
    pet.daily_tasks = tasks

    await pet.save(update_fields=["daily_tasks", "coins"])

    return {
        "success": True,
        "reward": reward,
        "exp": exp,
        "daily_tasks": pet.daily_tasks
    }


@pet_router.post("/test-notification/{tg_id}")
async def test_notification(tg_id: int):
    pet = await PetModel.get_or_none(tg_id=tg_id)
    lang = get_pet_lang(pet)
    if not pet:
        raise HTTPException(status_code=404, detail=MESSAGES[lang]["pet_not_found"])

    pet.hungry_notified = False
    pet.food_level = 5.0
    pet.last_interaction = int(time.time()) - 100
    await pet.save()

    await check_pet_notifications_job()

    return {"status": "ok", "message": MESSAGES[lang]["test_notification_ok"]}