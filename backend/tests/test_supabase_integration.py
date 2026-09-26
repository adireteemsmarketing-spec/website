"""Exercise the real upgraded SDK against deterministic HTTP responses."""
import json
import httpx
import pytest
from supabase import create_client
from supabase.lib.client_options import SyncClientOptions
from db.queries import ProductQueries, InventoryQueries
from schemas.product import ProductSchema


def client(handler):
    return create_client('https://test.supabase.co', 'sb_secret_test_key', options=SyncClientOptions(
        httpx_client=httpx.Client(transport=httpx.MockTransport(handler)),
        persist_session=False, auto_refresh_token=False,
    ))


@pytest.mark.asyncio
async def test_public_catalogue_filters_and_availability():
    calls = []
    def respond(request):
        calls.append(request)
        if request.url.path.endswith('/products'):
            assert request.url.params['status'] == 'eq.active'
            assert request.url.params['offset'] == '5'
            assert request.url.params['limit'] == '2'
            return httpx.Response(200, json=[{
                'id': 'product', 'name': 'Dress', 'slug': 'dress', 'description_short': 'Adire',
                'base_price': 15000, 'currency': 'NGN', 'category_id': None,
                'product_variants': [
                    {'id': 'available', 'product_id': 'product', 'sku': 'S', 'active': True},
                    {'id': 'empty', 'product_id': 'product', 'sku': 'M', 'active': True},
                    {'id': 'inactive', 'product_id': 'product', 'sku': 'L', 'active': False},
                ],
            }])
        assert request.url.path.endswith('/rpc/product_availability')
        assert json.loads(request.content) == {'target_product': 'product'}
        return httpx.Response(200, json=[{'variant_id': 'available', 'in_stock': True}, {'variant_id': 'empty', 'in_stock': False}])
    rows = await ProductQueries.get_all_products(client(respond), 2, 5)
    product = ProductSchema.model_validate(rows[0]).model_dump()
    assert product['currency'] == 'NGN'
    assert [v['in_stock'] for v in product['product_variants']] == [True, False]
    assert all('stock_qty' not in v for v in product['product_variants'])
    assert len(calls) == 2


@pytest.mark.asyncio
async def test_inventory_subtracts_reservations_and_filters_locations():
    def respond(request):
        assert request.url.path.endswith('/inventory')
        assert request.url.params['locations.active'] == 'eq.true'
        assert request.url.params['variant_id'] == 'eq.variant'
        return httpx.Response(200, json=[{'quantity': 10, 'reserved': 4}, {'quantity': 3, 'reserved': 3}])
    db = client(respond)
    assert await InventoryQueries.get_variant_stock(db, 'variant') == 6
    assert await InventoryQueries.check_stock_availability(db, 'variant', 6)
    assert not await InventoryQueries.check_stock_availability(db, 'variant', 7)
    assert not await InventoryQueries.check_stock_availability(db, 'variant', 0)


@pytest.mark.asyncio
async def test_database_failure_is_not_an_empty_catalogue():
    def respond(request):
        return httpx.Response(503, json={'message': 'Unavailable', 'code': '503', 'details': '', 'hint': ''})
    with pytest.raises(Exception):
        await ProductQueries.get_all_products(client(respond))


@pytest.mark.asyncio
async def test_missing_product_is_none():
    def respond(request):
        assert request.url.params['status'] == 'eq.active'
        return httpx.Response(200, json=[])
    assert await ProductQueries.get_product_by_id(client(respond), 'missing') is None


@pytest.mark.asyncio
async def test_search_uses_search_document():
    def respond(request):
        assert 'wfts(english)' in request.url.params['search_document']
        assert request.url.params['status'] == 'eq.active'
        return httpx.Response(200, json=[])
    assert await ProductQueries.search_products(client(respond), 'blue adire') == []
