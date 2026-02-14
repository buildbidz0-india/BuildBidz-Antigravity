from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import structlog

from app.services.ai import groq_service

logger = structlog.get_logger()
router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7

@router.post("/chat")
async def chat_with_groq(request: ChatRequest):
    """
    Endpoint for chat completions using Groq.
    If context is provided, uses RAG prompt template.
    """
    try:
        if request.context:
            # RAG flow
            # For simplicity, we assume the last message in request.messages is the current query
            # and the rest (if any) is history.
            all_messages = list(request.messages)
            if not all_messages:
                raise HTTPException(status_code=400, detail="Messages list is empty")
                
            query = all_messages[-1].content
            history = [msg.model_dump() for msg in all_messages[:-1]]
            
            result = await groq_service.rag_chat(
                query=query,
                context=request.context,
                history=history,
                model=request.model,
                temperature=request.temperature
            )
        else:
            # Standard chat flow
            messages = [msg.model_dump() for msg in request.messages]
            result = await groq_service.chat_completion(
                messages=messages,
                model=request.model,
                temperature=request.temperature
            )
        
        return {
            "content": result.choices[0].message.content,
            "model": result.model,
            "usage": result.usage.model_dump() if hasattr(result, 'usage') else None
        }
    except Exception as e:
        logger.error("Groq chat error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

class RagChatRequest(BaseModel):
    query: str
    context: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = 0.7

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[Dict[str, Any]] = {}
    namespace: Optional[str] = "default"

@router.post("/rag-chat")
async def chat_with_rag(request: RagChatRequest):
    """
    Endpoint for RAG-enhanced chat.
    """
    try:
        result = await groq_service.rag_chat(
            query=request.query,
            context=request.context,
            model=request.model,
            temperature=request.temperature
        )
        
        return {
            "content": result.choices[0].message.content,
            "model": result.model,
            "usage": result.usage.model_dump() if hasattr(result, 'usage') else None
        }
    except Exception as e:
        logger.error("RAG chat error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest")
async def ingest_document(request: IngestRequest):
    """
    Endpoint to ingest a document into the vector database.
    """
    try:
        from app.services.vector_db import vector_db_service
        import uuid
        
        # 1. Generate embedding
        embedding = await groq_service.get_embedding(request.text)
        
        # 2. Prepare vector for Pinecone
        vector_id = str(uuid.uuid4())
        metadata = request.metadata or {}
        metadata["text"] = request.text
        
        vector = {
            "id": vector_id,
            "values": embedding,
            "metadata": metadata
        }
        
        # 3. Upsert to Pinecone
        await vector_db_service.upsert_vectors([vector], namespace=request.namespace)
        
        return {
            "status": "success",
            "vector_id": vector_id
        }
    except Exception as e:
        logger.error("Ingestion error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def ai_health():
    """AI service health check."""
    return {
        "status": "healthy",
        "groq_enabled": groq_service.client is not None,
        "openai_enabled": groq_service.openai_client is not None
    }
