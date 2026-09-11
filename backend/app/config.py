import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RenewGuard AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-renewguard-hackout-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./renewguard.db")
    DEFAULT_ENERGY_PRICE: float = 0.12  # $ or € per kWh (configurable)
    DEFAULT_CURRENCY: str = "$"
    SIMULATION_MODE: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
