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