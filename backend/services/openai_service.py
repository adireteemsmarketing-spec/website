"""OpenAI integration for AI assistant service."""

from openai import AsyncOpenAI
from config import get_settings
import structlog
from typing import Optional, List, Dict, Any

logger = structlog.get_logger()


class OpenAIManager:
    """Manager for OpenAI API interactions."""
    
    _instance: Optional[AsyncOpenAI] = None
    
    @classmethod
    def initialize(cls) -> AsyncOpenAI:
        """Initialize OpenAI async client."""
        if cls._instance is not None:
            return cls._instance
        
        settings = get_settings()
        
        try:
            cls._instance = AsyncOpenAI(api_key=settings.openai_api_key)
            logger.info("OpenAI client initialized", model=settings.openai_model)
            return cls._instance
        except Exception as e:
            logger.error("Failed to initialize OpenAI client", error=str(e))
            raise
    
    @classmethod
    def get_client(cls) -> AsyncOpenAI:
        """Get OpenAI client instance."""
        if cls._instance is None:
            return cls.initialize()
        return cls._instance


class ChatAssistant:
    """AI chat assistant for product recommendations and shopping guidance."""
    
    def __init__(self, client: AsyncOpenAI | None = None):
        self.client = client or OpenAIManager.get_client()
        settings = get_settings()
        self.model = settings.openai_model
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> str:
        """
        Send a chat message to GPT and get a response.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            system_prompt: Optional system prompt to guide assistant behavior
            temperature: Response temperature (0-1)
        
        Returns:
            Assistant's response text
        """
        try:
            system_msg = system_prompt or self._default_system_prompt()
            
            # Prepend system message if not already included
            if not messages or messages[0].get("role") != "system":
                messages = [{"role": "system", "content": system_msg}] + messages
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=1024,
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error("Error calling OpenAI API", error=str(e))
            raise
    
    async def chat_with_functions(
        self,
        messages: List[Dict[str, str]],
        functions: List[Dict[str, Any]],
        system_prompt: str | None = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Chat with function calling enabled for product lookups.
        
        Args:
            messages: List of message dicts
            functions: List of function definitions
            system_prompt: Optional system prompt
            temperature: Response temperature
        
        Returns:
            Response with optional function_call
        """
        try:
            system_msg = system_prompt or self._default_system_prompt()
            
            if not messages or messages[0].get("role") != "system":
                messages = [{"role": "system", "content": system_msg}] + messages
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                functions=functions,
                function_call="auto",
                temperature=temperature,
                max_tokens=1024,
            )
            
            choice = response.choices[0]
            result = {
                "content": choice.message.content,
                "function_call": None,
            }
            
            if choice.message.function_call:
                result["function_call"] = {
                    "name": choice.message.function_call.name,
                    "arguments": choice.message.function_call.arguments,
                }
            
            return result
        except Exception as e:
            logger.error("Error calling OpenAI API with functions", error=str(e))
            raise
    
    @staticmethod
    def _default_system_prompt() -> str:
        """Get default system prompt for the shopping assistant."""
        return """You are Adire Teems' AI shopping assistant. You help customers find beautiful Adire fabric and apparel products.

Your role:
- Help customers find products based on their needs and preferences
- Answer questions about product features, colors, sizes, and availability
- Provide fashion styling advice and recommendations
- Guide customers through the shopping process
- Be warm, friendly, and knowledgeable about Adire fashion

Important:
- Always be honest about product availability and pricing
- Use specific product names and details when available
- Suggest related products that complement customer interests
- Never recommend out-of-stock items
- If you're unsure about something, ask the customer for clarification"""
    
    @staticmethod
    def get_product_lookup_functions() -> List[Dict[str, Any]]:
        """Get function definitions for product lookups."""
        return [
            {
                "name": "search_products",
                "description": "Search for products by name, category, or features. Use this when customer asks about specific items.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query (e.g., 'blue wrapper', 'ankara dress')",
                        },
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "get_featured_products",
                "description": "Get featured/recommended products. Use when customer is browsing or wants suggestions.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "limit": {
                            "type": "integer",
                            "description": "Number of products to return (default: 5)",
                        },
                    },
                },
            },
            {
                "name": "get_product_details",
                "description": "Get detailed information about a specific product including price, size options, and availability.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "product_id": {
                            "type": "string",
                            "description": "The unique product ID",
                        },
                    },
                    "required": ["product_id"],
                },
            },
        ]
