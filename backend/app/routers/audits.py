"""
Audit router — Part 8.

Endpoints:
  POST   /audits                                Create audit cycle
  GET    /audits                                List audit cycles (filtered)
  GET    /audits/{id}                           Get audit cycle
  POST   /audits/{id}/start                     Start audit cycle
  POST   /audits/{id}/verify                    Submit asset verification
  GET    /audits/{id}/verifications             List verifications for cycle
  GET    /audits/{id}/discrepancy-report        Generate discrepancy report
  POST   /audits/{id}/close                     Close audit cycle

Status flow: planned → in_progress → completed → closed
Discrepancy report auto-generated on close.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin, require_asset_manager
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import (
    AuditCycleCreate,
    AuditCycleResponse,
    AuditVerificationCreate,
    AuditVerificationResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audits", tags=["Audits"])


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post(
    "",
    response_model=AuditCycleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create audit cycle",
    description=(
        "Admin creates a new audit cycle with a date range, scope (departments), "
        "and auditor assignments. Counts in-scope assets automatically. "
        "Notifies all assigned auditors."
    ),
)
async def create_audit_cycle(
    data: AuditCycleCreate,
    request: Request,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AuditCycleResponse:
    service = AuditService(get_database())
    return await service.create_cycle(data, current_user, get_client_ip(request))


@router.get(
    "",
    response_model=PaginatedResponse[AuditCycleResponse],
    summary="List audit cycles",
    description="List all audit cycles with optional status filter. Paginated and sorted.",
)
async def list_audit_cycles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    status_filter: Optional[str] = Query(None, alias="status", description="planned | in_progress | completed | closed"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[AuditCycleResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = AuditService(get_database())
    return await service.list_cycles(params, status_filter)


@router.get(
    "/{cycle_id}",
    response_model=AuditCycleResponse,
    summary="Get audit cycle",
    description="Retrieve a specific audit cycle with full statistics.",
)
async def get_audit_cycle(
    cycle_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> AuditCycleResponse:
    from fastapi import HTTPException
    from app.utils.object_id import validate_object_id
    db = get_database()
    oid = validate_object_id(cycle_id)
    doc = await db["audit_cycles"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit cycle not found")
    service = AuditService(get_database())
    return service._serialize_cycle(doc)


@router.post(
    "/{cycle_id}/start",
    response_model=AuditCycleResponse,
    summary="Start audit cycle",
    description=(
        "Move audit cycle from `planned` to `in_progress`. "
        "Only planned cycles can be started. "
        "Auditors can now begin submitting verifications."
    ),
)
async def start_audit_cycle(
    cycle_id: str,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AuditCycleResponse:
    service = AuditService(get_database())
    return await service.start_cycle(cycle_id, current_user)


@router.post(
    "/{cycle_id}/verify",
    response_model=AuditVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit asset verification",
    description=(
        "Auditor submits a verification record for an asset in an active audit cycle. "
        "Status options: `verified`, `missing`, `damaged`, `not_checked`. "
        "Duplicate verifications for the same asset in the same cycle are rejected. "
        "Counters on the audit cycle are updated automatically."
    ),
)
async def verify_asset(
    cycle_id: str,
    data: AuditVerificationCreate,
    current_user: UserResponse = Depends(get_current_user),
) -> AuditVerificationResponse:
    service = AuditService(get_database())
    return await service.verify_asset(cycle_id, data, current_user)


@router.get(
    "/{cycle_id}/verifications",
    response_model=PaginatedResponse[AuditVerificationResponse],
    summary="List verifications",
    description="List all asset verifications submitted for an audit cycle. Paginated.",
)
async def list_verifications(
    cycle_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[AuditVerificationResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by="created_at", sort_order="desc")
    service = AuditService(get_database())
    return await service.get_verifications(cycle_id, params)


@router.get(
    "/{cycle_id}/discrepancy-report",
    summary="Generate discrepancy report",
    description=(
        "Generates or retrieves the discrepancy report for the audit cycle. "
        "Lists all missing and damaged assets found during the audit. "
        "Report is also stored on the audit cycle document."
    ),
)
async def get_discrepancy_report(
    cycle_id: str,
    current_user: UserResponse = Depends(require_asset_manager),
) -> dict:
    service = AuditService(get_database())
    return await service.generate_discrepancy_report(cycle_id)


@router.post(
    "/{cycle_id}/close",
    response_model=AuditCycleResponse,
    summary="Close audit cycle",
    description=(
        "Close an in-progress audit cycle. "
        "Automatically generates the final discrepancy report. "
        "No further verifications can be submitted after closing."
    ),
)
async def close_audit_cycle(
    cycle_id: str,
    current_user: UserResponse = Depends(require_asset_manager),
) -> AuditCycleResponse:
    service = AuditService(get_database())
    return await service.close_cycle(cycle_id, current_user)
