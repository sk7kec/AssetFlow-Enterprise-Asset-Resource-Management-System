"""
Asset allocation service - allocate, return, transfer with conflict detection.
Prevents double allocation and tracks full allocation history.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.asset import AssetStatus
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    AllocationCreate,
    AllocationHistoryResponse,
    AllocationResponse,
    AllocationReturn,
    AllocationStatus,
    TransferApproval,
    TransferCreate,
)
from app.services.activity_log_service import ActivityLogService
from app.services.asset_service import AssetService
from app.services.notification_service import NotificationService
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate


class AllocationService:
    """Business logic for asset allocation management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.allocations = db[Collections.ALLOCATIONS]
        self.allocation_history = db[Collections.ALLOCATION_HISTORY]
        self.assets = db[Collections.ASSETS]
        self.employees = db[Collections.EMPLOYEES]
        self.activity_log = ActivityLogService(db)
        self.asset_service = AssetService(db)
        self.notifications = NotificationService(db)

    def _serialize(self, doc: Dict[str, Any], **extras) -> AllocationResponse:
        return AllocationResponse(
            id=str(doc["_id"]),
            asset_id=doc["asset_id"],
            asset_tag=extras.get("asset_tag"),
            asset_name=extras.get("asset_name"),
            employee_id=doc["employee_id"],
            employee_name=extras.get("employee_name"),
            allocated_by=doc["allocated_by"],
            allocated_by_name=extras.get("allocated_by_name"),
            status=doc["status"],
            allocated_at=doc["allocated_at"],
            expected_return_date=doc.get("expected_return_date"),
            returned_at=doc.get("returned_at"),
            notes=doc.get("notes"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def _get_extras(self, doc: Dict[str, Any]) -> dict:
        extras = {}
        if doc.get("asset_id"):
            asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
            if asset:
                extras["asset_tag"] = asset.get("asset_tag")
                extras["asset_name"] = asset.get("name")
        if doc.get("employee_id"):
            emp = await self.employees.find_one({"_id": ObjectId(doc["employee_id"])})
            if emp:
                extras["employee_name"] = emp.get("full_name")
        return extras

    async def _check_conflict(self, asset_id: str) -> None:
        """Detect double allocation - no asset can have two active allocations."""
        active = await self.allocations.find_one({
            "asset_id": asset_id,
            "status": AllocationStatus.ACTIVE.value,
        })
        if active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Asset is already allocated. Return it before re-allocating.",
            )

    async def allocate(
        self,
        data: AllocationCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AllocationResponse:
        asset_oid = validate_object_id(data.asset_id, "asset_id")
        emp_oid = validate_object_id(data.employee_id, "employee_id")

        asset = await self.assets.find_one({"_id": asset_oid})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        if asset.get("status") not in [AssetStatus.AVAILABLE.value, AssetStatus.RESERVED.value]:
            raise HTTPException(status_code=400, detail=f"Asset status is '{asset.get('status')}', cannot allocate")

        employee = await self.employees.find_one({"_id": emp_oid, "is_active": True})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found or inactive")

        await self._check_conflict(data.asset_id)

        now = datetime.now(timezone.utc)
        doc = {
            "asset_id": data.asset_id,
            "employee_id": data.employee_id,
            "allocated_by": current_user.id,
            "status": AllocationStatus.ACTIVE.value,
            "allocated_at": now,
            "expected_return_date": data.expected_return_date.isoformat() if data.expected_return_date else None,
            "returned_at": None,
            "notes": data.notes,
            "transfer_pending": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.allocations.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Update asset status
        await self.assets.update_one(
            {"_id": asset_oid},
            {"$set": {"status": AssetStatus.ALLOCATED.value, "allocated_to": data.employee_id, "updated_at": now}},
        )

        await self.allocation_history.insert_one({
            "allocation_id": str(result.inserted_id),
            "action": "allocated",
            "to_employee_id": data.employee_id,
            "performed_by": current_user.id,
            "notes": data.notes,
            "created_at": now,
        })

        await self.notifications.create(
            user_id=data.employee_id,
            title="Asset Allocated",
            message=f"Asset {asset.get('asset_tag')} ({asset.get('name')}) has been allocated to you.",
            notification_type="allocation",
            entity_id=str(result.inserted_id),
            entity_type="allocation",
        )

        await self.activity_log.log(
            user_id=current_user.id, user_name=current_user.full_name,
            user_role=current_user.role, action="allocate", module="allocations",
            entity_id=str(result.inserted_id), entity_type="allocation",
            new_value={"asset_id": data.asset_id, "employee_id": data.employee_id},
            ip_address=ip_address,
        )

        extras = await self._get_extras(doc)
        extras["allocated_by_name"] = current_user.full_name
        return self._serialize(doc, **extras)

    async def return_asset(
        self,
        allocation_id: str,
        data: AllocationReturn,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AllocationResponse:
        oid = validate_object_id(allocation_id)
        allocation = await self.allocations.find_one({"_id": oid})
        if not allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")
        if allocation["status"] != AllocationStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Allocation is not active")

        now = datetime.now(timezone.utc)
        await self.allocations.update_one(
            {"_id": oid},
            {"$set": {"status": AllocationStatus.RETURNED.value, "returned_at": now, "updated_at": now, "notes": data.notes or allocation.get("notes")}},
        )

        asset_update = {"status": AssetStatus.AVAILABLE.value, "allocated_to": None, "updated_at": now}
        if data.condition:
            asset_update["condition"] = data.condition

        await self.assets.update_one({"_id": ObjectId(allocation["asset_id"])}, {"$set": asset_update})

        await self.allocation_history.insert_one({
            "allocation_id": allocation_id, "action": "returned",
            "from_employee_id": allocation["employee_id"],
            "performed_by": current_user.id, "notes": data.notes, "created_at": now,
        })

        allocation["status"] = AllocationStatus.RETURNED.value
        allocation["returned_at"] = now
        extras = await self._get_extras(allocation)
        return self._serialize(allocation, **extras)

    async def transfer(
        self,
        data: TransferCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        """Initiate asset transfer - requires approval."""
        oid = validate_object_id(data.allocation_id)
        allocation = await self.allocations.find_one({"_id": oid, "status": AllocationStatus.ACTIVE.value})
        if not allocation:
            raise HTTPException(status_code=404, detail="Active allocation not found")

        to_emp = validate_object_id(data.to_employee_id, "to_employee_id")
        employee = await self.employees.find_one({"_id": to_emp, "is_active": True})
        if not employee:
            raise HTTPException(status_code=404, detail="Target employee not found")

        now = datetime.now(timezone.utc)
        await self.allocations.update_one(
            {"_id": oid},
            {"$set": {
                "transfer_pending": {
                    "to_employee_id": data.to_employee_id,
                    "requested_by": current_user.id,
                    "notes": data.notes,
                    "requested_at": now.isoformat(),
                },
                "updated_at": now,
            }},
        )

        await self.notifications.create(
            user_id=data.to_employee_id,
            title="Transfer Approval Required",
            message=f"An asset transfer has been requested. Please review.",
            notification_type="transfer",
            entity_id=data.allocation_id,
            entity_type="allocation",
        )

        return {"message": "Transfer request submitted for approval"}

    async def approve_transfer(
        self,
        allocation_id: str,
        data: TransferApproval,
        current_user: UserResponse,
    ) -> AllocationResponse:
        oid = validate_object_id(allocation_id)
        allocation = await self.allocations.find_one({"_id": oid})
        if not allocation or not allocation.get("transfer_pending"):
            raise HTTPException(status_code=404, detail="No pending transfer found")

        if not data.approved:
            await self.allocations.update_one(
                {"_id": oid},
                {"$set": {"transfer_pending": None, "updated_at": datetime.now(timezone.utc)}},
            )
            raise HTTPException(status_code=200, detail="Transfer rejected")  # handled by router

        transfer = allocation["transfer_pending"]
        now = datetime.now(timezone.utc)

        await self.allocations.update_one(
            {"_id": oid},
            {"$set": {
                "employee_id": transfer["to_employee_id"],
                "transfer_pending": None,
                "updated_at": now,
            }},
        )

        await self.assets.update_one(
            {"_id": ObjectId(allocation["asset_id"])},
            {"$set": {"allocated_to": transfer["to_employee_id"], "updated_at": now}},
        )

        await self.allocation_history.insert_one({
            "allocation_id": allocation_id, "action": "transferred",
            "from_employee_id": allocation["employee_id"],
            "to_employee_id": transfer["to_employee_id"],
            "performed_by": current_user.id, "notes": data.notes, "created_at": now,
        })

        allocation["employee_id"] = transfer["to_employee_id"]
        extras = await self._get_extras(allocation)
        return self._serialize(allocation, **extras)

    async def list_allocations(
        self, params: PaginationParams,
        status_filter: Optional[str] = None,
        employee_id: Optional[str] = None,
        asset_id: Optional[str] = None,
    ) -> PaginatedResponse[AllocationResponse]:
        query: Dict[str, Any] = {}
        if status_filter:
            query["status"] = status_filter
        if employee_id:
            query["employee_id"] = employee_id
        if asset_id:
            query["asset_id"] = asset_id

        async def serializer(doc):
            extras = await self._get_extras(doc)
            return self._serialize(doc, **extras)

        return await paginate(self.allocations, query, params, serializer)

    async def get_history(self, allocation_id: str, params: PaginationParams) -> PaginatedResponse[AllocationHistoryResponse]:
        query = {"allocation_id": allocation_id}

        def serializer(doc):
            return AllocationHistoryResponse(
                id=str(doc["_id"]), allocation_id=doc["allocation_id"],
                action=doc["action"], from_employee_id=doc.get("from_employee_id"),
                to_employee_id=doc.get("to_employee_id"), performed_by=doc["performed_by"],
                notes=doc.get("notes"), created_at=doc["created_at"],
            )

        return await paginate(self.allocation_history, query, params, serializer)

    async def check_overdue(self) -> int:
        """Mark overdue allocations and return count."""
        today = date.today().isoformat()
        result = await self.allocations.update_many(
            {"status": AllocationStatus.ACTIVE.value, "expected_return_date": {"$lt": today}},
            {"$set": {"status": AllocationStatus.OVERDUE.value}},
        )
        return result.modified_count
