import random
import time

from backend.models.pet import Pet as PetModel

# === Настройки расхода (легко менять) ===
FOOD_PER_MIN_HEALTHY = 0.25
FOOD_PER_MIN_SICK = 0.416

ENERGY_PER_MIN_HEALTHY = 0.25
ENERGY_PER_MIN_SICK = 0.416
# ======================================


async def pet_tick_job():
    pets = await PetModel.all()
    NOW = int(time.time())
    for pet in pets:
        # --- 1. ЕДА уменьшается ВСЕГДА (и во сне, и при бодрствовании) ---
        food_rate = FOOD_PER_MIN_SICK if pet.sick else FOOD_PER_MIN_HEALTHY
        pet.food_level = max(0.0, pet.food_level - food_rate)

        # --- 2. ЭНЕРГИЯ растёт во сне или падает при бодрствовании ---
        if pet.sleep:
            pet.energy = min(100.0, pet.energy + 20.0)
            if pet.energy >= 100.0:
                pet.sleep = False
                pet.sleep_end_time = 0.0
        else:
            energy_rate = ENERGY_PER_MIN_SICK if pet.sick else ENERGY_PER_MIN_HEALTHY
            pet.energy = max(0.0, pet.energy - energy_rate)

            # Какать/вонять питомец может только когда бодрствует
            if pet.last_interaction and (NOW - pet.last_interaction) >= 1800:
                offline_minutes = (NOW - pet.last_interaction) / 60.0

                # Если прошло от 30 до 60 минут: шанс ~3.3% каждый тик (1 из 30).
                # Если прошло 60+ минут: 100% гарантированно становится грязным.
                if offline_minutes >= 60:
                    pet.stinky = True
                    pet.is_pooped = True
                else:
                    if not pet.stinky and random.random() < (1 / 30):
                        pet.stinky = True

                    if not pet.is_pooped and random.random() < (1 / 30):
                        pet.is_pooped = True

        # --- 3. НАКОПЛЕНИЕ ГРЯЗИ И БОЛЕЗНЬ ---
        if (pet.is_pooped or pet.stinky) and not pet.sick:
            pet.poop_bad_minutes += 1
            if pet.poop_bad_minutes >= 180:
                pet.sick = True

        # --- 4. НАКАЗАНИЕ ЗА 0 ЕДЫ ИЛИ 0 ЭНЕРГИИ ---
        if pet.food_level == 0 or pet.energy == 0:
            pet.bad_stats_minutes += 1
            if pet.bad_stats_minutes >= 480:
                pet.lives = max(0, pet.lives - 1)
                pet.bad_stats_minutes = 0

        pet.clean_up_stats()

        await pet.save(update_fields=[
            "food_level",
            "energy",
            "is_pooped",
            "stinky",
            "sick",
            "lives",
            "sleep",
            "sleep_end_time",
            "bad_stats_minutes",
            "poop_bad_minutes"
        ])