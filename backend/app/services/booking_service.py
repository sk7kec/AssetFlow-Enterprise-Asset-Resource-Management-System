"""
Resource booking service - room, vehicle, equipment bookings.
Calendar APIs with overlap validation.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import BookingCreate, BookingResponse, BookingStatus, BookingUpdate
from app.services.activity_log_service import ActivityLogService
from app.services.notification_service import NotificationService
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate


class BookingService:
    """Business logic for resource booking management."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.bookings = db[Collections.BOOKINGS]
        self.assets = db[Collections.ASSETS]
        self.activity_log = ActivityLogService(db)
        self.notifications = NotificationService(db)

    def _serialize(self, doc: Dict[str, Any], resource_name: Optional[str] = None) -> BookingResponse:
        return BookingResponse(
            id=str(doc["_id"]),
            booking_type=doc["booking_type"],
            resource_id=doc["resource_id"],
            resource_name=resource_name,
            title=doc["title"],
            booked_by=doc["booked_by"],
            booked_by_name=doc.get("booked_by_name"),
            start_time=doc["start_time"],
            end_time=doc["end_time"],
            status=doc["status"],
            notes=doc.get("notes"),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    async def _check_overlap(self, resource_id: str, start_time: datetime, end_time: datetime, exclude_id: Optional[str] = None) -> None:
        """Validate no overlapping bookings for the same resource."""
        query: Dict[str, Any] = {
            "resource_id": resource_id,
            "status": {"$nin": [BookingStatus.CANCELLED.value, BookingStatus.COMPLETED.value]},
            "$or": [
                {"start_time": {"$lt": end_time}, "end_time": {"$gt": start_time}},
            ],
        }
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}

        overlap = await self.bookings.find_one(query)
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Booking overlaps with existing booking '{overlap.get('title')}' ({overlap['start_time']} - {overlap['end_time']})",
            )

    async def create(self, data: BookingCreate, current_user: UserResponse, ip_address: Optional[str] = None) -> BookingResponse:
        asset_oid = validate_object_id(data.resource_id, "resource_id")
        asset = await self.assets.find_one({"_id": asset_oid, "is_bookable": True})
        if not asset:
            raise HTTPException(status_code=404, detail="Bookable resource not found")

        await self._check_overlap(data.resource_id, data.start_time, data.end_time)

        now = datetime.now(timezone.utc)
        booking_status = BookingStatus.UPCOMING.value
        if data.start_time <= now <= data.end_time:
            booking_status = BookingStatus.ACTIVE.value

        doc = {
            "booking_type": data.booking_type.value,
            "resource_id": data.resource_id,
            "title": data.title,
            "booked_by": current_user.id,
            "booked_by_name": current_user.full_name,
            "start_time": data.start_time,
            "end_time": data.end_time,
            "status": booking_status,
            "notes": data.notes,
            "created_at": now,
            "updated_at": now,
        }

        result = await self.bookings.insert_one(doc)
        doc["_id"] = result.inserted_id

        await self.activity_log.log(
            user_id=current_user.id, user_name=current_user.full_name,
            user_role=current_user.role, action="create", module="bookings",
            entity_id=str(result.inserted_id), entity_type="booking",
            new_value={"title": data.title, "resource_id": data.resource_id},
            ip_address=ip_address,
        )

        return self._serialize(doc, asset.get("name"))

    async def get_by_id(self, booking_id: str) -> BookingResponse:
        oid = validate_object_id(booking_id)
        doc = await self.bookings.find_one({"_id": oid})
        if not doc:
            raise HTTPException(status_code=404, detail="Booking not found")
        resource_name = None
        if doc.get("resource_id"):
            asset = await self.assets.find_one({"_id": ObjectId(doc["resource_id"])})
            resource_name = asset.get("name") if asset else None
        return self._serialize(doc, resource_name)

    async def list_bookings(
        self, params: PaginationParams,
        booking_type: Optional[str] = None,
        status_filter: Optional[str] = None,
        resource_id: Optional[str] = None,
        booked_by: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> PaginatedResponse[BookingResponse]:
        query: Dict[str, Any] = {}
        if booking_type:
            query["booking_type"] = booking_type
        if status_filter:
            query["status"] = status_filter
        if resource_id:
            query["resource_id"] = resource_id
        if booked_by:
            query["booked_by"] = booked_by
        if start_date:
            query["start_time"] = {"$gte": start_date}
        if end_date:
            query.setdefault("end_time", {})["$lte"] = end_date

        async def serializer(doc):
            resource_name = None
            if doc.get("resource_id"):
                asset = await self.assets.find_one({"_id": ObjectId(doc["resource_id"])})
                resource_name = asset.get("name") if asset else None
            return self._serialize(doc, resource_name)

        return await paginate(self.bookings, query, params, serializer)

    async def get_calendar(self, start_date: datetime, end_date: datetime, resource_id: Optional[str] = None) -> list:
        """Calendar API - return bookings in date range for calendar view."""
        query: Dict[str, Any] = {
            "start_time": {"$gte": start_date},
            "end_time": {"$lte": end_date},
            "status": {"$nin": [BookingStatus.CANCELLED.value]},
        }
        if resource_id:
            query["resource_id"] = resource_id

        events = []
        async for doc in self.bookings.find(query).sort("start_time", 1):
            events.append({
                "id": str(doc["_id"]),
                "title": doc["title"],
                "start": doc["start_time"].isoformat(),
                "end": doc["end_time"].isoformat(),
                "type": doc["booking_type"],
                "status": doc["status"],
                "resource_id": doc["resource_id"],
            })
        return events

    async def update(self, booking_id: str, data: BookingUpdate, current_user: UserResponse) -> BookingResponse:
        oid = validate_object_id(booking_id)
        existing = await self.bookings.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Booking not found")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        if "status" in update_data and hasattr(update_data["status"], "value"):
            update_data["status"] = update_data["status"].value

        # Check overlap if times changed
        start = update_data.get("start_time", existing["start_time"])
        end = update_data.get("end_time", existing["end_time"])
        if "start_time" in update_data or "end_time" in update_data:
            await self._check_overlap(existing["resource_id"], start, end, booking_id)

        update_data["updated_at"] = datetime.now(timezone.utc)
        await self.bookings.update_one({"_id": oid}, {"$set": update_data})
        return await self.get_by_id(booking_id)

    async def cancel(self, booking_id: str, current_user: UserResponse) -> BookingResponse:
        oid = validate_object_id(booking_id)
        existing = await self.bookings.find_one({"_id": oid})
        if not existing:
            raise HTTPException(status_code=404, detail="Booking not found")
        if existing["status"] in [BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value]:
            raise HTTPException(status_code=400, detail="Booking cannot be cancelled")

        await self.bookings.update_one(
            {"_id": oid},
            {"$set": {"status": BookingStatus.CANCELLED.value, "updated_at": datetime.now(timezone.utc)}},
        )
        return await self.get_by_id(booking_id)
