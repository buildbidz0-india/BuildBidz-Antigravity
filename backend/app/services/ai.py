from typing import List, Dict, Any, Optional
import time
import structlog
from groq import Groq
from openai import OpenAI
from app.config import settings
from app.services.vector_db import vector_db_service
from app.core.ai_rotator import APIKeyRotator
from app.core.model_config import TaskType
from app.core.model_router import model_router

logger = structlog.get_logger()

class GroqService:
    """
    Service for interacting with Groq LLMs.
    
    Integrates with the ModelRouter for:
    - Task-based model selection (5-model architecture from the AI Roadmap)
    - Circuit breaker automatic failover
    - Latency tracking and health monitoring
    
    Models:
    - GPT-OSS 120B: Compare & Award (high reasoning)
    - DeepSeek-R1 70B: Price Forecasting (deep logic / math)
    - Llama 3.3 70B: Multilingual Coordination (dialogue)
    - GPT-OSS 20B: Magic Extractor (instant speed)
    - Whisper Large V3: Field Voice ASR
    """

    def __init__(self):
        self.rotator = APIKeyRotator(settings.GROQ_API_KEYS, service_name="Groq LLM")
        self.client = None
        self._init_client()
        
        # Model IDs from config
        self.default_model = settings.GROQ_MODEL
        self.model_20b = settings.GROQ_MODEL_20B
        self.model_120b = settings.GROQ_MODEL_120B
        self.model_forecast = settings.GROQ_MODEL_FORECAST
        self.model_coordinator = settings.GROQ_MODEL_COORDINATOR

        # OpenAI for embeddings
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.embedding_model = settings.OPENAI_EMBEDDING_MODEL

        # Router reference
        self.router = model_router

    def _init_client(self):
        """Initialize or re-initialize the Groq client with the current key."""
        key = self.rotator.get_key()
        if key:
            self.client = Groq(api_key=key)
        else:
            logger.warning("No Groq API keys available")
            self.client = None

    # =========================================================================
    # Embedding
    # =========================================================================

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

    # =========================================================================
    # Router-Integrated Task Methods (Roadmap 2026)
    # =========================================================================

    async def task_chat(
        self,
        task_type: TaskType,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        use_system_prompt: bool = True,
        **kwargs
    ):
        """
        Send a chat request routed by task type through the ModelRouter.
        
        This is the PRIMARY method for all AI interactions. It:
        1. Routes to the correct model via ModelRouter
        2. Injects the task-specific system prompt
        3. Tracks latency for circuit breaker decisions
        4. Falls back automatically on failure
        
        Args:
            task_type: The TaskType enum value (AWARD, FORECAST, EXTRACTION, etc.)
            messages: Chat messages (system prompt is auto-prepended if use_system_prompt=True)
            temperature: Override the model's default temperature
            max_tokens: Override the model's default max_tokens
            use_system_prompt: Whether to prepend the roadmap-defined system prompt
        """
        # 1. Route to the best available model
        route_result = self.router.route(task_type)
        spec = route_result.model_spec

        # 2. Build final messages with optional system prompt
        final_messages = list(messages)
        if use_system_prompt:
            system_prompt = self.router.get_system_prompt(task_type)
            if system_prompt:
                # Prepend system prompt if not already in messages
                has_system = any(m.get("role") == "system" for m in final_messages)
                if not has_system:
                    final_messages.insert(0, {"role": "system", "content": system_prompt})

        # 3. Determine parameters
        model_id = spec.model_id
        temp = temperature if temperature is not None else spec.default_temperature
        tokens = max_tokens if max_tokens is not None else spec.max_tokens

        # 4. Execute with latency tracking
        try:
            result = await self.chat_completion(
                messages=final_messages,
                model=model_id,
                temperature=temp,
                max_tokens=tokens,
                **kwargs
            )

            logger.info(
                "Task chat completed",
                task=task_type.value,
                model=model_id,
                is_fallback=route_result.is_fallback,
                fallback_level=route_result.fallback_level,
            )
            return result

        except Exception as e:
            # Record failure in router (circuit breaker may open)
            self.router.record_failure(model_id, reason=str(e)[:100])

            # Try fallback if primary failed and we haven't tried fallback yet
            if not route_result.is_fallback:
                logger.warning(
                    "Primary model failed, attempting fallback via router",
                    task=task_type.value,
                    failed_model=model_id,
                    error=str(e)[:100],
                )
                # Re-route (router will now skip the failed model's open circuit)
                fallback_result = self.router.route(task_type)
                if fallback_result.model_spec.model_id != model_id:
                    return await self.chat_completion(
                        messages=final_messages,
                        model=fallback_result.model_spec.model_id,
                        temperature=temp,
                        max_tokens=tokens,
                        **kwargs
                    )

            raise

    # =========================================================================
    # Convenience Methods (Roadmap Task Types)
    # =========================================================================

    async def award_compare(self, messages: List[Dict[str, str]], **kwargs):
        """Compare & Award — Uses GPT-OSS 120B (Senior Procurement Officer)."""
        return await self.task_chat(TaskType.AWARD, messages, **kwargs)

    async def price_forecast(self, messages: List[Dict[str, str]], **kwargs):
        """Price Forecasting — Uses DeepSeek-R1 70B (Quantitative Analyst)."""
        return await self.task_chat(TaskType.FORECAST, messages, **kwargs)

    async def coordinate(self, messages: List[Dict[str, str]], **kwargs):
        """Multilingual Coordination — Uses Llama 3.3 70B (Project Coordinator)."""
        return await self.task_chat(TaskType.COORDINATION, messages, **kwargs)

    async def extract(self, messages: List[Dict[str, str]], **kwargs):
        """Magic Extractor — Uses GPT-OSS 20B (Unstructured→JSON)."""
        return await self.task_chat(TaskType.EXTRACTION, messages, **kwargs)

    # =========================================================================
    # RAG Chat
    # =========================================================================

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

    # =========================================================================
    # Legacy Model-Specific Methods (backward compatible)
    # =========================================================================

    async def chat_20b(self, messages: List[Dict[str, str]], **kwargs):
        """Chat completion using GPT-OSS 20B."""
        return await self.chat_completion(messages, model=self.model_20b, **kwargs)

    async def chat_120b(self, messages: List[Dict[str, str]], **kwargs):
        """Chat completion using GPT-OSS 120B."""
        return await self.chat_completion(messages, model=self.model_120b, **kwargs)

    # =========================================================================
    # Core Chat Completion (with rotation + latency tracking)
    # =========================================================================

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
        Generate chat completion using Groq with automatic rotation and
        latency tracking for the circuit breaker.
        """
        if not self.client:
            self._init_client()
            if not self.client:
                raise ValueError("Groq client not initialized. Check GROQ_API_KEYS.")

        model = model or self.default_model
        
        try:
            logger.info("Sending request to Groq", model=model, message_count=len(messages), retry=retry_count)
            
            start_time = time.monotonic()
            
            completion = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream,
            )
            
            # Track latency for circuit breaker
            latency_ms = (time.monotonic() - start_time) * 1000
            self.router.record_success(model, latency_ms)
            
            logger.info(
                "Groq response received",
                model=model,
                latency_ms=round(latency_ms),
            )
            
            return completion
        except Exception as e:
            # Track failure in circuit breaker
            self.router.record_failure(model, reason=str(e)[:100])
            
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

    # =========================================================================
    # Utility Methods
    # =========================================================================

    async def summarize_document(self, text: str):
        """Specialized method to summarize construction documents."""
        messages = [
            {"role": "system", "content": "You are an expert construction project manager. Summarize the following document accurately."},
            {"role": "user", "content": f"Please summarize this document:\n\n{text}"}
        ]
        return await self.task_chat(TaskType.SUMMARIZATION, messages, use_system_prompt=False)

    def get_health(self) -> Dict[str, Any]:
        """Get the health status of all AI models and the circuit breaker system."""
        return self.router.get_health_status()


# Global instance
groq_service = GroqService()
