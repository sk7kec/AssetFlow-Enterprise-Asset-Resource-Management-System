"""
Role-based middleware for request-level access control.
Validates JWT and attaches user context to request state.
"""

import time
from typing import Callable, List, Optional, Set

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.models.user import UserRole
from app.security import decode_token


class RoleMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces role-based access on specific path prefixes.
    Configure protected paths and required roles at initialization.
    """

    def __init__(
        self,
        app,
        protected_paths: Optional[dict] = None,
    ):
        super().__init__(app)
        # Map of path prefix -> set of allowed roles
        self.protected_paths = protected_paths or {
            "/api/v1/admin": {UserRole.ADMIN.value},
            "/api/v1/asset-manager": {
                UserRole.ADMIN.value,
                UserRole.ASSET_MANAGER.value,
            },
            "/api/v1/department-head": {
                UserRole.ADMIN.value,
                UserRole.ASSET_MANAGER.value,
                UserRole.DEPARTMENT_HEAD.value,
            },
        }

        # Paths that skip authentication entirely
        self.public_paths: Set[str] = {
            "/",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/refresh",
            "/health",
        }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Skip public paths
        if path in self.public_paths or path.startswith("/docs"):
            return await call_next(request)

        # Check if path requires role validation
        required_roles = self._get_required_roles(path)
        if not required_roles:
            return await call_next(request)

        # Extract and validate JWT
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Authentication required"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = auth_header.split(" ")[1]
        payload = decode_token(token)

        if not payload or payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        user_role = payload.get("role", UserRole.EMPLOYEE.value)

        # Admin bypasses all role checks
        if user_role != UserRole.ADMIN.value and user_role not in required_roles:
            return JSONResponse(
                status_code=403,
                content={"detail": "Insufficient permissions for this resource"},
            )

        # Attach user context to request state for downstream use
        request.state.user_id = payload.get("sub")
        request.state.user_email = payload.get("email")
        request.state.user_role = user_role

        return await call_next(request)

    def _get_required_roles(self, path: str) -> Optional[Set[str]]:
        """Find required roles for a given path prefix."""
        for prefix, roles in self.protected_paths.items():
            if path.startswith(prefix):
                return roles
        return None


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log request method, path, status code, and duration."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000

        # Attach timing header for debugging
        response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"

        return response
