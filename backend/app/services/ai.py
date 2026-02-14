from typing import List, Dict, Any, Optional
import structlog
from groq import Groq
from openai import OpenAI
from app.config import settings
from app.services.vector_db import vector_db_service
from app.core.ai_rotator import APIKeyRotator

logger = structlog.get_logger()

class GroqService:
    """
    Service for interacting with Groq LLMs.
    Provides fast inference for Indian language tasks and document processing.
    """

    def __init__(self):
        self.rotator = APIKeyRotator(settings.GROQ_API_KEYS, service_name="Groq LLM")
        self.client = None
        self._init_client()
        
        self.default_model = settings.GROQ_MODEL
        self.model_20b = settings.GROQ_MODEL_20B
        self.model_120b = settings.GROQ_MODEL_120B

        # OpenAI for embeddings
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL

    def _init_client(self):
        """Initialize or re-initialize the Groq client with the current key."""
        key = self.rotator.get_key()
        if key:
            self.client = Groq(api_key=key)
        else:
            logger.warning("No Groq API keys available")
            self.client = None

    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI."""
        client = self.openai_client
        if client is None:
            logger.error("OpenAI client not initialized for embeddings")
            return []
        
        try:
            response = client.embeddings.create(
                input=[text.replace("\n", " ")],
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error("Embedding generation error", error=str(e))
            raise

    async def rag_chat(
        self, 
        query: str, 
        context: Optional[str] = None, 
        history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None,
        **kwargs
    ):
        """
        Enhanced chat with RAG.
        If context is not provided, it attempts to retrieve it using the query.
        """
        if context is None:
            # 1. Generate embedding for query
            query_embedding = await self.get_embedding(query)
            
            # 2. Query Vector DB
            matches = await vector_db_service.query_vectors(query_embedding)
            
            # 3. Build context from matches
            context_parts = []
            for match in matches:
                if 'metadata' in match and 'text' in match['metadata']:
                    context_parts.append(match['metadata']['text'])
            
            context = "\n\n---\n\n".join(context_parts) if context_parts else "No relevant context found."

        # 4. Construct messages for Groq
        system_prompt = (
            "You are a helpful assistant for BuildBidz, a construction platform. "
            "Use the provided context to answer the user's question accurately. "
            "If the answer is not in the context, state that you don't have enough information from the provided docs."
            "\n\nCONTEXT:\n" + context
        )

        chat_messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            chat_messages.extend(history)
        else:
            chat_messages.append({"role": "user", "content": query})

        # 5. Get completion from Groq
        return await self.chat_completion(chat_messages, model=model, **kwargs)

    async def chat_20b(self, messages: List[Dict[str, str]], **kwargs):
        """Chat completion using GPT-OSS 20B."""
        return await self.chat_completion(messages, model=self.model_20b, **kwargs)

    async def chat_120b(self, messages: List[Dict[str, str]], **kwargs):
        """Chat completion using GPT-OSS 120B."""
        return await self.chat_completion(messages, model=self.model_120b, **kwargs)

    async def chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        stream: bool = False,
        retry_count: int = 0
    ):
        """
        Generate chat completion using Groq with automatic rotation.
        """
        if not self.client:
            self._init_client()
            if not self.client:
                raise ValueError("Groq client not initialized. Check GROQ_API_KEYS.")

        model = model or self.default_model
        
        try:
            logger.info("Sending request to Groq", model=model, message_count=len(messages), retry=retry_count)
            
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            return completion
        except Exception as e:
            # Check for rate limit error (usually 429)
            error_str = str(e).lower()
            if "rate limit" in error_str or "429" in error_str:
                if retry_count < len(self.rotator.keys):
                    logger.warning("Groq rate limit hit, rotating key and retrying", error=str(e), retry=retry_count)
                    self.rotator.mark_limited(self.rotator.get_key())
                    self._init_client()
                    return await self.chat_completion(
                        messages=messages,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        stream=stream,
                        retry_count=retry_count + 1
                    )
            
            logger.error("Groq API error", error=str(e))
            raise

    async def summarize_document(self, text: str):
        """
        Specialized method to summarize construction documents.
        """
        messages = [
            {"role": "system", "content": "You are an expert construction project manager. Summarize the following document accurately."},
            {"role": "user", "content": f"Please summarize this document:\n\n{text}"}
        ]
        return await self.chat_completion(messages)

# Global instance
groq_service = GroqService()
