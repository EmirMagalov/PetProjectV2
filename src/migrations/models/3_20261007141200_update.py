from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "pet" ADD "deaths_count" INT NOT NULL DEFAULT 0;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "pet" DROP COLUMN "deaths_count";"""


MODELS_STATE = (
    "eJztm+9v4jYYx/8VxKs76VYBLdfudJoEHbcx9eDU9qZJ02SZxAkWxk5jpy3q9X+fbRICiU"
    "NxNqiK/Ir2sb+J83ke/7afmnPmI8JPviHR/NR4alI4R/KPdfOHRhNGUW5UBgEnROeL0gwT"
    "LmLoqWcEkHAkTT7iXowjgRmVVpoQoozMkxkxDXNTQvFdgoBgIRJTFMuEv/+RZkx99Ih49m"
    "80AwFGxN8opAgB9tXrdRIQi0ib+zgcUvFFZ1fvnACPkWRONyTRQkwZXWkw1d8RIopiKJB6"
    "j4gT9R2qmOnXZp+2LHKeZVnWNY2PApgQsfbdE5DbmgCMxrfgZnALQNOClMeooiyLyjWGUB"
    "Xhp587ndPT807r9ONF9+z8vHvRupB5dXnLSefPy8LkwJaP0tiGvw1Ht6pATLpy6V5leNYa"
    "KOBSpV2S+0D/llxwOYWx2QFZ/gJ/+WFF/hntNQekeFf8syy5A/LoO4QH5vAREERDMZX/tr"
    "tb4P7Zu778vXf9rt19v0l4lKZ0dJJinbP1CPZmkl1CBYrLkCuDvKR7OdgNsEvRvgvt1n6D"
    "vdM+Oz+7OP14torxlWVbaGdhnKMl6B4RC6Sr/IdD2X4jKNFjZAEyze0isojRY5hym0qe5X"
    "coS5Ub3yMblKv8DmURpY+gmPJlX2JBtChzYItgA8Z8UNELfSEMVoDdlBWwBkr31sBuofbr"
    "+Hv/atD4dj24HN4MxyP1lvmC35E8UZmkAQsN4HrQuyr2TpJEuLBinEsc3xf5coHpzMC3zx"
    "hBkJoJ56IC4YlU7QvwynJYyP3x+EqD5SnY/rAwyRp9/9ofyKnB+03Y5TaDE4QMY63tqDON"
    "I21LGiAqX4FN89strUdZetBW5OSNtiMBQr71MGNT5AYZpYEw5AIkkS8/3yqGCzoXwDsEsG"
    "aG1YoL9HTRrIEXxI76DtQn0AdcQMHBHNNEWE37jFrXiJRmKjI29bRDvgTBmU3zXFY6vEW8"
    "mIMAGjq9raO6XOSGdRbDOonNjxNqiOGXaK9kjrcd74ixCJk26V4AnusccQviEYEL62H0ps"
    "g10aWleRgbcP5xMx5VLM2n+QskfeyJxo8GwXxvRJtPz83Dx68isRG/2abmu6+9v4r7nZdX"
    "476Gw7gIY/0U/YB+AXpCCfNmcn43RdA3DOuq8ZeVr+CIz0FC9VC+MUkwEZjyE/W+X47FPe"
    "guwVGUQi57p/oAQEl4fCcBOt1djgLIXJVnAXRaRX3wpGeSuWmms0OVWBe7WrG/WpFyrlUx"
    "1rSubuxUN/TyyQPkU1S1YLvtTJhJfTSDoIMcDyt4Qo3dgaeG9/X9YXyG80o9r3Ds2c55M4"
    "mbfVnMvqCvOlFZNPu1MpP0aML9f5uJ5ZSs9+XKUrfAvsMC+zShYbwAlAksX2G7kGNQuwbF"
    "okFZHkWpS9+gdvRtFtPUGKQm+5LWkbc5f6EPCNVlb1A7+hb0Q/kL2D2K6zrA/ADnAwsfEP"
    "YA9Lnkuj4wP8D5wMIHsmQCe5BIjgGq64fqhzhf2PQI6kpT3f6gqHXk7ftidVrG/oyNWewm"
    "tsahZj3EJqkDrACri8PBbO3aqjJMoDd7gLEPSimsw6rylpPmnXnRAikMNSX1Rapw6SXqHo"
    "qxN20arlenKR+23bCGeZ5XuWRtumFdGYtHdrf6P1bv6lvTcmjMjWdEq7eH1iS1doVq1e63"
    "vS2kKpUF4TT7EdJtt1q73E1vtaovp6u04oVVKpDpnNGWgzG55PCbz3ukfYht5lftzJ7/BS"
    "59o4k="
)
