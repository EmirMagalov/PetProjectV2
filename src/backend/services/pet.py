import random
import time

# === Настройки расхода (легко менять) ===
FOOD_PER_HOUR_HEALTHY   = 15    # ~6.7 часа
FOOD_PER_HOUR_SICK      = 25    # ~4 часа

ENERGY_PER_HOUR_HEALTHY = 15
ENERGY_PER_HOUR_SICK    = 25
# ======================================


async def update_pet_stats(pet) -> bool:
    """Обновляет состояние питомца на основе прошедшего времени."""
    now = time.time()

    if not pet.last_update:
        pet.last_update = now
        await pet.save()
        return False

    elapsed_seconds = now - pet.last_update
    elapsed_hours = elapsed_seconds / 3600

    if pet.last_interaction and pet.last_interaction > 0:
        time_since_last_visit = (now - pet.last_interaction) / 60
    else:
        time_since_last_visit = 999999
    # Защита от слишком частых вызовов (если прошло меньше 30 секунд)
    if elapsed_seconds < 30:
        return False

    if elapsed_hours <= 0:
        return False

    # Ограничиваем максимальный догон (не больше 24 часов за раз)
    capped_hours = min(elapsed_hours, 24.0)
    capped_minutes = int(capped_hours * 60)  # для какашек/вони/жизней

    # 1. ЕСЛИ ПИТОМЕЦ СПАЛ
    if pet.sleep:
        if now >= pet.sleep_end_time:
            pet.energy = 100.0
            pet.sleep = False
            pet.sleep_end_time = 0.0
        else:
            recovered_energy = int(elapsed_seconds // 3)
            pet.energy = min(100.0, pet.energy + recovered_energy)

            if pet.energy >= 100.0:
                pet.energy = 100.0
                pet.sleep = False
                pet.sleep_end_time = 0.0

    # 2. ЕСЛИ ПИТОМЕЦ БОДРСТВОВАЛ
    else:
        # === Расход еды и энергии ===
        if pet.sick:
            food_rate = FOOD_PER_HOUR_SICK
            energy_rate = ENERGY_PER_HOUR_SICK
        else:
            food_rate = FOOD_PER_HOUR_HEALTHY
            energy_rate = ENERGY_PER_HOUR_HEALTHY

        pet.food_level = max(0.0, pet.food_level - food_rate * capped_hours)
        pet.energy = max(0.0, pet.energy - energy_rate * capped_hours)

        # Сброс зависимости
        if pet.addiction_streak > 0 and pet.addiction_time == 0:
            pet.addiction_time = time.time()  # Запоминаем точное время старта

            # 2. Проверяем, прошло ли 30 минут (1800 секунд) с момента старта
        if pet.addiction_streak > 0:
            if pet.addiction_time > 0 and (now - pet.addiction_time) >= 1800:
                pet.addiction_streak = 0
                pet.addiction_time = 0.0  # Сбрасываем таймер
        else:
            # Если зависимости нет вообще, обнуляем таймер
            pet.addiction_time = 0.0



        if time_since_last_visit >= 20 and capped_minutes > 0:
            # Какашка
            if not pet.is_pooped:
                poop_chance = 1 - ((1 - 1 / 90) ** capped_minutes)
                if random.random() < poop_chance:
                    pet.is_pooped = True

        if pet.is_pooped:
            pet.poop_bad_minutes += capped_minutes
            if pet.poop_bad_minutes >= 180:
                pet.sick = True
        else:
            pet.poop_bad_minutes = 0

        # Вонь
        if time_since_last_visit >= 20 and capped_minutes > 0:
            if not pet.stinky:
                stinky_chance = 1 - ((1 - 1 / 90) ** capped_minutes)
                if random.random() < stinky_chance:
                    pet.stinky = True

        if pet.stinky:
            pet.stinky_bad_minutes += capped_minutes
            if pet.stinky_bad_minutes >= 180:
                pet.sick = True
        else:
            pet.stinky_bad_minutes = 0

        # Потеря жизней при нулевой еде или энергии
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

    # ВСЕГДА обновляем last_update на текущее время, чтобы следующий тик считал честную дельту
    pet.last_update = now
    await pet.save()
    return True