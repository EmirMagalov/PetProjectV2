import time
from fastapi import APIRouter, HTTPException
from backend.models.pet import Pet as PetModel

pet_router = APIRouter(prefix="/api", tags=["api"])


@pet_router.get("/{tg_id}")
async def get_pet(tg_id: int):
    # Просто отдаем данные из базы — фоновая задача их уже обновила!
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
            },
        )
    return pet


@pet_router.post("/update")
async def update_pet(data: dict):
    tg_id = data.get("tg_id")
    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Применяем действия игрока (кормление, уборка, лечение)
    for key, value in data.items():
        if hasattr(pet, key) and key != "tg_id":
            setattr(pet, key, value)

    # Если убрали грязь — сбрасываем счетчик
    if not pet.is_pooped and not pet.stinky:
        pet.poop_bad_minutes = 0

    # Если покормили — сбрасываем счетчик голода
    if pet.food_level > 0 and pet.energy > 0:
        pet.bad_stats_minutes = 0

    await pet.save()
    return {"status": "success", "pet": pet}


@pet_router.post("/reset")
async def reset_pet(data: dict):
    tg_id = data.get("tg_id")
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

    await pet.save()
    return {"status": "success", "pet": pet}