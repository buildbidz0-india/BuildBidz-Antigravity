# =============================================================================
# BuildBidz AI - Model Configuration Registry
# =============================================================================
# Maps task types to specific Groq models with capability metadata and
# fallback chains, as defined in the Strategic AI Integration Roadmap (2026).
# =============================================================================

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional


class TaskType(str, Enum):
    """
    AI task types aligned with the 5-model roadmap architecture.
    Each maps to a specific model optimized for that workload.
    """
    # Model 1: GPT-OSS 120B — Compare & Award (High Reasoning / MoE)
    AWARD = "award"

    # Model 2: DeepSeek-R1 70B — Price Forecasting (Deep Logic / Math)
    FORECAST = "forecast"

    # Model 3: Llama 3.3 70B — Multilingual Coordination (Dialogue)
    COORDINATION = "coordination"

    # Model 4: GPT-OSS 20B — Magic Extractor (Instant Speed)
    EXTRACTION = "extraction"

    # Model 5: Whisper Large V3 — Voice-to-Text (ASR)
    ASR = "asr"

    # General purpose / RAG chat
    GENERAL = "general"

    # Document summarization
    SUMMARIZATION = "summarization"


@dataclass
class ModelSpec:
    """
    Specification for a single AI model in the BuildBidz system.
    """
    # Groq model identifier
    model_id: str

    # Human-readable name
    display_name: str

    # What this model excels at
    capability: str

    # Maximum tokens this model supports
    max_tokens: int = 4096

    # Default temperature for this model
    default_temperature: float = 0.7

    # Whether this model supports streaming
    supports_streaming: bool = True

    # Whether this is an ASR (audio) model rather than text
    is_audio_model: bool = False


@dataclass
class TaskModelMapping:
    """
    Maps a task type to its primary model and ordered fallback chain.
    Implements the Reliability Architecture from the roadmap:
      Primary → Tier 1 Fallback (Llama 3.3 70B) → General Fallback
    """
    task_type: TaskType

    # Primary model for this task
    primary: ModelSpec

    # Ordered list of fallback models (Tier 1, Tier 2, etc.)
    fallbacks: List[ModelSpec] = field(default_factory=list)

    # System prompt template for this task type (optional)
    system_prompt_template: Optional[str] = None


# =============================================================================
# Model Definitions
# =============================================================================

# Model 1: High Reasoning / MoE — Compare & Award
MODEL_AWARD = ModelSpec(
    model_id="openai/gpt-oss-120b",
    display_name="GPT-OSS 120B (Award Engine)",
    capability="High-reasoning bid comparison, multi-factor scoring, verbal justification",
    max_tokens=8192,
    default_temperature=0.3,  # Lower temp for consistent award decisions
)

# Model 2: Deep Logic / Math — Price Forecasting
MODEL_FORECAST = ModelSpec(
    model_id="deepseek-r1-distill-llama-70b",
    display_name="DeepSeek-R1 70B (Forecasting)",
    capability="Material price trend analysis, lock rate calculation, hedging logic",
    max_tokens=8192,
    default_temperature=0.2,  # Very low temp for quantitative analysis
)

# Model 3: General Dialogue / Multilingual — Coordination
MODEL_COORDINATOR = ModelSpec(
    model_id="llama-3.3-70b-versatile",
    display_name="Llama 3.3 70B (Coordinator)",
    capability="Multilingual dialogue, regional nuance, post-award communication",
    max_tokens=4096,
    default_temperature=0.6,
)

# Model 4: Instant Speed — Magic Extractor
MODEL_EXTRACTOR = ModelSpec(
    model_id="openai/gpt-oss-20b",
    display_name="GPT-OSS 20B (Extractor)",
    capability="Unstructured-to-JSON extraction, KYC (GSTIN/PAN), WhatsApp screenshots",
    max_tokens=4096,
    default_temperature=0.1,  # Very low temp for accurate extraction
)

# Model 5: Voice-to-Text — ASR
MODEL_ASR = ModelSpec(
    model_id="whisper-large-v3",
    display_name="Whisper Large V3 (ASR)",
    capability="Voice-to-text transcription, construction vocabulary",
    is_audio_model=True,
    supports_streaming=False,
)

# General-purpose fallback
MODEL_GENERAL = ModelSpec(
    model_id="llama3-70b-8192",
    display_name="Llama 3 70B (General)",
    capability="General-purpose chat, RAG, summarization",
    max_tokens=8192,
    default_temperature=0.7,
)

# Small/fast general-purpose (secondary fallback)
MODEL_GENERAL_SMALL = ModelSpec(
    model_id="llama3-8b-8192",
    display_name="Llama 3 8B (Fast Fallback)",
    capability="Fast general-purpose inference, basic tasks",
    max_tokens=8192,
    default_temperature=0.7,
)


# =============================================================================
# Task → Model Mapping (with Fallback Chains)
# =============================================================================
# Roadmap Reliability Architecture:
#   Primary → Tier 1 Fallback (Llama 3.3 70B) → General Fallback (Llama 3 70B)
# =============================================================================

TASK_MODEL_MAP: dict[TaskType, TaskModelMapping] = {
    TaskType.AWARD: TaskModelMapping(
        task_type=TaskType.AWARD,
        primary=MODEL_AWARD,
        fallbacks=[MODEL_COORDINATOR, MODEL_GENERAL],
        system_prompt_template=(
            "You are a Senior Procurement Officer for BuildBidz, an Indian construction procurement platform. "
            "Your task is to evaluate bids not just on lowest price, but on the intersection of price, delivery speed, "
            "and supplier reputation. You MUST provide a clear verbal justification for your recommendation to build "
            "trust with family-owned firms. Be merit-based and transparent — never show favoritism."
        ),
    ),

    TaskType.FORECAST: TaskModelMapping(
        task_type=TaskType.FORECAST,
        primary=MODEL_FORECAST,
        fallbacks=[MODEL_GENERAL, MODEL_GENERAL_SMALL],
        system_prompt_template=(
            "You are a Quantitative Supply Chain Analyst for BuildBidz. "
            "Analyze price trends for construction materials (steel, cement, sand, tiles, fittings) "
            "in Indian Tier 2 cities. Protect the developer's target margin. "
            "Provide 'Lock Rate' recommendations and suggest whether to hedge now or wait based on "
            "seasonal demand and supply chain variables. Output precise numbers and percentages."
        ),
    ),

    TaskType.COORDINATION: TaskModelMapping(
        task_type=TaskType.COORDINATION,
        primary=MODEL_COORDINATOR,
        fallbacks=[MODEL_GENERAL, MODEL_GENERAL_SMALL],
        system_prompt_template=(
            "You are a Project Coordinator for BuildBidz, operating in Indian Tier 2 cities. "
            "Translate technical construction jargon into simplified steps that local contractors can follow. "
            "Handle regional nuances in dialogue. Ensure communication is professional and merit-based, "
            "free from favoritism typical of legacy agent networks. Support Hindi and regional languages."
        ),
    ),

    TaskType.EXTRACTION: TaskModelMapping(
        task_type=TaskType.EXTRACTION,
        primary=MODEL_EXTRACTOR,
        fallbacks=[MODEL_COORDINATOR, MODEL_GENERAL],
        system_prompt_template=(
            "You are the Magic Extractor Agent for BuildBidz. "
            "Extract structured data from unstructured sources: WhatsApp screenshots, handwritten invoices, "
            "physical receipts, and site notes. Output clean JSON with fields: item, qty, price, gstin, pan, "
            "verification_ready. Handle KYC verification by extracting GSTIN and PAN data. "
            "Output ONLY valid JSON — no explanations, no markdown."
        ),
    ),

    TaskType.ASR: TaskModelMapping(
        task_type=TaskType.ASR,
        primary=MODEL_ASR,
        fallbacks=[],  # ASR has no text-model fallback
    ),

    TaskType.GENERAL: TaskModelMapping(
        task_type=TaskType.GENERAL,
        primary=MODEL_GENERAL,
        fallbacks=[MODEL_COORDINATOR, MODEL_GENERAL_SMALL],
    ),

    TaskType.SUMMARIZATION: TaskModelMapping(
        task_type=TaskType.SUMMARIZATION,
        primary=MODEL_GENERAL,
        fallbacks=[MODEL_COORDINATOR, MODEL_GENERAL_SMALL],
    ),
}


def get_model_for_task(task_type: TaskType) -> TaskModelMapping:
    """Get the model mapping for a given task type."""
    mapping = TASK_MODEL_MAP.get(task_type)
    if not mapping:
        # Default to general if task type is unknown
        return TASK_MODEL_MAP[TaskType.GENERAL]
    return mapping


def get_all_model_ids() -> list[str]:
    """Get a list of all unique model IDs used across all task types."""
    ids = set()
    for mapping in TASK_MODEL_MAP.values():
        ids.add(mapping.primary.model_id)
        for fb in mapping.fallbacks:
            ids.add(fb.model_id)
    return sorted(ids)
