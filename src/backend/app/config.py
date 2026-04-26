from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Environment
    environment: str = "development"
    
    # Database
    database_url: str
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Google Gemini API — Tiered Models
    # Accepts either GOOGLE_API_KEY or GEMINI_API_KEY from .env
    google_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_flash_model: str = "gemini-3.1-flash-lite-preview"   # Fast routing & classification
    gemini_pro_model: str = "gemma-4-31b-it"       # Deep reasoning (Reflection, Planner)
    
    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cache settings to avoid reading .env file multiple times"""
    return Settings()

