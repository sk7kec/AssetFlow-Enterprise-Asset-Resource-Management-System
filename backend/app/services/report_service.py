"""
Reports service - asset utilization, department summary, maintenance report,
booking heatmap. Export to CSV, Excel, PDF.
"""

import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.dashboard import (
    AssetUtilizationReport,
    BookingHeatmapItem,
    DepartmentSummaryReport,
    MaintenanceReportItem,
    ReportFilter,
)


class ReportService:
    """Business logic for report generation and export."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def asset_utilization(self, filters: ReportFilter) -> List[AssetUtilizationReport]:
        """Calculate asset utilization based on allocations and bookings."""
        query: Dict[str, Any] = {"status": {"$nin": ["disposed", "retired"]}}
        if filters.category_id:
            query["category_id"] = filters.category_id

        reports = []
        async for asset in self.db[Collections.ASSETS].find(query):
            asset_id = str(asset["_id"])
            total_allocations = await self.db[Collections.ALLOCATIONS].count_documents({"asset_id": asset_id})
            total_bookings = await self.db[Collections.BOOKINGS].count_documents({"resource_id": asset_id})
            maintenance_count = await self.db[Collections.MAINTENANCE_REQUESTS].count_documents({"asset_id": asset_id})

            cat_name = "Unknown"
            if asset.get("category_id"):
                cat = await self.db[Collections.ASSET_CATEGORIES].find_one({"_id": ObjectId(asset["category_id"])})
                cat_name = cat.get("name", "Unknown") if cat else "Unknown"

            utilization = min(100.0, (total_allocations + total_bookings) * 10)

            reports.append(AssetUtilizationReport(
                asset_id=asset_id,
                asset_tag=asset.get("asset_tag", ""),
                asset_name=asset.get("name", ""),
                category=cat_name,
                total_allocations=total_allocations,
                total_bookings=total_bookings,
                maintenance_count=maintenance_count,
                utilization_percentage=utilization,
            ))

        return sorted(reports, key=lambda x: x.utilization_percentage, reverse=True)

    async def department_summary(self, filters: ReportFilter) -> List[DepartmentSummaryReport]:
        """Department-level asset and employee summary."""
        query: Dict[str, Any] = {"is_active": True}
        reports = []

        async for dept in self.db[Collections.DEPARTMENTS].find(query):
            dept_id = str(dept["_id"])
            total_employees = await self.db[Collections.EMPLOYEES].count_documents({"department_id": dept_id, "is_active": True})
            total_assets = await self.db[Collections.ASSETS].count_documents({"department_id": dept_id})
            allocated_assets = await self.db[Collections.ASSETS].count_documents({"department_id": dept_id, "status": "allocated"})
            maintenance_requests = await self.db[Collections.MAINTENANCE_REQUESTS].count_documents({})

            reports.append(DepartmentSummaryReport(
                department_id=dept_id,
                department_name=dept.get("name", ""),
                total_employees=total_employees,
                total_assets=total_assets,
                allocated_assets=allocated_assets,
                maintenance_requests=maintenance_requests,
            ))

        return reports

    async def maintenance_report(self, filters: ReportFilter) -> List[MaintenanceReportItem]:
        """Maintenance requests report with resolution time."""
        query: Dict[str, Any] = {}
        if filters.start_date:
            query["created_at"] = {"$gte": datetime.fromisoformat(filters.start_date)}
        if filters.end_date:
            query.setdefault("created_at", {})["$lte"] = datetime.fromisoformat(filters.end_date)

        reports = []
        async for req in self.db[Collections.MAINTENANCE_REQUESTS].find(query).sort("created_at", -1):
            asset_tag = ""
            if req.get("asset_id"):
                asset = await self.db[Collections.ASSETS].find_one({"_id": ObjectId(req["asset_id"])})
                asset_tag = asset.get("asset_tag", "") if asset else ""

            resolution_days = None
            if req.get("resolved_at") and req.get("created_at"):
                delta = req["resolved_at"] - req["created_at"]
                resolution_days = round(delta.total_seconds() / 86400, 1)

            reports.append(MaintenanceReportItem(
                request_id=str(req["_id"]),
                asset_tag=asset_tag,
                title=req["title"],
                priority=req["priority"],
                status=req["status"],
                raised_by=req.get("raised_by_name", req.get("raised_by", "")),
                created_at=req["created_at"],
                resolved_at=req.get("resolved_at"),
                resolution_days=resolution_days,
            ))

        return reports

    async def booking_heatmap(self, filters: ReportFilter) -> List[BookingHeatmapItem]:
        """Booking frequency heatmap by date and type."""
        pipeline = [
            {"$group": {
                "_id": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$start_time"}}, "type": "$booking_type"},
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id.date": 1}},
        ]

        items = []
        async for item in self.db[Collections.BOOKINGS].aggregate(pipeline):
            items.append(BookingHeatmapItem(
                date=item["_id"]["date"],
                booking_count=item["count"],
                booking_type=item["_id"]["type"],
            ))
        return items

    async def export_csv(self, data: List[Dict[str, Any]], filename: str = "report") -> bytes:
        """Export data to CSV format."""
        import csv
        if not data:
            return b"No data"

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys() if isinstance(data[0], dict) else data[0].model_dump().keys())
        writer.writeheader()
        for row in data:
            if hasattr(row, "model_dump"):
                writer.writerow(row.model_dump())
            else:
                writer.writerow(row)

        return output.getvalue().encode("utf-8")

    async def export_excel(self, data: List[Dict[str, Any]], sheet_name: str = "Report") -> bytes:
        """Export data to Excel format."""
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = sheet_name

        if not data:
            return b"No data"

        rows = [item.model_dump() if hasattr(item, "model_dump") else item for item in data]
        headers = list(rows[0].keys())
        ws.append(headers)
        for row in rows:
            ws.append([row.get(h) for h in headers])

        output = io.BytesIO()
        wb.save(output)
        return output.getvalue()

    async def export_pdf(self, title: str, data: List[Dict[str, Any]]) -> bytes:
        """Export data to PDF format."""
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        output = io.BytesIO()
        doc = SimpleDocTemplate(output, pagesize=landscape(A4))
        styles = getSampleStyleSheet()
        elements = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

        if data:
            rows = [item.model_dump() if hasattr(item, "model_dump") else item for item in data]
            headers = list(rows[0].keys())
            table_data = [headers] + [[str(row.get(h, "")) for h in headers] for row in rows]
            table = Table(table_data)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ]))
            elements.append(table)

        doc.build(elements)
        return output.getvalue()
