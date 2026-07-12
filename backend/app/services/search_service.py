"""
Global search service - search across assets, employees, departments,
bookings, maintenance, and audits with pagination and sorting.
"""

from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import Collections
from app.schemas.common import PaginatedResponse, PaginationParams
from app.utils.pagination import build_search_filter, paginate


class SearchService:
    """Unified search across all modules."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def global_search(
        self,
        query: str,
        modules: Optional[List[str]] = None,
        params: Optional[PaginationParams] = None,
    ) -> Dict[str, Any]:
        """
        Search across multiple modules simultaneously.
        Returns grouped results by module type.
        """
        if not query or len(query) < 2:
            return {"results": {}, "total": 0, "query": query}

        search_modules = modules or ["assets", "employees", "departments", "bookings", "maintenance", "audits"]
        results: Dict[str, List[Dict[str, Any]]] = {}
        total = 0

        if "assets" in search_modules:
            assets = await self._search_assets(query, 10)
            results["assets"] = assets
            total += len(assets)

        if "employees" in search_modules:
            employees = await self._search_employees(query, 10)
            results["employees"] = employees
            total += len(employees)

        if "departments" in search_modules:
            departments = await self._search_departments(query, 10)
            results["departments"] = departments
            total += len(departments)

        if "bookings" in search_modules:
            bookings = await self._search_bookings(query, 10)
            results["bookings"] = bookings
            total += len(bookings)

        if "maintenance" in search_modules:
            maintenance = await self._search_maintenance(query, 10)
            results["maintenance"] = maintenance
            total += len(maintenance)

        if "audits" in search_modules:
            audits = await self._search_audits(query, 10)
            results["audits"] = audits
            total += len(audits)

        return {"results": results, "total": total, "query": query}

    async def _search_assets(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["name", "asset_tag", "serial_number", "manufacturer"])
        items = []
        async for doc in self.db[Collections.ASSETS].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "asset",
                "title": doc.get("name"),
                "subtitle": doc.get("asset_tag"),
                "status": doc.get("status"),
            })
        return items

    async def _search_employees(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["full_name", "employee_code", "email", "designation"])
        items = []
        async for doc in self.db[Collections.EMPLOYEES].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "employee",
                "title": doc.get("full_name"),
                "subtitle": doc.get("employee_code"),
                "department_id": doc.get("department_id"),
            })
        return items

    async def _search_departments(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["name", "code", "description"])
        items = []
        async for doc in self.db[Collections.DEPARTMENTS].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "department",
                "title": doc.get("name"),
                "subtitle": doc.get("code"),
            })
        return items

    async def _search_bookings(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["title", "notes"])
        items = []
        async for doc in self.db[Collections.BOOKINGS].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "booking",
                "title": doc.get("title"),
                "subtitle": doc.get("booking_type"),
                "status": doc.get("status"),
            })
        return items

    async def _search_maintenance(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["title", "description"])
        items = []
        async for doc in self.db[Collections.MAINTENANCE_REQUESTS].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "maintenance",
                "title": doc.get("title"),
                "subtitle": doc.get("priority"),
                "status": doc.get("status"),
            })
        return items

    async def _search_audits(self, query: str, limit: int) -> List[Dict[str, Any]]:
        filter_query = build_search_filter(query, ["title", "description"])
        items = []
        async for doc in self.db[Collections.AUDIT_CYCLES].find(filter_query).limit(limit):
            items.append({
                "id": str(doc["_id"]),
                "type": "audit",
                "title": doc.get("title"),
                "subtitle": doc.get("status"),
            })
        return items

    async def search_module(
        self,
        module: str,
        query: str,
        params: PaginationParams,
    ) -> PaginatedResponse:
        """Search within a single module with full pagination."""
        searchers = {
            "assets": (Collections.ASSETS, ["name", "asset_tag", "serial_number"]),
            "employees": (Collections.EMPLOYEES, ["full_name", "employee_code", "email"]),
            "departments": (Collections.DEPARTMENTS, ["name", "code"]),
            "bookings": (Collections.BOOKINGS, ["title"]),
            "maintenance": (Collections.MAINTENANCE_REQUESTS, ["title", "description"]),
            "audits": (Collections.AUDIT_CYCLES, ["title"]),
        }

        if module not in searchers:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Invalid module: {module}")

        collection_name, fields = searchers[module]
        filter_query = build_search_filter(query, fields)

        def serializer(doc):
            doc["id"] = str(doc.pop("_id"))
            return doc

        return await paginate(self.db[collection_name], filter_query, params, serializer)
