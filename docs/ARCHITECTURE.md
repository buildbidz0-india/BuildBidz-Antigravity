# BuildBidz - System Architecture

This document provides a technical overview of the BuildBidz platform architecture after the migration to Firebase.

## 1. High-Level Architecture

BuildBidz uses a hybrid architecture combining GraphQL (via Firebase Data Connect) for core CRUD operations and a Python/FastAPI backend for compute-intensive tasks (AI/ML, complex integrations).

### Component Stack
- **Web**: Next.js (Admin Dashboard)
- **Mobile**: React Native / Expo (Field App)
- **API (Data)**: Firebase Data Connect (managed GraphQL over PostgreSQL)
- **API (Logic)**: FastAPI (ML, Workers, Integrations)
- **Database**: Google Cloud SQL (PostgreSQL + pgvector)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Cache**: Redis
- **Graph**: Neo4j (Knowledge Graph)

## 2. Data Flow

### Client -> Database
Most client requests go directly to **Firebase Data Connect**.
1. Client sends a GraphQL mutation/query.
2. Data Connect validates the request using security rules.
3. Data Connect executes the SQL directly on **Cloud SQL**.

### Client -> Backend -> Database
Operations involving AI or external integrations go through the **Python Backend**.
1. Client verifies their Firebase ID Token.
2. Client calls a FastAPI endpoint with the token in the `Authorization` header.
3. Backend verifies the token via `firebase-admin`.
4. Backend processes the request (e.g., OCR an image from Storage).
5. Backend updates the database using `asyncpg`.

## 3. Worker Architecture (ML Pipeline)

Computationally heavy tasks are handled by **Celery Workers**.

1. **Trigger**: A file is uploaded to Firebase Storage.
2. **Event**: A Firestore/Storage trigger (or a direct API call) kicks off a task.
3. **Queue**: Task is added to a Redis-backed Celery queue.
4. **Processing**:
   - **OCR Worker**: Downloads from Storage, runs Tesseract/OpenAI Vision.
   - **ASR Worker**: Processes audio files using Whisper.
   - **Sync Worker**: Syncs project data to external systems (Tally, Zoho).
5. **Result**: Findings are written back to Postgres/Neo4j.

## 4. Multi-tenancy (RLS)

BuildBidz handles multi-tenant isolation using PostgreSQL **Row Level Security (RLS)**.
- Every table has an `org_id` column.
- The `python_backend` uses a session-level variable `app.current_org_id` to enforce scoping.
- Data Connect handles scoping through its `@auth` directives in the schema.

## 5. Integrations

- **WhatsApp**: Webhook receiver in FastAPI -> Celery task -> Data Connect.
- **Tally/Zoho**: Background sync workers using domain-specific services.
- **Payments**: Frontend SDK (Razorpay) -> Backend verification -> Webhook.
