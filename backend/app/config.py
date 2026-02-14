# =============================================================================
# BuildBidz Python Backend - Configuration
# =============================================================================

from typing import List, Optional
from pydantic import Field, PostgresDsn, RedisDsn, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )
    
    # App
    APP_NAME: str = "BuildBidz"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3100"]
    
    # Database
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql://postgres:postgres@localhost:5432/buildbidz"
    )
    
    # Firebase
    FIREBASE_PROJECT_ID: str = "buildbidz-d56f2"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    FIREBASE_STORAGE_BUCKET: str = "buildbidz-d56f2.firebasestorage.app"
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_ORG_ID: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Groq
    GROQ_API_KEYS: List[str] = Field(default_factory=list)
    GROQ_MODEL: str = "llama3-70b-8192"

    @validator("GROQ_API_KEYS", pre=True)
    def parse_groq_api_keys(cls, v):
        if isinstance(v, str):
            return [k.strip() for k in v.split(",") if k.strip()]
        return v
    GROQ_MODEL_20B: str = "openai/gpt-oss-20b"
    GROQ_MODEL_120B: str = "openai/gpt-oss-120b"
    
    # Roadmap Multi-Model Configuration (2026)
    GROQ_MODEL_FORECAST: str = "deepseek-r1-distill-llama-70b"
    GROQ_MODEL_COORDINATOR: str = "llama-3.3-70b-versatile"
    GROQ_MODEL_ASR: str = "whisper-large-v3"
    
    # Circuit Breaker Configuration (from Reliability Architecture)
    CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS: int = 5000   # 5s as per roadmap
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: int = 3
    CIRCUIT_BREAKER_RECOVERY_TIMEOUT_S: int = 60
    
    # Pinecone
    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = "us-east-1"
    PINECONE_INDEX_NAME: str = "buildbidz-docs"
    
    # Security
    SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_SECONDS: int = 86400
    ENCRYPTION_KEY: str = ""
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # Feature Flags
    FEATURE_OFFLINE_SYNC_ENABLED: bool = True
    FEATURE_AI_COPILOT_ENABLED: bool = True
    
    # AI/LLM Settings
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


# Global settings instance
settings = Settings()
