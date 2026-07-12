"""
Asset Allocation router — Part 5.

Endpoints:
  POST   /allocations                           Allocate an asset to an employee
  GET    /allocations                           List all allocations (filtered)
  GET    /allocations/{id}                      Get allocation by ID
  POST   /allocations/{id}/return               Return an asset
  POST   /allocations/{id}/transfer             Request transfer to another employee
  POST   /allocations/{id}/approve-transfer     Approve or reject transfer
  GET    /allocations/{id}/history              Allocation event history
  POST   /allocations/check-overdue             Mark overdue allocations (admin)
"""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin, require_asset_manager, require_department_head
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    AllocationCreate,
    AllocationHistoryResponse,
    AllocationResponse,
    AllocationReturn,
    TransferApproval,
    TransferCreate,
)
from app.services.allocation_service import AllocationService

router = APIRouter(prefix="/allocations", tags=["Allocations"])


def get_client_ip(request: Request) -> Optional[str]:
    """Extract real client IP from request headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post(
    "",
    response_model=AllocationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Allocate an asset to an employee",
    description=(
        "Assigns an available asset to an employee. "
        "Performs conflict detection (double-allocation prevention). "
        "Sets asset status to `allocated`. Requires Asset Manager or Admin role."
    ),
)
async def allocate_asset(
    data: AllocationCreate,
    request: Request,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AllocationResponse:
    service = AllocationService(get_database())
    return await service.allocate(data, current_user, get_client_ip(request))


@router.get(
    "",
    response_model=PaginatedResponse[AllocationResponse],
    summary="List allocations",
    description="List all allocations with filtering by status, employee, and asset. Paginated and sorted.",
)
async def list_allocations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("created_at", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    employee_id: Optional[str] = Query(None, description="Filter by employee ID"),
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[AllocationResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = AllocationService(get_database())
    return await service.list_allocations(params, status_filter, employee_id, asset_id)


@router.get(
    "/overdue",
    response_model=PaginatedResponse[AllocationResponse],
    summary="List overdue allocations",
    description="Returns allocations past their expected return date.",
)
async def list_overdue_allocations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(require_asset_manager),
) -> PaginatedResponse[AllocationResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by="expected_return_date", sort_order="asc")
    service = AllocationService(get_database())
    return await service.list_allocations(params, status_filter="overdue")


@router.get(
    "/{allocation_id}",
    response_model=AllocationResponse,
    summary="Get allocation by ID",
    description="Retrieve a specific allocation record with enriched employee and asset details.",
)
async def get_allocation(
    allocation_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> AllocationResponse:
    service = AllocationService(get_database())
    # Reuse list with a synthetic query — or add get_by_id to service
    from app.utils.object_id import validate_object_id
    from bson import ObjectId
    from fastapi import HTTPException
    db = get_database()
    oid = validate_object_id(allocation_id)
    doc = await db["allocations"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Allocation not found")
    extras = await service._get_extras(doc)
    return service._serialize(doc, **extras)


@router.post(
    "/{allocation_id}/return",
    response_model=AllocationResponse,
    summary="Return an asset",
    description=(
        "Mark an active allocation as returned. "
        "Sets asset status back to `available`. "
        "Optionally records condition of returned asset."
    ),
)
async def return_asset(
    allocation_id: str,
    data: AllocationReturn,
    request: Request,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AllocationResponse:
    service = AllocationService(get_database())
    return await service.return_asset(allocation_id, data, current_user, get_client_ip(request))


@router.post(
    "/{allocation_id}/transfer",
    response_model=MessageResponse,
    summary="Request asset transfer to another employee",
    description=(
        "Initiates a transfer of an allocated asset to a different employee. "
        "Sends a notification to the target employee for approval. "
        "Does not immediately complete — requires `approve-transfer` step."
    ),
)
async def transfer_asset(
    allocation_id: str,
    data: TransferCreate,
    request: Request,
    current_user: UserResponse = Depends(require_department_head),
) -> MessageResponse:
    service = AllocationService(get_database())
    result = await service.transfer(data, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


@router.post(
    "/{allocation_id}/approve-transfer",
    response_model=AllocationResponse,
    summary="Approve or reject transfer",
    description=(
        "Asset Manager or Admin approves/rejects a pending transfer request. "
        "If approved, the allocation is reassigned to the new employee. "
        "Sends notification on both outcomes."
    ),
)
async def approve_transfer(
    allocation_id: str,
    data: TransferApproval,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AllocationResponse:
    service = AllocationService(get_database())
    return await service.approve_transfer(allocation_id, data, current_user)


@router.get(
    "/{allocation_id}/history",
    response_model=PaginatedResponse[AllocationHistoryResponse],
    summary="Get allocation history",
    description="Returns the full event log for an allocation (allocated, returned, transferred).",
)
async def get_allocation_history(
    allocation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[AllocationHistoryResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by="created_at", sort_order="desc")
    service = AllocationService(get_database())
    return await service.get_history(allocation_id, params)


@router.post(
    "/admin/check-overdue",
    response_model=MessageResponse,
    summary="Mark overdue allocations",
    description=(
        "Administrative endpoint that scans all active allocations past their "
        "expected return date and marks them as `overdue`. "
        "Returns the count of updated records."
    ),
)
async def check_overdue_allocations(
    current_user: UserResponse = Depends(require_admin),
) -> MessageResponse:
    service = AllocationService(get_database())
    count = await service.check_overdue()
    return MessageResponse(message=f"{count} allocations marked as overdue")
