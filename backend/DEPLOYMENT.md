"""
# Adire Teems FastAPI Backend - Deployment Guide

## Environment Setup

1. Clone the repository and navigate to backend folder:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create .env file from template:
   ```bash
   cp .env.example .env
   ```

5. Update .env with your credentials:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_SERVICE_ROLE_KEY: Service role key from Supabase
   - OPENAI_API_KEY: Your OpenAI API key
   - JWT_SECRET: Generate a strong secret

## Local Development

Run the development server:
```bash
python main.py
```

The server will start at http://localhost:8000

View API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Running Tests

```bash
pytest tests/
```

## Deployment to Render

### Prerequisites
- Render account
- GitHub repository connected

### Steps

1. Create new Web Service on Render
2. Connect GitHub repository (backend folder)
3. Set build command:
   ```
   pip install -r requirements.txt
   ```
4. Set start command (Procfile handles this):
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```
5. Add environment variables in Render dashboard:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - OPENAI_API_KEY
   - JWT_SECRET
   - ENVIRONMENT=production
   - DEBUG=false

6. Deploy:
   - Push to main branch to auto-deploy
   - Or manually trigger deploy from Render dashboard

### Health Check
Render will check: `GET /health` for service status

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/search?query=...` - Search products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get all categories
- `GET /api/products/{product_id}` - Get product details
- `GET /api/products/{product_id}/recommendations` - Get related products

### Chat/AI Assistant
- `POST /api/chat/conversations` - Create new conversation
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/conversations/{id}/history` - Get conversation history

### Health
- `GET /health` - Health check
- `GET /` - API info

## Monitoring

View logs in Render dashboard or with:
```bash
render logs <service-id>
```

Check health:
```bash
curl https://your-backend.onrender.com/health
```
"""
