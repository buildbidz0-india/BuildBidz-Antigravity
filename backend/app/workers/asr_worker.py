# =============================================================================
# BuildBidz ML Pipeline - ASR Worker
# Audio Speech Recognition using Sarvam AI, Whisper, and fallbacks
# =============================================================================

import asyncio
import io
import tempfile
from pathlib import Path
from typing import Optional

import httpx
from celery import current_task
import structlog

from app.config import settings
from app.workers.celery_app import celery_app
from app.db.session import get_db_pool
from app.core.ai_rotator import APIKeyRotator

logger = structlog.get_logger()


# =============================================================================
# ASR Providers
# =============================================================================

class SarvamASR:
    """
    Sarvam AI ASR for Indian languages.
    Supports Hindi, Hinglish, Tamil, Telugu, etc.
    """

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.endpoint = "https://api.sarvam.ai/speech-to-text"

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: str = "hi-IN",
    ) -> dict:
        """Transcribe audio using Sarvam AI."""
        if not self.api_key:
            raise ValueError("Sarvam AI API key not configured")

        async with httpx.AsyncClient() as client:
            # Create multipart form data
            files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
            data = {
                "language_code": language,
                "model": "saarika:v1",
                "with_timestamps": True,
            }

            response = await client.post(
                self.endpoint,
                headers={"api-subscription-key": self.api_key},
                files=files,
                data=data,
                timeout=120.0,
            )

            if response.status_code != 200:
                raise Exception(f"Sarvam AI error: {response.status_code}")

            result = response.json()

            return {
                "text": result.get("transcript", ""),
                "language": language,
                "confidence": result.get("confidence", 0),
                "segments": result.get("timestamps", []),
                "provider": "sarvam",
            }


class WhisperASR:
    """
    OpenAI Whisper ASR.
    Good for multilingual and mixed-language audio.
    """

    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.endpoint = "https://api.openai.com/v1/audio/transcriptions"

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> dict:
        """Transcribe audio using OpenAI Whisper."""
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")

        async with httpx.AsyncClient() as client:
            files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
            data = {
                "model": "whisper-1",
                "response_format": "verbose_json",
            }
            if language:
                # Convert to ISO 639-1 code
                lang_map = {"hi-IN": "hi", "en-IN": "en", "ta-IN": "ta", "te-IN": "te"}
                data["language"] = lang_map.get(language, language[:2])

            response = await client.post(
                self.endpoint,
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
                data=data,
                timeout=120.0,
            )

            if response.status_code != 200:
                raise Exception(f"Whisper API error: {response.status_code}")

            result = response.json()

            return {
                "text": result.get("text", ""),
                "language": result.get("language", language),
                "confidence": 0.9,  # Whisper doesn't provide confidence
                "segments": [
                    {
                        "start": seg.get("start"),
                        "end": seg.get("end"),
                        "text": seg.get("text"),
                    }
                    for seg in result.get("segments", [])
                ],
                "provider": "whisper",
            }


class GroqASR:
    """
    Groq Cloud Whisper ASR.
    Extremely fast inference with automatic key rotation.
    """

    def __init__(self):
        self.rotator = APIKeyRotator(settings.GROQ_API_KEYS, service_name="Groq ASR")
        self.endpoint = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        retry_count: int = 0
    ) -> dict:
        """Transcribe audio using Groq Whisper with rotation."""
        key = self.rotator.get_key()
        if not key:
            raise ValueError("Groq API key not configured")

        async with httpx.AsyncClient() as client:
            files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
            data = {
                "model": "whisper-large-v3",
                "response_format": "verbose_json",
            }
            if language:
                lang_map = {"hi-IN": "hi", "en-IN": "en", "ta-IN": "ta", "te-IN": "te"}
                data["language"] = lang_map.get(language, language[:2])

            try:
                response = await client.post(
                    self.endpoint,
                    headers={"Authorization": f"Bearer {key}"},
                    files=files,
                    data=data,
                    timeout=60.0,
                )

                if response.status_code != 200:
                    error_text = response.text
                    if response.status_code == 429 or "rate limit" in error_text.lower():
                        if retry_count < len(self.rotator.keys):
                            logger.warning("Groq ASR rate limit hit, rotating key and retrying", retry=retry_count)
                            self.rotator.mark_limited(key)
                            return await self.transcribe(audio_bytes, language, retry_count + 1)
                    
                    raise Exception(f"Groq API error: {response.status_code} - {error_text}")

                result = response.json()

                return {
                    "text": result.get("text", ""),
                    "language": result.get("language", language),
                    "confidence": 0.95,
                    "segments": [
                        {
                            "start": seg.get("start"),
                            "end": seg.get("end"),
                            "text": seg.get("text"),
                        }
                        for seg in result.get("segments", [])
                    ],
                    "provider": "groq",
                }
            except httpx.HTTPError as e:
                logger.error("Groq ASR HTTP error", error=str(e))
                raise


class LocalWhisperASR:
    """
    Local Whisper model fallback.
    Uses faster-whisper for on-premise processing.
    """

    def __init__(self):
        self.model = None
        self.model_size = "medium"

    def _load_model(self):
        """Lazy load the model."""
        if self.model is None:
            try:
                from faster_whisper import WhisperModel
                self.model = WhisperModel(
                    self.model_size,
                    device="cuda" if settings.USE_GPU else "cpu",
                    compute_type="float16" if settings.USE_GPU else "int8",
                )
            except ImportError:
                raise Exception("faster-whisper not installed")

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> dict:
        """Transcribe audio using local Whisper."""
        self._load_model()

        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name

        try:
            # Run in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._transcribe_sync,
                temp_path,
                language,
            )
            return result
        finally:
            Path(temp_path).unlink(missing_ok=True)

    def _transcribe_sync(self, audio_path: str, language: Optional[str]) -> dict:
        """Sync transcription for thread pool."""
        segments, info = self.model.transcribe(
            audio_path,
            language=language[:2] if language else None,
            beam_size=5,
            word_timestamps=True,
        )

        segments_list = list(segments)
        full_text = " ".join(seg.text for seg in segments_list)

        return {
            "text": full_text.strip(),
            "language": info.language,
            "confidence": info.language_probability,
            "segments": [
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text,
                }
                for seg in segments_list
            ],
            "provider": "local_whisper",
        }


# =============================================================================
# Audio Processing Utilities
# =============================================================================

async def download_audio(storage_path: str) -> bytes:
    """Download audio file from Firebase Storage."""
    from app.firebase import download_firebase_file
    return await download_firebase_file(storage_path)


def detect_audio_language(audio_bytes: bytes) -> str:
    """
    Detect the primary language in audio.
    Returns language code like 'hi-IN', 'en-IN'.
    """
    # Simple heuristic: use Sarvam for Indian numbers detection
    # In production, could use a language detection model
    return "hi-IN"


async def update_whatsapp_message(
    message_id: str,
    transcription: str,
    language: str,
) -> None:
    """Update WhatsApp message with transcription."""
    pool = await get_db_pool()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE whatsapp_messages
            SET transcription = $1, language = $2, updated_at = NOW()
            WHERE id = $3
            """,
            transcription,
            language,
            message_id,
        )


# =============================================================================
# Celery Tasks
# =============================================================================

@celery_app.task(
    bind=True,
    name="workers.asr_worker.transcribe_audio",
    max_retries=3,
    default_retry_delay=60,
)
def transcribe_audio(
    self,
    message_id: str,
    storage_path: str,
    language_hint: Optional[str] = None,
) -> dict:
    """
    Transcribe audio from WhatsApp voice message.
    
    Uses Sarvam AI for Indian languages, falls back to Whisper.
    """
    logger.info(
        "Starting ASR",
        message_id=message_id,
        storage_path=storage_path,
    )

    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(
            _transcribe_audio(message_id, storage_path, language_hint)
        )

        logger.info(
            "ASR completed",
            message_id=message_id,
            provider=result.get("provider"),
            language=result.get("language"),
        )

        return result

    except Exception as e:
        logger.error("ASR failed", message_id=message_id, error=str(e))
        raise self.retry(exc=e)


async def _transcribe_audio(
    message_id: str,
    storage_path: str,
    language_hint: Optional[str] = None,
) -> dict:
    """Async implementation of audio transcription."""
    # Download audio
    audio_bytes = await download_audio(storage_path)

    # Detect language if not provided
    language = language_hint or detect_audio_language(audio_bytes)

    # Try Groq first (extremely fast)
    try:
        groq = GroqASR()
        result = await groq.transcribe(audio_bytes, language)
    except Exception as groq_error:
        logger.warning("Groq ASR failed, trying Sarvam/Whisper", error=str(groq_error))

        # Try Sarvam AI for Indian languages
        try:
            if language.startswith(("hi", "ta", "te", "kn", "ml", "mr", "bn", "gu", "pa")):
                sarvam = SarvamASR()
                result = await sarvam.transcribe(audio_bytes, language)
            else:
                raise ValueError("Non-Indian language, use Whisper")
        except Exception as sarvam_error:
            logger.warning("Sarvam AI failed, trying Whisper", error=str(sarvam_error))

            # Fallback to Whisper
            try:
                whisper = WhisperASR()
                result = await whisper.transcribe(audio_bytes, language)
            except Exception as whisper_error:
                logger.warning("Whisper API failed, trying local", error=str(whisper_error))

                # Fallback to local Whisper
                local_whisper = LocalWhisperASR()
                result = await local_whisper.transcribe(audio_bytes, language)

    # Update WhatsApp message with transcription
    await update_whatsapp_message(
        message_id,
        result["text"],
        result["language"],
    )

    # Queue for embedding generation
    celery_app.send_task(
        "workers.embedding_worker.generate_text_embeddings",
        kwargs={
            "text": result["text"],
            "source_type": "whatsapp_message",
            "source_id": message_id,
        },
    )

    return result


@celery_app.task(
    name="workers.asr_worker.transcribe_batch",
    max_retries=1,
)
def transcribe_batch(message_ids: list[str]) -> dict:
    """Process multiple audio files in batch."""
    results = {}

    for message_id in message_ids:
        try:
            # Get storage path from database
            pool = asyncio.get_event_loop().run_until_complete(get_db_pool())
            
            async def get_path():
                async with pool.acquire() as conn:
                    row = await conn.fetchrow(
                        "SELECT media_url FROM whatsapp_messages WHERE id = $1",
                        message_id,
                    )
                    return row["media_url"] if row else None

            storage_path = asyncio.get_event_loop().run_until_complete(get_path())
            
            if storage_path:
                result = transcribe_audio.delay(message_id, storage_path)
                results[message_id] = {"status": "queued", "task_id": result.id}
            else:
                results[message_id] = {"status": "error", "error": "No audio found"}

        except Exception as e:
            results[message_id] = {"status": "error", "error": str(e)}

    return results
