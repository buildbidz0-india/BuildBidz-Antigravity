# =============================================================================
# BuildBidz ML Pipeline - OCR Worker
# Document OCR using Azure Vision and Tesseract fallback
# =============================================================================

import asyncio
import io
import time
from typing import Optional

import httpx
from celery import current_task
import structlog

from app.config import settings
from app.workers.celery_app import celery_app
from app.db.session import get_db_pool

logger = structlog.get_logger()


class AzureVisionOCR:
    """Azure Computer Vision OCR client."""

    def __init__(self):
        self.endpoint = settings.AZURE_VISION_ENDPOINT
        self.key = settings.AZURE_VISION_KEY
        self.api_version = "2023-04-01-preview"

    async def extract_text(self, image_bytes: bytes) -> dict:
        """Extract text from image using Azure Vision Read API."""
        if not self.endpoint or not self.key:
            raise ValueError("Azure Vision not configured")

        url = f"{self.endpoint}/vision/v3.2/read/analyze"

        async with httpx.AsyncClient() as client:
            # Submit image for analysis
            response = await client.post(
                url,
                headers={
                    "Ocp-Apim-Subscription-Key": self.key,
                    "Content-Type": "application/octet-stream",
                },
                content=image_bytes,
                timeout=30.0,
            )

            if response.status_code != 202:
                raise Exception(f"Azure Vision error: {response.status_code}")

            # Get operation location
            operation_url = response.headers.get("Operation-Location")

            # Poll for results
            for _ in range(60):  # Max 60 seconds
                await asyncio.sleep(1)

                result_response = await client.get(
                    operation_url,
                    headers={"Ocp-Apim-Subscription-Key": self.key},
                )
                result = result_response.json()

                if result.get("status") == "succeeded":
                    return self._parse_result(result)
                elif result.get("status") == "failed":
                    raise Exception("Azure Vision analysis failed")

            raise Exception("Azure Vision timeout")

    def _parse_result(self, result: dict) -> dict:
        """Parse Azure Vision result into structured format."""
        lines = []
        full_text = []
        confidence_scores = []

        for page in result.get("analyzeResult", {}).get("readResults", []):
            for line in page.get("lines", []):
                lines.append({
                    "text": line.get("text"),
                    "bounding_box": line.get("boundingBox"),
                    "confidence": sum(w.get("confidence", 0) for w in line.get("words", [])) / max(len(line.get("words", [])), 1),
                })
                full_text.append(line.get("text", ""))
                for word in line.get("words", []):
                    confidence_scores.append(word.get("confidence", 0))

        avg_confidence = sum(confidence_scores) / max(len(confidence_scores), 1)

        return {
            "text": "\n".join(full_text),
            "lines": lines,
            "confidence": avg_confidence,
            "provider": "azure_vision",
        }


class TesseractOCR:
    """Fallback OCR using Tesseract."""

    async def extract_text(self, image_bytes: bytes) -> dict:
        """Extract text using Tesseract OCR."""
        try:
            import pytesseract
            from PIL import Image

            image = Image.open(io.BytesIO(image_bytes))

            # Run Tesseract with Hindi and English language support
            text = pytesseract.image_to_string(
                image,
                lang="eng+hin",
                config="--psm 3"
            )

            # Get confidence data
            data = pytesseract.image_to_data(
                image,
                lang="eng+hin",
                output_type=pytesseract.Output.DICT
            )

            confidences = [
                int(c) for c in data.get("conf", [])
                if str(c).isdigit() and int(c) > 0
            ]
            avg_confidence = sum(confidences) / max(len(confidences), 1) / 100

            return {
                "text": text.strip(),
                "lines": [],
                "confidence": avg_confidence,
                "provider": "tesseract",
            }
        except ImportError:
            raise Exception("Tesseract not installed")


async def download_file(storage_path: str) -> bytes:
    """Download file from Firebase Storage."""
    from app.firebase import download_firebase_file
    return await download_firebase_file(storage_path)


async def update_document_ocr(
    document_id: str,
    result: dict,
    status: str = "completed"
) -> None:
    """Update document with OCR results."""
    pool = await get_db_pool()

    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE documents
            SET ocr_status = $1, ocr_text = $2, ocr_confidence = $3, updated_at = NOW()
            WHERE id = $4
            """,
            status,
            result.get("text"),
            result.get("confidence"),
            document_id,
        )


# =============================================================================
# Celery Tasks
# =============================================================================

@celery_app.task(
    bind=True,
    name="workers.ocr_worker.process_document",
    max_retries=3,
    default_retry_delay=60,
)
def process_document_ocr(self, document_id: str) -> dict:
    """
    Process document OCR.
    
    Uses Azure Vision as primary, Tesseract as fallback.
    """
    logger.info("Starting OCR", document_id=document_id, task_id=self.request.id)

    try:
        # Run async code in sync context
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(_process_document_ocr(document_id))

        logger.info(
            "OCR completed",
            document_id=document_id,
            provider=result.get("provider"),
            confidence=result.get("confidence"),
        )

        return result

    except Exception as e:
        logger.error("OCR failed", document_id=document_id, error=str(e))

        # Update status to failed
        loop = asyncio.get_event_loop()
        loop.run_until_complete(
            update_document_ocr(document_id, {}, status="failed")
        )

        raise self.retry(exc=e)


async def _process_document_ocr(document_id: str) -> dict:
    """Async implementation of document OCR."""
    pool = await get_db_pool()

    # Get document info
    async with pool.acquire() as conn:
        doc = await conn.fetchrow(
            "SELECT file_path, mime_type FROM documents WHERE id = $1",
            document_id,
        )

    if not doc:
        raise ValueError(f"Document not found: {document_id}")

    # Update status to processing
    await update_document_ocr(document_id, {}, status="processing")

    # Download file
    file_bytes = await download_file(doc["file_path"])

    # Try Azure Vision first
    try:
        if settings.AZURE_VISION_ENDPOINT:
            azure_ocr = AzureVisionOCR()
            result = await azure_ocr.extract_text(file_bytes)
        else:
            raise ValueError("Azure Vision not configured")
    except Exception as azure_error:
        logger.warning("Azure Vision failed, trying Tesseract", error=str(azure_error))

        # Fallback to Tesseract
        tesseract_ocr = TesseractOCR()
        result = await tesseract_ocr.extract_text(file_bytes)

    # Update document
    await update_document_ocr(document_id, result)

    # Queue embedding generation
    celery_app.send_task(
        "workers.embedding_worker.generate_document_embeddings",
        args=[document_id],
    )

    # Queue Magic Extractor for invoices
    if "invoice" in doc.get("mime_type", "").lower() or result.get("text", "").lower().find("invoice") >= 0:
        celery_app.send_task(
            "workers.magic_extractor.extract_invoice",
            args=[document_id, result.get("text")],
        )

    return result


@celery_app.task(
    name="workers.ocr_worker.process_batch",
    max_retries=1,
)
def process_batch_ocr(document_ids: list[str]) -> dict:
    """Process multiple documents in batch."""
    results = {}
    for doc_id in document_ids:
        try:
            result = process_document_ocr.delay(doc_id)
            results[doc_id] = {"status": "queued", "task_id": result.id}
        except Exception as e:
            results[doc_id] = {"status": "error", "error": str(e)}

    return results
