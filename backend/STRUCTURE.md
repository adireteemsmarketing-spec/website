"""Project structure and module organization."""

"""
backend/
├── main.py                 # FastAPI app entry point
├── config.py               # Settings/configuration
├── requirements.txt        # Python dependencies
├── Procfile               # Render deployment config
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore patterns
│
├── db/                    # Database layer
│   ├── __init__.py
│   ├── client.py          # Supabase client singleton
│   └── queries.py         # Database query functions
│
├── api/                   # API route handlers
│   ├── __init__.py
│   ├── products.py        # Product endpoints
│   ├── chat.py            # Chat/assistant endpoints
│   └── health.py          # Health check endpoints
│
├── services/              # Business logic
│   ├── __init__.py
│   ├── openai_service.py  # OpenAI integration
│   ├── product_service.py # Product logic
│   └── chat_service.py    # Assistant logic
│
├── schemas/               # Pydantic models
│   ├── __init__.py
│   ├── product.py         # Product schemas
│   ├── chat.py            # Chat schemas
│   └── user.py            # User schemas
│
├── middleware/            # Middleware
│   ├── __init__.py
│   ├── auth.py            # JWT authentication
│   └── logging.py         # Request logging
│
└── tests/                 # Test suite
    ├── __init__.py
    ├── test_products.py
    └── test_chat.py
"""
