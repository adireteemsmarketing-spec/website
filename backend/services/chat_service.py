"""Chat service for AI assistant interactions."""

from supabase import Client
from services.openai_service import ChatAssistant, OpenAIManager
from services.product_service import ProductService
from typing import List, Dict, Any
import json
import structlog

logger = structlog.get_logger()


class ChatService:
    """Service for managing AI chat conversations."""
    
    def __init__(self, db: Client):
        self.db = db
        self.assistant = ChatAssistant(OpenAIManager.get_client())
        self.product_service = ProductService(db)
    
    async def start_conversation(
        self,
        user_id: str | None = None,
        session_id: str | None = None,
    ) -> str:
        """
        Start a new conversation.
        
        Args:
            user_id: Optional user ID if logged in
            session_id: Session ID for tracking
        
        Returns:
            Conversation ID
        """
        try:
            record = {"customer_id": user_id}
            if session_id:
                record["session_id"] = session_id
            response = self.db.table("ai_conversations").insert(record).execute()
            
            return response.data[0]["id"] if response.data else None
        except Exception as e:
            logger.error("Error starting conversation", error=str(e))
            raise
    
    async def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
    ) -> str:
        """Save message to conversation history."""
        try:
            response = self.db.table("ai_messages").insert({
                "conversation_id": conversation_id,
                "role": role,
                "content": content,
            }).execute()
            
            return response.data[0]["id"] if response.data else None
        except Exception as e:
            logger.error("Error saving message", error=str(e))
            raise
    
    async def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 20,
    ) -> List[Dict[str, str]]:
        """Get message history for a conversation."""
        try:
            response = self.db.table("ai_messages") \
                .select("role, content") \
                .eq("conversation_id", conversation_id) \
                .order("created_at") \
                .limit(limit) \
                .execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error("Error fetching conversation history", error=str(e))
            return []
    
    async def chat_with_ai(
        self,
        conversation_id: str,
        user_message: str,
        user_id: str | None = None,
    ) -> str:
        """
        Process user message and get AI response.
        
        Args:
            conversation_id: Conversation ID
            user_message: User's message
            user_id: Optional user ID
        
        Returns:
            AI response text
        """
        try:
            # Save user message
            await self.save_message(conversation_id, "user", user_message)
            
            # Get conversation history
            history = await self.get_conversation_history(conversation_id)
            
            # Add current message to history
            messages = [{"role": m["role"], "content": m["content"]} for m in history]
            messages.append({"role": "user", "content": user_message})
            
            # Get AI response with function calling
            functions = ChatAssistant.get_product_lookup_functions()
            response = await self.assistant.chat_with_functions(
                messages=messages,
                functions=functions,
            )
            
            ai_message = response["content"]
            
            # Handle function calls if any
            if response.get("function_call"):
                function_call = response["function_call"]
                ai_message = await self._handle_function_call(
                    function_call,
                    messages,
                )
            
            # Save AI response
            await self.save_message(conversation_id, "assistant", ai_message)
            
            logger.info("Chat processed", conversation_id=conversation_id)
            return ai_message
            
        except Exception as e:
            logger.error("Error processing chat", error=str(e))
            raise
    
    async def _handle_function_call(
        self,
        function_call: Dict[str, Any],
        messages: List[Dict[str, str]],
    ) -> str:
        """Handle function calls from OpenAI."""
        function_name = function_call["name"]
        arguments = json.loads(function_call["arguments"])
        
        logger.info("Handling function call", function=function_name, args=arguments)
        
        try:
            if function_name == "search_products":
                products = await self.product_service.search_products(
                    arguments["query"],
                    limit=5,
                )
                return self._format_product_response(products)
            
            elif function_name == "get_featured_products":
                limit = arguments.get("limit", 5)
                products = await self.product_service.get_featured_products(limit)
                return self._format_product_response(products)
            
            elif function_name == "get_product_details":
                product = await self.product_service.get_product(
                    arguments["product_id"],
                )
                return self._format_product_details(product) if product else "Product not found"
            
            else:
                return "Function not recognized"
        
        except Exception as e:
            logger.error("Error in function call", error=str(e))
            return f"Error processing request: {str(e)}"
    
    @staticmethod
    def _format_product_response(products: List[Dict[str, Any]]) -> str:
        """Format products for chat response."""
        if not products:
            return "I couldn't find any matching products. Would you like to browse featured items instead?"
        
        response = "Here are some products I found:\n\n"
        for product in products[:5]:  # Limit to 5
            response += f"• **{product['name']}**\n"
            response += f"  Price: ₦{product['base_price']:,.0f}\n"
            response += f"  {product.get('description_short', '')}\n\n"
        
        return response
    
    @staticmethod
    def _format_product_details(product: Dict[str, Any]) -> str:
        """Format single product details for chat."""
        response = f"**{product['name']}**\n\n"
        response += f"Price: ₦{product['base_price']:,.0f}\n\n"
        response += f"Description:\n{product.get('description_long', product.get('description_short', ''))}\n\n"
        
        if product.get("product_variants"):
            response += "Available options:\n"
            for variant in product["product_variants"][:10]:
                in_stock = "In Stock" if variant.get("in_stock") else "Out of Stock"
                response += f"- {variant.get('color', '')} {variant.get('size', '')}: {in_stock}\n"
        
        return response
