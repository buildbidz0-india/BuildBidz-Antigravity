
# =============================================================================
# BuildBidz ML Pipeline - Magic Extractor Worker
# =============================================================================
# Extracts structured data (JSON) from OCR text using the ExtractionAgent.
# =============================================================================

import asyncio
from typing import Dict, Any

from celery import shared_task
import structlog

from app.workers.celery_app import celery_app
from app.services.extraction_agent import extraction_agent
from app.db.session import get_db_pool

logger = structlog.get_logger()

async def update_document_extraction(document_id: str, data: Dict[str, Any]) -> None:
    """
    Update document with extracted JSON data.
    Note: Assumes 'extracted_data' JSONB column exists or we store in metadata.
    For now, we'll log it and attempt a safe update if the column exists.
    """
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        try:
            # Try to update extracted_data column
            await conn.execute(
                """
                UPDATE documents
                SET extracted_data = $1, updated_at = NOW()
                WHERE id = $2
                """,
                data,
                document_id,
            )
        except Exception as e:
            logger.warning("Could not update extracted_data column (might not exist)", error=str(e))
            # Fallback: Store in existing metadata column if available, or just log
            pass

@celery_app.task(
    bind=True,
    name="workers.magic_extractor.extract_invoice",
    max_retries=3,
    default_retry_delay=60,
)
def extract_invoice(self, document_id: str, ocr_text: str) -> Dict[str, Any]:
    """
    Process OCR text to extract structure (Invoice details, GSTIN, Line Items).
    """
    logger.info("Starting Magic Extraction", document_id=document_id, task_id=self.request.id)

    try:
        # Run async code in sync context
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(extraction_agent.extract_invoice_data(ocr_text))
        
        # Convert Pydantic model to dict
        result_dict = result.dict()
        
        logger.info(
            "Extraction completed",
            document_id=document_id,
            doc_type=result_dict.get("document_type"),
            verification_ready=result_dict.get("verification_ready"),
            gstin=result_dict.get("gstin")
        )

        # Update DB
        loop.run_until_complete(update_document_extraction(document_id, result_dict))

        return result_dict

    except Exception as e:
        logger.error("Magic Extraction failed", document_id=document_id, error=str(e))
        raise self.retry(exc=e)
