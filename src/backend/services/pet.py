import random
import time

async def update_pet_stats(pet) -> bool:
    """Обновляет состояние питомца на основе прошедшего времени.
       Возвращает True, если статы изменились."""
    now = time.time()
    elapsed_seconds = now - pet.last_update
    elapsed_minutes = int(elapsed_seconds // 60)

    if elapsed_minutes <= 0:
        return False

    # 1. ЕСЛИ ПИТОМЕЦ СПАЛ
    if pet.sleep:
        if now >= pet.sleep_end_time:
            pet.energy = 100
            pet.sleep = False
            pet.sleep_end_time = 0.0
        else:
            elapsed_sleep_seconds = now - pet.last_update
            recovered_energy = int(elapsed_sleep_seconds // 3)
            pet.energy = min(100, pet.energy + recovered_energy)

            if pet.energy >= 100:
                pet.energy = 100
                pet.sleep = False
                pet.sleep_end_time = 0.0

    # 2. ЕСЛИ ПИТОМЕЦ БОДРСТВОВАЛ
    else:
        capped_minutes = min(elapsed_minutes, 1440)

        for _ in range(capped_minutes):
            if pet.food_level > 0:
                consume = 0.3 if pet.is_drunk else 0.1
                pet.food_level = max(0.0, pet.food_level - consume)
            if pet.energy > 0:
                pet.energy = max(0, pet.energy - 0.1)
            if not pet.is_pooped and random.random() < 1 / 45:
                pet.is_pooped = True

            if not pet.stinky and random.random() < 1 / 90:
                pet.stinky = True
            is_food_zero = pet.food_level == 0
            is_energy_zero = pet.energy == 0

            if is_food_zero or is_energy_zero:
                pet.bad_stats_minutes += 1
                target_minutes =  480

                if pet.bad_stats_minutes >= target_minutes:
                    if pet.lives > 0:
                        pet.lives -= 1
                    pet.bad_stats_minutes = 0
            else:
                pet.bad_stats_minutes = 0

    pet.last_update = now
    await pet.save()
    return True