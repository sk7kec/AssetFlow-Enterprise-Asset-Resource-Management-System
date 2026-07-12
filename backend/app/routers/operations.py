"""Operations routers - allocations, bookings, maintenance, audits."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status

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
    AuditCycleCreate,
    AuditCycleResponse,
    AuditVerificationCreate,
    AuditVerificationResponse,
    BookingCreate,
    BookingResponse,
    BookingUpdate,
    MaintenanceApproval,
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceStatus,
    MaintenanceUpdate,
    TransferApproval,
    TransferCreate,
)
from app.services.allocation_service import AllocationService
from app.services.audit_service import AuditService
from app.services.booking_service import BookingService
from app.services.maintenance_service import MaintenanceService

router = APIRouter(tags=["Operations"])


def get_ip(request: Request) -> Optional[str]:
    fwd = request.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None)


# ─── Allocations ──────────────────────────────────────────────────

alloc_router = APIRouter(prefix="/allocations", tags=["Allocations"])


@alloc_router.post("", response_model=AllocationResponse, status_code=201)
async def allocate_asset(data: AllocationCreate, request: Request, user: UserResponse = Depends(require_asset_manager)):
    return await AllocationService(get_database()).allocate(data, user, get_ip(request))


@alloc_router.get("", response_model=PaginatedResponse[AllocationResponse])
async def list_allocations(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    employee_id: Optional[str] = Query(None), asset_id: Optional[str] = Query(None),
    user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await AllocationService(get_database()).list_allocations(params, status_filter, employee_id, asset_id)


@alloc_router.post("/{allocation_id}/return", response_model=AllocationResponse)
async def return_asset(allocation_id: str, data: AllocationReturn, request: Request, user: UserResponse = Depends(require_asset_manager)):
    return await AllocationService(get_database()).return_asset(allocation_id, data, user, get_ip(request))


@alloc_router.post("/transfer", response_model=MessageResponse)
async def transfer_asset(data: TransferCreate, request: Request, user: UserResponse = Depends(require_asset_manager)):
    result = await AllocationService(get_database()).transfer(data, user, get_ip(request))
    return MessageResponse(message=result["message"])


@alloc_router.post("/{allocation_id}/approve-transfer", response_model=AllocationResponse)
async def approve_transfer(allocation_id: str, data: TransferApproval, user: UserResponse = Depends(require_department_head)):
    return await AllocationService(get_database()).approve_transfer(allocation_id, data, user)


@alloc_router.get("/{allocation_id}/history", response_model=PaginatedResponse[AllocationHistoryResponse])
async def allocation_history(allocation_id: str, page: int = Query(1, ge=1), user: UserResponse = Depends(get_current_user)):
    params = PaginationParams(page=page, page_size=20)
    return await AllocationService(get_database()).get_history(allocation_id, params)


# ─── Bookings ─────────────────────────────────────────────────────

booking_router = APIRouter(prefix="/bookings", tags=["Bookings"])


@booking_router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(data: BookingCreate, request: Request, user: UserResponse = Depends(get_current_user)):
    return await BookingService(get_database()).create(data, user, get_ip(request))


@booking_router.get("", response_model=PaginatedResponse[BookingResponse])
async def list_bookings(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    booking_type: Optional[str] = Query(None), status_filter: Optional[str] = Query(None, alias="status"),
    resource_id: Optional[str] = Query(None), user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await BookingService(get_database()).list_bookings(params, booking_type, status_filter, resource_id)


@booking_router.get("/calendar")
async def booking_calendar(
    start_date: datetime = Query(...), end_date: datetime = Query(...),
    resource_id: Optional[str] = Query(None), user: UserResponse = Depends(get_current_user),
):
    return await BookingService(get_database()).get_calendar(start_date, end_date, resource_id)


@booking_router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(booking_id: str, data: BookingUpdate, user: UserResponse = Depends(get_current_user)):
    return await BookingService(get_database()).update(booking_id, data, user)


@booking_router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(booking_id: str, user: UserResponse = Depends(get_current_user)):
    return await BookingService(get_database()).cancel(booking_id, user)


# ─── Maintenance ──────────────────────────────────────────────────

maint_router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@maint_router.post("", response_model=MaintenanceResponse, status_code=201)
async def raise_maintenance(data: MaintenanceCreate, request: Request, user: UserResponse = Depends(get_current_user)):
    return await MaintenanceService(get_database()).create(data, user, get_ip(request))


@maint_router.get("", response_model=PaginatedResponse[MaintenanceResponse])
async def list_maintenance(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None), asset_id: Optional[str] = Query(None),
    user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await MaintenanceService(get_database()).list_requests(params, status_filter, priority, asset_id)


@maint_router.post("/{request_id}/approve", response_model=MaintenanceResponse)
async def approve_maintenance(request_id: str, data: MaintenanceApproval, user: UserResponse = Depends(require_asset_manager)):
    return await MaintenanceService(get_database()).approve(request_id, data, user)


@maint_router.post("/{request_id}/assign/{technician_id}", response_model=MaintenanceResponse)
async def assign_technician(request_id: str, technician_id: str, user: UserResponse = Depends(require_asset_manager)):
    return await MaintenanceService(get_database()).assign_technician(request_id, technician_id, user)


@maint_router.patch("/{request_id}/status/{new_status}", response_model=MaintenanceResponse)
async def update_maintenance_status(request_id: str, new_status: MaintenanceStatus, resolution_notes: Optional[str] = Query(None), user: UserResponse = Depends(get_current_user)):
    return await MaintenanceService(get_database()).update_status(request_id, new_status, user, resolution_notes)


@maint_router.post("/{request_id}/images", response_model=MaintenanceResponse)
async def upload_maintenance_images(request_id: str, files: List[UploadFile] = File(...), user: UserResponse = Depends(get_current_user)):
    return await MaintenanceService(get_database()).upload_images(request_id, files)


# ─── Audits ───────────────────────────────────────────────────────

audit_router = APIRouter(prefix="/audits", tags=["Audits"])


@audit_router.post("", response_model=AuditCycleResponse, status_code=201)
async def create_audit(data: AuditCycleCreate, request: Request, user: UserResponse = Depends(require_admin)):
    return await AuditService(get_database()).create_cycle(data, user, get_ip(request))


@audit_router.get("", response_model=PaginatedResponse[AuditCycleResponse])
async def list_audits(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), status_filter: Optional[str] = Query(None, alias="status"), user: UserResponse = Depends(get_current_user)):
    params = PaginationParams(page=page, page_size=page_size)
    return await AuditService(get_database()).list_cycles(params, status_filter)


@audit_router.post("/{cycle_id}/start", response_model=AuditCycleResponse)
async def start_audit(cycle_id: str, user: UserResponse = Depends(require_admin)):
    return await AuditService(get_database()).start_cycle(cycle_id, user)


@audit_router.post("/{cycle_id}/verify", response_model=AuditVerificationResponse)
async def verify_asset(cycle_id: str, data: AuditVerificationCreate, user: UserResponse = Depends(get_current_user)):
    return await AuditService(get_database()).verify_asset(cycle_id, data, user)


@audit_router.get("/{cycle_id}/verifications", response_model=PaginatedResponse[AuditVerificationResponse])
async def list_verifications(cycle_id: str, page: int = Query(1, ge=1), user: UserResponse = Depends(get_current_user)):
    params = PaginationParams(page=page, page_size=20)
    return await AuditService(get_database()).get_verifications(cycle_id, params)


@audit_router.get("/{cycle_id}/discrepancy-report")
async def discrepancy_report(cycle_id: str, user: UserResponse = Depends(require_admin)):
    return await AuditService(get_database()).generate_discrepancy_report(cycle_id)


@audit_router.post("/{cycle_id}/close", response_model=AuditCycleResponse)
async def close_audit(cycle_id: str, user: UserResponse = Depends(require_admin)):
    return await AuditService(get_database()).close_cycle(cycle_id, user)
