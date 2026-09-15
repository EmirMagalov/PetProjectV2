from tortoise import migrations
from tortoise.migrations import operations as ops
from tortoise import fields

class Migration(migrations.Migration):
    dependencies = [('models', '0002_auto_20260915_1528')]

    initial = False

    operations = [
        ops.AddField(
            model_name='Pet',
            name='click_counter',
            field=fields.IntField(default=0),
        ),
    ]
