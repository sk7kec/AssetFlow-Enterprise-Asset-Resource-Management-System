"""
Maintenance router — Part 7.

Endpoints:
  POST   /maintenance                           Raise a maintenance request
  GET    /maintenance                           List requests (filtered, paginated)
  GET    /maintenance/{id}                      Get maintenance request by ID
  POST   /maintenance/{id}/approve             Approve or reject request
  POST   /maintenance/{id}/assign-technician   Assign technician
  POST   /maintenance/{id}/status              Update status (in_progress, resolved)
  POST   /maintenance/{id}/images              Upload images for request
  GET    /maintenance/{id}/history             Maintenance event history

Priority: low | medium | high | critical
Status flow: pending → approved/rejected → technician_assigned → in_progress → resolved
Auto-updates asset status: approved → under_maintenance, resolved → available
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_asset_manager, require_department_head
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    MaintenanceApproval,
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceStatus,
)
from app.services.maintenance_service import MaintenanceService

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post(
    "",
    response_model=MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Raise a maintenance request",
    description=(
        "Any employee can raise a maintenance request for an asset. "
        "Initial status is `pending`. "
        "Notifies the raising user upon creation."
    ),
)
async def create_maintenance_request(
    data: MaintenanceCreate,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.create(data, current_user, get_client_ip(request))


@router.get(
    "",
    response_model=PaginatedResponse[MaintenanceResponse],
    summary="List maintenance requests",
    description="List all maintenance requests with filtering by status, priority, and asset. Paginated.",
)
async def list_maintenance_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    status_filter: Optional[str] = Query(
        None, alias="status",
        description="pending | approved | rejected | technician_assigned | in_progress | resolved"
    ),
    priority: Optional[str] = Query(None, description="low | medium | high | critical"),
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[MaintenanceResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = MaintenanceService(get_database())
    return await service.list_requests(params, status_filter, priority, asset_id)


@router.get(
    "/{request_id}",
    response_model=MaintenanceResponse,
    summary="Get maintenance request",
    description="Retrieve a specific maintenance request with asset and technician details.",
)
async def get_maintenance_request(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> MaintenanceResponse:
    from fastapi import HTTPException
    from app.utils.object_id import validate_object_id
    db = get_database()
    oid = validate_object_id(request_id)
    doc = await db["maintenance_requests"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Maintenance request not found")
    service = MaintenanceService(get_database())
    from bson import ObjectId
    asset = await db["assets"].find_one({"_id": ObjectId(doc["asset_id"])}) if doc.get("asset_id") else None
    technician = None
    if doc.get("technician_id"):
        technician = await db["employees"].find_one({"_id": ObjectId(doc["technician_id"])})
    return service._serialize(
        doc,
        asset_tag=asset.get("asset_tag") if asset else None,
        technician_name=technician.get("full_name") if technician else None,
    )


@router.post(
    "/{request_id}/approve",
    response_model=MaintenanceResponse,
    summary="Approve or reject maintenance request",
    description=(
        "Asset Manager or Admin approves or rejects a pending maintenance request. "
        "If approved: asset status changes to `under_maintenance`. "
        "If rejected: status becomes `rejected`."
    ),
)
async def approve_maintenance_request(
    request_id: str,
    data: MaintenanceApproval,
    current_user: UserResponse = Depends(require_asset_manager),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.approve(request_id, data, current_user)


@router.post(
    "/{request_id}/assign-technician",
    response_model=MaintenanceResponse,
    summary="Assign technician",
    description=(
        "Assign a technician (by employee ID) to an approved maintenance request. "
        "Sets status to `technician_assigned` and notifies the technician."
    ),
)
async def assign_technician(
    request_id: str,
    technician_id: str = Query(..., description="Employee ID of the technician to assign"),
    current_user: UserResponse = Depends(require_asset_manager),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.assign_technician(request_id, technician_id, current_user)


@router.post(
    "/{request_id}/in-progress",
    response_model=MaintenanceResponse,
    summary="Mark as in progress",
    description="Technician or Asset Manager marks the maintenance as actively in progress.",
)
async def mark_in_progress(
    request_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.update_status(request_id, MaintenanceStatus.IN_PROGRESS, current_user)


@router.post(
    "/{request_id}/resolve",
    response_model=MaintenanceResponse,
    summary="Resolve maintenance request",
    description=(
        "Mark a maintenance request as resolved. "
        "Asset status is automatically changed back to `available`. "
        "Resolution notes are required."
    ),
)
async def resolve_maintenance_request(
    request_id: str,
    resolution_notes: str = Query(..., description="Description of how the issue was resolved"),
    current_user: UserResponse = Depends(get_current_user),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.update_status(request_id, MaintenanceStatus.RESOLVED, current_user, resolution_notes)


@router.post(
    "/{request_id}/images",
    response_model=MaintenanceResponse,
    summary="Upload maintenance images",
    description=(
        "Upload evidence images for a maintenance request (e.g., damage photos). "
        "Accepts JPEG, PNG, or WebP files up to the configured max size. "
        "Images are stored in /uploads/maintenance/."
    ),
)
async def upload_maintenance_images(
    request_id: str,
    files: List[UploadFile] = File(..., description="Image files to upload"),
    current_user: UserResponse = Depends(get_current_user),
) -> MaintenanceResponse:
    service = MaintenanceService(get_database())
    return await service.upload_images(request_id, files)


@router.get(
    "/{request_id}/history",
    response_model=PaginatedResponse,
    summary="Get maintenance history",
    description="Full event log for a maintenance request (created, approved, assigned, in_progress, resolved).",
)
async def get_maintenance_history(
    request_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse:
    params = PaginationParams(page=page, page_size=page_size, sort_by="created_at", sort_order="desc")
    service = MaintenanceService(get_database())
    return await service.get_history(request_id, params)
