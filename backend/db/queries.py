"""Catalogue queries for the normalized Supabase schema.

Public results never include inventory counts, even when the server client has
service-role access. Database failures propagate instead of looking like an empty store.
"""
from supabase import Client
from typing import Any


async def enrich(db: Client, products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for product in products:
        available = db.rpc('product_availability', {'target_product': product['id']}).execute().data or []
        flags = {row['variant_id']: row['in_stock'] for row in available}
        product['product_variants'] = [
            {**variant, 'in_stock': bool(flags.get(variant['id'], False))}
            for variant in product.get('product_variants', []) if variant.get('active', True)
        ]
    return products


class ProductQueries:
    @staticmethod
    def catalogue(db: Client):
        return db.table('products').select('*, product_variants(*), product_images(*)').eq('status', 'active')

    @staticmethod
    async def get_all_products(db: Client, limit: int = 50, offset: int = 0):
        rows = ProductQueries.catalogue(db).order('id').range(offset, offset + limit - 1).execute().data or []
        return await enrich(db, rows)

    @staticmethod
    async def get_product_by_id(db: Client, product_id: str):
        rows = ProductQueries.catalogue(db).eq('id', product_id).limit(1).execute().data or []
        return (await enrich(db, rows))[0] if rows else None

    @staticmethod
    async def search_products(db: Client, query: str, limit: int = 20):
        rows = ProductQueries.catalogue(db).order('id').limit(limit).text_search('search_document', query, options={'type': 'web_search', 'config': 'english'}).execute().data or []
        return await enrich(db, rows)

    @staticmethod
    async def get_featured_products(db: Client, limit: int = 10):
        rows = ProductQueries.catalogue(db).eq('is_featured', True).order('id').limit(limit).execute().data or []
        return await enrich(db, rows)


class InventoryQueries:
    @staticmethod
    async def get_variant_stock(db: Client, variant_id: str) -> int:
        """Trusted server-only count of unreserved stock at active locations."""
        rows = db.table('inventory').select('quantity,reserved,locations!inner(active)').eq('variant_id', variant_id).eq('locations.active', 'true').execute().data or []
        return sum(max(0, row['quantity'] - row['reserved']) for row in rows)

    @staticmethod
    async def check_stock_availability(db: Client, variant_id: str, quantity: int) -> bool:
        if quantity < 1:
            return False
        return await InventoryQueries.get_variant_stock(db, variant_id) >= quantity


class CategoryQueries:
    @staticmethod
    async def get_all_categories(db: Client):
        return db.table('categories').select('*').eq('active', True).order('sort_order').execute().data or []

    @staticmethod
    async def get_products_by_category(db: Client, category_id: str):
        rows = ProductQueries.catalogue(db).eq('category_id', category_id).order('id').execute().data or []
        return await enrich(db, rows)
