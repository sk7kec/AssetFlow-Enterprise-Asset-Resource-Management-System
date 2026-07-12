"""
Asset registration service - full CRUD with auto tag, QR/barcode,
serial validation, search, pagination, filtering, sorting, and history.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.asset import (
    AssetCondition,
    AssetCreate,
    AssetHistoryResponse,
    AssetResponse,
    AssetStatus,
    AssetUpdate,
)
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.services.activity_log_service import ActivityLogService
from app.services.counter_service import CounterService
from app.services.file_upload_service import FileUploadService
from app.utils.code_generator import generate_barcode, generate_qr_code
from app.utils.object_id import validate_object_id
from app.utils.pagination import build_search_filter, paginate


class AssetService:
    """Business logic for asset registration and management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.assets = db[Collections.ASSETS]
        self.categories = db[Collections.ASSET_CATEGORIES]
        self.history = db[Collections.ASSET_HISTORY]
        self.counter = CounterService(db)
        self.activity_log = ActivityLogService(db)
        self.file_upload = FileUploadService()

    def _serialize(self, doc: Dict[str, Any], category_name: Optional[str] = None) -> AssetResponse:
        return AssetResponse(
            id=str(doc["_id"]),
            asset_tag=doc["asset_tag"],
            name=doc["name"],
            category_id=doc["category_id"],
            category_name=category_name,
            serial_number=doc.get("serial_number"),
            description=doc.get("description"),
            location=doc.get("location"),
            condition=doc.get("condition", AssetCondition.NEW.value),
            purchase_cost=doc.get("purchase_cost"),
            purchase_date=doc.get("purchase_date"),
            warranty_expiry=doc.get("warranty_expiry"),
            is_bookable=doc.get("is_bookable", False),
            status=doc.get("status", AssetStatus.AVAILABLE.value),
            department_id=doc.get("department_id"),
            manufacturer=doc.get("manufacturer"),
            model=doc.get("model"),
            qr_code_url=doc.get("qr_code_url"),
            barcode_url=doc.get("barcode_url"),
            image_urls=doc.get("image_urls", []),
            document_urls=doc.get("document_urls", []),
            custom_field_values=doc.get("custom_field_values"),
            allocated_to=doc.get("allocated_to"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def _record_history(
        self,
        asset_id: str,
        action: str,
        user: UserResponse,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        notes: Optional[str] = None,
    ) -> None:
        await self.history.insert_one({
            "asset_id": asset_id,
            "action": action,
            "performed_by": user.id,
            "performed_by_name": user.full_name,
            "old_value": old_value,
            "new_value": new_value,
            "notes": notes,
            "created_at": datetime.now(timezone.utc),
        })

    async def create(
        self,
        data: AssetCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AssetResponse:
        """Register a new asset with auto-generated tag, QR, and barcode."""
        # Validate category
        cat_oid = validate_object_id(data.category_id, "category_id")
        category = await self.categories.find_one({"_id": cat_oid, "is_active": True})
        if not category:
            raise HTTPException(status_code=404, detail="Asset category not found")

        # Serial number validation
        if category.get("requires_serial_number") and not data.serial_number:
            raise HTTPException(status_code=400, detail="Serial number is required for this category")

        if data.serial_number:
            existing_sn = await self.assets.find_one({"serial_number": data.serial_number})
            if existing_sn:
                raise HTTPException(status_code=409, detail="Serial number already registered")

        # Auto-generate asset tag: AF-0001, AF-0002, etc.
        asset_tag = await self.counter.get_next_sequence("asset_tag", "AF-", 4)

        # Generate QR code and barcode
        qr_url = generate_qr_code(asset_tag, asset_tag)
        barcode_url = generate_barcode(asset_tag, asset_tag)

        now = datetime.now(timezone.utc)
        doc = {
            "asset_tag": asset_tag,
            "name": data.name.strip(),
            "category_id": data.category_id,
            "serial_number": data.serial_number,
            "description": data.description,
            "location": data.location,
            "condition": data.condition.value if isinstance(data.condition, AssetCondition) else data.condition,
            "purchase_cost": data.purchase_cost,
            "purchase_date": data.purchase_date.isoformat() if data.purchase_date else None,
            "warranty_expiry": data.warranty_expiry.isoformat() if data.warranty_expiry else None,
            "is_bookable": data.is_bookable or category.get("is_bookable", False),
            "status": AssetStatus.AVAILABLE.value,
            "department_id": data.department_id,
            "manufacturer": data.manufacturer,
            "model": data.model,
            "qr_code_url": qr_url,
            "barcode_url": barcode_url,
            "image_urls": [],
            "document_urls": [],
            "custom_field_values": data.custom_field_values,
            "allocated_to": None,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.assets.insert_one(doc)
        doc["_id"] = result.inserted_id
        asset_id = str(result.inserted_id)

        await self._record_history(asset_id, "created", current_user, new_value={"asset_tag": asset_tag, "name": data.name})
        await self.activity_log.log(
            user_id=current_user.id, user_name=current_user.full_name,
            user_role=current_user.role, action="create", module="assets",
            entity_id=asset_id, entity_type="asset",
            new_value={"asset_tag": asset_tag, "name": data.name}, ip_address=ip_address,
        )

        return self._serialize(doc, category.get("name"))

    async def get_by_id(self, asset_id: str) -> AssetResponse:
        oid = validate_object_id(asset_id)
        doc = await self.assets.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Asset not found")

        cat_name = None
        if doc.get("category_id"):
            cat = await self.categories.find_one({"_id": ObjectId(doc["category_id"])})
            cat_name = cat.get("name") if cat else None

        return self._serialize(doc, cat_name)

    async def get_by_tag(self, asset_tag: str) -> AssetResponse:
        doc = await self.assets.find_one({"asset_tag": asset_tag.upper()})
        if not doc:
            raise HTTPException(status_code=404, detail="Asset not found")
        return await self.get_by_id(str(doc["_id"]))

    async def list_all(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        status: Optional[str] = None,
        condition: Optional[str] = None,
        department_id: Optional[str] = None,
        location: Optional[str] = None,
        is_bookable: Optional[bool] = None,
    ) -> PaginatedResponse[AssetResponse]:
        """List assets with search, filtering, sorting, and pagination."""
        query: Dict[str, Any] = {}
        if category_id:
            query["category_id"] = category_id
        if status:
            query["status"] = status
        if condition:
            query["condition"] = condition
        if department_id:
            query["department_id"] = department_id
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        if is_bookable is not None:
            query["is_bookable"] = is_bookable
        if search:
            query.update(build_search_filter(search, ["name", "asset_tag", "serial_number", "manufacturer", "model"]))

        cat_cache: Dict[str, str] = {}

        async def serializer(doc):
            cat_id = doc.get("category_id")
            if cat_id and cat_id not in cat_cache:
                cat = await self.categories.find_one({"_id": ObjectId(cat_id)})
                cat_cache[cat_id] = cat.get("name") if cat else None
            return self._serialize(doc, cat_cache.get(cat_id))

        return await paginate(self.assets, query, params, serializer)

    async def update(
        self,
        asset_id: str,
        data: AssetUpdate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AssetResponse:
        oid = validate_object_id(asset_id)
        existing = await self.assets.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Asset not found")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Convert enums to strings
        if "condition" in update_data and hasattr(update_data["condition"], "value"):
            update_data["condition"] = update_data["condition"].value
        if "status" in update_data and hasattr(update_data["status"], "value"):
            update_data["status"] = update_data["status"].value
        if "purchase_date" in update_data and update_data["purchase_date"]:
            update_data["purchase_date"] = update_data["purchase_date"].isoformat()
        if "warranty_expiry" in update_data and update_data["warranty_expiry"]:
            update_data["warranty_expiry"] = update_data["warranty_expiry"].isoformat()

        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.assets.update_one({"_id": oid}, {"$set": update_data})

        await self._record_history(asset_id, "updated", current_user,
            old_value={k: existing.get(k) for k in update_data},
            new_value=update_data)
        await self.activity_log.log(
            user_id=current_user.id, user_name=current_user.full_name,
            user_role=current_user.role, action="update", module="assets",
            entity_id=asset_id, entity_type="asset",
            old_value={k: existing.get(k) for k in update_data},
            new_value=update_data, ip_address=ip_address,
        )

        return await self.get_by_id(asset_id)

    async def delete(
        self,
        asset_id: str,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        """Mark asset as disposed (soft delete)."""
        oid = validate_object_id(asset_id)
        existing = await self.assets.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Asset not found")

        if existing.get("status") == AssetStatus.ALLOCATED.value:
            raise HTTPException(status_code=400, detail="Cannot dispose an allocated asset")

        await self.assets.update_one(
            {"_id": oid},
            {"$set": {"status": AssetStatus.DISPOSED.value, "updated_at": datetime.now(timezone.utc)}},
        )

        await self._record_history(asset_id, "disposed", current_user, notes="Asset marked as disposed")
        await self.activity_log.log(
            user_id=current_user.id, user_name=current_user.full_name,
            user_role=current_user.role, action="delete", module="assets",
            entity_id=asset_id, entity_type="asset", ip_address=ip_address,
        )

        return {"message": "Asset disposed successfully"}

    async def upload_images(self, asset_id: str, files: List[UploadFile], current_user: UserResponse) -> AssetResponse:
        oid = validate_object_id(asset_id)
        doc = await self.assets.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Asset not found")

        urls = await self.file_upload.upload_multiple(files, "image", "assets/images")
        all_urls = doc.get("image_urls", []) + urls

        await self.assets.update_one(
            {"_id": oid},
            {"$set": {"image_urls": all_urls, "updated_at": datetime.now(timezone.utc)}},
        )
        return await self.get_by_id(asset_id)

    async def upload_documents(self, asset_id: str, files: List[UploadFile], current_user: UserResponse) -> AssetResponse:
        oid = validate_object_id(asset_id)
        doc = await self.assets.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Asset not found")

        urls = await self.file_upload.upload_multiple(files, "document", "assets/documents")
        all_urls = doc.get("document_urls", []) + urls

        await self.assets.update_one(
            {"_id": oid},
            {"$set": {"document_urls": all_urls, "updated_at": datetime.now(timezone.utc)}},
        )
        return await self.get_by_id(asset_id)

    async def get_history(
        self,
        asset_id: str,
        params: PaginationParams,
    ) -> PaginatedResponse[AssetHistoryResponse]:
        validate_object_id(asset_id)
        query = {"asset_id": asset_id}

        def serializer(doc):
            return AssetHistoryResponse(
                id=str(doc["_id"]),
                asset_id=doc["asset_id"],
                action=doc["action"],
                performed_by=doc["performed_by"],
                performed_by_name=doc.get("performed_by_name"),
                old_value=doc.get("old_value"),
                new_value=doc.get("new_value"),
                notes=doc.get("notes"),
                created_at=doc["created_at"],
            )

        return await paginate(self.history, query, params, serializer)

    async def update_status(self, asset_id: str, new_status: AssetStatus, current_user: UserResponse, notes: Optional[str] = None) -> AssetResponse:
        """Update asset status - used by allocation, maintenance, audit modules."""
        oid = validate_object_id(asset_id)
        existing = await self.assets.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Asset not found")

        old_status = existing.get("status")
        await self.assets.update_one(
            {"_id": oid},
            {"$set": {"status": new_status.value, "updated_at": datetime.now(timezone.utc)}},
        )

        await self._record_history(
            asset_id, "status_changed", current_user,
            old_value={"status": old_status},
            new_value={"status": new_status.value},
            notes=notes,
        )
        return await self.get_by_id(asset_id)
