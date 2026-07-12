"""
Authentication schemas - signup, login, token responses.
Pydantic V2 models with validation and Swagger examples.
"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserSignup(BaseModel):
    """User registration request."""

    email: EmailStr = Field(..., examples=["john.doe@company.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["SecurePass123!"])
    full_name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    phone: Optional[str] = Field(None, max_length=20, examples=["+1234567890"])

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """Enforce strong password policy."""
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")
        return value

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@company.com",
                "password": "SecurePass123!",
                "full_name": "John Doe",
                "phone": "+1234567890",
            }
        }
    )


class UserLogin(BaseModel):
    """User login request."""

    email: EmailStr = Field(..., examples=["john.doe@company.com"])
    password: str = Field(..., examples=["SecurePass123!"])

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "john.doe@company.com",
                "password": "SecurePass123!",
            }
        }
    )


class ForgotPasswordRequest(BaseModel):
    """Forgot password - request reset token."""

    email: EmailStr = Field(..., examples=["john.doe@company.com"])


class ResetPasswordRequest(BaseModel):
    """Reset password with token."""

    token: str = Field(..., min_length=32)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain at least one digit")
        return value


class TokenResponse(BaseModel):
    """JWT token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    )


class RefreshTokenRequest(BaseModel):
    """Refresh access token using refresh token."""

    refresh_token: str


class UserResponse(BaseModel):
    """Public user profile - never exposes password."""

    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    employee_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "john.doe@company.com",
                "full_name": "John Doe",
                "phone": "+1234567890",
                "role": "employee",
                "is_active": True,
                "employee_id": None,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        },
    )


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str
    detail: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"message": "Operation successful", "detail": None}
        }
    )
