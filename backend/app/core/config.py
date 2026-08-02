import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Codex Detective API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default="SUPER_SECRET_CODEX_KEY_CHANGE_ME_IN_PRODUCTION_1234567890", validation_alias="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DB URL: Fallback to SQLite if Postgres not set up
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./codex_detective.db", validation_alias="DATABASE_URL")
    
    # Redis URL
    REDIS_URL: Optional[str] = Field(default=None, validation_alias="REDIS_URL")
    
    # AI API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = Field(default=None, validation_alias="GEMINI_API_KEY")
    
    # Supabase (Optional for Storage)
    SUPABASE_URL: Optional[str] = Field(default=None, validation_alias="SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = Field(default=None, validation_alias="SUPABASE_KEY")
    
    # Directory for local file storage (cloned repositories, uploaded zips)
    STORAGE_DIR: str = Field(default="./storage", validation_alias="STORAGE_DIR")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Create storage directories if they do not exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "clones"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "reports"), exist_ok=True)
