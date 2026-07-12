"""Tests for notifications, dashboard, and search endpoints."""

import pytest
from fastapi.testclient import TestClient


def get_auth_token(client: TestClient) -> str:
    """Helper: signup + login, return access token."""
    client.post(
        "/api/v1/auth/signup",
        json={
            "email": "notiftest@assetflow.test",
            "password": "TestPass@999",
            "full_name": "Notif Test User",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "notiftest@assetflow.test", "password": "TestPass@999"},
    )
    return resp.json().get("access_token", "")


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Dashboard ────────────────────────────────────────────────────────────────

def test_dashboard_structure(client: TestClient):
    """Dashboard should return KPIs, charts, and activity data."""
    token = get_auth_token(client)
    response = client.get("/api/v1/dashboard", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "charts" in data
    assert "recent_activities" in data
    assert "upcoming_maintenance" in data
    assert "overdue_allocations" in data

    kpis = data["kpis"]
    assert "total_assets" in kpis
    assert "assets_available" in kpis
    assert "assets_allocated" in kpis
    assert "unread_notifications" in kpis


def test_dashboard_unauthenticated(client: TestClient):
    """Dashboard should reject unauthenticated access."""
    response = client.get("/api/v1/dashboard")
    assert response.status_code in (401, 403)


# ─── Notifications ────────────────────────────────────────────────────────────

def test_notifications_list(client: TestClient):
    """User can list their notifications."""
    token = get_auth_token(client)
    response = client.get("/api/v1/notifications", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_notifications_unread_count(client: TestClient):
    """Unread count endpoint should return numeric count."""
    token = get_auth_token(client)
    response = client.get("/api/v1/notifications/unread-count", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert isinstance(data["count"], int)
    assert data["count"] >= 0


def test_notifications_mark_all_read(client: TestClient):
    """Mark all read should return success message."""
    token = get_auth_token(client)
    response = client.post("/api/v1/notifications/read-all", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


# ─── Search ───────────────────────────────────────────────────────────────────

def test_global_search_valid(client: TestClient):
    """Global search with 2+ char query should return results dict."""
    token = get_auth_token(client)
    response = client.get("/api/v1/search?q=test", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "total" in data
    assert "query" in data
    assert data["query"] == "test"


def test_global_search_too_short(client: TestClient):
    """Single character query should return 422."""
    token = get_auth_token(client)
    response = client.get("/api/v1/search?q=a", headers=auth_header(token))
    assert response.status_code == 422


def test_module_search_assets(client: TestClient):
    """Module-specific asset search should return paginated response."""
    token = get_auth_token(client)
    response = client.get("/api/v1/search/assets?q=laptop", headers=auth_header(token))
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_module_search_invalid_module(client: TestClient):
    """Invalid module name should return 400."""
    token = get_auth_token(client)
    response = client.get("/api/v1/search/invalidmodule?q=test", headers=auth_header(token))
    assert response.status_code == 400


# ─── Reports ─────────────────────────────────────────────────────────────────

def test_reports_booking_heatmap(client: TestClient):
    """Booking heatmap should return list of heatmap items."""
    token = get_auth_token(client)
    response = client.get("/api/v1/reports/booking-heatmap", headers=auth_header(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)
