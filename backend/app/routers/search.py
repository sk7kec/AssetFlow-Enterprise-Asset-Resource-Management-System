"""
Global Search router — Part 14.

Endpoints:
  GET /search                       Search across all modules simultaneously
  GET /search/{module}              Search within a specific module with pagination

Searchable modules: assets | employees | departments | bookings | maintenance | audits

Global search returns grouped results (max 10 per module) with entity type tags.
Module search returns full paginated results with sort support.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Global Search"])

VALID_MODULES = ["assets", "employees", "departments", "bookings", "maintenance", "audits"]


@router.get(
    "",
    summary="Global search across all modules",
    description=(
        "Performs a simultaneous search across all system modules: assets, employees, "
        "departments, bookings, maintenance requests, and audit cycles. "
        "Returns grouped results by entity type with a maximum of 10 results per module. "
        "Query must be at least 2 characters. "
        "Use `modules` to scope the search to specific entity types."
    ),
    response_model=Dict[str, Any],
)
async def global_search(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    modules: Optional[str] = Query(
        None,
        description="Comma-separated list of modules to search: assets,employees,departments,bookings,maintenance,audits"
    ),
    current_user: UserResponse = Depends(get_current_user),
) -> Dict[str, Any]:
    module_list = None
    if modules:
        module_list = [m.strip() for m in modules.split(",") if m.strip() in VALID_MODULES]

    service = SearchService(get_database())
    return await service.global_search(q, module_list)


@router.get(
    "/{module}",
    response_model=PaginatedResponse,
    summary="Search within a specific module",
    description=(
        "Full paginated search within a specific system module. "
        "Returns complete document data with pagination metadata. "
        f"Valid modules: {', '.join(VALID_MODULES)}."
    ),
)
async def search_module(
    module: str,
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse:
    from fastapi import HTTPException
    if module not in VALID_MODULES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid module '{module}'. Valid modules: {', '.join(VALID_MODULES)}"
        )

    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = SearchService(get_database())
    return await service.search_module(module, q, params)
