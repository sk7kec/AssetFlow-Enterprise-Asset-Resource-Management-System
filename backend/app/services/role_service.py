"""
Role management service - CRUD for custom roles and permissions.
System roles (admin, employee, etc.) are predefined and cannot be deleted.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.models.user import UserRole
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.organization import RoleCreate, RoleResponse, RoleUpdate
from app.services.activity_log_service import ActivityLogService
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate

# System roles that ship with the application
SYSTEM_ROLES = [
    {"name": UserRole.ADMIN.value, "display_name": "Administrator", "permissions": ["*"]},
    {"name": UserRole.ASSET_MANAGER.value, "display_name": "Asset Manager", "permissions": ["assets.*", "allocations.*", "maintenance.*"]},
    {"name": UserRole.DEPARTMENT_HEAD.value, "display_name": "Department Head", "permissions": ["assets.read", "allocations.*", "employees.read"]},
    {"name": UserRole.EMPLOYEE.value, "display_name": "Employee", "permissions": ["assets.read", "bookings.*"]},
    {"name": UserRole.TECHNICIAN.value, "display_name": "Technician", "permissions": ["maintenance.*", "assets.read"]},
    {"name": UserRole.AUDITOR.value, "display_name": "Auditor", "permissions": ["audit.*", "assets.read"]},
]


class RoleService:
    """Business logic for role and permission management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.roles = db[Collections.ROLES]
        self.activity_log = ActivityLogService(db)

    async def seed_system_roles(self) -> None:
        """Seed default system roles on first run."""
        for role_data in SYSTEM_ROLES:
            existing = await self.roles.find_one({"name": role_data["name"]})
            if not existing:
                now = datetime.now(timezone.utc)
                await self.roles.insert_one({
                    **role_data,
                    "description": f"System role: {role_data['display_name']}",
                    "is_system": True,
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                })

    def _serialize(self, doc: Dict[str, Any]) -> RoleResponse:
        return RoleResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            display_name=doc["display_name"],
            description=doc.get("description"),
            permissions=doc.get("permissions", []),
            is_system=doc.get("is_system", False),
            is_active=doc.get("is_active", True),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create(
        self,
        data: RoleCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> RoleResponse:
        """Create a custom role."""
        existing = await self.roles.find_one({"name": data.name.lower()})
        if existing:
            raise HTTPException(status_code=409, detail="Role name already exists")

        now = datetime.now(timezone.utc)
        doc = {
            "name": data.name.lower().replace(" ", "_"),
            "display_name": data.display_name,
            "description": data.description,
            "permissions": data.permissions,
            "is_system": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.roles.insert_one(doc)
        doc["_id"] = result.inserted_id

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="create",
            module="roles",
            entity_id=str(result.inserted_id),
            entity_type="role",
            new_value={"name": doc["name"], "permissions": data.permissions},
            ip_address=ip_address,
        )

        return self._serialize(doc)

    async def get_by_id(self, role_id: str) -> RoleResponse:
        oid = validate_object_id(role_id)
        doc = await self.roles.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Role not found")
        return self._serialize(doc)

    async def list_all(
        self,
        params: PaginationParams,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[RoleResponse]:
        query: Dict[str, Any] = {}
        if is_active is not None:
            query["is_active"] = is_active
        return await paginate(self.roles, query, params, self._serialize)

    async def update(
        self,
        role_id: str,
        data: RoleUpdate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> RoleResponse:
        oid = validate_object_id(role_id)
        existing = await self.roles.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")

        if existing.get("is_system"):
            raise HTTPException(status_code=400, detail="System roles cannot be modified")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.roles.update_one({"_id": oid}, {"$set": update_data})

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="update",
            module="roles",
            entity_id=role_id,
            entity_type="role",
            old_value={k: existing.get(k) for k in update_data},
            new_value=update_data,
            ip_address=ip_address,
        )

        return await self.get_by_id(role_id)

    async def delete(
        self,
        role_id: str,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        oid = validate_object_id(role_id)
        existing = await self.roles.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Role not found")

        if existing.get("is_system"):
            raise HTTPException(status_code=400, detail="System roles cannot be deleted")

        await self.roles.update_one(
            {"_id": oid},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        )

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="delete",
            module="roles",
            entity_id=role_id,
            entity_type="role",
            ip_address=ip_address,
        )

        return {"message": "Role deactivated successfully"}
