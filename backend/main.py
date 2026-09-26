"""
Adire Teems FastAPI Backend
AI-powered e-commerce assistant service
"""

# Direct local startup uses this project's saved configuration, including when
# the parent shell carries unrelated SUPABASE_URL or DEBUG variables. ASGI
# deployments importing main:app keep the normal environment-first precedence.
if __name__ == '__main__':
    from pathlib import Path
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).with_name('.env'), override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog
from contextlib import asynccontextmanager

from config import get_settings
from middleware.logging import LoggingMiddleware, ErrorHandlingMiddleware
from db.connection import SupabaseManager
from api import products, chat

logger = structlog.get_logger()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Starting Adire Teems AI Backend", environment=settings.environment)
    try:
        SupabaseManager.initialize()
        logger.info("Database initialized")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Adire Teems AI Backend")
    SupabaseManager.close()


# Initialize FastAPI app
app = FastAPI(
    title="Adire Teems AI Backend",
    description="AI-powered e-commerce assistant service with product recommendations",
    version="1.0.0",
    lifespan=lifespan,
)

# Add middleware (order matters - most general first)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [
        "https://adireteems.com",
        "https://www.adireteems.com",
        "https://app.adireteems.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(products.router)
app.include_router(chat.router)
# Catalogue management, inventory and uploads now use the authenticated Next.js
# routes. Do not mount the legacy unauthenticated JSON-file demo routers.


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for Render deployment."""
    return {
        "status": "healthy",
        "environment": settings.environment,
    }


@app.get("/", tags=["root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Adire Teems AI Backend",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
    )
