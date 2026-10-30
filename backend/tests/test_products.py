"""Tests for product endpoints."""

import pytest
from fastapi.testclient import TestClient
from main import app
from db.connection import get_db_dependency
from services.product_service import ProductService


client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_catalogue(monkeypatch):
    async def empty(*args, **kwargs):
        return []
    for name in ['get_all_products', 'search_products', 'get_featured_products', 'get_categories']:
        monkeypatch.setattr(ProductService, name, empty)
    app.dependency_overrides[get_db_dependency] = lambda: object()
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_endpoint():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Adire Teems AI Backend"


@pytest.mark.asyncio
async def test_list_products():
    """Test listing products."""
    response = client.get("/api/products")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_search_products():
    """Test product search."""
    response = client.get("/api/products/search?query=wrapper")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_featured_products():
    """Test getting featured products."""
    response = client.get("/api/products/featured")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_categories():
    """Test getting categories."""
    response = client.get("/api/products/categories")
    assert response.status_code == 200
