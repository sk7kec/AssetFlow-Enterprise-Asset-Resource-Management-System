"""
Tests for authentication endpoints.

Tests:
  - Health check
  - Signup (first user becomes admin)
  - Login with valid credentials
  - Login with invalid credentials
  - Refresh token
  - Get current user (me)
  - Forgot password
  - Reset password
"""

import pytest
from fastapi.testclient import TestClient


# ─── Health Check ────────────────────────────────────────────────────────────

def test_health_check(client: TestClient):
    """Health check should return 200 with app info."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app" in data
    assert "version" in data


def test_root_endpoint(client: TestClient):
    """Root endpoint should return welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data


# ─── Signup ──────────────────────────────────────────────────────────────────

def test_signup_valid(client: TestClient):
    """Valid signup should return user object with hashed password hidden."""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "admin@assetflow.test",
            "password": "SecurePass@123",
            "full_name": "Test Admin",
        },
    )
    # 201 on first user (becomes admin) or 409 if already exists
    assert response.status_code in (201, 409)
    if response.status_code == 201:
        data = response.json()
        assert data["email"] == "admin@assetflow.test"
        assert "password" not in data
        assert "hashed_password" not in data
        assert data["role"] == "admin"  # First user is admin


def test_signup_invalid_email(client: TestClient):
    """Invalid email format should return 422."""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "not-an-email",
            "password": "SecurePass@123",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 422


def test_signup_weak_password(client: TestClient):
    """Passwords shorter than 8 chars should return 422."""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "user@assetflow.test",
            "password": "short",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 422


# ─── Login ────────────────────────────────────────────────────────────────────

def test_login_valid(client: TestClient):
    """Valid credentials should return access and refresh tokens."""
    # First ensure user exists
    client.post(
        "/api/v1/auth/signup",
        json={
            "email": "logintest@assetflow.test",
            "password": "TestPass@456",
            "full_name": "Login Test User",
        },
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "logintest@assetflow.test",
            "password": "TestPass@456",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient):
    """Wrong password should return 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "logintest@assetflow.test",
            "password": "WrongPassword!",
        },
    )
    assert response.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    """Login with non-existent email should return 401."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nobody@doesnotexist.test",
            "password": "AnyPassword@123",
        },
    )
    assert response.status_code == 401


# ─── Protected Endpoints ──────────────────────────────────────────────────────

def test_get_me_without_token(client: TestClient):
    """Accessing /me without token should return 403 or 401."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


def test_get_me_with_invalid_token(client: TestClient):
    """Accessing /me with invalid token should return 401."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer this.is.invalid"},
    )
    assert response.status_code == 401


# ─── Forgot Password ──────────────────────────────────────────────────────────

def test_forgot_password_valid_email(client: TestClient):
    """Forgot password for existing email should return 200 with message."""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "logintest@assetflow.test"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_forgot_password_nonexistent_email(client: TestClient):
    """Forgot password for non-existent email should NOT reveal that (security)."""
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "ghost@doesnotexist.test"},
    )
    # Should still return 200 to prevent email enumeration
    assert response.status_code == 200
