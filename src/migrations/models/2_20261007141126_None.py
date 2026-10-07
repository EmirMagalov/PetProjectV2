from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "pet" (
    "tg_id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(15),
    "click_counter" INT NOT NULL,
    "level" INT NOT NULL,
    "exp" INT NOT NULL,
    "coins" INT NOT NULL,
    "lives" INT NOT NULL,
    "food_level" REAL NOT NULL,
    "energy" REAL NOT NULL,
    "stinky" INT NOT NULL,
    "sleep" INT NOT NULL,
    "sleep_end_time" REAL NOT NULL,
    "feed_count" INT NOT NULL,
    "last_update" REAL NOT NULL,
    "last_interaction" REAL NOT NULL,
    "bad_stats_minutes" INT NOT NULL,
    "fastfood_streak" INT NOT NULL,
    "is_fat" INT NOT NULL,
    "is_drunk" INT NOT NULL,
    "is_pooped" INT NOT NULL,
    "play_count" INT NOT NULL,
    "cart" JSON NOT NULL,
    "unlocked_heads" JSON NOT NULL,
    "equipped_head" VARCHAR(255),
    "unlocked_costumes" JSON NOT NULL,
    "equipped_costume" VARCHAR(255),
    "last_washed_time" BIGINT NOT NULL,
    "last_poop_cleaned_time" BIGINT NOT NULL,
    "sick" INT NOT NULL,
    "addiction_streak" INT NOT NULL,
    "addiction_time" REAL NOT NULL,
    "hungry_notified" INT NOT NULL,
    "energy_notified" INT NOT NULL,
    "poop_notified" INT NOT NULL,
    "stinky_notified" INT NOT NULL,
    "game_over_notified" INT NOT NULL,
    "low_lives_notified" INT NOT NULL,
    "critical_life_notified" INT NOT NULL,
    "sick_notified" INT NOT NULL,
    "stinky_bad_minutes" INT NOT NULL,
    "poop_bad_minutes" INT NOT NULL
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "eJztm+9v4jYYx/8VxKs76VYBLdfudJoEHbcx9eDU9qZJ02SZxAkWxk5jpy3q9X+fbRICiU"
    "NxNqiK/IrW9tdxPs9j5/Gvp+ac+Yjwk29IND81npoUzpH8Yz35Q6MJoyhPVAkCToguF6UF"
    "JlzE0FN1BJBwJJN8xL0YRwIzKlNpQohKZJ4siGmYJyUU3yUICBYiMUWxzPj7H5mMqY8eEc"
    "/+jWYgwIj4G40UIcC+erzOAmIR6eQ+DodUfNHF1TMnwGMkmdMNSbQQU0ZXGkz1e4SIohgK"
    "pJ4j4kS9h2pm+rbZqy2bnBdZtnVN46MAJkSsvfcE5GlNAEbjW3AzuAWgaUHKY1RRlk3lGk"
    "OomvDTz53O6el5p3X68aJ7dn7evWhdyLK6veWs8+dlY3Jgy6o0tuFvw9GtahCTplyaVyU8"
    "aw0UcKnSJsltoH9LJricwthsgKx8gb98sSL/jPaaAVK8K/5ZkdwAufcdwgJz+AgIoqGYyn"
    "/b3S1w/+xdX/7eu37X7r7fJDxKczo6S7HO2XoEezPJLqECxWXIlU5e0r3s7AbYJW/fhXZr"
    "v87eaZ+dn12cfjxb+fgqZZtrZ26coyXoHhELpKvyh0PZfiMo0WNkATIt7TyyiNFjmHKbTp"
    "6VdyhLnRvfIxuUq/IOZRFlwJgPKgbLL4TBCqKbsgLWQOneGtgt1H4df+9fDRrfrgeXw5vh"
    "eKSeMl/wO5JnqiSZgIUGcD3oXRUHUUkiXFgxziWO74t8ucB0ZuDbZ4wgSM2Ec1GB8ESq9g"
    "V4lXJYyP3x+EqD5SnY/rAwFxh9/9ofyAj2/Sbs8pjBCUKGkGA76kzjSNuSBojKR2DTNGzL"
    "6FGWHnQUOXmj40iAkL+cWVnEF5siF2SU4jXIBUgiX76+lQ8XdM6Bd3BgzQyrhQHo6aZZAy"
    "+IHfUdqE+gD7iAgoM5pomwmp0YtW4QKc1UpG/qaYd8CIIzm+G5rHR4i3gxBwE0fPS2RnW5"
    "yIV1FmGdxObHCTX48Eu0VzLH2453xFiETHtJLwDPdY64BfGIwIV1GL0pckN0aQUZxgacf9"
    "yMRxUryGn5Akkfe6Lxo0Ew3xvR5tNz8/D+q0hs+G+29/bua++v4rbc5dW4r+EwLsJY16Ir"
    "6BegJ5Qwbybnd1MEfUNYV42/rHwFQ3wOEqpD+cYkwURgyk/U8345FvOguwRHUQq5bJ3qfe"
    "qS8Pg2rDvdXXasZanKLWudV9EfPGmZZG6a6ezQJdbFrlfsr1eknGt1jDWt6xs79Q29fPIA"
    "+RRVLdhuO7pkUh9NEHSQU0wFS6jYHXgqvK9vD2Mdzir1rMKxZzvnzSRu9mUx+4K++ojKpt"
    "mvlZmkR+Pu/9tMLKdkvS9XlroF9h0W2KcJDeMFoExg+QjbhRyD2g0oFgPK8ihKXfoGtaNv"
    "s5imYpCa7EtaR97m/IU+IFSXvUHt6FvQD+UvYPcormsAcwXOBhY2IOwB6OOzdW1grsDZwM"
    "IGsmUCe5BIjgGqa4fqSpwtbL4I6uZN3e9BUevI23+L1WkZ+zM2ZrGb2BpDzXqITVIHWAFW"
    "91uD2drtSpUwgd7sAcY+KOWwDqsqW86ad+bFFEhhqCmpN1KNS+/69lCMvWnTcAs4zfmw7S"
    "IwzMu8yl1g00XgSl88sivA/7F7V1/ulaExN54Rrd4eWpPU2hWq1bvf9raQ6lQWhNPiR0i3"
    "3WrtcoW61aq+Q63yivcqqUCmc0ZbDsbkksNvPu+R9iG2mV/1Y/b8L3XnNtg="
)
