"""Supabase connection utilities and initialization."""

from supabase import create_client, Client
from config import get_settings
import structlog
from typing import Optional

logger = structlog.get_logger()


class SupabaseManager:
    """Manager for Supabase database connections."""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def initialize(cls) -> Optional[Client]:
        """Initialize Supabase client with connection pooling."""
        if cls._instance is not None:
            return cls._instance
        
        settings = get_settings()
        
        try:
            cls._instance = create_client(
                settings.supabase_url,
                settings.supabase_key,
            )
            logger.info(
                "Supabase client initialized",
                url=settings.supabase_url,
            )
            return cls._instance
        except Exception as e:
            # In development it's sometimes useful to start the app without a live
            # Supabase instance (e.g., when using mocked services). Log and continue
            # rather than raising so the server can start.
            logger.error("Failed to initialize Supabase client", error=str(e))
            cls._instance = None
            return None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get Supabase client instance."""
        if cls._instance is None:
            return cls.initialize()
        return cls._instance
    
    @classmethod
    def close(cls) -> None:
        """Close Supabase connection."""
        if cls._instance is not None:
            logger.info("Closing Supabase connection")
            cls._instance = None


async def get_db_dependency() -> Client:
    """FastAPI dependency for injecting Supabase client."""
    from fastapi import HTTPException
    client = SupabaseManager.get_client()
    if client is None:
        raise HTTPException(status_code=503, detail='Database is unavailable')
    return client
