"""Product service for business logic."""

from supabase import Client
from db.queries import ProductQueries, InventoryQueries, CategoryQueries
import structlog
from typing import List, Dict, Any

logger = structlog.get_logger()


class ProductService:
    """Service for product-related operations."""
    
    def __init__(self, db: Client):
        self.db = db
    
    async def get_all_products(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all products with pagination."""
        return await ProductQueries.get_all_products(self.db, limit, offset)
    
    async def get_product(self, product_id: str) -> Dict[str, Any] | None:
        """Get single product with all details."""
        product = await ProductQueries.get_product_by_id(self.db, product_id)
        
        if product and "product_variants" in product:
            # Add stock info to variants
            for variant in product["product_variants"]:
                variant["in_stock"] = variant.get("in_stock", False)
        
        return product
    
    async def search_products(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search products by query string."""
        products = await ProductQueries.search_products(self.db, query, limit)
        
        # Enrich with stock status
        for product in products:
            if "product_variants" in product:
                for variant in product["product_variants"]:
                    variant["in_stock"] = variant.get("in_stock", False)
        
        return products
    
    async def get_featured_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get featured products."""
        products = await ProductQueries.get_featured_products(self.db, limit)
        
        for product in products:
            if "product_variants" in product:
                for variant in product["product_variants"]:
                    variant["in_stock"] = variant.get("in_stock", False)
        
        return products
    
    async def check_stock(self, variant_id: str, quantity: int) -> bool:
        """Check if variant has sufficient stock."""
        return await InventoryQueries.check_stock_availability(self.db, variant_id, quantity)
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Get all product categories."""
        return await CategoryQueries.get_all_categories(self.db)
    
    async def get_products_by_category(self, category_id: str) -> List[Dict[str, Any]]:
        """Get products in a specific category."""
        return await CategoryQueries.get_products_by_category(self.db, category_id)


class RecommendationService:
    """Service for generating product recommendations."""
    
    def __init__(self, db: Client):
        self.db = db
        self.product_service = ProductService(db)
    
    async def get_recommendations(
        self,
        user_preferences: Dict[str, Any] | None = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Get product recommendations based on preferences or featured items.
        
        Args:
            user_preferences: Optional dict with 'category', 'price_range', 'colors', etc.
            limit: Number of recommendations
        
        Returns:
            List of recommended products
        """
        # For now, return featured products
        # Can be enhanced with ML/user behavior tracking
        return await self.product_service.get_featured_products(limit)
    
    async def get_related_products(
        self,
        product_id: str,
        limit: int = 4,
    ) -> List[Dict[str, Any]]:
        """Get products similar to the given product."""
        product = await self.product_service.get_product(product_id)
        
        if not product:
            return []
        
        # Get other products in same category
        related = await self.product_service.get_products_by_category(
            product.get("category_id"),
        )
        
        # Filter out the product itself and limit
        related = [p for p in related if p["id"] != product_id][:limit]
        
        return related
