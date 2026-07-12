"""
Resource Booking router — Part 6.

Endpoints:
  POST   /bookings                              Create a new resource booking
  GET    /bookings                              List bookings (filtered, paginated)
  GET    /bookings/calendar                     Calendar view for date range
  GET    /bookings/{id}                         Get booking by ID
  PUT    /bookings/{id}                         Update booking
  POST   /bookings/{id}/cancel                  Cancel a booking
  GET    /bookings/upcoming                     Upcoming bookings for current user
  GET    /bookings/my                           My bookings

Booking types: room | vehicle | equipment
Status flow: upcoming → active → completed | cancelled
Overlap validation prevents double-booking of same resource.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_asset_manager
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.operations import BookingCreate, BookingResponse, BookingUpdate

from app.services.booking_service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a resource booking",
    description=(
        "Book a room, vehicle, or equipment for a specific time window. "
        "Overlap validation ensures no two bookings conflict for the same resource. "
        "Status is automatically set to `upcoming` or `active` based on current time."
    ),
)
async def create_booking(
    data: BookingCreate,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
) -> BookingResponse:
    service = BookingService(get_database())
    return await service.create(data, current_user, get_client_ip(request))


@router.get(
    "",
    response_model=PaginatedResponse[BookingResponse],
    summary="List bookings",
    description=(
        "List all resource bookings with optional filtering by type, status, "
        "resource, user, and date range. Paginated and sorted."
    ),
)
async def list_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("start_time"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    booking_type: Optional[str] = Query(None, description="room | vehicle | equipment"),
    status_filter: Optional[str] = Query(None, alias="status", description="upcoming | active | completed | cancelled"),
    resource_id: Optional[str] = Query(None, description="Filter by resource asset ID"),
    booked_by: Optional[str] = Query(None, description="Filter by booker user ID"),
    start_date: Optional[datetime] = Query(None, description="ISO8601 start date filter"),
    end_date: Optional[datetime] = Query(None, description="ISO8601 end date filter"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[BookingResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = BookingService(get_database())
    return await service.list_bookings(params, booking_type, status_filter, resource_id, booked_by, start_date, end_date)


@router.get(
    "/my",
    response_model=PaginatedResponse[BookingResponse],
    summary="Get my bookings",
    description="Returns all bookings made by the currently authenticated user.",
)
async def my_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[BookingResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by="start_time", sort_order="desc")
    service = BookingService(get_database())
    return await service.list_bookings(params, status_filter=status_filter, booked_by=current_user.id)


@router.get(
    "/upcoming",
    response_model=PaginatedResponse[BookingResponse],
    summary="Get upcoming bookings",
    description="Returns all bookings with status `upcoming` sorted by start time.",
)
async def upcoming_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[BookingResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by="start_time", sort_order="asc")
    service = BookingService(get_database())
    return await service.list_bookings(params, status_filter="upcoming")


@router.get(
    "/calendar",
    summary="Calendar view of bookings",
    description=(
        "Returns bookings in a date range formatted for calendar rendering. "
        "Each event includes id, title, start, end, type, and status fields. "
        "Optional resource_id filter scopes to a single resource."
    ),
    response_model=list,
)
async def booking_calendar(
    start_date: datetime = Query(..., description="Calendar range start (ISO8601)"),
    end_date: datetime = Query(..., description="Calendar range end (ISO8601)"),
    resource_id: Optional[str] = Query(None, description="Scope to a single resource"),
    current_user: UserResponse = Depends(get_current_user),
) -> list:
    service = BookingService(get_database())
    return await service.get_calendar(start_date, end_date, resource_id)


@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Get booking by ID",
    description="Retrieve a specific booking record with resource details.",
)
async def get_booking(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> BookingResponse:
    service = BookingService(get_database())
    return await service.get_by_id(booking_id)


@router.put(
    "/{booking_id}",
    response_model=BookingResponse,
    summary="Update booking",
    description=(
        "Update booking title, times, notes, or status. "
        "If times are changed, overlap validation is re-run. "
        "Asset Managers can update any booking; employees can only update their own."
    ),
)
async def update_booking(
    booking_id: str,
    data: BookingUpdate,
    current_user: UserResponse = Depends(get_current_user),
) -> BookingResponse:
    service = BookingService(get_database())
    return await service.update(booking_id, data, current_user)


@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
    summary="Cancel booking",
    description=(
        "Cancel an upcoming or active booking. "
        "Completed bookings cannot be cancelled. "
        "Sets status to `cancelled`."
    ),
)
async def cancel_booking(
    booking_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> BookingResponse:
    service = BookingService(get_database())
    return await service.cancel(booking_id, current_user)
