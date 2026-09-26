"""Supabase database client initialization and utilities."""

from supabase import create_client, Client
from config import get_settings
import structlog

logger = structlog.get_logger()


class SupabaseClient:
    """Singleton Supabase client wrapper."""
    
    _instance: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client."""
        if cls._instance is None:
            settings = get_settings()
            cls._instance = create_client(
                settings.supabase_url,
                settings.supabase_key,
            )
            logger.info("Supabase client initialized")
        return cls._instance


def get_db() -> Client:
    """Dependency for getting Supabase client."""
    return SupabaseClient.get_client()
