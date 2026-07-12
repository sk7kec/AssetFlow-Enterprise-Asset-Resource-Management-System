"""
Employee directory service - CRUD for employee records.
Links employees to users, departments, and roles.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.organization import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.services.activity_log_service import ActivityLogService
from app.utils.object_id import validate_object_id
from app.utils.pagination import build_search_filter, paginate


class EmployeeService:
    """Business logic for employee directory management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.employees = db[Collections.EMPLOYEES]
        self.departments = db[Collections.DEPARTMENTS]
        self.users = db[Collections.USERS]
        self.activity_log = ActivityLogService(db)

    def _serialize(self, doc: Dict[str, Any], department_name: Optional[str] = None) -> EmployeeResponse:
        return EmployeeResponse(
            id=str(doc["_id"]),
            user_id=doc.get("user_id"),
            employee_code=doc["employee_code"],
            full_name=doc["full_name"],
            email=doc["email"],
            phone=doc.get("phone"),
            department_id=doc["department_id"],
            department_name=department_name,
            designation=doc["designation"],
            role=doc.get("role", "employee"),
            is_active=doc.get("is_active", True),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create(
        self,
        data: EmployeeCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Create a new employee record."""
        # Validate unique employee code
        existing = await self.employees.find_one({"employee_code": data.employee_code})
        if existing:
            raise HTTPException(status_code=409, detail="Employee code already exists")

        # Validate department exists
        dept_oid = validate_object_id(data.department_id, "department_id")
        department = await self.departments.find_one({"_id": dept_oid, "is_active": True})
        if not department:
            raise HTTPException(status_code=404, detail="Department not found or inactive")

        # Validate user link if provided
        if data.user_id:
            user_oid = validate_object_id(data.user_id, "user_id")
            user = await self.users.find_one({"_id": user_oid})
            if not user:
                raise HTTPException(status_code=404, detail="Linked user not found")
            # Update user role and employee_id link
            await self.users.update_one(
                {"_id": user_oid},
                {"$set": {"role": data.role, "updated_at": datetime.now(timezone.utc)}},
            )

        now = datetime.now(timezone.utc)
        doc = {
            "user_id": data.user_id,
            "employee_code": data.employee_code.upper(),
            "full_name": data.full_name.strip(),
            "email": data.email.lower(),
            "phone": data.phone,
            "department_id": data.department_id,
            "designation": data.designation,
            "role": data.role,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.employees.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Link employee_id back to user
        if data.user_id:
            await self.users.update_one(
                {"_id": ObjectId(data.user_id)},
                {"$set": {"employee_id": str(result.inserted_id)}},
            )

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="create",
            module="employees",
            entity_id=str(result.inserted_id),
            entity_type="employee",
            new_value={"employee_code": data.employee_code, "full_name": data.full_name},
            ip_address=ip_address,
        )

        return self._serialize(doc, department.get("name"))

    async def get_by_id(self, employee_id: str) -> EmployeeResponse:
        """Get employee by ID."""
        oid = validate_object_id(employee_id)
        doc = await self.employees.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Employee not found")

        dept_name = None
        if doc.get("department_id"):
            dept = await self.departments.find_one({"_id": ObjectId(doc["department_id"])})
            if dept:
                dept_name = dept.get("name")

        return self._serialize(doc, dept_name)

    async def list_all(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        department_id: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[EmployeeResponse]:
        """List employees with filters."""
        query: Dict[str, Any] = {}
        if department_id:
            query["department_id"] = department_id
        if is_active is not None:
            query["is_active"] = is_active
        if search:
            query.update(build_search_filter(search, ["full_name", "employee_code", "email", "designation"]))

        # Cache department names to avoid N+1 queries
        dept_cache: Dict[str, str] = {}

        async def serializer(doc):
            dept_id = doc.get("department_id")
            if dept_id and dept_id not in dept_cache:
                dept = await self.departments.find_one({"_id": ObjectId(dept_id)})
                dept_cache[dept_id] = dept.get("name") if dept else None
            return self._serialize(doc, dept_cache.get(dept_id))

        return await paginate(self.employees, query, params, serializer)

    async def update(
        self,
        employee_id: str,
        data: EmployeeUpdate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> EmployeeResponse:
        """Update employee record."""
        oid = validate_object_id(employee_id)
        existing = await self.employees.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Employee not found")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "department_id" in update_data:
            dept = await self.departments.find_one({
                "_id": ObjectId(update_data["department_id"]),
                "is_active": True,
            })
            if not dept:
                raise HTTPException(status_code=404, detail="Department not found")

        if "role" in update_data and existing.get("user_id"):
            await self.users.update_one(
                {"_id": ObjectId(existing["user_id"])},
                {"$set": {"role": update_data["role"]}},
            )

        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.employees.update_one({"_id": oid}, {"$set": update_data})

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="update",
            module="employees",
            entity_id=employee_id,
            entity_type="employee",
            old_value={k: existing.get(k) for k in update_data if k != "updated_at"},
            new_value=update_data,
            ip_address=ip_address,
        )

        return await self.get_by_id(employee_id)

    async def delete(
        self,
        employee_id: str,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        """Soft-delete employee."""
        oid = validate_object_id(employee_id)
        existing = await self.employees.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Employee not found")

        await self.employees.update_one(
            {"_id": oid},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        )

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="delete",
            module="employees",
            entity_id=employee_id,
            entity_type="employee",
            ip_address=ip_address,
        )

        return {"message": "Employee deactivated successfully"}
