"""Dashboard, notification, and report schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ─── Dashboard ────────────────────────────────────────────────────

class DashboardKPIs(BaseModel):
    total_assets: int = 0
    assets_available: int = 0
    assets_allocated: int = 0
    assets_under_maintenance: int = 0
    assets_overdue: int = 0
    todays_maintenance: int = 0
    active_bookings: int = 0
    pending_transfers: int = 0
    active_audits: int = 0
    unread_notifications: int = 0


class ChartDataPoint(BaseModel):
    label: str
    value: int


class DashboardCharts(BaseModel):
    assets_by_status: List[ChartDataPoint] = []
    assets_by_category: List[ChartDataPoint] = []
    assets_by_department: List[ChartDataPoint] = []
    maintenance_by_priority: List[ChartDataPoint] = []
    bookings_by_type: List[ChartDataPoint] = []
    monthly_allocations: List[ChartDataPoint] = []


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    charts: DashboardCharts
    recent_activities: List[Dict[str, Any]] = []
    upcoming_maintenance: List[Dict[str, Any]] = []
    overdue_allocations: List[Dict[str, Any]] = []


# ─── Notifications ───────────────────────────────────────────────

class NotificationType(str):
    REMINDER = "reminder"
    TRANSFER = "transfer"
    MAINTENANCE = "maintenance"
    AUDIT = "audit"
    ALLOCATION = "allocation"
    BOOKING = "booking"
    SYSTEM = "system"


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    notification_type: str = "system"
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None
    is_read: bool = False
    created_at: datetime


class UnreadCountResponse(BaseModel):
    count: int


# ─── Reports ──────────────────────────────────────────────────────

class ReportFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    department_id: Optional[str] = None
    category_id: Optional[str] = None


class AssetUtilizationReport(BaseModel):
    asset_id: str
    asset_tag: str
    asset_name: str
    category: str
    total_allocations: int
    total_bookings: int
    maintenance_count: int
    utilization_percentage: float


class DepartmentSummaryReport(BaseModel):
    department_id: str
    department_name: str
    total_employees: int
    total_assets: int
    allocated_assets: int
    maintenance_requests: int


class MaintenanceReportItem(BaseModel):
    request_id: str
    asset_tag: str
    title: str
    priority: str
    status: str
    raised_by: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_days: Optional[float] = None


class BookingHeatmapItem(BaseModel):
    date: str
    booking_count: int
    booking_type: str
