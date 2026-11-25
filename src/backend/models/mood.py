from tortoise import fields, models


MOOD_STATES = ("great", "good", "not a great", "bad", "terrible")


def get_fresh_mood_counts() -> dict[str, int]:
    return {state: 0 for state in MOOD_STATES}


class Mood(models.Model):
    """Текущее настроение питомца и счётчики по каждому состоянию."""

    id = fields.IntField(pk=True)
    pet = fields.OneToOneField(
        "models.Pet",
        on_delete=fields.CASCADE,
        related_name="mood",
    )
    state = fields.CharField(max_length=32, default="good")
    # Счётчик каждого настроения: {"great": 0, "good": 1, "not a great": 0, "bad": 0, "terrible": 0}
    counts = fields.JSONField(default=get_fresh_mood_counts)
    # Дата/время с фронтенда для последнего обновления (например ISO-строка или epoch ms/s)
    client_recorded_at = fields.CharField(max_length=64, null=True, default=None)
    updated_at = fields.FloatField(default=0.0)  # Серверный timestamp последнего обновления

    class Meta:
        db_table = "pet_mood"


class MoodLog(models.Model):
    """История записей настроения с датой и временем от клиента."""

    id = fields.IntField(pk=True)
    mood = fields.ForeignKeyField(
        "models.Mood",
        on_delete=fields.CASCADE,
        related_name="logs",
    )
    state = fields.CharField(max_length=32)
    # Дата и время, присланные с фронтенда (сохраняем как пришло + при желании можно парсить в datetime)
    recorded_at_client = fields.CharField(max_length=64)
    server_timestamp = fields.FloatField(default=0.0)

    class Meta:
        db_table = "pet_mood_log"