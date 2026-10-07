from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "pet" ADD "fat_count" INT NOT NULL DEFAULT 0;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "pet" DROP COLUMN "fat_count";"""


MODELS_STATE = (
    "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"
)
