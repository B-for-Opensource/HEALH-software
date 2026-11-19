import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "HEAL Clinic Management API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'heal.db'}")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "HEAL_SECURE_JWT_SECRET_KEY_CHANGE_IN_PRODUCTION_2026!@#")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / "uploads" / "photos"
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    # CORS
    raw_cors = os.getenv("CORS_ORIGINS", '["*"]')
    try:
        CORS_ORIGINS = json.loads(raw_cors)
    except Exception:
        CORS_ORIGINS = ["*"]

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
