"""Pydantic schemas for chat/AI assistant."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MessageSchema(BaseModel):
    """Chat message schema."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequestSchema(BaseModel):
    """Chat request schema."""
    messages: List[MessageSchema]
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    stream: bool = False


class ChatResponseSchema(BaseModel):
    """Chat response schema."""
    conversation_id: str
    message: str
    function_calls: Optional[List[dict]] = None
    timestamp: datetime


class ConversationSchema(BaseModel):
    """Conversation schema."""
    id: str
    user_id: Optional[str] = None
    session_id: str
    created_at: datetime
    updated_at: datetime


class AIMessageSchema(BaseModel):
    """AI message schema."""
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime
