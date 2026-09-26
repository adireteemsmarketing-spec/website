from fastapi import APIRouter, HTTPException, Body
from pathlib import Path
import json

router = APIRouter(prefix="/api/inventory", tags=["inventory"]) 
BASE = Path(__file__).resolve().parent.parent
DATA_FILE = BASE / "inventory.json"


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
async def list_inventory():
    return _read()


@router.put("/{sku}", response_model=dict)
async def update_stock(sku: str, payload: dict = Body(...)):
    data = _read()
    for i, it in enumerate(data):
        if it.get("sku") == sku:
            data[i] = { **it, **payload }
            _write(data)
            return data[i]
    raise HTTPException(status_code=404, detail="SKU not found")
