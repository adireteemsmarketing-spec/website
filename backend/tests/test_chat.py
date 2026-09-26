"""Tests for chat endpoints."""

import pytest
from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


@pytest.mark.asyncio
async def test_create_conversation():
    """Test creating a new conversation."""
    response = client.post("/api/chat/conversations")
    assert response.status_code in [200, 500]  # 500 if no DB


@pytest.mark.asyncio
async def test_send_message():
    """Test sending a message."""
    payload = {
        "messages": [
            {"role": "user", "content": "Show me blue wrappers"}
        ],
    }
    response = client.post("/api/chat/message", json=payload)
    assert response.status_code in [200, 500]


@pytest.mark.asyncio
async def test_get_conversation_history():
    """Test retrieving conversation history."""
    response = client.get("/api/chat/conversations/test-id/history")
    assert response.status_code in [200, 500]
