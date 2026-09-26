"""Pydantic schemas for products."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductImageSchema(BaseModel):
    """Product image schema."""
    id: str
    product_id: str
    storage_path: str
    sort_order: int


class ProductVariantSchema(BaseModel):
    """Product variant schema (size, color, etc)."""
    id: str
    product_id: str
    size: Optional[str] = None
    color: Optional[str] = None
    sku: str
    price_override: Optional[float] = None
    in_stock: bool = Field(default=False)


class ProductSchema(BaseModel):
    """Product schema."""
    id: str
    name: str
    slug: str
    description_short: str
    description_long: Optional[str] = None
    category_id: Optional[str] = None
    currency: str = 'NGN'
    base_price: float
    is_featured: bool = False
    status: str = "active"
    product_variants: List[ProductVariantSchema] = []
    product_images: List[ProductImageSchema] = []
    created_at: Optional[datetime] = None


class ProductSearchRequestSchema(BaseModel):
    """Product search request."""
    query: str = Field(..., min_length=1)
    limit: int = Field(20, ge=1, le=100)


class ProductSearchResponseSchema(BaseModel):
    """Product search response."""
    total: int
    products: List[ProductSchema]


class CategorySchema(BaseModel):
    """Product category schema."""
    id: str
    name: str
    slug: str
    parent_id: Optional[str] = None
