
# =============================================================================
# BuildBidz - Extraction Specialist (Magic Extractor)
# =============================================================================
# Handles structured data extraction from unstructured text (OCR output)
# using GPT-OSS 20B (or equivalent Llama 3 model) via Groq.
# =============================================================================

import json
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
import structlog

from app.services.ai import groq_service

logger = structlog.get_logger()

# =============================================================================
# Data Models
# =============================================================================

class LineItem(BaseModel):
    description: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None

class ExtractionResult(BaseModel):
    document_type: str = Field(..., description="INVOICE, RECEIPT, WHATSAPP, or UNKNOWN")
    vendor_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    gstin: Optional[str] = Field(None, description="GST Identification Number")
    pan: Optional[str] = Field(None, description="Permanent Account Number")
    total_amount: Optional[float] = None
    line_items: List[LineItem] = []
    verification_ready: bool = Field(False, description="True if GSTIN and Total Amount are present")

# =============================================================================
# Extraction Agent Service
# =============================================================================

class ExtractionAgent:
    """
    Core logic for the 'Extraction Specialist' phase.
    
    Uses AI to parse OCR text into structured JSON.
    Focuses on Indian context (GSTIN, PAN, Lakhs/Crores).
    """

    async def extract_invoice_data(self, ocr_text: str) -> ExtractionResult:
        """
        Extracts structured data from invoice OCR text.
        """
        system_prompt = (
            "You are an expert data extraction AI for Indian construction documents. "
            "Extract structured data from the provided OCR text into JSON format. "
            "Focus on capturing GSTIN (15 chars), PAN (10 chars), and Line Items. "
            "If a value is missing, return null. "
            "Format dates as YYYY-MM-DD. "
            "Normalize amounts to floats (remove commas/currency symbols). "
            "Identify the document type as INVOICE, RECEIPT, or WHATSAPP."
        )

        user_prompt = f"OCR TEXT:\n{ocr_text}\n\nReturn JSON matching this schema: {{ document_type, vendor_name, invoice_number, invoice_date, gstin, pan, total_amount, line_items: [ {{ description, quantity, unit, unit_price, total_price }} ] }}"

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            # Use 'extract' task type (mapped to GPT-OSS 20B / Llama 3 8B)
            response = await groq_service.extract(messages, temperature=0.1, response_format={"type": "json_object"})
            content = response.choices[0].message.content
            
            # Parse JSON
            data = json.loads(content)
            
            # Determine verification readiness
            # Ready if we have a GSTIN and a Total Amount
            verification_ready = bool(data.get("gstin") and data.get("total_amount"))
            data["verification_ready"] = verification_ready
            
            return ExtractionResult(**data)

        except json.JSONDecodeError:
            logger.error("Failed to parse AI response as JSON", content=content)
            # Return empty result with raw text as fallback if needed, or just specific error
            return ExtractionResult(document_type="UNKNOWN")
            
        except Exception as e:
            logger.error("Extraction AI failed", error=str(e))
            raise

# Global Instance
extraction_agent = ExtractionAgent()
