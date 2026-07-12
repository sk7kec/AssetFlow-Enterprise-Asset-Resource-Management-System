"""
Asset category service - CRUD with warranty field validation.
Admin-only operations enforced at router level.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.asset import AssetCategoryCreate, AssetCategoryResponse, AssetCategoryUpdate
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.services.activity_log_service import ActivityLogService
from app.utils.object_id import validate_object_id
from app.utils.pagination import build_search_filter, paginate


class AssetCategoryService:
    """Business logic for asset category management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.categories = db[Collections.ASSET_CATEGORIES]
        self.assets = db[Collections.ASSETS]
        self.activity_log = ActivityLogService(db)

    def _serialize(self, doc: Dict[str, Any], asset_count: int = 0) -> AssetCategoryResponse:
        return AssetCategoryResponse(
            id=str(doc["_id"]),
            name=doc["name"],
            description=doc.get("description"),
            depreciation_years=doc.get("depreciation_years"),
            warranty_months=doc.get("warranty_months"),
            requires_serial_number=doc.get("requires_serial_number", True),
            is_bookable=doc.get("is_bookable", False),
            custom_fields=doc.get("custom_fields", []),
            asset_count=asset_count,
            is_active=doc.get("is_active", True),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def create(
        self,
        data: AssetCategoryCreate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AssetCategoryResponse:
        existing = await self.categories.find_one({"name": {"$regex": f"^{data.name}$", "$options": "i"}})
        if existing:
            raise HTTPException(status_code=409, detail="Category name already exists")

        now = datetime.now(timezone.utc)
        doc = {
            "name": data.name.strip(),
            "description": data.description,
            "depreciation_years": data.depreciation_years,
            "warranty_months": data.warranty_months,
            "requires_serial_number": data.requires_serial_number,
            "is_bookable": data.is_bookable,
            "custom_fields": data.custom_fields or [],
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.categories.insert_one(doc)
        doc["_id"] = result.inserted_id

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="create",
            module="asset_categories",
            entity_id=str(result.inserted_id),
            entity_type="asset_category",
            new_value={"name": data.name},
            ip_address=ip_address,
        )

        return self._serialize(doc)

    async def get_by_id(self, category_id: str) -> AssetCategoryResponse:
        oid = validate_object_id(category_id)
        doc = await self.categories.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Category not found")
        count = await self.assets.count_documents({"category_id": category_id})
        return self._serialize(doc, count)

    async def list_all(
        self,
        params: PaginationParams,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> PaginatedResponse[AssetCategoryResponse]:
        query: Dict[str, Any] = {}
        if is_active is not None:
            query["is_active"] = is_active
        if search:
            query.update(build_search_filter(search, ["name", "description"]))

        async def serializer(doc):
            count = await self.assets.count_documents({"category_id": str(doc["_id"])})
            return self._serialize(doc, count)

        return await paginate(self.categories, query, params, serializer)

    async def update(
        self,
        category_id: str,
        data: AssetCategoryUpdate,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> AssetCategoryResponse:
        oid = validate_object_id(category_id)
        existing = await self.categories.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.categories.update_one({"_id": oid}, {"$set": update_data})

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="update",
            module="asset_categories",
            entity_id=category_id,
            entity_type="asset_category",
            old_value={k: existing.get(k) for k in update_data},
            new_value=update_data,
            ip_address=ip_address,
        )

        return await self.get_by_id(category_id)

    async def delete(
        self,
        category_id: str,
        current_user: UserResponse,
        ip_address: Optional[str] = None,
    ) -> Dict[str, str]:
        oid = validate_object_id(category_id)
        existing = await self.categories.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")

        asset_count = await self.assets.count_documents({"category_id": category_id, "status": {"$ne": "disposed"}})
        if asset_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete category with {asset_count} active assets",
            )

        await self.categories.update_one(
            {"_id": oid},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        )

        await self.activity_log.log(
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            action="delete",
            module="asset_categories",
            entity_id=category_id,
            entity_type="asset_category",
            ip_address=ip_address,
        )

        return {"message": "Category deactivated successfully"}
