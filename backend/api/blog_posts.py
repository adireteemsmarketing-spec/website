from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import json
import uuid

router = APIRouter(prefix="/api/blog", tags=["blog"]) 
BASE = Path(__file__).resolve().parent.parent
DATA_FILE = BASE / "blog.json"


def _read():
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _write(data):
    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


@router.get("", response_model=list)
async def list_posts():
    return _read()


@router.post("", response_model=dict)
async def add_post(item: dict = Body(...)):
    data = _read()
    new_item = {"id": str(uuid.uuid4()), **item}
    data.append(new_item)
    _write(data)
    return new_item


@router.put("/{item_id}", response_model=dict)
async def update_post(item_id: str, item: dict = Body(...)):
    data = _read()
    for i, it in enumerate(data):
        if it.get("id") == item_id:
            data[i] = { **it, **item }
            _write(data)
            return data[i]
    raise HTTPException(status_code=404, detail="Post not found")


@router.delete("/{item_id}")
async def delete_post(item_id: str):
    data = _read()
    new = [it for it in data if it.get("id") != item_id]
    if len(new) == len(data):
        raise HTTPException(status_code=404, detail="Post not found")
    _write(new)
    return {"deleted": item_id}
