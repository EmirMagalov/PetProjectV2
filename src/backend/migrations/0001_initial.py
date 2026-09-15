from tortoise import migrations
from tortoise.migrations import operations as ops
import functools
from json import dumps, loads
from tortoise import fields

class Migration(migrations.Migration):
    initial = True

    operations = [
        ops.CreateModel(
            name='Pet',
            fields=[
                ('tg_id', fields.BigIntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('click_counter', fields.IntField(default=0)),
                ('level', fields.IntField(default=1)),
                ('exp', fields.IntField(default=0)),
                ('coins', fields.IntField(default=0)),
                ('lives', fields.IntField(default=0)),
                ('food_level', fields.IntField(default=0)),
                ('energy', fields.IntField(default=0)),
                ('stinky', fields.BooleanField(default=False)),
                ('sleep', fields.BooleanField(default=False)),
                ('sleep_end_time', fields.FloatField(default=0.0)),
                ('feed_count', fields.IntField(default=0)),
                ('equipped_head', fields.CharField(null=True, max_length=255)),
                ('last_update', fields.FloatField(default=0.0)),
                ('bad_stats_minutes', fields.IntField(default=0)),
                ('fastfood_streak', fields.IntField(default=0)),
                ('is_fat', fields.BooleanField(default=False)),
                ('is_drunk', fields.BooleanField(default=False)),
                ('play_count', fields.IntField(default=0)),
                ('cart', fields.JSONField(default={}, encoder=functools.partial(dumps, separators=(',', ':')), decoder=loads)),
                ('unlocked_heads', fields.JSONField(default=list, encoder=functools.partial(dumps, separators=(',', ':')), decoder=loads)),
                ('addiction_level', fields.IntField(default=0)),
                ('addiction_streak', fields.IntField(default=0)),
            ],
            options={'table': 'pet', 'app': 'models', 'pk_attr': 'tg_id'},
            bases=['Model'],
        ),
    ]
