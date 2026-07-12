"""
Audit service - audit cycles, assign auditors, verify assets,
auto discrepancy reports, close audits.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    AuditCycleCreate,
    AuditCycleResponse,
    AuditStatus,
    AuditVerificationCreate,
    AuditVerificationResponse,
    VerificationStatus,
)
from app.services.activity_log_service import ActivityLogService
from app.services.notification_service import NotificationService
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate


class AuditService:
    """Business logic for asset audit management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.cycles = db[Collections.AUDIT_CYCLES]
        self.verifications = db[Collections.AUDIT_VERIFICATIONS]
        self.assets = db[Collections.ASSETS]
        self.activity_log = ActivityLogService(db)
        self.notifications = NotificationService(db)

    def _serialize_cycle(self, doc: Dict[str, Any]) -> AuditCycleResponse:
        return AuditCycleResponse(
            id=str(doc["_id"]),
            title=doc["title"],
            description=doc.get("description"),
            status=doc["status"],
            start_date=doc["start_date"],
            end_date=doc["end_date"],
            department_ids=doc.get("department_ids", []),
            auditor_ids=doc.get("auditor_ids", []),
            created_by=doc["created_by"],
            total_assets=doc.get("total_assets", 0),
            verified_count=doc.get("verified_count", 0),
            missing_count=doc.get("missing_count", 0),
            damaged_count=doc.get("damaged_count", 0),
            discrepancy_report=doc.get("discrepancy_report"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create_cycle(self, data: AuditCycleCreate, current_user: UserResponse, ip_address: Optional[str] = None) -> AuditCycleResponse:
        now = datetime.now(timezone.utc)

        # Count assets in scope
        asset_query: Dict[str, Any] = {"status": {"$nin": ["disposed", "retired"]}}
        if data.department_ids:
            asset_query["department_id"] = {"$in": data.department_ids}
        total_assets = await self.assets.count_documents(asset_query)

        doc = {
            "title": data.title,
            "description": data.description,
            "status": AuditStatus.PLANNED.value,
            "start_date": data.start_date.isoformat(),
            "end_date": data.end_date.isoformat(),
            "department_ids": data.department_ids or [],
            "auditor_ids": data.auditor_ids,
            "created_by": current_user.id,
            "total_assets": total_assets,
            "verified_count": 0,
            "missing_count": 0,
            "damaged_count": 0,
            "discrepancy_report": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.cycles.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Notify auditors
        for auditor_id in data.auditor_ids:
            await self.notifications.create(
                user_id=auditor_id,
                title="Audit Assignment",
                message=f"You have been assigned to audit: {data.title}",
                notification_type="audit",
                entity_id=str(result.inserted_id),
                entity_type="audit_cycle",
            )

        return self._serialize_cycle(doc)

    async def start_cycle(self, cycle_id: str, current_user: UserResponse) -> AuditCycleResponse:
        oid = validate_object_id(cycle_id)
        doc = await self.cycles.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Audit cycle not found")
        if doc["status"] != AuditStatus.PLANNED.value:
            raise HTTPException(status_code=400, detail="Audit cycle already started")

        await self.cycles.update_one(
            {"_id": oid},
            {"$set": {"status": AuditStatus.IN_PROGRESS.value, "updated_at": datetime.now(timezone.utc)}},
        )
        doc["status"] = AuditStatus.IN_PROGRESS.value
        return self._serialize_cycle(doc)

    async def verify_asset(self, cycle_id: str, data: AuditVerificationCreate, current_user: UserResponse) -> AuditVerificationResponse:
        cycle_oid = validate_object_id(cycle_id)
        cycle = await self.cycles.find_one({"_id": cycle_oid, "status": AuditStatus.IN_PROGRESS.value})
        if not cycle:
            raise HTTPException(status_code=404, detail="Active audit cycle not found")

        asset_oid = validate_object_id(data.asset_id, "asset_id")
        asset = await self.assets.find_one({"_id": asset_oid})
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Check if already verified in this cycle
        existing = await self.verifications.find_one({"audit_cycle_id": cycle_id, "asset_id": data.asset_id})
        if existing:
            raise HTTPException(status_code=409, detail="Asset already verified in this cycle")

        now = datetime.now(timezone.utc)
        doc = {
            "audit_cycle_id": cycle_id,
            "asset_id": data.asset_id,
            "status": data.status.value,
            "verified_by": current_user.id,
            "notes": data.notes,
            "condition_notes": data.condition_notes,
            "created_at": now,
        }

        result = await self.verifications.insert_one(doc)

        # Update cycle counters
        counter_field = {
            VerificationStatus.VERIFIED.value: "verified_count",
            VerificationStatus.MISSING.value: "missing_count",
            VerificationStatus.DAMAGED.value: "damaged_count",
        }.get(data.status.value)

        if counter_field:
            await self.cycles.update_one({"_id": cycle_oid}, {"$inc": {counter_field: 1}})

        return AuditVerificationResponse(
            id=str(result.inserted_id),
            audit_cycle_id=cycle_id,
            asset_id=data.asset_id,
            asset_tag=asset.get("asset_tag"),
            status=data.status.value,
            verified_by=current_user.id,
            notes=data.notes,
            condition_notes=data.condition_notes,
            created_at=now,
        )

    async def generate_discrepancy_report(self, cycle_id: str) -> Dict[str, Any]:
        """Auto-generate discrepancy report for an audit cycle."""
        cycle_oid = validate_object_id(cycle_id)
        cycle = await self.cycles.find_one({"_id": cycle_oid})
        if not cycle:
            raise HTTPException(status_code=404, detail="Audit cycle not found")

        missing = []
        damaged = []
        async for v in self.verifications.find({"audit_cycle_id": cycle_id, "status": VerificationStatus.MISSING.value}):
            asset = await self.assets.find_one({"_id": ObjectId(v["asset_id"])})
            missing.append({"asset_id": v["asset_id"], "asset_tag": asset.get("asset_tag") if asset else None, "notes": v.get("notes")})

        async for v in self.verifications.find({"audit_cycle_id": cycle_id, "status": VerificationStatus.DAMAGED.value}):
            asset = await self.assets.find_one({"_id": ObjectId(v["asset_id"])})
            damaged.append({"asset_id": v["asset_id"], "asset_tag": asset.get("asset_tag") if asset else None, "notes": v.get("notes")})

        report = {
            "cycle_id": cycle_id,
            "title": cycle["title"],
            "total_assets": cycle.get("total_assets", 0),
            "verified": cycle.get("verified_count", 0),
            "missing": missing,
            "damaged": damaged,
            "missing_count": len(missing),
            "damaged_count": len(damaged),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

        await self.cycles.update_one({"_id": cycle_oid}, {"$set": {"discrepancy_report": report}})
        return report

    async def close_cycle(self, cycle_id: str, current_user: UserResponse) -> AuditCycleResponse:
        oid = validate_object_id(cycle_id)
        report = await self.generate_discrepancy_report(cycle_id)

        await self.cycles.update_one(
            {"_id": oid},
            {"$set": {"status": AuditStatus.CLOSED.value, "updated_at": datetime.now(timezone.utc)}},
        )

        doc = await self.cycles.find_one({"_id": oid})
        return self._serialize_cycle(doc)

    async def list_cycles(self, params: PaginationParams, status_filter: Optional[str] = None) -> PaginatedResponse[AuditCycleResponse]:
        query: Dict[str, Any] = {}
        if status_filter:
            query["status"] = status_filter
        return await paginate(self.cycles, query, params, self._serialize_cycle)

    async def get_verifications(self, cycle_id: str, params: PaginationParams) -> PaginatedResponse[AuditVerificationResponse]:
        query = {"audit_cycle_id": cycle_id}

        async def serializer(doc):
            asset_tag = None
            if doc.get("asset_id"):
                asset = await self.assets.find_one({"_id": ObjectId(doc["asset_id"])})
                asset_tag = asset.get("asset_tag") if asset else None
            return AuditVerificationResponse(
                id=str(doc["_id"]), audit_cycle_id=doc["audit_cycle_id"],
                asset_id=doc["asset_id"], asset_tag=asset_tag,
                status=doc["status"], verified_by=doc["verified_by"],
                notes=doc.get("notes"), condition_notes=doc.get("condition_notes"),
                created_at=doc["created_at"],
            )

        return await paginate(self.verifications, query, params, serializer)
