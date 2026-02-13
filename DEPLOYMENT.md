# BuildBidz Deployment Guide

This guide provides step-by-step instructions for deploying the BuildBidz platform, including the Next.js frontend, FastAPI backend, Firebase services, and background workers.

## 🏗️ Architecture Overview

- **Frontend**: Next.js (Web & Mobile/Tauri potential)
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (via Firebase Data Connect)
- **Knowledge Graph**: Neo4j
- **Cache**: Redis
- **Background Workers**: Celery + Redis
- **File Storage**: Cloudinary / Firebase Storage
- **Authentication**: Firebase Auth

## 🛠️ Prerequisites

Ensure you have the following installed on your local machine or build server:

- **Node.js**: v18.x or higher
- **Python**: v3.11 or higher
- **Firebase CLI**: `npm install -g firebase-tools`
- **Docker & Docker Compose**: For local infrastructure or containerized deployment
- **Git**

## 1. 🔥 Firebase Setup

### Initialize Firebase
1.  Login to Firebase: `firebase login`
2.  Set your active project: `firebase use your-project-id`

### Deploy Firebase Services
Deploy security rules and Data Connect configuration:
```bash
firebase deploy --only dataconnect,auth
```

> [!IMPORTANT]
> Ensure you have provisioned a Cloud SQL instance in the Firebase Console if you are using Data Connect in production.

## 2. 🔌 Environment Configuration

Copy `.env.example` to `.env` in the root directory and fill in the required values.

### Key Categories:
- **Firebase**: `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_SERVICE_ACCOUNT_PATH`
- **Database**: `DATABASE_URL` (Postgres)
- **Redis & Neo4j**: Connection URIs and credentials
- **Third-Party APIs**: WhatsApp, Cloudinary, OpenAI, Razorpay (refer to `.env.example`)

## 3. 🚀 Backend Deployment (FastAPI)

### Local Development / Manual Deployment
1.  Navigate to backend: `cd backend`
2.  Create virtual environment: `python -m venv venv`
3.  Activate venv: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4.  Install dependencies: `pip install -r requirements.txt`
5.  Run server: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Database Migrations
Use the BuildBidz CLI to push schema changes:
```bash
python -m scripts.cli db migrate
```

## 4. 🌐 Frontend Deployment (Next.js)

### Build and Export
1.  Navigate to frontend/web: `cd frontend/web`
2.  Install dependencies: `npm install`
3.  Build the application: `npm run build`
4.  Start production server: `npm run start`

> [!TIP]
> For production, consider deploying to **Vercel** or using a containerized approach with **Docker**.

## 5. ⚙️ Background Workers (Celery)

Background tasks (OCR, KG Sync, Invoicing) require a Celery worker.

### Run Worker
```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info
```

### Run Flower (Monitoring)
```bash
celery -A app.workers.celery_app flower --port=5555
```

## 6. 🩺 Post-Deployment Verification

Check the health of the system:
- **API Health**: `GET /health` -> `{"status": "healthy"}`
- **Ready Check**: `GET /ready` (Validates database connectivity)
- **CLI Status**: `python -m scripts.cli db status`

---
*For support or contributions, please refer to the internal documentation in `/docs`.*
