from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import json
import uuid

router = APIRouter(prefix="/api/media", tags=["media"]) 
BASE = Path(__file__).resolve().parent.parent
MEDIA_FILE = BASE / "media.json"


def _read():
    if not MEDIA_FILE.exists():
        return []
    try:
        return json.loads(MEDIA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _write(data):
    MEDIA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


@router.get("", response_model=list)
async def list_media():
    """List media items."""
    return _read()


@router.post("", response_model=dict)
async def add_media(item: dict = Body(...)):
    """Add a media item. Body: { title, description, imageUrl }
    This is intentionally simple (no auth) for development; add auth in production.
    """
    data = _read()
    new_item = {
        "id": str(uuid.uuid4()),
        "title": item.get("title", "Untitled"),
        "description": item.get("description", ""),
        "imageUrl": item.get("imageUrl", ""),
    }
    data.append(new_item)
    _write(data)
    return new_item


@router.put("/{item_id}", response_model=dict)
async def update_media(item_id: str, item: dict = Body(...)):
    data = _read()
    for i, it in enumerate(data):
        if it.get("id") == item_id:
            data[i] = { **it, **item }
            _write(data)
            return data[i]
    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("/{item_id}")
async def delete_media(item_id: str):
    data = _read()
    new = [it for it in data if it.get("id") != item_id]
    if len(new) == len(data):
        raise HTTPException(status_code=404, detail="Item not found")
    _write(new)
    return {"deleted": item_id}
