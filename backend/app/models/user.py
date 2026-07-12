"""
User roles and permission constants.
Used by middleware and dependency injection for RBAC.
"""

from enum import Enum


class UserRole(str, Enum):
    """System-wide user roles with hierarchical access."""

    ADMIN = "admin"
    ASSET_MANAGER = "asset_manager"
    DEPARTMENT_HEAD = "department_head"
    EMPLOYEE = "employee"
    TECHNICIAN = "technician"
    AUDITOR = "auditor"


# Role hierarchy - higher index = more privileges for admin checks
ROLE_HIERARCHY = [
    UserRole.EMPLOYEE,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ASSET_MANAGER,
    UserRole.ADMIN,
]


def has_minimum_role(user_role: str, required_role: UserRole) -> bool:
    """Check if user_role meets or exceeds required_role in hierarchy."""
    try:
        user_idx = ROLE_HIERARCHY.index(UserRole(user_role))
        required_idx = ROLE_HIERARCHY.index(required_role)
        return user_idx >= required_idx
    except ValueError:
        return False
