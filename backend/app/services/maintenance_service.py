"""
Maintenance service - raise requests, approval workflow, technician assignment.
Auto-changes asset status to under_maintenance.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.asset import AssetStatus
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    MaintenanceApproval,
    MaintenanceCreate,
    MaintenancePriority,
    MaintenanceResponse,
    MaintenanceStatus,
    MaintenanceUpdate,
)
from app.services.activity_log_service import ActivityLogService
from app.services.file_upload_service import FileUploadService
from app.services.notification_service import NotificationService
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate


class MaintenanceService:
    """Business logic for maintenance request management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.requests = db[Collections.MAINTENANCE_REQUESTS]
        self.history = db[Collections.MAINTENANCE_HISTORY]
        self.assets = db[Collections.ASSETS]
        self.employees = db[Collections.EMPLOYEES]
        self.activity_log = ActivityLogService(db)
        self.notifications = NotificationService(db)
        self.file_upload = FileUploadService()

    def _serialize(self, doc: Dict[str, Any], **extras) -> MaintenanceResponse:
        return MaintenanceResponse(
            id=str(doc["_id"]),
            asset_id=doc["asset_id"],
            asset_tag=extras.get("asset_tag"),
            title=doc["title"],
            description=doc["description"],
            priority=doc["priority"],
            status=doc["status"],
            raised_by=doc["raised_by"],
            raised_by_name=doc.get("raised_by_name"),
            technician_id=doc.get("technician_id"),
            technician_name=extras.get("technician_name"),
            approved_by=doc.get("approved_by"),
            image_urls=doc.get("image_urls", []),
            resolution_notes=doc.get("resolution_notes"),
            resolved_at=doc.get("resolved_at"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create(self, data: MaintenanceCreate, current_user: UserResponse, ip_address: Optional[str] = None) -> MaintenanceResponse:
        asset_oid = validate_object_id(data.asset_id, "asset_id")
        asset = await self.assets.find_one({"_id": asset_oid})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        now = datetime.now(timezone.utc)
        doc = {
            "asset_id": data.asset_id,
            "title": data.title,
            "description": data.description,
            "priority": data.priority.value,
            "status": MaintenanceStatus.PENDING.value,
            "raised_by": current_user.id,
            "raised_by_name": current_user.full_name,
            "technician_id": None,
            "approved_by": None,
            "image_urls": [],
            "resolution_notes": None,
            "resolved_at": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.requests.insert_one(doc)
        doc["_id"] = result.inserted_id

        await self.history.insert_one({
            "request_id": str(result.inserted_id), "action": "created",
            "performed_by": current_user.id, "notes": data.title, "created_at": now,
        })

        await self.notifications.create(
            user_id=current_user.id,
            title="Maintenance Request Raised",
            message=f"Maintenance request '{data.title}' for {asset.get('asset_tag')} has been submitted.",
            notification_type="maintenance",
            entity_id=str(result.inserted_id),
            entity_type="maintenance",
        )

        return self._serialize(doc, asset_tag=asset.get("asset_tag"))

    async def approve(self, request_id: str, data: MaintenanceApproval, current_user: UserResponse) -> MaintenanceResponse:
        oid = validate_object_id(request_id)
        doc = await self.requests.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Maintenance request not found")
        if doc["status"] != MaintenanceStatus.PENDING.value:
            raise HTTPException(status_code=400, detail="Request is not pending approval")

        now = datetime.now(timezone.utc)
        new_status = MaintenanceStatus.APPROVED.value if data.approved else MaintenanceStatus.REJECTED.value

        await self.requests.update_one(
            {"_id": oid},
            {"$set": {"status": new_status, "approved_by": current_user.id, "updated_at": now}},
        )

        if data.approved:
            # Auto-change asset status to under_maintenance
            await self.assets.update_one(
                {"_id": ObjectId(doc["asset_id"])},
                {"$set": {"status": AssetStatus.UNDER_MAINTENANCE.value, "updated_at": now}},
            )

        await self.history.insert_one({
            "request_id": request_id, "action": "approved" if data.approved else "rejected",
            "performed_by": current_user.id, "notes": data.notes, "created_at": now,
        })

        doc["status"] = new_status
        asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
        return self._serialize(doc, asset_tag=asset.get("asset_tag") if asset else None)

    async def assign_technician(self, request_id: str, technician_id: str, current_user: UserResponse) -> MaintenanceResponse:
        oid = validate_object_id(request_id)
        tech_oid = validate_object_id(technician_id, "technician_id")

        doc = await self.requests.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Request not found")

        technician = await self.employees.find_one({"_id": tech_oid})
        if not technician:
            raise HTTPException(status_code=404, detail="Technician not found")

        now = datetime.now(timezone.utc)
        await self.requests.update_one(
            {"_id": oid},
            {"$set": {
                "technician_id": technician_id,
                "status": MaintenanceStatus.TECHNICIAN_ASSIGNED.value,
                "updated_at": now,
            }},
        )

        await self.notifications.create(
            user_id=technician.get("user_id", technician_id),
            title="Maintenance Assignment",
            message=f"You have been assigned to: {doc['title']}",
            notification_type="maintenance",
            entity_id=request_id,
            entity_type="maintenance",
        )

        doc["technician_id"] = technician_id
        doc["status"] = MaintenanceStatus.TECHNICIAN_ASSIGNED.value
        asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
        return self._serialize(doc, asset_tag=asset.get("asset_tag") if asset else None, technician_name=technician.get("full_name"))

    async def update_status(self, request_id: str, new_status: MaintenanceStatus, current_user: UserResponse, resolution_notes: Optional[str] = None) -> MaintenanceResponse:
        oid = validate_object_id(request_id)
        doc = await self.requests.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Request not found")

        now = datetime.now(timezone.utc)
        update = {"status": new_status.value, "updated_at": now}

        if new_status == MaintenanceStatus.RESOLVED:
            update["resolved_at"] = now
            update["resolution_notes"] = resolution_notes
            # Restore asset to available
            await self.assets.update_one(
                {"_id": ObjectId(doc["asset_id"])},
                {"$set": {"status": AssetStatus.AVAILABLE.value, "updated_at": now}},
            )

        await self.requests.update_one({"_id": oid}, {"$set": update})
        await self.history.insert_one({
            "request_id": request_id, "action": new_status.value,
            "performed_by": current_user.id, "notes": resolution_notes, "created_at": now,
        })

        doc.update(update)
        asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
        return self._serialize(doc, asset_tag=asset.get("asset_tag") if asset else None)

    async def upload_images(self, request_id: str, files: List[UploadFile]) -> MaintenanceResponse:
        oid = validate_object_id(request_id)
        doc = await self.requests.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Request not found")

        urls = await self.file_upload.upload_multiple(files, "image", "maintenance")
        all_urls = doc.get("image_urls", []) + urls
        await self.requests.update_one({"_id": oid}, {"$set": {"image_urls": all_urls}})

        doc["image_urls"] = all_urls
        asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
        return self._serialize(doc, asset_tag=asset.get("asset_tag") if asset else None)

    async def list_requests(
        self, params: PaginationParams,
        status_filter: Optional[str] = None,
        priority: Optional[str] = None,
        asset_id: Optional[str] = None,
    ) -> PaginatedResponse[MaintenanceResponse]:
        query: Dict[str, Any] = {}
        if status_filter:
            query["status"] = status_filter
        if priority:
            query["priority"] = priority
        if asset_id:
            query["asset_id"] = asset_id

        async def serializer(doc):
            asset_tag = None
            if doc.get("asset_id"):
                asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
                asset_tag = asset.get("asset_tag") if asset else None
            return self._serialize(doc, asset_tag=asset_tag)

        return await paginate(self.requests, query, params, serializer)

    async def get_history(self, request_id: str, params: PaginationParams) -> PaginatedResponse:
        query = {"request_id": request_id}
        return await paginate(self.history, query, params, lambda doc: {
            "id": str(doc["_id"]), "request_id": doc["request_id"],
            "action": doc["action"], "performed_by": doc["performed_by"],
            "notes": doc.get("notes"), "created_at": doc["created_at"],
        })
