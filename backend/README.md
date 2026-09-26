# Adire Teems FastAPI Backend - README

## Quick Start

### Prerequisites
- Python 3.10+
- pip or poetry
- Supabase account
- OpenAI API key

### Setup

1. **Clone and navigate:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
    ,,,          ,
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Run development server:**
   ```bash
   python main.py
   ```

   Server runs at: http://localhost:8000
   Docs: http://localhost:8000/docs

---

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Configuration & settings
├── requirements.txt       # Dependencies
├── Procfile              # Render deployment
├── .env.example          # Environment template
│
├── db/
│   ├── client.py         # Supabase client
│   ├── connection.py     # Connection management
│   └── queries.py        # Database queries
│
├── api/
│   ├── products.py       # Product endpoints
│   └── chat.py           # Chat/AI endpoints
│
├── services/
│   ├── openai_service.py # OpenAI integration
│   ├── product_service.py # Product logic
│   └── chat_service.py   # Chat logic
│
├── schemas/
│   ├── product.py        # Product schemas
│   ├── chat.py           # Chat schemas
│   └── user.py           # User schemas
│
├── middleware/
│   ├── auth.py           # JWT & auth
│   └── logging.py        # Request logging
│
├── tests/
│   ├── test_products.py
│   └── test_chat.py
│
├── API.md               # API documentation
├── DEPLOYMENT.md        # Deployment guide
└── STRUCTURE.md         # Structure overview
```

---

## Key Features

### 🛍️ Product Management
- Search products by name/description
- Browse categories
- Get product details with variants
- View stock availability
- Product recommendations

### 🤖 AI Assistant
- Chat-based shopping guidance
- Function calling for dynamic product lookups
- Conversation history tracking
- RAG (Retrieval-Augmented Generation) with grounded responses

### 🔐 Authentication
- JWT token support
- Password hashing with bcrypt
- Role-based access (future)

### 📊 Logging & Monitoring
- Structured logging with structlog
- Request/response tracking
- Error handling middleware

---

## Configuration

### Environment Variables

Create `.env` file:
```env
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
JWT_SECRET=your-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
ENVIRONMENT=development
DEBUG=true
```

---

## API Usage

### Products
```bash
# List products
curl http://localhost:8000/api/products

# Search
curl "http://localhost:8000/api/products/search?query=wrapper"

# Get one
curl http://localhost:8000/api/products/prod-id
```

### Chat
```bash
# Create conversation
curl -X POST http://localhost:8000/api/chat/conversations

# Send message
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Show blue wrappers"}]}'
```

Full docs: See `API.md` or visit `/docs` endpoint

---

## Testing

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_products.py

# With coverage
pytest --cov=. tests/
```

---

## Deployment

### Render.com

1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: Uses Procfile
4. Add environment variables
5. Deploy

See `DEPLOYMENT.md` for detailed instructions

---

## Database Schema

Key tables (see PDR for full schema):
- `products` - Product catalog
- `product_variants` - Sizes, colors, pricing
- `product_images` - Product photos
- `categories` - Product categories
- `ai_conversations` - Chat sessions
- `ai_messages` - Chat message history
- `orders` - Customer orders (for context)

---

## Development

### Adding New Endpoints

1. Create schema in `schemas/`
2. Create service logic in `services/`
3. Add endpoint in `api/`
4. Add tests in `tests/`

Example:
```python
# schemas/my_feature.py
from pydantic import BaseModel

class MySchema(BaseModel):
    id: str
    name: str

# api/my_feature.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/feature", tags=["feature"])

@router.get("", response_model=list[MySchema])
async def get_items():
    return []

# main.py
from api import my_feature
app.include_router(my_feature.router)
```

### Code Style

- Use type hints
- Follow PEP 8
- Add docstrings
- Structured logging with structlog

---

## Troubleshooting

### Import Errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`

### Database Connection
- Verify Supabase credentials in `.env`
- Check network connectivity
- Test with: `curl http://localhost:8000/health`

### OpenAI Errors
- Verify API key is correct
- Check OpenAI account has sufficient credits
- Review request parameters

### Port Already in Use
```bash
# Change port in main.py or run on different port:
uvicorn main:app --port 8001
```

---

## Performance Tips

- Use pagination for large datasets
- Cache featured products
- Implement rate limiting for production
- Monitor logs for slow queries
- Use async functions throughout

---

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use strong Supabase service role key
- [ ] Enable CORS only for trusted domains
- [ ] Set DEBUG=false in production
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Use HTTPS in production
- [ ] Rotate API keys periodically

---

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run linting & tests
5. Submit PR

---

## License

Proprietary - Adire Teems

---

## Contact

For questions or support, contact the development team.
