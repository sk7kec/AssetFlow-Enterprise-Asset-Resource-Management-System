"""
Activity log service - records all user actions across the system.
Stores user, action, date, IP, role, old/new values.
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.organization import ActivityLogResponse
from app.utils.pagination import paginate


class ActivityLogService:
    """Centralized activity logging for audit trail."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.logs = db[Collections.ACTIVITY_LOGS]

    async def log(
        self,
        user_id: str,
        user_name: str,
        user_role: str,
        action: str,
        module: str,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """
        Record an activity log entry.
        Called by services after create/update/delete operations.
        """
        await self.logs.insert_one({
            "user_id": user_id,
            "user_name": user_name,
            "user_role": user_role,
            "action": action,
            "module": module,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "old_value": old_value,
            "new_value": new_value,
            "ip_address": ip_address,
            "created_at": datetime.now(timezone.utc),
        })

    def _serialize(self, doc: Dict[str, Any]) -> ActivityLogResponse:
        return ActivityLogResponse(
            id=str(doc["_id"]),
            user_id=doc["user_id"],
            user_name=doc.get("user_name"),
            user_role=doc["user_role"],
            action=doc["action"],
            module=doc["module"],
            entity_id=doc.get("entity_id"),
            entity_type=doc.get("entity_type"),
            old_value=doc.get("old_value"),
            new_value=doc.get("new_value"),
            ip_address=doc.get("ip_address"),
            created_at=doc["created_at"],
        )

    async def get_logs(
        self,
        params: PaginationParams,
        module: Optional[str] = None,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
    ) -> PaginatedResponse[ActivityLogResponse]:
        """Retrieve activity logs with optional filters."""
        query: Dict[str, Any] = {}
        if module:
            query["module"] = module
        if user_id:
            query["user_id"] = user_id
        if action:
            query["action"] = action

        return await paginate(self.logs, query, params, self._serialize)
