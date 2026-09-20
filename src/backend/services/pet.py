import random
import time

# Словарь в памяти для отслеживания фоновых пересчетов (не трогает last_update юзера)
background_last_processed = {}


async def update_pet_stats(pet) -> bool:
    """Обновляет состояние питомца на основе прошедшего времени."""
    now = time.time()

    if not pet.last_update:
        pet.last_update = now
        background_last_processed[pet.tg_id] = now
        await pet.save()
        return False

    # Берем время последнего фонового просчета.
    # Если юзер заходил на сайт недавно, его pet.last_update новее — синхронизируемся с ним.
    last_check = background_last_processed.get(pet.tg_id, pet.last_update)
    if pet.last_update > last_check:
        last_check = pet.last_update

    elapsed_seconds = now - last_check
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
            elapsed_sleep_seconds = now - last_check
            recovered_energy = int(elapsed_sleep_seconds // 3)
            pet.energy = min(100, pet.energy + recovered_energy)

            if pet.energy >= 100:
                pet.energy = 100
                pet.sleep, pet.sleep_end_time = False, 0.0

    # 2. ЕСЛИ ПИТОМЕЦ БОДРСТВОВАЛ
    else:
        capped_minutes = min(elapsed_minutes, 1440)

        food_consumed = capped_minutes * (0.3 if pet.is_drunk else 0.1)
        pet.food_level = max(0.0, pet.food_level - food_consumed)

        energy_consumed = capped_minutes * 0.1
        pet.energy = max(0.0, pet.energy - energy_consumed)
        if pet.addiction_streak > 1:
            hours_passed = int(elapsed_seconds // 3600)
            if hours_passed > 0:
                pet.addiction_streak = 0
                if pet.addiction_streak <= 1:
                    pet.addiction_level = 1
                    pet.is_drunk = False
        if not pet.is_pooped and capped_minutes > 0:
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
            pet.bad_stats_minutes += capped_minutes
            target_minutes = 480

            if pet.bad_stats_minutes >= target_minutes:
                lives_to_lose = pet.bad_stats_minutes // target_minutes
                pet.lives = max(0, pet.lives - lives_to_lose)
                pet.bad_stats_minutes %= target_minutes
        else:
            pet.bad_stats_minutes = 0

    # Запоминаем текущее время как последнюю фоновую проверку
    background_last_processed[pet.tg_id] = now

    # ВНИМАНИЕ: pet.last_update мы НЕ трогаем!
    # Он останется неизменным, пока юзер реально не откроет сайт.
    # Благодаря этому проверка (current_time - last_update) < 35 начнет работать правильно.

    await pet.save()
    return True