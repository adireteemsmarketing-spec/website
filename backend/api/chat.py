"""Chat/Assistant API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from db.connection import get_db_dependency
from services.chat_service import ChatService
from schemas.chat import ChatRequestSchema, ChatResponseSchema, ConversationSchema
from supabase import Client
import uuid
from datetime import datetime
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationSchema)
async def create_conversation(
    user_id: str | None = None,
    db: Client = Depends(get_db_dependency),
):
    """Create a new conversation."""
    service = ChatService(db)
    session_id = str(uuid.uuid4())
    conversation_id = await service.start_conversation(user_id, session_id)
    
    if not conversation_id:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    
    return {
        "id": conversation_id,
        "user_id": user_id,
        "session_id": session_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


@router.post("/message", response_model=ChatResponseSchema)
async def send_message(
    request: ChatRequestSchema,
    db: Client = Depends(get_db_dependency),
):
    """Send a message to the AI assistant."""
    service = ChatService(db)
    
    # Use existing or create new conversation
    conversation_id = request.conversation_id or (
        await service.start_conversation(request.user_id)
    )
    
    if not conversation_id:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    
    # Get last user message (the actual question)
    user_message = request.messages[-1].content if request.messages else ""
    
    if not user_message:
        raise HTTPException(status_code=400, detail="Empty message")
    
    try:
        # Get AI response
        ai_response = await service.chat_with_ai(
            conversation_id,
            user_message,
            request.user_id,
        )
        
        return ChatResponseSchema(
            conversation_id=conversation_id,
            message=ai_response,
            timestamp=datetime.utcnow(),
        )
    
    except Exception as e:
        logger.error("Error in chat endpoint", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process message")


@router.get("/conversations/{conversation_id}/history")
async def get_conversation(
    conversation_id: str,
    limit: int = 20,
    db: Client = Depends(get_db_dependency),
):
    """Get conversation history."""
    service = ChatService(db)
    messages = await service.get_conversation_history(conversation_id, limit)
    return {"conversation_id": conversation_id, "messages": messages}
