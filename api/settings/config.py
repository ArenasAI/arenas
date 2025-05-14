from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, Dict, Any
import os

class Settings(BaseSettings):
    NEXT_PUBLIC_SUPABASE_URL: str
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT: str 

    SERVER_URL: str = "http://localhost:8000"
    NEXT_PUBLIC_APP_URL: str = "http://localhost:3000"
    
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    DEEPSEEK_API_KEY: Optional[str] = None
    HUGGING_FACE_API_KEY: Optional[str] = None
    
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # App Settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    CORS_ORIGINS: list = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = 'utf-8'
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()

def initialize_model_configs() -> Dict[str, Dict[str, Any]]:
    """
    Initialize configurations for different language models.
    Returns a dictionary mapping model IDs to their configurations.
    """
    return {
        "gpt-4o": {
            "provider": "openai",
            "model": "gpt-4o",
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
        "claude-3-7-sonnet": {
            "provider": "anthropic",
            "model": "claude-3-7-sonnet-20250219",
            "api_key": os.getenv("ANTHROPIC_API_KEY"),
        },
        "deepseek-reasoner": {
            "provider": "deepseek",
            "model": "deepseek-chat",  
            "api_key": os.getenv("DEEPSEEK_API_KEY"),
        },
        "gemini-2.5-pro": {
            "provider": "google",
            "model": "gemini-2.5-pro",
            "api_key": os.getenv("GOOGLE_API_KEY"),
        },
        "gpt-4.5": {
            "provider": "openai",
            "model": "gpt-4.5-preview",
            "api_key": os.getenv("OPENAI_API_KEY"),
        }
    }

def validate_settings():
    required_vars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_JWT",
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "DEEPSEEK_API_KEY",
    ]

    missing = []
    for var in required_vars:
        if not getattr(settings, var):
            missing.append(var)
    
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

# Validate settings on import
validate_settings()