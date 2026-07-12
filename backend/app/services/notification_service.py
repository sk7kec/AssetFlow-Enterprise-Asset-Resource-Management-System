"""
Notification service - create, read, mark read, unread count.
Supports reminder, transfer, maintenance, and audit notifications.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.dashboard import NotificationResponse, UnreadCountResponse
from app.utils.object_id import validate_object_id
from app.utils.pagination import paginate


class NotificationService:
    """Business logic for in-app notifications."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.notifications = db[Collections.NOTIFICATIONS]

    async def create(
        self,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "system",
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> NotificationResponse:
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "notification_type": notification_type,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "is_read": False,
            "created_at": now,
        }
        result = await self.notifications.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._serialize(doc)

    def _serialize(self, doc: Dict[str, Any]) -> NotificationResponse:
        return NotificationResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            title=doc["title"],
            message=doc["message"],
            notification_type=doc["notification_type"],
            entity_id=doc.get("entity_id"),
            entity_type=doc.get("entity_type"),
            is_read=doc.get("is_read", False),
            created_at=doc["created_at"],
        )

    async def get_user_notifications(
        self,
        user_id: str,
        params: PaginationParams,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None,
    ) -> PaginatedResponse[NotificationResponse]:
        query: Dict[str, Any] = {"user_id": user_id}
        if is_read is not None:
            query["is_read"] = is_read
        if notification_type:
            query["notification_type"] = notification_type
        return await paginate(self.notifications, query, params, self._serialize)

    async def get_unread_count(self, user_id: str) -> UnreadCountResponse:
        count = await self.notifications.count_documents({"user_id": user_id, "is_read": False})
        return UnreadCountResponse(count=count)

    async def mark_as_read(self, notification_id: str, user_id: str) -> NotificationResponse:
        oid = validate_object_id(notification_id)
        doc = await self.notifications.find_one_and_update(
            {"_id": oid, "user_id": user_id},
            {"$set": {"is_read": True}},
            return_document=True,
        )
        if not doc:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Notification not found")
        return self._serialize(doc)

    async def mark_all_read(self, user_id: str) -> Dict[str, str]:
        await self.notifications.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}},
        )
        return {"message": "All notifications marked as read"}

    async def send_reminders(self) -> int:
        """Send reminder notifications for upcoming bookings and overdue allocations."""
        # Called by a scheduled task - returns count of reminders sent
        count = 0
        now = datetime.now(timezone.utc)

        # Overdue allocation reminders
        from app.database import Collections
        allocations = self.db[Collections.ALLOCATIONS]
        overdue = allocations.find({"status": "overdue"})
        async for alloc in overdue:
            await self.create(
                user_id=alloc["employee_id"],
                title="Overdue Asset Return",
                message="You have an overdue asset allocation. Please return it promptly.",
                notification_type="reminder",
                entity_id=str(alloc["_id"]),
                entity_type="allocation",
            )
            count += 1

        return count
