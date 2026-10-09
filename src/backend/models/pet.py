from tortoise import fields, models


class Pet(models.Model):
    """Модель питомца, хранящая его характеристики, состояние и игровой прогресс."""

    # ==========================================
    # 1. ОСНОВНАЯ ИНФОРМАЦИЯ И ИДЕНТИФИКАЦИЯ
    # ==========================================
    tg_id = fields.BigIntField(pk=True)  # Telegram ID пользователя (PK)
    name = fields.CharField(max_length=15, null=True, default=None)  # Имя питомца

    # ==========================================
    # 2. ПРОГРЕСС И ЭКОНОМИКА
    # ==========================================
    level = fields.IntField(default=1)  # Текущий уровень питомца
    exp = fields.IntField(default=0)  # Опыт
    coins = fields.IntField(default=0)  # Монеты / Валюта
    click_counter = fields.IntField(default=0)  # Общее количество кликов

    # ==========================================
    # 3. ОСНОВНЫЕ ПОКАЗАТЕЛИ ЗДОРОВЬЯ И СОСТОЯНИЯ
    # ==========================================
    food_level = fields.FloatField(default=0.0)  # Уровень сытости (0.0 - 100.0)
    energy = fields.FloatField(default=0.0)  # Уровень энергии (0.0 - 100.0)
    lives = fields.IntField(default=0)  # Количество оставшихся жизней
    deaths_count = fields.IntField(default=0)  # Общее количество смертей питомца

    # ==========================================
    # 4. ТЕКУЩИЕ СТАТУСЫ И СОСТОЯНИЯ (ФЛАГИ)
    # ==========================================
    sleep = fields.BooleanField(default=False)  # Спит ли питомец сейчас
    sleep_end_time = fields.FloatField(default=0.0)  # Timestamp окончания сна

    stinky = fields.BooleanField(default=False)  # Грязный / Вонючий
    is_pooped = fields.BooleanField(default=False)  # Накакал (требуется уборка)
    sick = fields.BooleanField(default=False)  # Болен
    is_fat = fields.BooleanField(default=False)  # Толстый (переедание)
    is_drunk = fields.BooleanField(default=False)  # Пьян

    # ==========================================
    # 5. СЧЁТЧИКИ И СТРИКИ ДЕЙСТВИЙ (МЕХАНИКИ)
    # ==========================================
    feed_count = fields.IntField(default=0)  # Счётчик кормлений (до вони/грязи)
    play_count = fields.IntField(default=0)  # Счётчик игр/кликов (для похудения/механик)
    fat_count = fields.IntField(default=0)  # Счётчик съеденных фруктов во время ожирения
    fastfood_streak = fields.IntField(default=0)  # Стрик поедания фастфуда
    addiction_streak = fields.IntField(default=0)  # Стрик зависимости
    addiction_time = fields.FloatField(default=0.0)  # Timestamp отсчёта зависимости

    # ==========================================
    # 6. ВРЕМЕННЫЕ МЕТКИ (TIMESTAMPS) И ТАЙМЕРЫ
    # ==========================================
    last_update = fields.FloatField(default=0.0)  # Timestamp последнего обновления тикера
    last_interaction = fields.FloatField(default=0.0)  # Timestamp последнего взаимодействия игрока
    last_washed_time = fields.BigIntField(default=0)  # Timestamp последнего мытья
    last_poop_cleaned_time = fields.BigIntField(default=0)  # Timestamp последней уборки какахи

    # Таймеры плохого состояния (в минутах)
    bad_stats_minutes = fields.IntField(default=0)  # Минуты в состоянии полного голода/усталости
    stinky_bad_minutes = fields.IntField(default=0)  # Минуты в грязном состоянии
    poop_bad_minutes = fields.IntField(default=0)  # Минуты не убранной какахи

    # ==========================================
    # 7. ИНВЕНТАРЬ И КАСТОМИЗАЦИЯ
    # ==========================================
    cart = fields.JSONField(default=dict)  # Корзина / Инвентарь еды и предметов

    unlocked_heads = fields.JSONField(default=list)  # Разблокированные шапки/головы
    equipped_head = fields.CharField(max_length=255, null=True)  # Надетая шапка

    unlocked_costumes = fields.JSONField(default=list)  # Разблокированные костюмы
    equipped_costume = fields.CharField(max_length=255, null=True)  # Надетый костюм

    # ==========================================
    # 8. ФЛАГИ УВЕДОМЛЕНИЙ (ЗАЩИТА ОТ СПАМА)
    # ==========================================
    hungry_notified = fields.BooleanField(default=False)  # Уведомление о голоде
    energy_notified = fields.BooleanField(default=False)  # Уведомление о низкой энергии
    poop_notified = fields.BooleanField(default=False)  # Уведомление о какахе
    stinky_notified = fields.BooleanField(default=False)  # Уведомление о вони
    sick_notified = fields.BooleanField(default=False)  # Уведомление о болезни
    low_lives_notified = fields.BooleanField(default=False)  # Уведомление о малой жизни
    critical_life_notified = fields.BooleanField(default=False)  # Уведомление о критической жизни
    game_over_notified = fields.BooleanField(default=False)  # Уведомление о смерти

    # Поля для Колеса Фортуны
    last_fortune_spin = fields.IntField(default=0)  # Timestamp последнего кручения
    fortune_notified = fields.BooleanField(default=False)  # Отправлено ли уже уведомление
    # ==========================================
    # МЕТОДЫ МОДЕЛИ
    # ==========================================
    def clean_up_stats(self) -> None:
        """Автоматически сбрасывает счетчики запущенности, если показатели в норме."""
        # Убрали грязь — сбросили таймер грязи
        if not self.is_pooped and not self.stinky:
            self.poop_bad_minutes = 0

        # Есть еда и энергия — сбросили таймер голода
        if self.food_level > 0 and self.energy > 0:
            self.bad_stats_minutes = 0

    class Meta:
        db_table = "pet"