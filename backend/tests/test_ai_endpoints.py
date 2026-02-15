"""
Phase 8: Smoke tests for AI endpoints.
Run with: pytest backend/tests/test_ai_endpoints.py -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ai_health():
    """GET /api/v1/ai/health returns 200 and router/health info."""
    response = client.get("/api/v1/ai/health")
    assert response.status_code == 200
    data = response.json()
    # get_health() returns dict with circuit breaker / model state
    assert isinstance(data, dict)
