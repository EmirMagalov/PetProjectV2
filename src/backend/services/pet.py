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
    if not pets:
        return

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
            if (not pet.stinky or not pet.is_pooped) and pet.last_interaction:
                time_since_interaction = NOW - pet.last_interaction

                if time_since_interaction >= 3600:  # Прошло больше 1 часа
                    offline_minutes = time_since_interaction / 60.0

                    if offline_minutes >= 120:
                        pet.stinky = True
                        pet.is_pooped = True
                    else:
                        if not pet.stinky and random.random() < (1 / 60):
                            pet.stinky = True

                        if not pet.is_pooped and random.random() < (1 / 60):
                            pet.is_pooped = True

            # --- 3. НАКОПЛЕНИЕ ГРЯЗИ И БОЛЕЗНЬ (только при бодрствовании) ---
            if (pet.is_pooped or pet.stinky) and not pet.sick:
                pet.poop_bad_minutes += 1
                if pet.poop_bad_minutes >= 60:
                    pet.sick = True
                    pet.poop_bad_minutes = 0  # Сбрасываем счетчик при заболевании
            elif not pet.is_pooped and not pet.stinky:
                # Если питомец чистый, сбрасываем прогресс болезни от грязи
                pet.poop_bad_minutes = 0

        # --- 4. НАКАЗАНИЕ ЗА 0 ЕДЫ ИЛИ 0 ЭНЕРГИИ ---
        if pet.food_level == 0 or pet.energy == 0:
            pet.bad_stats_minutes += 1
            if pet.bad_stats_minutes >= 480:
                pet.lives = max(0, pet.lives - 1)
                pet.bad_stats_minutes = 0
        else:
            # Сбрасываем таймер наказания, если покормили / восстановили энергию
            pet.bad_stats_minutes = 0

        pet.clean_up_stats()

    # --- 5. МАССОВОЕ ОБНОВЛЕНИЕ ВСЕХ ПИТОМЦЕВ ОДНИМ ЗАПРОСОМ ---
    await PetModel.bulk_update(
        objects=pets,
        fields=[
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
        ]
    )