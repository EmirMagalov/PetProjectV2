from fastapi import routing, APIRouter, HTTPException
from backend.schemas.pet import PetResponse, PetSyncRequest
from backend.models.pet import Pet as PetModel
import time

from backend.services.pet import update_pet_stats

pet_router = APIRouter(prefix="/api", tags=["api"])


@pet_router.get("/{tg_id}")
async def get_pet(tg_id: int):
    pet = await PetModel.filter(tg_id=tg_id).first()
    if not pet:
        pet, created = await PetModel.get_or_create(tg_id=tg_id, defaults={
            "coins": 50,
            "food_level": 50,
            "energy": 50,
            "lives": 3,
            "feed_count":3,
            "bad_stats_minutes": 0,
            "cart":{'burger':1},
            "last_update": time.time()

        })
    else:

        await update_pet_stats(pet)
        await pet.save()
    return pet


@pet_router.post("/update")
async def update_pet(data: dict):
    tg_id = data.get("tg_id")
    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    client_last_update = data.get("last_update")

    if client_last_update is not None and client_last_update < pet.last_update:
        return {
            "status": "outdated",
            "server_data": pet
        }

    # Данные актуальные — сохраняем
    for key, value in data.items():
        if hasattr(pet, key) and key not in ("tg_id", "last_update"):
            setattr(pet, key, value)

    pet.last_update = time.time()
    await pet.save()

    return {"status": "success", "pet": pet}

@pet_router.post("/reset")
async def reset_pet(data: dict):
    tg_id = data.get("tg_id")
    pet = await PetModel.get_or_none(tg_id=tg_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # Сбрасываем всё к заводским настройкам
    pet.name = None
    pet.level = 1
    pet.exp = 0
    pet.lives = 3
    pet.food_level = 50
    pet.energy = 50
    pet.stinky = False
    pet.sleep = False
    pet.sleep_end_time = 0.0
    pet.fastfood_streak = 0
    pet.is_fat = False
    pet.is_drunk = False
    pet.addiction_streak = 0
    pet.bad_stats_minutes = 0
    pet.cart = {'burger':1}
    pet.last_update = time.time()

    await pet.save()
    return {"status": "success", "pet": pet}