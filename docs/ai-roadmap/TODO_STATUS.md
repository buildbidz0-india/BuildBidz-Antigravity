# BuildBidz AI Roadmap — Status & To-Do List

> **Purpose:** Single source of truth for what is done vs. remaining from the [Strategic AI Integration Roadmap](00_ROADMAP_ANALYSIS.md) and [Implementation Plan](01_IMPLEMENTATION_PLAN.md).  
> **Last updated:** 2026-02-15  
> **Safe file:** Version-controlled in `docs/ai-roadmap/` — use this for handoffs and sprint planning.

---

## Summary at a Glance

| Area | Done | Remaining |
|------|------|-----------|
| **Backend: 5-model foundation** | ✅ Phases 1–6 | Phase 8 (testing/launch) |
| **Backend: APIs** | ✅ Award, Forecast, Coordination, Extract, Transcribe, AI health | — |
| **Frontend: AI UI** | ✅ Charts wired to APIs, Copilot + quick actions, justification UI | — |
| **Frontend: Full flows** | ✅ Compare page, Coordination modal, Extract page, Voice page | — |
| **Reliability** | ✅ Router + circuit breaker | On-device fallback (deferred) |

**Overall:** Backend and frontend AI roadmap tasks are implemented. Remaining: Phase 8 (E2E tests, load tests), on-device fallback (deferred).

---

## ✅ DONE (Verified in Codebase)

### Phase 1: Model Router & Reliability Layer
- [x] `backend/app/core/model_config.py` — Task types, model registry, fallback chains
- [x] `backend/app/core/model_router.py` — Circuit breaker (5s latency, failover)
- [x] `backend/app/services/ai.py` — Router integration, `task_chat()`, task-specific methods
- [x] `backend/app/config.py` — Multi-model and circuit-breaker settings
- [x] `backend/app/api/v1/endpoints/ai.py` — AI health check endpoint

### Phase 2: Compare & Award Engine
- [x] `backend/app/services/award_engine.py` — Weighted scoring, AI justification (GPT-OSS 120B)
- [x] `backend/app/api/v1/endpoints/award.py` — `/awards/compare`, `/awards/score-only`
- [x] Router registration in `backend/app/api/v1/router.py`

### Phase 3: Price Forecasting Engine
- [x] `backend/app/services/price_forecast.py` — Trend analysis, lock-rate logic (mock data)
- [x] `backend/app/api/v1/endpoints/forecast.py` — `/forecast/analyze`
- [x] Router registration

### Phase 4: Multilingual Coordination Agent
- [x] `backend/app/services/coordination_agent.py` — Hindi/Hinglish/English templates
- [x] `backend/app/api/v1/endpoints/coordination.py` — `/coordination/send`
- [x] Router registration

### Phase 5: Magic Extractor (Unstructured → JSON)
- [x] `backend/app/services/extraction_agent.py` — Structured output, GSTIN/PAN, `verification_ready`
- [x] `backend/app/workers/magic_extractor.py` — Celery task (OCR → extraction)

### Phase 6: Enhanced ASR (Field Voice)
- [x] `backend/app/workers/asr_worker.py` — Construction vocabulary prompt (Whisper)

### Phase 7: Dashboard & Copilot UI (Partial)
- [x] `frontend/web/components/dashboard/BidScoringChart.tsx` — Bar chart (mock data)
- [x] `frontend/web/components/dashboard/PriceTrendChart.tsx` — Trend chart (mock data)
- [x] `frontend/web/app/dashboard/page.tsx` — AI Insights section, Copilot card
- [x] `frontend/web/components/AIChat.tsx` — Uses `aiApi.ragChat()` (generic RAG), not award/forecast/coordination

---

## ✅ COMPLETED (2026-02-15)
- Items 1–10 from the list below are implemented (APIs wired, Compare/Extract/Voice pages, Coordination modal, Copilot quick actions, README).

## 🔲 REMAINING — To-Do List (all items above done; optional follow-ups)

### High priority (frontend: wire AI backend to UI)

1. **Wire Bid Scoring to Award API**
   - [ ] In `frontend/web/lib/api.ts`: add `awardsApi.compare(bids, options?)` calling `POST /api/v1/awards/compare`.
   - [ ] In `BidScoringChart.tsx` (or a parent): fetch or accept bid list, call compare API, display real scores and justification.
   - [ ] Optionally: dedicated “Compare Bids” page/modal that shows justification text from the Award engine.

2. **Wire Price Trends to Forecast API**
   - [ ] In `frontend/web/lib/api.ts`: add `forecastApi.analyze(material?, region?)` calling `POST /api/v1/forecast/analyze` (or existing endpoint).
   - [ ] In `PriceTrendChart.tsx`: replace mock data with data from forecast API; show lock-rate recommendation (LOCK/WAIT) in UI.

3. **Award justification in UI**
   - [ ] Add a component or section that displays the AI-generated “verbal justification” from the Award engine (e.g. in project detail or bids list).
   - [ ] Link “Analyze Market” / “Ask Copilot” flows to award or forecast where relevant (e.g. “Compare these bids” → award API).

### Medium priority (new flows & polish)

4. **Real-time Market Comparison page**
   - [ ] Full-page or major section: “Market Comparison” that lets user submit/select bids and see side-by-side comparison + award recommendation + justification (per progress log).

5. **Copilot: route to correct AI**
   - [ ] Extend AIChat (or backend RAG) so that intent like “compare these bids” or “forecast steel price” routes to Award or Forecast APIs and shows structured results (e.g. table + justification, or chart + lock recommendation).

6. **Coordination agent in UI**
   - [ ] Add a flow (e.g. from project or contractor view) to “Send notification” that calls `POST /coordination/send` and shows the generated Hindi/Hinglish/English message (copy or send via WhatsApp).

### Lower priority / later

7. **Phase 8: Testing & launch**
   - [ ] E2E tests for Award, Forecast, Coordination, Extraction flows.
   - [ ] Load/latency tests against 5s SLA (reuse or extend `verify_performance.py`).
   - [ ] Docs: update README or developer docs with new env vars and API usage.

8. **Magic Extractor in UI**
   - [ ] Upload receipt/screenshot → trigger OCR + Magic Extractor worker → show structured JSON (item, qty, price, GSTIN, verification_ready) in a table or form.

9. **Voice input (Field Voice)**
   - [ ] Web or mobile: record audio → send to ASR (Whisper) → show transcript and optionally attach to project/RFI (per roadmap).

10. **On-device fallback**
    - [ ] Deferred per roadmap: Mistral-7B (or similar) on-device when offline. Document as future phase.

---

## Dependency Order (Suggested)

```
1–3 (wire Award + Forecast + justification)  →  enables “AI-powered” dashboard and comparison
4–5 (comparison page + Copilot routing)      →  full roadmap “real-time market comparison”
6 (Coordination UI)                           →  standalone value, no blocker
7 (Testing/launch)                            →  after 1–5
8–10 (Extractor UI, Voice, On-device)        →  as capacity allows
```

---

## File Reference

| Doc | Description |
|-----|-------------|
| `00_ROADMAP_ANALYSIS.md` | Full roadmap analysis, 5 models, gap analysis |
| `01_IMPLEMENTATION_PLAN.md` | Phased implementation plan (Phases 1–8) |
| `02_PROGRESS_LOG.md` | Session-by-session progress log |
| **`03_TODO_STATUS.md`** | **This file — done vs remaining, to-do list** |

---

*When resuming work: read this file and `02_PROGRESS_LOG.md` to see current status and next tasks.*
