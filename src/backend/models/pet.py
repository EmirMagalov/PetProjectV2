from tortoise import models, fields
class Pet(models.Model):
    tg_id = fields.BigIntField(pk=True)
    # Основные игровые статы
    click_counter = fields.IntField(default=0)
    level = fields.IntField(default=1)
    exp = fields.IntField(default=0)
    coins = fields.IntField(default=0)
    lives = fields.IntegerField(default=0)

    food_level = fields.IntField(default=0)
    energy = fields.IntField(default=0)

    # Статусы и флаги
    stinky = fields.BooleanField(default=False)
    sleep = fields.BooleanField(default=False)
    sleep_end_time = fields.FloatField(default=0.0)

    feed_count = fields.IntField(default=0)
    equipped_head = fields.CharField(max_length=255, null=True)

    last_update = fields.FloatField(default=0.0)
    bad_stats_minutes = fields.IntField(default=0)
    # Дополнительные игровые механики
    fastfood_streak = fields.IntField(default=0)
    is_fat = fields.BooleanField(default=False)
    is_drunk = fields.BooleanField(default=False)
    play_count = fields.IntField(default=0)

    cart = fields.JSONField(default={})
    unlocked_heads = fields.JSONField(default=list)

    addiction_level = fields.IntField(default=0)
    addiction_streak = fields.IntField(default=0)

    class Meta:
        db_table = "pet"
