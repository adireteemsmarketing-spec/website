"""Middleware for request/response logging and error handling."""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
import time
import uuid

logger = structlog.get_logger()


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured request/response logging."""
    
    async def dispatch(self, request: Request, call_next):
        """Log all requests and responses."""
        request_id = str(uuid.uuid4())
        
        # Add request ID to request state
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log request
        logger.info(
            "request_start",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client=request.client.host if request.client else None,
        )
        
        try:
            response = await call_next(request)
            
            # Log response
            duration = time.time() - start_time
            logger.info(
                "request_end",
                request_id=request_id,
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
            
            return response
        
        except Exception as exc:
            duration = time.time() - start_time
            logger.error(
                "request_error",
                request_id=request_id,
                error=str(exc),
                duration_ms=round(duration * 1000, 2),
            )
            raise


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for global error handling."""
    
    async def dispatch(self, request: Request, call_next):
        """Handle errors globally."""
        try:
            response = await call_next(request)
            return response
        
        except Exception as exc:
            logger.error(
                "unhandled_error",
                error=str(exc),
                path=request.url.path,
                method=request.method,
            )
            
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error": str(exc) if True else None,  # Hide in production
                },
            )
