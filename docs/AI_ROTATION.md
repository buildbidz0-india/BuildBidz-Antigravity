# Rotary API Key Management for AI Services

BuildBidz implements an automatic API key rotation system for AI services (currently Groq) to ensure high availability and stay within rate limits effortlessly.

## 🚀 How it Works

The system uses an `APIKeyRotator` utility that manages a list of API keys. When an AI service (like Groq Chat or Groq ASR) encounters a "Rate Limit" error (HTTP 429), it automatically:

1.  **Marks** the current key as limited.
2.  **Rotates** to the next available key in the list.
3.  **Retries** the request with the new key.

This happens transparently to the end-user and the rest of the application logic.

## 🛠️ Configuration

Multiple keys can be configured in the `.env` file using a comma-separated list.

### Backend Configuration (`.env`)

```env
# GROQ_API_KEYS can take one or more keys separated by commas
GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3
GROQ_MODEL=llama3-70b-8192
```

## 🏗️ Implementation Details

### `APIKeyRotator` (`backend/app/core/ai_rotator.py`)

A thread-safe-ready utility that maintains the state of the keys and handles the rotation index.

### `GroqService` (`backend/app/services/ai.py`)

Integrated into the main AI service for chat and RAG tasks. It catches exceptions and triggers rotation.

### `GroqASR` (`backend/app/workers/asr_worker.py`)

Integrated into the Celery worker for fast audio transcription, ensuring that even batch processing of WhatsApp voice messages doesn't get interrupted by rate limits.

## 📈 Advantages

- **Resilience**: Applications stay alive even when one account hits a limit.
- **Cost Management**: Can distribute load across multiple free-tier or paid-tier accounts.
- **Performance**: Minimizes latency caused by manual key swaps or downtime.
