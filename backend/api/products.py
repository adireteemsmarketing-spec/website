"""Product API endpoints."""

from fastapi import APIRouter, Depends, Query, HTTPException
from db.connection import get_db_dependency
from services.product_service import ProductService, RecommendationService
from schemas.product import ProductSchema, ProductSearchRequestSchema, CategorySchema
from supabase import Client
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[ProductSchema])
async def list_products(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db_dependency),
):
    """List all products with pagination."""
    service = ProductService(db)
    products = await service.get_all_products(limit, offset)
    return products


@router.get("/search", response_model=list[ProductSchema])
async def search_products(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Client = Depends(get_db_dependency),
):
    """Search products by name or description."""
    service = ProductService(db)
    products = await service.search_products(query, limit)
    return products


@router.get("/featured", response_model=list[ProductSchema])
async def get_featured_products(
    limit: int = Query(10, ge=1, le=50),
    db: Client = Depends(get_db_dependency),
):
    """Get featured/recommended products."""
    service = ProductService(db)
    products = await service.get_featured_products(limit)
    return products


@router.get("/categories", response_model=list[CategorySchema])
async def get_categories(db: Client = Depends(get_db_dependency)):
    """Get all product categories."""
    service = ProductService(db)
    categories = await service.get_categories()
    return categories


@router.get("/category/{category_id}", response_model=list[ProductSchema])
async def get_products_by_category(
    category_id: str,
    db: Client = Depends(get_db_dependency),
):
    """Get all products in a specific category."""
    service = ProductService(db)
    products = await service.get_products_by_category(category_id)
    if not products:
        raise HTTPException(status_code=404, detail="Category not found or empty")
    return products


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: str,
    db: Client = Depends(get_db_dependency),
):
    """Get a single product with full details."""
    service = ProductService(db)
    product = await service.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{product_id}/recommendations", response_model=list[ProductSchema])
async def get_related_products(
    product_id: str,
    limit: int = Query(4, ge=1, le=20),
    db: Client = Depends(get_db_dependency),
):
    """Get recommended products related to the given product."""
    service = RecommendationService(db)
    products = await service.get_related_products(product_id, limit)
    return products
