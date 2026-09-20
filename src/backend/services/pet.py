import random
import time


async def update_pet_stats(pet) -> bool:
    """Обновляет состояние питомца на основе прошедшего времени."""
    now = time.time()
    elapsed_seconds = now - pet.last_update
    elapsed_minutes = int(elapsed_seconds // 60)
    # Защита на случай, если last_update еще не был задан
    if not pet.last_update:
        pet.last_update = now
        await pet.save()
        return False
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
                pet.sleep, pet.sleep_end_time = False, 0.0

    # 2. ЕСЛИ ПИТОМЕЦ БОДРСТВОВАЛ
    else:
        capped_minutes = min(elapsed_minutes, 1440)

        # Плавное уменьшение статов без сумасшедшего ретроспективного рандома
        food_consumed = capped_minutes * (0.3 if pet.is_drunk else 0.1)
        pet.food_level = max(0.0, pet.food_level - food_consumed)

        energy_consumed = capped_minutes * 0.1
        pet.energy = max(0.0, pet.energy - energy_consumed)

        # Рандом какашек и вони делаем мягче: если прошло много времени,
        # даем один честный шанс сработать, а не умножаем его на каждую минуту!
        if not pet.is_pooped and capped_minutes > 0:
            # Шанс выпасть какашке пропорционально времени, но без цикла на 1440 итераций
            poop_chance = 1 - ((1 - 1 / 45) ** capped_minutes)
            if random.random() < poop_chance:
                pet.is_pooped = True

        if not pet.stinky and capped_minutes > 0:
            stinky_chance = 1 - ((1 - 1 / 90) ** capped_minutes)
            if random.random() < stinky_chance:
                pet.stinky = True

        is_food_zero = pet.food_level == 0
        is_energy_zero = pet.energy == 0

        if is_food_zero or is_energy_zero:
            pet.bad_stats_minutes += capped_minutes  # Сразу прибавляем все минуты плохих условий
            target_minutes = 480

            if pet.bad_stats_minutes >= target_minutes:
                # Считаем сколько жизней снять, если прошло больше 8 часов
                lives_to_lose = pet.bad_stats_minutes // target_minutes
                pet.lives = max(0, pet.lives - lives_to_lose)
                pet.bad_stats_minutes %= target_minutes

        else:
            pet.bad_stats_minutes = 0

    pet.last_update += elapsed_minutes * 60
    await pet.save()
    return True