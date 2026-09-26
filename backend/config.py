from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration from environment variables."""
    
    # Supabase
    supabase_url: str
    supabase_service_role_key: str = ''
    supabase_secret_key: str = ''

    @property
    def supabase_key(self) -> str:
        return self.supabase_secret_key or self.supabase_service_role_key
    
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
