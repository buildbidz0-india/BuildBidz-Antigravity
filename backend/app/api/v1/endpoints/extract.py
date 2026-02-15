from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.extraction_agent import extraction_agent, ExtractionResult
from app.core.auth import get_current_user

router = APIRouter()


class ExtractRequest(BaseModel):
    ocr_text: str


@router.post("/", response_model=ExtractionResult)
async def extract_document(
    request: ExtractRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Extract structured data (GSTIN, PAN, line items, total) from invoice/receipt OCR text.
    Uses Magic Extractor (GPT-OSS 20B) per AI roadmap.
    """
    if not request.ocr_text or not request.ocr_text.strip():
        raise HTTPException(status_code=400, detail="ocr_text is required")
    try:
        result = await extraction_agent.extract_invoice_data(request.ocr_text.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
