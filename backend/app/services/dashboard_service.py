"""
Dashboard service - KPIs, charts, statistics for admin overview.
"""

from datetime import date, datetime, timezone
from typing import Any, Dict, List

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.dashboard import (
    ChartDataPoint,
    DashboardCharts,
    DashboardKPIs,
    DashboardResponse,
)
from app.schemas.auth import UserResponse


class DashboardService:
    """Aggregates data for dashboard KPIs and charts."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def get_dashboard(self, current_user: UserResponse) -> DashboardResponse:
        today = date.today().isoformat()
        now = datetime.now(timezone.utc)

        # KPIs
        total_assets = await self.db[Collections.ASSETS].count_documents({})
        assets_available = await self.db[Collections.ASSETS].count_documents({"status": "available"})
        assets_allocated = await self.db[Collections.ASSETS].count_documents({"status": "allocated"})
        assets_under_maintenance = await self.db[Collections.ASSETS].count_documents({"status": "under_maintenance"})
        assets_overdue = await self.db[Collections.ALLOCATIONS].count_documents({"status": "overdue"})
        todays_maintenance = await self.db[Collections.MAINTENANCE_REQUESTS].count_documents({
            "created_at": {"$gte": datetime(now.year, now.month, now.day, tzinfo=timezone.utc)}
        })
        active_bookings = await self.db[Collections.BOOKINGS].count_documents({"status": {"$in": ["upcoming", "active"]}})
        pending_transfers = await self.db[Collections.ALLOCATIONS].count_documents({"transfer_pending": {"$ne": None}})
        active_audits = await self.db[Collections.AUDIT_CYCLES].count_documents({"status": "in_progress"})
        unread_notifications = await self.db[Collections.NOTIFICATIONS].count_documents({
            "user_id": current_user.id, "is_read": False
        })

        kpis = DashboardKPIs(
            total_assets=total_assets,
            assets_available=assets_available,
            assets_allocated=assets_allocated,
            assets_under_maintenance=assets_under_maintenance,
            assets_overdue=assets_overdue,
            todays_maintenance=todays_maintenance,
            active_bookings=active_bookings,
            pending_transfers=pending_transfers,
            active_audits=active_audits,
            unread_notifications=unread_notifications,
        )

        # Charts
        charts = await self._build_charts()

        # Recent activities
        recent = []
        async for log in self.db[Collections.ACTIVITY_LOGS].find().sort("created_at", -1).limit(10):
            recent.append({
                "action": log.get("action"),
                "module": log.get("module"),
                "user_name": log.get("user_name"),
                "created_at": log["created_at"].isoformat(),
            })

        # Upcoming maintenance
        upcoming_maint = []
        async for req in self.db[Collections.MAINTENANCE_REQUESTS].find(
            {"status": {"$in": ["pending", "approved", "in_progress"]}}
        ).sort("created_at", -1).limit(5):
            upcoming_maint.append({
                "id": str(req["_id"]),
                "title": req["title"],
                "priority": req["priority"],
                "status": req["status"],
            })

        # Overdue allocations
        overdue_allocs = []
        async for alloc in self.db[Collections.ALLOCATIONS].find({"status": "overdue"}).limit(5):
            overdue_allocs.append({
                "id": str(alloc["_id"]),
                "asset_id": alloc["asset_id"],
                "employee_id": alloc["employee_id"],
                "expected_return_date": alloc.get("expected_return_date"),
            })

        return DashboardResponse(
            kpis=kpis,
            charts=charts,
            recent_activities=recent,
            upcoming_maintenance=upcoming_maint,
            overdue_allocations=overdue_allocs,
        )

    async def _build_charts(self) -> DashboardCharts:
        # Assets by status
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        assets_by_status = []
        async for item in self.db[Collections.ASSETS].aggregate(status_pipeline):
            assets_by_status.append(ChartDataPoint(label=item["_id"] or "unknown", value=item["count"]))

        # Assets by category
        cat_pipeline = [
            {"$group": {"_id": "$category_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ]
        assets_by_category = []
        async for item in self.db[Collections.ASSETS].aggregate(cat_pipeline):
            cat = await self.db[Collections.ASSET_CATEGORIES].find_one({"_id": item["_id"]})
            label = cat.get("name", "Unknown") if cat else "Unknown"
            assets_by_category.append(ChartDataPoint(label=label, value=item["count"]))

        # Maintenance by priority
        maint_pipeline = [
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
        ]
        maintenance_by_priority = []
        async for item in self.db[Collections.MAINTENANCE_REQUESTS].aggregate(maint_pipeline):
            maintenance_by_priority.append(ChartDataPoint(label=item["_id"] or "unknown", value=item["count"]))

        # Bookings by type
        booking_pipeline = [
            {"$group": {"_id": "$booking_type", "count": {"$sum": 1}}},
        ]
        bookings_by_type = []
        async for item in self.db[Collections.BOOKINGS].aggregate(booking_pipeline):
            bookings_by_type.append(ChartDataPoint(label=item["_id"] or "unknown", value=item["count"]))

        return DashboardCharts(
            assets_by_status=assets_by_status,
            assets_by_category=assets_by_category,
            assets_by_department=[],
            maintenance_by_priority=maintenance_by_priority,
            bookings_by_type=bookings_by_type,
            monthly_allocations=[],
        )
