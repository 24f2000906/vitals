from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "VITALS API"
    debug: bool = True  # in debug mode the simulated OTP is also returned in the response

    database_url: str = "sqlite+aiosqlite:///./vitals.db"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_minutes: int = 30
    refresh_token_days: int = 7
    setup_token_minutes: int = 60

    otp_ttl_minutes: int = 10
    otp_max_attempts: int = 5

    # --- Cloudinary (storage for the original PDFs / images; files are private, signed access only) ---
    cloudinary_cloud_name: Optional[str] = None
    cloudinary_api_key: Optional[str] = None
    cloudinary_api_secret: Optional[str] = None
    cloudinary_folder: str = "vitals"
    max_upload_mb: int = 10  # Cloudinary's free plan caps image/PDF uploads at 10 MB; raise it on a paid plan
    view_url_minutes: int = 15
    download_url_minutes: int = 5
    cors_origins: list[str] = None

    # --- ChromaDB (text chunks for retrieval) ---
    chroma_path: Path = Path("./chroma_db")
    chroma_collection: str = "vitals_documents"
    chunk_size: int = 500
    chunk_overlap: int = 50

    # --- LLM MODELS ---
    text_model: str = ""
    text_model_api_key: str = ""
    ocr_model: str = "gemini-3.6-flash"
    ocr_model_api_key: str = ""
    embedding_model: str = ""
    embedding_model_api_key: str = ""

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
