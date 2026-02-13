# BuildBidz - Developer Onboarding Guide

Welcome to BuildBidz! This guide will help you set up your development environment and understand the codebase.

## Prerequisites

- **Node.js** 20+ (for Edge Functions and frontend)
- **Python** 3.11+ (for backend and ML)
- **Docker** & Docker Compose (for local services)
- **Git** (for version control)

### Optional
- **VS Code** with extensions: Python, ESLint, Prettier, PostgreSQL
- **pgAdmin** or **DBeaver** for database management
- **Postman** or **Insomnia** for API testing

## Quick Start

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/buildbidz/buildbidz.git
cd buildbidz

# Copy environment file
cp .env.example .env

# Start all services
make dev
```

### 2. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:3000 | admin/admin |
| API Docs | http://localhost:8000/docs | - |
| Data Connect (SQL) | Cloud SQL (Postgres) | See .env |
| Grafana | http://localhost:3001 | admin/admin |
| Neo4j Browser | http://localhost:7474 | neo4j/password |
| Firebase Console | https://console.firebase.google.com | - |

### 3. Run Tests

```bash
# Python tests
make test-python

# Frontend tests
make test-frontend

# All tests
make test
```

## Project Structure

```
buildbidz/
├── dataconnect/            # Firebase Data Connect config
│   ├── schema/             # GraphQL schema for Postgres
│   └── connector/          # Connectors and queries
│
├── python_backend/         # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── workers/        # Celery background tasks
│   │   ├── neo4j/          # Graph database client
│   │   └── schemas/        # Pydantic models
│   └── tests/              # Test files
│
├── frontend/
│   ├── web/                # Next.js web app
│   └── mobile/             # React Native app
│
├── infra/                  # Infrastructure as Code
│   └── terraform/          # AWS Terraform configs
│
├── docs/                   # Documentation
└── .github/                # CI/CD workflows
```

## Key Concepts

### 1. Multi-Tenancy

All data is scoped to organizations:
- Every table has `org_id` column
- RLS policies enforce isolation
- Use `X-Org-Id` header in API requests

### 2. India-First Features

- **GST/TDS**: All invoice amounts in paise (₹1 = 100 paise)
- **GSTIN/PAN**: Validated with regex patterns
- **Languages**: Hindi, English, Hinglish supported
- **Timezones**: IST (Asia/Kolkata) is default

### 3. Offline-First Mobile

- WatermelonDB for local storage
- Sync service pushes/pulls changes
- Conflict resolution: server wins (except dirty records)

### 4. AI/ML Pipeline

```
Document → OCR → Text → Embeddings → Vector DB
                    ↓
              Magic Extractor → Entities → Knowledge Graph
```

## Development Workflows

### Adding a New API Endpoint

1. Create/update schema in `app/schemas/`
2. Add endpoint in `app/api/v1/`
3. Register in `app/api/v1/router.py`
4. Add tests in `tests/`
5. Update API docs

### Adding a Database Table

1. Update schema in `dataconnect/schema/schema.gql`
2. Run `firebase dataconnect:sql:push`
3. Update Python models if needed

### Adding a Background Task

1. Create worker in `app/workers/`
2. Register in `celery_app.py`
3. Call via `celery_app.send_task()`

### Adding a Frontend Page

1. Create page in `app/(dashboard)/`
2. Add API hooks in `lib/hooks/`
3. Update navigation in layout

## Environment Variables

Key variables to configure:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=buildbidz-d56f2
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
FIREBASE_SERVICE_ACCOUNT_PATH=firebase-service-account.json

# AI Services (get your own keys)
OPENAI_API_KEY=sk-...
AZURE_VISION_ENDPOINT=https://...
SARVAM_API_KEY=...

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Feature Flags
ENABLE_EMBEDDED_FINANCE=false
ENABLE_WHATSAPP=false
```

## Debugging

### Python Backend
```bash
# Run with debugger
cd python_backend
uvicorn app.main:app --reload --port 8000
```

### Celery Workers
```bash
# Watch worker logs
docker-compose logs -f celery-worker
```

### Database Queries
```bash
# Connect to Postgres
docker-compose exec postgres psql -U postgres -d postgres
```

## Code Style

- **Python**: Ruff + Black (run `make lint`)
- **TypeScript**: ESLint + Prettier
- **SQL**: Lowercase keywords, snake_case names

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes
3. Run tests: `make test`
4. Commit: `git commit -m "feat: add feature"`
5. Push: `git push origin feature/my-feature`
6. Create PR

Commit message format: `type: description`
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactor
- `test`: Tests

## Getting Help

- **Slack**: #buildbidz-dev
- **Wiki**: https://wiki.buildbidz.com
- **Issues**: GitHub Issues

## Common Issues

### "Permission denied" on Docker
```bash
sudo chmod 666 /var/run/docker.sock
```

### "Port already in use"
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>
```

### "Migration failed"
```bash
# Reset and rerun migrations
make db-reset
make db-migrate
```

### "Neo4j connection refused"
Wait for Neo4j to fully start (check with `docker-compose logs neo4j`)
