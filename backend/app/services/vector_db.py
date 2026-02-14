import structlog
from pinecone import Pinecone
from typing import List, Dict, Any, Optional
from app.config import settings

logger = structlog.get_logger()

class VectorDBService:
    """
    Service for interacting with Pinecone Vector Database.
    Used for storing and retrieving document embeddings for RAG.
    """

    def __init__(self):
        self.api_key = settings.PINECONE_API_KEY
        self.index_name = settings.PINECONE_INDEX_NAME
        
        if not self.api_key:
            logger.warning("PINECONE_API_KEY not configured")
            self.pc = None
            self.index = None
        else:
            self.pc = Pinecone(api_key=self.api_key)
            self.index = self.pc.Index(self.index_name)

    async def upsert_vectors(self, vectors: List[Dict[str, Any]], namespace: str = "default"):
        """
        Upsert vectors into the Pinecone index.
        vectors: List of dicts with 'id', 'values' (embedding), and 'metadata'.
        """
        if not self.index:
            logger.error("Pinecone index not initialized")
            return None
        
        try:
            logger.info("Upserting vectors to Pinecone", count=len(vectors))
            response = self.index.upsert(vectors=vectors, namespace=namespace)
            return response
        except Exception as e:
            logger.error("Pinecone upsert error", error=str(e))
            raise

    async def query_vectors(
        self, 
        vector: List[float], 
        top_k: int = 5, 
        namespace: str = "default",
        include_metadata: bool = True
    ):
        """
        Query the Pinecone index for nearest neighbors.
        """
        if not self.index:
            logger.error("Pinecone index not initialized")
            return []
        
        try:
            logger.info("Querying Pinecone", top_k=top_k)
            response = self.index.query(
                vector=vector,
                top_k=top_k,
                namespace=namespace,
                include_metadata=include_metadata
            )
            return response.get('matches', [])
        except Exception as e:
            logger.error("Pinecone query error", error=str(e))
            raise

# Global instance
vector_db_service = VectorDBService()
