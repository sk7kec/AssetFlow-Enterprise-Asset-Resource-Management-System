"""
Dashboard router — Part 9.

Endpoints:
  GET /dashboard          Full dashboard with KPIs, charts, and recent activity

Returns:
  - KPIs: total assets, available, allocated, under maintenance,
          overdue allocations, today's maintenance, active bookings,
          pending transfers, active audits, unread notifications
  - Charts: assets by status, category, department; maintenance by priority;
            bookings by type; monthly allocations
  - Recent activities (last 10 activity log entries)
  - Upcoming maintenance requests
  - Overdue allocations
"""

from fastapi import APIRouter, Depends

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "",
    response_model=DashboardResponse,
    summary="Get dashboard data",
    description=(
        "Returns the complete dashboard payload including KPI metrics, "
        "chart data, recent activity log, upcoming maintenance queue, "
        "and overdue allocation alerts. "
        "Authenticated access required — all roles can view."
    ),
)
async def get_dashboard(
    current_user: UserResponse = Depends(get_current_user),
) -> DashboardResponse:
    service = DashboardService(get_database())
    return await service.get_dashboard(current_user)
