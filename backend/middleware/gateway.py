"""Private gateway authentication for privileged AI/conversation operations."""
import hmac
from fastapi import Header, HTTPException
from config import get_settings


async def require_ai_gateway(authorization: str | None = Header(default=None)):
    token = get_settings().ai_gateway_token
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Authentication required')
    if len(token) < 32:
        raise HTTPException(status_code=503, detail='AI gateway is not configured')
    if not hmac.compare_digest(authorization[7:].encode(), token.encode()):
        raise HTTPException(status_code=401, detail='Authentication required')
