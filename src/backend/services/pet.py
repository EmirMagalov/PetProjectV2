import random
import time

from backend.models.pet import Pet as PetModel

# === Настройки расхода (в минуту) ===
FOOD_PER_MIN_HEALTHY = 0.25
FOOD_PER_MIN_SICK = 0.416

ENERGY_PER_MIN_HEALTHY = 0.25
ENERGY_PER_MIN_SICK = 0.416


async def pet_tick_job():
    pets = await PetModel.all()
    if not pets:
        return

    NOW = int(time.time())

    for pet in pets:
        # --- 1. ЕДА уменьшается ВСЕГДА ---
        food_rate = FOOD_PER_MIN_SICK if pet.sick else FOOD_PER_MIN_HEALTHY
        pet.food_level = max(0.0, pet.food_level - food_rate)

        # --- 2. ЭНЕРГИЯ ---
        if pet.sleep:
            # Сон (+20 в минуту)
            pet.energy = min(100.0, pet.energy + 20.0)
            if pet.energy >= 100.0:
                pet.sleep = False
                pet.sleep_end_time = 0.0
        else:
            energy_rate = ENERGY_PER_MIN_SICK if pet.sick else ENERGY_PER_MIN_HEALTHY
            pet.energy = max(0.0, pet.energy - energy_rate)

        # --- 3. ГРЯЗЬ И КАКАШКИ ---

        # --- ПРОВЕРКА ГРЯЗИ (STINKY) ---
        if not pet.stinky:
            washed_time = pet.last_washed_time or pet.last_interaction or NOW
            time_since_washed = NOW - washed_time

            if time_since_washed >= 10800:
                # Через 4 часа — гарантированная грязь
                pet.stinky = True
            elif time_since_washed >= 7200:
                # Через 2 часа — шанс испачкаться (1/90)
                if random.random() < (1 / 90):
                    pet.stinky = True

        # --- ПРОВЕРКА КАКАХИ (IS_POOPED) ---
        if not pet.is_pooped:
            poop_time = pet.last_poop_cleaned_time or pet.last_interaction or NOW
            time_since_poop = NOW - poop_time

            if time_since_poop >= 10800:
                # Через 3 часа — гарантированная кучка
                pet.is_pooped = True
            elif time_since_poop >= 5400:
                # Через 1.5 часа — шанс накакать (1/90)
                if random.random() < (1 / 90):
                    pet.is_pooped = True

        # --- 4. НАКОПЛЕНИЕ ГРЯЗИ И БОЛЕЗНЬ (через 60 минут грязи) ---
        if (pet.is_pooped or pet.stinky) and not pet.sick:
            pet.poop_bad_minutes += 1
            if pet.poop_bad_minutes >= 60:
                pet.sick = True
                pet.poop_bad_minutes = 0
        elif not pet.is_pooped and not pet.stinky:
            pet.poop_bad_minutes = 0

        # --- 5. НАКАЗАНИЕ ЗА 0 ЕДЫ ИЛИ 0 ЭНЕРГИИ (8 часов = 480 мин) ---
        if pet.food_level == 0.0 or pet.energy == 0.0:
            pet.bad_stats_minutes += 1
            if pet.bad_stats_minutes >= 480:
                pet.lives = max(0, pet.lives - 1)
                pet.bad_stats_minutes = 0
        else:
            pet.bad_stats_minutes = 0

        pet.clean_up_stats()

    # --- 6. МАССОВОЕ ОБНОВЛЕНИЕ ---
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
            "poop_bad_minutes",
            "last_washed_time",
            "last_poop_cleaned_time",
        ],
    )