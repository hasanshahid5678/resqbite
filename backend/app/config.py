from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "ResQBite"
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "ResQBite"

    DATABASE_URL: str = "postgresql+psycopg2://resqbite:resqbite@localhost:5432/resqbite"
    DATABASE_URL_ASYNC: str = "postgresql+asyncpg://resqbite:resqbite@localhost:5432/resqbite"

    JWT_SECRET_KEY: str = "dev-super-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    QR_SECRET_KEY: str = "qr-signing-secret-change-me"

    MAX_IMAGE_BYTES: int = 800 * 1024  # 800 KB
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    DEFAULT_PAGE_SIZE: int = 10
    MAX_PAGE_SIZE: int = 50


settings = Settings()