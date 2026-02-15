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
    assert isinstance(data, dict)


def test_award_compare_requires_auth():
    """POST /api/v1/awards/compare returns 401 without Authorization."""
    response = client.post(
        "/api/v1/awards/compare",
        json={
            "requirement_description": "Steel supply",
            "bids": [
                {"id": "1", "supplier_name": "A", "price": 100, "delivery_days": 10, "reputation_score": 8},
                {"id": "2", "supplier_name": "B", "price": 110, "delivery_days": 12, "reputation_score": 7},
            ],
        },
    )
    assert response.status_code == 401


def test_forecast_analyze_requires_auth():
    """POST /api/v1/forecast/analyze returns 401 without Authorization."""
    response = client.post(
        "/api/v1/forecast/analyze",
        json={"material": "steel", "region": "delhi_ncr", "quantity": 10},
    )
    assert response.status_code == 401


def test_extract_requires_auth():
    """POST /api/v1/extract/ returns 401 without Authorization."""
    response = client.post(
        "/api/v1/extract/",
        json={"ocr_text": "Invoice 123 Total 1000"},
    )
    assert response.status_code == 401


def test_coordination_send_requires_auth():
    """POST /api/v1/coordination/send returns 401 without Authorization."""
    response = client.post(
        "/api/v1/coordination/send",
        json={
            "contractor_name": "Test",
            "phone_number": "+919999999999",
            "language": "hinglish",
            "step": "award_notification",
            "project_name": "P1",
            "details": {},
        },
    )
    assert response.status_code == 401
