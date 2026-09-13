from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
class Settings(BaseSettings):
    TELEGRAM_BOT_TOKEN: str
    DOMAIN:str
    DATABASE_URL: str
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding='utf-8',
        extra='ignore'
    )


try:
    settings = Settings()
except Exception as e:
    print(f"Ошибка загрузки настроек: {e}")

    raise e
