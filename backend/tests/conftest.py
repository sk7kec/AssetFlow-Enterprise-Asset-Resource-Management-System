"""
Test configuration and shared fixtures for AssetFlow backend tests.

Uses pytest-asyncio with motor's test client.
A test MongoDB database is created and torn down for each test session.
"""

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient


# ─── Event Loop ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Environment Setup ────────────────────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def setup_test_env(monkeypatch_session):
    """Override environment variables for testing."""
    monkeypatch_session.setenv("APP_ENV", "testing")
    monkeypatch_session.setenv("MONGODB_DB_NAME", "assetflow_test")
    monkeypatch_session.setenv("DEBUG", "true")
    monkeypatch_session.setenv("LOG_LEVEL", "WARNING")


@pytest.fixture(scope="session")
def monkeypatch_session(request):
    """Session-scoped monkeypatch fixture."""
    from _pytest.monkeypatch import MonkeyPatch
    mp = MonkeyPatch()
    yield mp
    mp.undo()


# ─── FastAPI App ──────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def app():
    """Create FastAPI app instance for testing."""
    from app.main import app as fastapi_app
    return fastapi_app


@pytest.fixture
def client(app):
    """Synchronous test client (for simple tests)."""
    with TestClient(app) as c:
        yield c


@pytest_asyncio.fixture
async def async_client(app) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for testing async endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


# ─── Auth Fixtures ────────────────────────────────────────────────────────────
@pytest.fixture
def admin_token(async_client):
    """Get admin JWT token for protected endpoint tests."""
    # This would require a test user — implement after DB seeding
    return "test-admin-token"


@pytest.fixture
def auth_headers(admin_token):
    """HTTP headers with JWT bearer token."""
    return {"Authorization": f"Bearer {admin_token}"}
