
# =============================================================================
# BuildBidz - Local Facilitator (Multilingual Coordination Agent)
# =============================================================================
# Handles post-award communication, jargon simplification, and translation
# into Hindi/Hinglish for contractors using Llama 3.3 70B.
# =============================================================================

from typing import List, Dict, Optional, Any
from enum import Enum
from pydantic import BaseModel
import structlog

from app.services.ai import groq_service

logger = structlog.get_logger()

# =============================================================================
# Data Models
# =============================================================================

class Language(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    HINGLISH = "hinglish"
    # Can extend to other regional languages (Tamil, Marathi) later

class CommunicationStep(str, Enum):
    AWARD_NOTIFICATION = "award_notification"
    SITE_READY = "site_ready"
    PAYMENT_RELEASED = "payment_released"
    DEFECT_NOTICE = "defect_notice"

class NotificationRequest(BaseModel):
    contractor_name: str
    phone_number: str
    language: Language
    step: CommunicationStep
    project_name: str
    details: Dict[str, Any]

class NotificationResult(BaseModel):
    original_intent: str
    translated_message: str
    whatsapp_formatted: str
    audio_transcription_url: Optional[str] = None # For future voice synthesis

# =============================================================================
# Coordination Agent Service
# =============================================================================

class CoordinationAgent:
    """
    Core logic for the 'Local Facilitator' phase.
    
    1. Communication Management: Selects appropriate templates for award stages.
    2. Translation & Simplification: Uses AI (Llama 3.3 70B) to:
       - Translate technical terms into contractor-friendly language.
       - Convert formal English to Hindi/Hinglish/Regional.
       - Format for WhatsApp (bolding, emojis).
    """

    async def _get_system_prompt(self, language: Language) -> str:
        """
        Returns the persona prompt for the Local Facilitator.
        """
        base_prompt = (
            "You are the 'BuildBidz Site Manager Assistant', a helpful and respectful AI "
            "that communicates with construction contractors in India. "
            "Your goal is to be clear, polite, and firm about deadlines/quality. "
            "Avoid complex legal jargon. Use simple, direct words.\n"
        )
        
        if language == Language.HINDI:
            return base_prompt + (
                "Output STRICTLY in formal but accessible Hindi (Devanagari script). "
                "Use English terms for technical words like 'Invoice', 'Site', 'Beam' if common."
            )
        elif language == Language.HINGLISH:
            return base_prompt + (
                "Output in conversational Hinglish (Hindi written in Latin script). "
                "Example: 'Aapka payment process ho gaya hai.' "
                "Tone should be professional yet friendly like a WhatsApp message."
            )
        else:
            return base_prompt + "Output in clear, simple English."

    async def generate_notification(self, request: NotificationRequest) -> NotificationResult:
        """
        Generates a translated, formatted message for a contractor.
        """
        # 1. Select Template Strategy
        if request.step == CommunicationStep.AWARD_NOTIFICATION:
            user_content = (
                f"Notify contractor {request.contractor_name} that they have won the bid for "
                f"{request.project_name}. "
                f"Total Amount: {request.details.get('amount')}. "
                f"Start Date: {request.details.get('start_date')}. "
                "Ask them to confirm acceptance by replying 'YES'."
            )
        elif request.step == CommunicationStep.SITE_READY:
            user_content = (
                f"Inform {request.contractor_name} that the site for {request.project_name} "
                "is ready for their work. "
                "They should bring their team and materials by tomorrow morning."
            )
        elif request.step == CommunicationStep.PAYMENT_RELEASED:
            user_content = (
                f"Tell {request.contractor_name} that payment of {request.details.get('amount')} "
                f"has been released via UPI/NEFT. Allocations: {request.details.get('breakdown')}."
            )
        else:
            user_content = f"Message to {request.contractor_name}: {str(request.details)}"

        # 2. Add specific formatting instructions
        user_content += (
            "\n\nFORMATTING RULES:\n"
            "- Use WhatsApp formatting (*Bold* for amounts/dates)\n"
            "- Use 1-2 relevant emojis 👷🧱💰\n"
            "- Keep it under 50 words."
        )

        # 3. AI Generation (Llama 3.3 70B via Router)
        system_prompt = await self._get_system_prompt(request.language)
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            # Task 'coordination' maps to Llama 3.3 70B
            response = await groq_service.coordinate(messages, temperature=0.4)
            message_text = response.choices[0].message.content
        except Exception as e:
            logger.error("Coordination AI failed", error=str(e))
            message_text = f"[AI Error] Please contact {request.contractor_name} manually."

        # 4. Result
        return NotificationResult(
            original_intent=request.step.name,
            translated_message=message_text,
            whatsapp_formatted=message_text # already formatted by prompt instructions
        )

# Global Instance
coordination_agent = CoordinationAgent()
