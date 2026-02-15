# BuildBidz - India-First Construction Platform

An end-to-end construction platform for the Indian market featuring bidding, procurement, drawings, RFIs, field management, financials, embedded-finance, AI copilot, knowledge graph, offline mobile sync, WhatsApp ingestion, OCR/ASR, RAG, and vector search.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BUILDBIDZ PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  INGESTION: WhatsApp · Mobile · Web · Email · API                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  API LAYER: Firebase Data Connect (GQL) │ FastAPI (Python)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  AUTH & STORAGE: Firebase Auth │ Firebase Storage                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  DATA: Cloud SQL (Postgres+pgvector) │ Redis │ Neo4j                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  CLIENTS: Next.js Web │ React Native Mobile (Offline-first)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  INTEGRATIONS: WhatsApp · Tally · Zoho · UPI · NBFCs                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development

1. **Clone & Setup**:
   ```bash
   git clone https://github.com/buildbidz/buildbidz.git
   cd buildbidz
   cp .env.example .env
   ```

2. **Infrastructure**:
   ```bash
   # Start local services (Redis, Neo4j)
   docker-compose up -d
   ```

3. **Database**:
   ```bash
   # Push schema via Firebase Data Connect
   firebase dataconnect:sql:push
   ```

4. **Frontends**:
   ```bash
   # Web Admin
   cd frontend/web && npm install && npm run dev
   
   # Mobile App
   cd frontend/mobile && npm install && npx expo start
   ```

5. **Python Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m app.main
   ```

### AI Integration (Groq)

BuildBidz uses Groq for high-speed LLM inference. To configure:
1. Add `GROQ_API_KEY` to your `.env` file.
2. (Optional) Set `GROQ_MODEL` (default: `llama3-70b-8192`).

Test the integration:
```bash
cd backend
python -m scripts.cli ai groq-test --prompt "How can AI help Indian construction projects?"
```
(If your CLI lives under `backend/scripts/`, run from repo root: `cd backend && python -m scripts.cli ...`.)

## 📁 Project Structure

```
buildbidz/
├── dataconnect/       # Firebase Data Connect (SQL Schema & GQL)
├── backend/           # FastAPI Backend & ML Workers
│   ├── app/
│   │   ├── api/       # API Routes
│   │   ├── services/  # Domain Logic (Finance, AI, Integrations)
│   │   └── workers/   # Celery Workers (OCR, ASR, Sync)
├── frontend/
│   ├── web/           # Next.js Admin Dashboard
│   └── mobile/        # React Native Field App
├── infra/             # Kubernetes & Deployment Configs
├── docs/              # Detailed Technical Documentation
└── scripts/           # Maintenance & CLI Scripts
```

## 📚 Documentation

- [System Architecture](./docs/ARCHITECTURE.md)
- [Developer Onboarding](./docs/developer/onboarding.md)
- [Firebase Migration Guide](./docs/MIGRATION.md)

## 🔒 Security

- Row Level Security (RLS) via Data Connect
- Firebase Auth (MFA, SSO)
- End-to-end Audit Logging
- SOC2/ISO 27001 aligned
