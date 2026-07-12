"""
Department, Employee, and Role schemas.
Pydantic V2 models for organization setup module.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─── Department Schemas ───────────────────────────────────────────

class DepartmentCreate(BaseModel):
    """Create a new department."""

    name: str = Field(..., min_length=2, max_length=100, examples=["Engineering"])
    code: str = Field(..., min_length=2, max_length=20, examples=["ENG"])
    description: Optional[str] = Field(None, max_length=500)
    head_employee_id: Optional[str] = Field(None, description="Employee ID of department head")

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, value: str) -> str:
        return value.upper().strip()

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Engineering",
                "code": "ENG",
                "description": "Software and hardware engineering",
                "head_employee_id": None,
            }
        }
    )


class DepartmentUpdate(BaseModel):
    """Update department fields."""

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    head_employee_id: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    """Department response model."""

    id: str
    name: str
    code: str
    description: Optional[str] = None
    head_employee_id: Optional[str] = None
    head_name: Optional[str] = None
    employee_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Engineering",
                "code": "ENG",
                "description": "Software and hardware engineering",
                "head_employee_id": None,
                "head_name": None,
                "employee_count": 25,
                "is_active": True,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    )


# ─── Employee Schemas ─────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    """Create a new employee in the directory."""

    user_id: Optional[str] = Field(None, description="Link to existing user account")
    employee_code: str = Field(..., min_length=2, max_length=20, examples=["EMP001"])
    full_name: str = Field(..., min_length=2, max_length=100, examples=["Jane Smith"])
    email: str = Field(..., examples=["jane.smith@company.com"])
    phone: Optional[str] = Field(None, max_length=20)
    department_id: str = Field(..., description="Department ObjectId")
    designation: str = Field(..., min_length=2, max_length=100, examples=["Senior Developer"])
    role: str = Field(default="employee", examples=["employee"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "employee_code": "EMP001",
                "full_name": "Jane Smith",
                "email": "jane.smith@company.com",
                "phone": "+1234567890",
                "department_id": "507f1f77bcf86cd799439011",
                "designation": "Senior Developer",
                "role": "employee",
            }
        }
    )


class EmployeeUpdate(BaseModel):
    """Update employee fields."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    department_id: Optional[str] = None
    designation: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeResponse(BaseModel):
    """Employee directory response."""

    id: str
    user_id: Optional[str] = None
    employee_code: str
    full_name: str
    email: str
    phone: Optional[str] = None
    department_id: str
    department_name: Optional[str] = None
    designation: str
    role: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "user_id": "507f1f77bcf86cd799439011",
                "employee_code": "EMP001",
                "full_name": "Jane Smith",
                "email": "jane.smith@company.com",
                "department_id": "507f1f77bcf86cd799439011",
                "department_name": "Engineering",
                "designation": "Senior Developer",
                "role": "employee",
                "is_active": True,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    )


# ─── Role Schemas ─────────────────────────────────────────────────

class RoleCreate(BaseModel):
    """Create a custom role with permissions."""

    name: str = Field(..., min_length=2, max_length=50, examples=["inventory_clerk"])
    display_name: str = Field(..., min_length=2, max_length=100, examples=["Inventory Clerk"])
    description: Optional[str] = Field(None, max_length=500)
    permissions: List[str] = Field(
        default_factory=list,
        examples=[["assets.read", "assets.create"]],
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "inventory_clerk",
                "display_name": "Inventory Clerk",
                "description": "Can manage asset inventory",
                "permissions": ["assets.read", "assets.create", "assets.update"],
            }
        }
    )


class RoleUpdate(BaseModel):
    """Update role permissions."""

    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    permissions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RoleResponse(BaseModel):
    """Role response model."""

    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = []
    is_system: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "name": "inventory_clerk",
                "display_name": "Inventory Clerk",
                "permissions": ["assets.read", "assets.create"],
                "is_system": False,
                "is_active": True,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    )


# ─── Activity Log Schemas ─────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    """Activity log entry response."""

    id: str
    user_id: str
    user_name: Optional[str] = None
    user_role: str
    action: str
    module: str
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "user_id": "507f1f77bcf86cd799439011",
                "user_name": "John Doe",
                "user_role": "admin",
                "action": "create",
                "module": "departments",
                "entity_id": "507f1f77bcf86cd799439011",
                "entity_type": "department",
                "old_value": None,
                "new_value": {"name": "Engineering", "code": "ENG"},
                "ip_address": "192.168.1.1",
                "created_at": "2026-01-15T10:00:00Z",
            }
        }
    )
