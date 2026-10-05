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
    """Фоновая задача: запускается раз в 1 минуту для всех питомцев."""
    pets = await PetModel.all()

    for pet in pets:
        # 1. Сон
        if pet.sleep:
            pet.energy = min(100.0, pet.energy + 20.0)  # +20 энергии в минуту
            if pet.energy >= 100.0:
                pet.sleep = False
                pet.sleep_end_time = 0.0

        # 2. Бодрствование
        else:
            food_rate = (
                FOOD_PER_MIN_SICK if pet.sick else FOOD_PER_MIN_HEALTHY
            )
            energy_rate = (
                ENERGY_PER_MIN_SICK if pet.sick else ENERGY_PER_MIN_HEALTHY
            )

            pet.food_level = max(0.0, pet.food_level - food_rate)
            pet.energy = max(0.0, pet.energy - energy_rate)

            # Шанс покакать (1/90 в минуту)
            if not pet.is_pooped and random.random() < (1 / 90):
                pet.is_pooped = True

            # Шанс завонять (1/90 в минуту)
            if not pet.stinky and random.random() < (1 / 90):
                pet.stinky = True
        # current_time = int(time.time())
        # last_interaction = int(pet.last_interaction) if pet.last_interaction else 0
        # seconds_since_last_action = current_time - last_interaction
        # 3. Накопление грязи и болезнь (180 минут = 3 часа)
        if pet.is_pooped or pet.stinky:
            # Считаем грязь только пока питомец не болен
            if not pet.sick:
                pet.poop_bad_minutes += 1
                if pet.poop_bad_minutes >= 180:
                    pet.sick = True
                    pet.poop_bad_minutes = 0
            else:
                pet.poop_bad_minutes = 0
        else:
            pet.poop_bad_minutes = 0

        # 4. Потеря жизней от голода/усталости (480 минут = 8 часов)
        if pet.food_level == 0 or pet.energy == 0:
            pet.bad_stats_minutes += 1
            if pet.bad_stats_minutes >= 480:
                pet.lives = max(0, pet.lives - 1)
                pet.bad_stats_minutes = 0
        else:
            pet.bad_stats_minutes = 0

        await pet.save()