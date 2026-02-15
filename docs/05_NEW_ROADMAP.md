# BuildBidz AI Roadmap — Phase 9+ (Post-Core)

> **Status:** Draft
> **Source:** `docs/04_COMPLETION_ANALYSIS.md`

---

## Phase 9: Production Hardening (Priority: HIGH)

**Goal:** Transform the functional MVP into a robust, specialized platform with real Indian market data.

### 9.1: Real Data Integration
- [ ] **Indian Price API Integration**
  - **Task:** Replace mock sine-wave data with real feeds.
  - **Action:** Integrate SteelMint, CMA, or custom scraper for daily rates.
  - **Tech:** Python `requests`, Redis Custom Caching (TTL 1 day).
  - **Files:** `backend/app/services/price_data_source.py`, `backend/app/services/price_forecast.py`

- [ ] **Bids/Tenders Backend API**
  - **Task:** Enable CRUD for Tenders so "Bids" page isn't static.
  - **Action:** Create `tenders` table and endpoints.
  - **Tech:** SQLAlchemy, Pydantic.
  - **Files:** `backend/app/api/v1/endpoints/bids.py`

### 9.2: Comprehensive Testing
- [ ] **E2E Tests**
  - **Task:** Verify the "Golden Paths".
  - **Scopes:** 
    1. Create Bid -> Compare -> Award (Verify JSON output).
    2. Upload Text -> Extract -> Verify GSTIN.
  - **Tech:** `pytest`, `httpx`.

- [ ] **Load Tests**
  - **Task:** Ensure < 5s latency under concurrency.
  - **Action:** Automate `verify_performance.py` in CI.

### 9.3: Monitoring & Observability
- [ ] **AI Metrics Dashboard**
  - **Task:** Visualize token usage and costs.
  - **Metrics:** `cost_per_award`, `latency_p95`.

---

## Phase 10: Advanced Features (Priority: MEDIUM)

### 10.1: Enhanced Magic Extractor
- [ ] **Image Upload → OCR → Extract**
  - **Task:** Allow photo uploads of crumpled receipts.
  - **Tech:** Google Cloud Vision API or Tesseract (Sidecar).
  - **Endpoint:** `POST /extract/upload`

### 10.2: Copilot Intelligence
- [ ] **Intent Routing**
  - **Task:** "Show me steel prices" -> Auto-opens Forecast Chart.
  - **Tech:** Intent classifier (DistilBERT or GPT-4o-mini).

---

## Phase 11: Mobile Integration (Priority: HIGH)

**Goal:** Bring AI features to the React Native app for field staff.

### 11.1: Mobile Voice
- [ ] **Voice Recording**
  - **Task:** "Record Site Log" button.
  - **Tech:** `expo-av` -> `POST /transcribe`.

### 11.2: Mobile Extractor
- [ ] **Camera Scan**
  - **Task:** "Scan Invoice" button.
  - **Tech:** `expo-camera` -> Upload -> Backend OCR.

### 11.3: Mobile Coordination
- [ ] **WhatsApp Integration**
  - **Task:** "Send to Contractor" deep link.
  - **Tech:** `Linking.openURL('whatsapp://send?text=...')`.

---

## Phase 12: Scale & Optimization (Priority: LOW)

- [ ] **Fine-Tuning:** Train Llama 3 on strict Indian Construction Code (IS 456).
- [ ] **Regional Languages:** Add Tamil, Telugu, Bengali support.
