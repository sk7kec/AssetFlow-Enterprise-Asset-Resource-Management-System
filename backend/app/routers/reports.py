"""
Reports router — Part 11.

Endpoints:
  GET /reports/asset-utilization          Asset utilization report
  GET /reports/department-summary         Department-level summary report
  GET /reports/maintenance                Maintenance requests report
  GET /reports/booking-heatmap            Booking frequency heatmap

Export endpoints (streaming file downloads):
  GET /reports/export/asset-utilization/csv
  GET /reports/export/asset-utilization/excel
  GET /reports/export/asset-utilization/pdf
  GET /reports/export/maintenance/csv
  GET /reports/export/maintenance/excel
  GET /reports/export/maintenance/pdf
  GET /reports/export/department/csv
  GET /reports/export/department/excel
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_asset_manager
from app.schemas.auth import UserResponse
from app.schemas.dashboard import (
    AssetUtilizationReport,
    BookingHeatmapItem,
    DepartmentSummaryReport,
    MaintenanceReportItem,
    ReportFilter,
)
from app.services.report_service import ReportService
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])


def _make_filter(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    department_id: Optional[str] = None,
    category_id: Optional[str] = None,
) -> ReportFilter:
    return ReportFilter(
        start_date=start_date,
        end_date=end_date,
        department_id=department_id,
        category_id=category_id,
    )


# ─── Data Endpoints ────────────────────────────────────────────────

@router.get(
    "/asset-utilization",
    response_model=List[AssetUtilizationReport],
    summary="Asset utilization report",
    description=(
        "Returns utilization metrics per asset: total allocations, bookings, "
        "maintenance count, and a calculated utilization percentage. "
        "Results are sorted by utilization descending."
    ),
)
async def asset_utilization_report(
    start_date: Optional[str] = Query(None, description="ISO date: 2026-01-01"),
    end_date: Optional[str] = Query(None, description="ISO date: 2026-12-31"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    current_user: UserResponse = Depends(require_asset_manager),
) -> List[AssetUtilizationReport]:
    filters = _make_filter(start_date, end_date, category_id=category_id)
    service = ReportService(get_database())
    return await service.asset_utilization(filters)


@router.get(
    "/department-summary",
    response_model=List[DepartmentSummaryReport],
    summary="Department summary report",
    description=(
        "Returns a per-department summary of employees, total assets, "
        "allocated assets, and maintenance requests."
    ),
)
async def department_summary_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
) -> List[DepartmentSummaryReport]:
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    return await service.department_summary(filters)


@router.get(
    "/maintenance",
    response_model=List[MaintenanceReportItem],
    summary="Maintenance report",
    description=(
        "Returns all maintenance requests with resolution time calculations. "
        "Sorted by created date descending. Filterable by date range."
    ),
)
async def maintenance_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
) -> List[MaintenanceReportItem]:
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    return await service.maintenance_report(filters)


@router.get(
    "/booking-heatmap",
    response_model=List[BookingHeatmapItem],
    summary="Booking heatmap",
    description=(
        "Returns booking frequency grouped by date and booking type. "
        "Use this data to render a calendar heatmap in the frontend."
    ),
)
async def booking_heatmap_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
) -> List[BookingHeatmapItem]:
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    return await service.booking_heatmap(filters)


# ─── Export: Asset Utilization ─────────────────────────────────────

@router.get(
    "/export/asset-utilization/csv",
    summary="Export asset utilization as CSV",
    description="Download asset utilization report as a CSV file.",
    response_class=Response,
)
async def export_asset_utilization_csv(
    category_id: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(category_id=category_id)
    service = ReportService(get_database())
    data = await service.asset_utilization(filters)
    csv_bytes = await service.export_csv([r.model_dump() for r in data], "asset_utilization")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=asset_utilization.csv"},
    )


@router.get(
    "/export/asset-utilization/excel",
    summary="Export asset utilization as Excel",
    description="Download asset utilization report as an Excel (.xlsx) file.",
    response_class=Response,
)
async def export_asset_utilization_excel(
    category_id: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(category_id=category_id)
    service = ReportService(get_database())
    data = await service.asset_utilization(filters)
    excel_bytes = await service.export_excel(data, "Asset Utilization")
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=asset_utilization.xlsx"},
    )


@router.get(
    "/export/asset-utilization/pdf",
    summary="Export asset utilization as PDF",
    description="Download asset utilization report as a PDF file.",
    response_class=Response,
)
async def export_asset_utilization_pdf(
    category_id: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(category_id=category_id)
    service = ReportService(get_database())
    data = await service.asset_utilization(filters)
    pdf_bytes = await service.export_pdf("Asset Utilization Report", [r.model_dump() for r in data])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=asset_utilization.pdf"},
    )


# ─── Export: Maintenance ───────────────────────────────────────────

@router.get(
    "/export/maintenance/csv",
    summary="Export maintenance report as CSV",
    response_class=Response,
)
async def export_maintenance_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    data = await service.maintenance_report(filters)
    csv_bytes = await service.export_csv([r.model_dump() for r in data], "maintenance")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=maintenance_report.csv"},
    )


@router.get(
    "/export/maintenance/excel",
    summary="Export maintenance report as Excel",
    response_class=Response,
)
async def export_maintenance_excel(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    data = await service.maintenance_report(filters)
    excel_bytes = await service.export_excel(data, "Maintenance Report")
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=maintenance_report.xlsx"},
    )


@router.get(
    "/export/maintenance/pdf",
    summary="Export maintenance report as PDF",
    response_class=Response,
)
async def export_maintenance_pdf(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter(start_date, end_date)
    service = ReportService(get_database())
    data = await service.maintenance_report(filters)
    pdf_bytes = await service.export_pdf("Maintenance Report", [r.model_dump() for r in data])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=maintenance_report.pdf"},
    )


# ─── Export: Department Summary ────────────────────────────────────

@router.get(
    "/export/department/csv",
    summary="Export department summary as CSV",
    response_class=Response,
)
async def export_department_csv(
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter()
    service = ReportService(get_database())
    data = await service.department_summary(filters)
    csv_bytes = await service.export_csv([r.model_dump() for r in data], "department")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=department_report.csv"},
    )


@router.get(
    "/export/department/excel",
    summary="Export department summary as Excel",
    response_class=Response,
)
async def export_department_excel(
    current_user: UserResponse = Depends(require_asset_manager),
):
    filters = _make_filter()
    service = ReportService(get_database())
    data = await service.department_summary(filters)
    excel_bytes = await service.export_excel(data, "Department Summary")
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=department_report.xlsx"},
    )
