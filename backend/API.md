# Adire Teems AI Backend - API Documentation

## Overview

The Adire Teems FastAPI backend is an AI-powered e-commerce assistant service that provides:
- Product search and recommendations
- AI chat assistance for shopping guidance
- Integration with Supabase database
- OpenAI GPT-4o powered responses with function calling

Base URL: `https://adireteems-backend.onrender.com` (or `http://localhost:8000` locally)

---

## Authentication

Currently, the API supports:
- **Public endpoints**: Product browsing and chat (guest users)
- **JWT tokens** (future): For authenticated users and admins

Header: `Authorization: Bearer <token>`

---

## Products API

### List Products
```http
GET /api/products?limit=50&offset=0
```

**Parameters:**
- `limit` (integer, optional): Number of products per page (default: 50, max: 100)
- `offset` (integer, optional): Starting position for pagination (default: 0)

**Response:** `200 OK`
```json
[
  {
    "id": "prod-001",
    "name": "Blue Ankara Wrapper",
    "slug": "blue-ankara-wrapper",
    "description_short": "Traditional blue Ankara fabric",
    "description_long": "...",
    "category_id": "cat-001",
    "base_price": 15000,
    "is_featured": true,
    "status": "active",
    "product_variants": [
      {
        "id": "var-001",
        "product_id": "prod-001",
        "size": "6 yards",
        "color": "Blue",
        "sku": "SKU-001",
        "stock_qty": 25,
        "in_stock": true
      }
    ],
    "product_images": []
  }
]
```

---

### Search Products
```http
GET /api/products/search?query=wrapper&limit=20
```

**Parameters:**
- `query` (string, required): Search term (min 1 character)
- `limit` (integer, optional): Max results (default: 20, max: 100)

**Response:** `200 OK` (array of products)

**Example:**
```bash
curl "http://localhost:8000/api/products/search?query=blue%20wrapper&limit=5"
```

---

### Get Featured Products
```http
GET /api/products/featured?limit=10
```

**Parameters:**
- `limit` (integer, optional): Number of featured items (default: 10, max: 50)

**Response:** `200 OK` (array of products)

---

### Get Categories
```http
GET /api/products/categories
```

**Response:** `200 OK`
```json
[
  {
    "id": "cat-001",
    "name": "Wrappers",
    "slug": "wrappers",
    "parent_id": null
  },
  {
    "id": "cat-002",
    "name": "Apparel",
    "slug": "apparel",
    "parent_id": null
  }
]
```

---

### Get Products by Category
```http
GET /api/products/category/{category_id}
```

**Response:** `200 OK` (array of products)

---

### Get Product Details
```http
GET /api/products/{product_id}
```

**Response:** `200 OK`
```json
{
  "id": "prod-001",
  "name": "Blue Ankara Wrapper",
  "slug": "blue-ankara-wrapper",
  "description_short": "Traditional blue Ankara fabric",
  "description_long": "High-quality Ankara wrapper perfect for traditional wear...",
  "category_id": "cat-001",
  "base_price": 15000,
  "is_featured": true,
  "status": "active",
  "product_variants": [
    {
      "id": "var-001",
      "size": "6 yards",
      "color": "Blue",
      "sku": "SKU-001",
      "stock_qty": 25,
      "in_stock": true
    },
    {
      "id": "var-002",
      "size": "4 yards",
      "color": "Blue",
      "sku": "SKU-002",
      "stock_qty": 0,
      "in_stock": false
    }
  ],
  "product_images": [
    {
      "id": "img-001",
      "storage_path": "products/prod-001/image1.jpg",
      "sort_order": 1
    }
  ]
}
```

**Error Response:** `404 Not Found`
```json
{"detail": "Product not found"}
```

---

### Get Related Products
```http
GET /api/products/{product_id}/recommendations?limit=4
```

**Parameters:**
- `limit` (integer, optional): Number of recommendations (default: 4, max: 20)

**Response:** `200 OK` (array of related products)

---

## Chat/AI Assistant API

### Create Conversation
```http
POST /api/chat/conversations
```

**Query Parameters:**
- `user_id` (string, optional): User ID if logged in

**Response:** `200 OK`
```json
{
  "id": "conv-123",
  "user_id": null,
  "session_id": "sess-abc",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### Send Message to AI
```http
POST /api/chat/message
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Show me blue wrappers for traditional occasions"
    }
  ],
  "conversation_id": "conv-123",
  "user_id": "user-456",
  "stream": false
}
```

**Parameters:**
- `messages` (array, required): Chat message history with role and content
- `conversation_id` (string, optional): Existing conversation ID
- `user_id` (string, optional): User ID if logged in
- `stream` (boolean, optional): Enable response streaming (default: false)

**Response:** `200 OK`
```json
{
  "conversation_id": "conv-123",
  "message": "I found some beautiful blue Ankara wrappers perfect for traditional occasions. Here are my recommendations:\n\n• **Blue Ankara Wrapper** - ₦15,000\n  Traditional blue Ankara fabric",
  "function_calls": null,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**AI Function Calling:**
The AI can automatically call functions to search products, get details, or fetch featured items:

```json
{
  "function_calls": [
    {
      "name": "search_products",
      "arguments": {
        "query": "blue wrappers"
      }
    }
  ]
}
```

---

### Get Conversation History
```http
GET /api/chat/conversations/{conversation_id}/history?limit=20
```

**Parameters:**
- `limit` (integer, optional): Number of messages (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "conversation_id": "conv-123",
  "messages": [
    {
      "role": "user",
      "content": "Show me blue wrappers"
    },
    {
      "role": "assistant",
      "content": "I found some beautiful blue Ankara wrappers..."
    }
  ]
}
```

---

## Health & Status

### Health Check
```http
GET /health
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "environment": "production"
}
```

### API Info
```http
GET /
```

**Response:** `200 OK`
```json
{
  "message": "Adire Teems AI Backend",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

## Error Handling

### Error Response Format
```json
{
  "detail": "Error message describing the issue"
}
```

### Common Status Codes
- `200 OK` - Successful request
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Example Errors

**Missing Required Parameter:**
```http
GET /api/products/search
```
Response: `422 Unprocessable Entity`
```json
{
  "detail": [
    {
      "loc": ["query", "query"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Invalid Product ID:**
```http
GET /api/products/nonexistent
```
Response: `404 Not Found`
```json
{"detail": "Product not found"}
```

---

## Rate Limiting & Performance

- No rate limiting currently (implement as needed)
- Pagination recommended for large result sets
- Search queries limited to 100 results max
- Chat message history limited to 20 most recent by default

---

## Interactive API Documentation

Access the full interactive API documentation:
- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI JSON**: `/openapi.json`

---

## Examples

### Example 1: Search and Get Details
```bash
# Search for blue wrappers
curl "http://localhost:8000/api/products/search?query=blue%20wrapper"

# Get details for a specific product
curl "http://localhost:8000/api/products/prod-001"
```

### Example 2: AI Chat Conversation
```bash
# Create conversation
curl -X POST "http://localhost:8000/api/chat/conversations"

# Send message
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Show me blue wrappers"}
    ],
    "conversation_id": "conv-123"
  }'

# Get history
curl "http://localhost:8000/api/chat/conversations/conv-123/history"
```

---

## Support & Issues

For issues or questions:
1. Check the error message in response
2. Review API documentation at `/docs`
3. Check server logs for detailed error info
4. Contact development team

---

**Last Updated:** January 2024
**Version:** 1.0.0
