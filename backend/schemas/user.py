"""User schemas."""

from pydantic import BaseModel, EmailStr
from typing import Optional


class UserSchema(BaseModel):
    """User profile schema."""
    id: str
    email: str
    name: str
    role: str = "user"  # user, sales_rep, admin, super_admin
    phone: Optional[str] = None


class UserCreateSchema(BaseModel):
    """User creation schema."""
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None


class TokenSchema(BaseModel):
    """JWT token schema."""
    access_token: str
    token_type: str = "bearer"
