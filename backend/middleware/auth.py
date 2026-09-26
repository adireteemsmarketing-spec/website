"""JWT authentication utilities."""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import get_settings
import structlog

logger = structlog.get_logger()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class JWTManager:
    """Manage JWT token creation and validation."""
    
    @staticmethod
    def create_token(
        data: Dict[str, Any],
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """
        Create a JWT token.
        
        Args:
            data: Data to encode in token
            expires_delta: Optional expiration time delta
        
        Returns:
            JWT token string
        """
        settings = get_settings()
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                hours=settings.jwt_expiration_hours,
            )
        
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.jwt_secret,
            algorithm=settings.jwt_algorithm,
        )
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any] | None:
        """
        Verify and decode JWT token.
        
        Args:
            token: JWT token to verify
        
        Returns:
            Decoded token data or None if invalid
        """
        settings = get_settings()
        
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
            )
            return payload
        except JWTError as e:
            logger.warning("Invalid token", error=str(e))
            return None


class PasswordManager:
    """Manage password hashing and verification."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return pwd_context.verify(plain_password, hashed_password)
