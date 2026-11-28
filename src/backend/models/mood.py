from tortoise import fields, models


MOOD_STATES = ("great", "good", "not a great", "bad", "terrible")

MOOD_EMOTIONS = (
    "happiness",
    "excitement",
    "relaxation",
    "tiredness",
    "insecurity",
    "boredom",
    "anxiety",
    "anger",
    "sadness",
    "despair",
)


def get_fresh_mood_counts() -> dict[str, int]:
    return {state: 0 for state in MOOD_STATES}


def get_fresh_emotion_counts() -> dict[str, int]:
    return {emotion: 0 for emotion in MOOD_EMOTIONS}


class Mood(models.Model):
    id = fields.IntField(pk=True)
    pet = fields.OneToOneField(
        "models.Pet",
        on_delete=fields.CASCADE,
        related_name="mood",
    )
    state = fields.CharField(max_length=32, default="good")
    emotion = fields.CharField(max_length=32, null=True, default=None)
    counts = fields.JSONField(default=get_fresh_mood_counts)
    emotion_counts = fields.JSONField(default=get_fresh_emotion_counts)
    client_recorded_at = fields.CharField(max_length=64, null=True, default=None)
    updated_at = fields.FloatField(default=0.0)

    class Meta:
        db_table = "pet_mood"


class MoodLog(models.Model):
    id = fields.IntField(pk=True)
    mood = fields.ForeignKeyField(
        "models.Mood",
        on_delete=fields.CASCADE,
        related_name="logs",
    )
    state = fields.CharField(max_length=32)
    emotion = fields.CharField(max_length=32, null=True, default=None)
    recorded_at_client = fields.CharField(max_length=64)
    server_timestamp = fields.FloatField(default=0.0)

    class Meta:
        db_table = "pet_mood_log"