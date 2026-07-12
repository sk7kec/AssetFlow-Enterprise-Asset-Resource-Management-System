"""
Role-based access control dependencies.
Enforces minimum role requirements on protected endpoints.
"""

from typing import Callable, List

from fastapi import Depends, HTTPException, status

from app.models.user import UserRole, has_minimum_role
from app.schemas.auth import UserResponse
from app.dependencies.auth import get_current_user


def require_roles(*roles: UserRole) -> Callable:
    """
    Factory that creates a dependency requiring one of the specified roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles(UserRole.ADMIN))])
    Or as parameter dependency:
        current_user: UserResponse = Depends(require_roles(UserRole.ADMIN))
    """

    async def role_checker(
        current_user: UserResponse = Depends(get_current_user),
    ) -> UserResponse:
        user_role = UserRole(current_user.role)
        if user_role not in roles and UserRole.ADMIN not in [user_role]:
            # Admin always has access
            if current_user.role != UserRole.ADMIN.value:
                allowed = [r.value for r in roles]
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required roles: {allowed}",
                )
        return current_user

    return role_checker


def require_minimum_role(minimum_role: UserRole) -> Callable:
    """Require user to have at least the specified role level."""

    async def role_checker(
        current_user: UserResponse = Depends(get_current_user),
    ) -> UserResponse:
        if not has_minimum_role(current_user.role, minimum_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Minimum role required: {minimum_role.value}",
            )
        return current_user

    return role_checker


# Pre-built role dependencies for common use cases
require_admin = require_roles(UserRole.ADMIN)
require_asset_manager = require_roles(UserRole.ADMIN, UserRole.ASSET_MANAGER)
require_department_head = require_roles(
    UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD
)
require_employee = require_roles(
    UserRole.ADMIN,
    UserRole.ASSET_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR,
)
