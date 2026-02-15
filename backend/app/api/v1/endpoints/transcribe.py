"""
Field Voice: upload audio and get transcript via Whisper (Groq).
Construction vocabulary is injected for better accuracy (RFI, OAC, TMT, etc.).
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel

from app.core.auth import get_current_user

router = APIRouter()

CONSTRUCTION_PROMPT = (
    "RFI, OAC, TMT bars, Grade 53 Cement, punch list, "
    "foundation, slab, reinforcement, formwork, BOQ, tender."
)


@router.post("/")
async def transcribe_audio(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Transcribe audio (e.g. field voice note) to text.
    Accepts WAV/MP3/WebM. Uses Whisper with construction vocabulary.
    """
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="Upload an audio file (e.g. audio/wav, audio/webm).",
        )
    try:
        audio_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")
    if len(audio_bytes) > 25 * 1024 * 1024:  # 25 MB
        raise HTTPException(status_code=400, detail="File too large (max 25 MB).")

    try:
        from app.workers.asr_worker import GroqASR
        groq = GroqASR()
        result = await groq.transcribe(
            audio_bytes,
            language="en",
            prompt=CONSTRUCTION_PROMPT,
        )
        return {
            "text": result.get("text", ""),
            "language": result.get("language"),
            "provider": result.get("provider", "groq"),
        }
    except ValueError as e:
        raise HTTPException(status_code=503, detail="ASR not configured")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
