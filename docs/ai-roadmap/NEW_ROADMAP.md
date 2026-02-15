# BuildBidz AI — New Roadmap (Post-Core Implementation)

> **Date:** 2026-02-15  
> **Status:** Core roadmap (5 models) **95% complete**. This roadmap covers Phase 9+ (production hardening, mobile, advanced features).  
> **See:** [04_COMPLETION_ANALYSIS.md](./04_COMPLETION_ANALYSIS.md) for detailed completion analysis.

---

## Quick Status

| Area | Status |
|------|--------|
| **5-Model Backend** | ✅ 100% Complete |
| **Frontend UI** | ✅ 100% Complete |
| **Production Ready** | ⚠️ 75% (needs real data, tests, mobile) |
| **Mobile Integration** | ❌ 0% |

---

## Phase 9: Production Hardening (Weeks 1–4)

### Week 1–2: Real Data Integration
- [ ] **Indian Price API** — Replace mock data in Forecast with real prices (SteelMint/CMA)
- [ ] **Bids Backend API** — CRUD for tenders/bids (`/api/v1/bids`), wire Bids page

### Week 3: Testing
- [ ] **E2E Tests** — Award, Forecast, Coordination, Extract flows
- [ ] **Load Tests** — Verify < 5s SLA, circuit breaker under load

### Week 4: Monitoring
- [ ] **Metrics Dashboard** — Model usage, latency, circuit breaker state
- [ ] **Alerting** — Alerts for circuit breaker opens, latency spikes

**Deliverable:** Production-ready AI features with real data and monitoring.

---

## Phase 10: Advanced Features (Weeks 5–7)

- [ ] **Image Upload → OCR → Extract** — `POST /extract/upload` for invoice images
- [ ] **Smart Copilot Routing** — Intent detection → route to Award/Forecast APIs
- [ ] **Multi-Material Comparison** — Compare steel vs cement trends
- [ ] **Batch Processing** — Process multiple invoices/extractions

**Deliverable:** Enhanced UX and efficiency.

---

## Phase 11: Mobile Integration (Weeks 8–10)

- [ ] **Voice Recording** — Port to React Native, attach to RFI/project
- [ ] **Camera Capture → Extract** — Mobile invoice capture → GSTIN extraction
- [ ] **Coordination (Mobile)** — Generate → send via WhatsApp Business API
- [ ] **Offline-First** — On-device fallback (Mistral-7B) for offline sites

**Deliverable:** Full mobile AI capabilities.

---

## Phase 12: Scale & Optimization (Future)

- [ ] **Caching** — Redis cache for forecasts/awards
- [ ] **Multi-Language** — Tamil, Telugu, Marathi support
- [ ] **Custom Fine-Tuning** — Domain-specific model training

---

## Priority Matrix

| Phase | Priority | Impact | Effort | Timeline |
|-------|----------|--------|--------|----------|
| **9.1 Real Data** | 🔴 HIGH | High | Medium | 2 weeks |
| **9.2 Testing** | 🔴 HIGH | High | Low | 1 week |
| **9.3 Monitoring** | 🟡 MEDIUM | Medium | Low | 1 week |
| **10 Advanced** | 🟡 MEDIUM | Medium | Medium | 2–3 weeks |
| **11 Mobile** | 🔴 HIGH | High | High | 3 weeks |
| **12 Scale** | 🟢 LOW | Low | High | Future |

---

## Success Metrics

- **Phase 9:** Forecast accuracy improves with real data; E2E tests pass; monitoring shows < 5s latency
- **Phase 11:** Mobile users can record voice, capture invoices, send notifications offline

---

*For detailed analysis, see [04_COMPLETION_ANALYSIS.md](./04_COMPLETION_ANALYSIS.md).*
