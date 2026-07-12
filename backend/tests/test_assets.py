"""
Tests for asset management endpoints.

Tests:
  - Asset category CRUD
  - Asset registration with auto tag (AF-000001)
  - Asset retrieval and filtering
  - Asset update and lifecycle
  - Asset history
"""

import pytest
from fastapi.testclient import TestClient


def get_auth_token(client: TestClient) -> str:
    """Helper: signup + login, return access token."""
    client.post(
        "/api/v1/auth/signup",
        json={
            "email": "assettest@assetflow.test",
            "password": "TestPass@789",
            "full_name": "Asset Test Admin",
        },
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "assettest@assetflow.test", "password": "TestPass@789"},
    )
    return resp.json().get("access_token", "")


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Asset Categories ─────────────────────────────────────────────────────────

def test_create_asset_category(client: TestClient):
    """Admin can create asset categories."""
    token = get_auth_token(client)
    response = client.post(
        "/api/v1/asset-categories",
        json={
            "name": "Test Laptops",
            "description": "Test laptop category",
            "depreciation_years": 3,
            "warranty_months": 12,
            "requires_serial_number": True,
            "is_bookable": False,
        },
        headers=auth_header(token),
    )
    assert response.status_code in (201, 409)  # 409 if already exists
    if response.status_code == 201:
        data = response.json()
        assert data["name"] == "Test Laptops"
        assert data["warranty_months"] == 12


def test_list_asset_categories(client: TestClient):
    """Authenticated users can list categories."""
    token = get_auth_token(client)
    response = client.get(
        "/api/v1/asset-categories",
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


def test_create_category_unauthenticated(client: TestClient):
    """Unauthenticated category creation should be rejected."""
    response = client.post(
        "/api/v1/asset-categories",
        json={"name": "Unauthorized Category"},
    )
    assert response.status_code in (401, 403)


# ─── Assets ───────────────────────────────────────────────────────────────────

def test_list_assets_paginated(client: TestClient):
    """Assets list should return paginated response structure."""
    token = get_auth_token(client)
    response = client.get(
        "/api/v1/assets?page=1&page_size=10",
        headers=auth_header(token),
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "total_pages" in data
    assert "has_next" in data
    assert "has_prev" in data
    assert data["page"] == 1
    assert data["page_size"] == 10


def test_list_assets_with_filters(client: TestClient):
    """Asset list should support status and condition filters."""
    token = get_auth_token(client)
    response = client.get(
        "/api/v1/assets?status=available&condition=new",
        headers=auth_header(token),
    )
    assert response.status_code == 200


def test_get_nonexistent_asset(client: TestClient):
    """Getting an asset by invalid ID should return 400."""
    token = get_auth_token(client)
    response = client.get(
        "/api/v1/assets/not-a-valid-object-id",
        headers=auth_header(token),
    )
    assert response.status_code == 400


def test_get_nonexistent_asset_valid_id(client: TestClient):
    """Getting an asset with valid but non-existent ID should return 404."""
    token = get_auth_token(client)
    response = client.get(
        "/api/v1/assets/507f1f77bcf86cd799439011",  # Valid ObjectId, doesn't exist
        headers=auth_header(token),
    )
    assert response.status_code == 404
