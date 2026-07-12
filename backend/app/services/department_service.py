"""
Department service - CRUD operations for organizational departments.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.organization import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.activity_log_service import ActivityLogService
from app.utils.object_id import validate_object_id
from app.utils.pagination import build_search_filter, paginate


class DepartmentService:
    """Business logic for department management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.departments = db[Collections.DEPARTMENTS]
        self.employees = db[Collections.EMPLOYEES]
        self.activity_log = ActivityLogService(db)

    def _serialize(self, doc: Dict[str, Any], employee_count: int = 0, head_name: Optional[str] = None) -> DepartmentResponse:
        return DepartmentResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            code=doc["code"],
            description=doc.get("description"),
            head_employee_id=doc.get("head_employee_id"),
            head_name=head_name,
            employee_count=employee_count,
            is_active=doc.get("is_active", True),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create(
        self,
        data: DepartmentCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> DepartmentResponse:
        """Create a new department."""
        existing = await self.departments.find_one({"code": data.code})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Department with code '{data.code}' already exists",
            )

        if data.head_employee_id:
            validate_object_id(data.head_employee_id, "head_employee_id")

        now = datetime.now(timezone.utc)
        doc = {
            "name": data.name.strip(),
            "code": data.code,
            "description": data.description,
            "head_employee_id": data.head_employee_id,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.departments.insert_one(doc)
        doc["_id"] = result.inserted_id

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="create",
            module="departments",
            entity_id=str(result.inserted_id),
            entity_type="department",
            new_value={"name": data.name, "code": data.code},
            ip_address=ip_address,
        )

        return self._serialize(doc)

    async def get_by_id(self, department_id: str) -> DepartmentResponse:
        """Get department by ID with employee count."""
        oid = validate_object_id(department_id)
        doc = await self.departments.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Department not found")

        employee_count = await self.employees.count_documents({"department_id": department_id})
        head_name = None
        if doc.get("head_employee_id"):
            head = await self.employees.find_one({"_id": ObjectId(doc["head_employee_id"])})
            if head:
                head_name = head.get("full_name")

        return self._serialize(doc, employee_count, head_name)

    async def list_all(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[DepartmentResponse]:
        """List departments with pagination, search, and filtering."""
        query: Dict[str, Any] = {}
        if is_active is not None:
            query["is_active"] = is_active
        if search:
            query.update(build_search_filter(search, ["name", "code", "description"]))

        async def serializer(doc):
            count = await self.employees.count_documents({"department_id": str(doc["_id"])})
            return self._serialize(doc, count)

        return await paginate(self.departments, query, params, serializer)

    async def update(
        self,
        department_id: str,
        data: DepartmentUpdate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> DepartmentResponse:
        """Update department fields."""
        oid = validate_object_id(department_id)
        existing = await self.departments.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Department not found")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "head_employee_id" in update_data and update_data["head_employee_id"]:
            validate_object_id(update_data["head_employee_id"], "head_employee_id")

        update_data["updated_at"] = datetime.now(timezone.utc)

        await self.departments.update_one({"_id": oid}, {"$set": update_data})
        updated = await self.departments.find_one({"_id": oid})

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="update",
            module="departments",
            entity_id=department_id,
            entity_type="department",
            old_value={k: existing.get(k) for k in update_data if k != "updated_at"},
            new_value=update_data,
            ip_address=ip_address,
        )

        return await self.get_by_id(department_id)

    async def delete(
        self,
        department_id: str,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        """Soft-delete a department (set is_active=False)."""
        oid = validate_object_id(department_id)
        existing = await self.departments.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Department not found")

        # Check for active employees
        active_employees = await self.employees.count_documents({
            "department_id": department_id,
            "is_active": True,
        })
        if active_employees > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete department with {active_employees} active employees",
            )

        await self.departments.update_one(
            {"_id": oid},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        )

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="delete",
            module="departments",
            entity_id=department_id,
            entity_type="department",
            old_value={"name": existing["name"], "is_active": True},
            new_value={"is_active": False},
            ip_address=ip_address,
        )

        return {"message": "Department deactivated successfully"}
