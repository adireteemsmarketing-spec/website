"""Privileged AI endpoints reject public requests before database access."""
import pytest
from fastapi.testclient import TestClient
from main import app
from middleware import gateway
from types import SimpleNamespace


@pytest.mark.parametrize('method,path,payload', [
    ('post', '/api/chat/conversations', None),
    ('post', '/api/chat/message', {'messages': [{'role': 'user', 'content': 'Hello'}]}),
    ('get', '/api/chat/conversations/test-id/history', None),
])
def test_public_chat_access_denied(method, path, payload):
    response = getattr(TestClient(app), method)(path, **({'json': payload} if payload else {}))
    assert response.status_code == 401


def test_gateway_fails_closed_without_configuration(monkeypatch):
    monkeypatch.setattr(gateway, 'get_settings', lambda: SimpleNamespace(ai_gateway_token=''))
    response = TestClient(app).post('/api/chat/conversations', headers={'Authorization': 'Bearer guessed-token'})
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_gateway_rejects_wrong_token_and_accepts_only_configured_secret(monkeypatch):
    token = 'test-only-' + 'a' * 40
    monkeypatch.setattr(gateway, 'get_settings', lambda: SimpleNamespace(ai_gateway_token=token))
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as error:
        await gateway.require_ai_gateway('Bearer incorrect')
    assert error.value.status_code == 401
    assert await gateway.require_ai_gateway('Bearer ' + token) is None
