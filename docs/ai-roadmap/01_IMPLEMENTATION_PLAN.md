# BuildBidz AI Roadmap — Implementation Plan

> **Source:** [00_ROADMAP_ANALYSIS.md](./00_ROADMAP_ANALYSIS.md)
> **Progress:** [02_PROGRESS_LOG.md](./02_PROGRESS_LOG.md)
> **Created:** 2026-02-14

---

## Overview

This document maps the 5-model AI architecture from the Strategic Roadmap to concrete backend services, API endpoints, and frontend components within the BuildBidz codebase.

---

## Phase Breakdown

### Phase 1: Model Router & Reliability Layer (Foundation)
**Priority: CRITICAL — Must be done first**

All other phases depend on this. Creates the orchestration layer that routes AI requests to the correct model and handles failover.

**New Files:**
- `backend/app/core/model_router.py` — Task-to-model mapping, circuit breaker, failover chain
- `backend/app/core/model_config.py` — Model registry with IDs, capabilities, fallback order

**Modified Files:**
- `backend/app/core/ai_rotator.py` — Extend for per-model key pools
- `.env.example` — Add multi-model configuration

**Architecture:**
```
Request → ModelRouter → Primary Model (e.g., GPT-OSS 120B)
                            │
                            ├── Success → Return response
                            │
                            ├── Latency > 5s → Tier 1 Fallback (Llama 3.3 70B)
                            │
                            └── Rate Limited → Next key (via AIKeyRotator)
                                    │
                                    └── All keys exhausted → Tier 1 Fallback
```

---

### Phase 2: Compare & Award Engine
**Depends on: Phase 1**

**New Files:**
- `backend/app/services/award_engine.py` — Multi-factor scoring, justification generation
- `backend/app/api/award_routes.py` — REST endpoints
- `backend/app/prompts/award_prompts.py` — System prompt templates

**Scoring Formula:**
```
Score = (W_price × PriceScore) + (W_delivery × DeliveryScore) + (W_reputation × ReputationScore)
```
Where weights are configurable per project type.

---

### Phase 3: Price Forecasting Engine  
**Depends on: Phase 1**

**New Files:**
- `backend/app/services/price_forecast.py` — Trend analysis, lock rate logic
- `backend/app/api/forecast_routes.py` — REST endpoints
- `backend/app/prompts/forecast_prompts.py` — System prompt templates

**Materials Covered:** Steel, Cement, Sand, Tiles, Fittings
**Regions:** Patna, Lucknow, Indore (expandable)

---

### Phase 4: Multilingual Coordination Agent
**Depends on: Phase 1**

**New Files:**
- `backend/app/services/coordination_agent.py` — Translation, communication templates
- `backend/app/prompts/coordination_prompts.py` — Multilingual templates

---

### Phase 5: Enhanced Magic Extractor
**Depends on: Phase 1**

**Modified Files:**
- `backend/app/workers/ocr_worker.py` — Add structured JSON output, KYC extraction

**New Output Format:**
```json
{
  "item": "string",
  "qty": "number",
  "price": "number",
  "gstin": "string",
  "pan": "string",
  "verification_ready": true
}
```

---

### Phase 6: Enhanced ASR (Field Voice)
**Depends on: Phase 1**

**Modified Files:**
- `backend/app/workers/asr_worker.py` — Construction vocabulary, field log mode

---

### Phase 7: Frontend Integration
**Depends on: Phases 2–6**

**Modified/New Files in `frontend/web/`:**
- Procurement dashboard with AI-powered comparison
- Price forecasting charts
- Award justification display

---

## Dependency Graph

```
Phase 1 (Router/Reliability) ──┬──→ Phase 2 (Award Engine)
                                ├──→ Phase 3 (Forecasting)
                                ├──→ Phase 4 (Coordination)
                                ├──→ Phase 5 (Extractor)
                                └──→ Phase 6 (ASR)
                                          │
                                          ↓
                                Phase 7 (Frontend)
                                          │
                                          ↓
                                Phase 8 (Testing/Launch)
```

---

## Environment Configuration (New Keys)

```env
# Multi-Model Configuration
GROQ_MODEL_AWARD=gpt-oss-120b          # Compare & Award
GROQ_MODEL_FORECAST=deepseek-r1-70b    # Price Forecasting
GROQ_MODEL_COORDINATOR=llama-3.3-70b   # Multilingual Coordination
GROQ_MODEL_EXTRACTOR=gpt-oss-20b       # Magic Extractor
GROQ_MODEL_ASR=whisper-large-v3        # Voice-to-Text

# Circuit Breaker
CIRCUIT_BREAKER_LATENCY_THRESHOLD_MS=5000
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_RECOVERY_TIMEOUT_S=60

# Fallback Chain
FALLBACK_TIER1_MODEL=llama-3.3-70b-versatile
FALLBACK_LOCAL_MODEL=mistral-7b
```

---

### Phase 8: Testing & Launch
**Depends on: Phases 1–7**

- **Verification scripts (repo root):** `verify_router.py`, `verify_award.py`, `verify_forecast.py`, `verify_coordination.py`, `verify_extraction.py`, `verify_asr.py`, `verify_performance.py` — run against backend to validate routing, scoring, and latency.
- **Automated tests:** Add `backend/tests/test_ai_endpoints.py` (or similar) for API smoke tests (e.g. `GET /api/v1/ai/health`). E2E and load tests vs 5s SLA as needed.
- **Launch:** Docs and env vars in README; monitor circuit breaker and model health in production.

---

### Future: On-Device Fallback
**Deferred per roadmap.** When connectivity drops (e.g. basement site), the mobile app may use a local model (Mistral-7B / OpenHermes) and queue data until sync. Document in architecture when prioritised.
