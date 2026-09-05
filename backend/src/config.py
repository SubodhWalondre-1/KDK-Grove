from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    database_url: str = "sqlite:///./mediora.db"
    upload_dir: str = "./uploads"
    jwt_secret_key: str = "change_me_to_a_secure_random_key_in_production"
    jwt_expiry_minutes: int = 1440

    frontend_base_url: str = "http://localhost:5173"

    admin_api_key: str = "change_me_to_a_long_random_string"

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"
    groq_api_key: str = ""
    qwen_model_slug: str = "qwen/qwen-2.5-7b-instruct"

    sarvam_api_key: str = ""
    sarvam_base_url: str = "https://api.sarvam.ai/translate"

    gemini_api_key: str = ""
    recommendation_model_slug: str = "google/gemini-2.5-flash"

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }


@lru_cache
def get_settings():
    """Return a cached Settings instance loaded from environment / .env file."""
    return Settings()
