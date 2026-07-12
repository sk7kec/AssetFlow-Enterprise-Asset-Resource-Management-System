"""
Authentication service - signup, login, password reset, user management.
All database operations are async using Motor.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.models.user import UserRole
from app.schemas.auth import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserResponse,
    UserSignup,
)
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_password_reset_token,
    get_password_reset_expiry,
    hash_password,
    verify_password,
)


class AuthService:
    """Handles all authentication-related business logic."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users = db[Collections.USERS]
        self.reset_tokens = db[Collections.PASSWORD_RESET_TOKENS]

    def _serialize_user(self, user: Dict[str, Any]) -> UserResponse:
        """Convert MongoDB document to UserResponse - never expose password."""
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user["full_name"],
            phone=user.get("phone"),
            role=user.get("role", UserRole.EMPLOYEE.value),
            is_active=user.get("is_active", True),
            employee_id=user.get("employee_id"),
            created_at=user["created_at"],
            updated_at=user["updated_at"],
        )

    async def signup(self, data: UserSignup) -> UserResponse:
        """
        Register a new user.
        First user in the system automatically becomes admin.
        """
        existing = await self.users.find_one({"email": data.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        # First user gets admin role for initial setup
        user_count = await self.users.count_documents({})
        role = UserRole.ADMIN.value if user_count == 0 else UserRole.EMPLOYEE.value

        now = datetime.now(timezone.utc)
        user_doc = {
            "email": data.email.lower(),
            "hashed_password": hash_password(data.password),
            "full_name": data.full_name,
            "phone": data.phone,
            "role": role,
            "is_active": True,
            "employee_id": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return self._serialize_user(user_doc)

    async def login(self, data: UserLogin) -> TokenResponse:
        """Authenticate user and return JWT token pair."""
        user = await self.users.find_one({"email": data.email.lower()})
        if not user or not verify_password(data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )

        token_data = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", UserRole.EMPLOYEE.value),
        }

        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Issue new access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user = await self.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        token_data = {
            "sub": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", UserRole.EMPLOYEE.value),
        }

        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Fetch user by MongoDB ObjectId."""
        if not ObjectId.is_valid(user_id):
            return None
        user = await self.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return None
        return self._serialize_user(user)

    async def forgot_password(self, data: ForgotPasswordRequest) -> Dict[str, str]:
        """
        Generate password reset token.
        In production, send token via email. Here we return it for testing.
        """
        user = await self.users.find_one({"email": data.email.lower()})
        if not user:
            # Don't reveal whether email exists - security best practice
            return {"message": "If the email exists, a reset link has been sent"}

        token = generate_password_reset_token()
        expires_at = get_password_reset_expiry()

        # Invalidate any existing tokens for this user
        await self.reset_tokens.delete_many({"user_id": str(user["_id"])})

        await self.reset_tokens.insert_one({
            "user_id": str(user["_id"]),
            "token": token,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc),
        })

        # TODO: Integrate email service in production
        return {
            "message": "If the email exists, a reset link has been sent",
            "reset_token": token,  # Remove in production - for dev/testing only
        }

    async def reset_password(self, data: ResetPasswordRequest) -> Dict[str, str]:
        """Reset password using a valid reset token."""
        reset_doc = await self.reset_tokens.find_one({
            "token": data.token,
            "used": False,
        })

        if not reset_doc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        if reset_doc["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired",
            )

        await self.users.update_one(
            {"_id": ObjectId(reset_doc["user_id"])},
            {
                "$set": {
                    "hashed_password": hash_password(data.new_password),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        await self.reset_tokens.update_one(
            {"_id": reset_doc["_id"]},
            {"$set": {"used": True}},
        )

        return {"message": "Password reset successful"}
