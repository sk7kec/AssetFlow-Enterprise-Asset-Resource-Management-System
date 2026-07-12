"""
Notifications router — Part 10.

Endpoints:
  GET    /notifications                 List notifications for current user
  GET    /notifications/unread-count    Get count of unread notifications
  POST   /notifications/{id}/read       Mark a single notification as read
  POST   /notifications/read-all        Mark all notifications as read

Types: reminder | transfer | maintenance | audit | allocation | booking | system
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.dashboard import NotificationResponse, UnreadCountResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List notifications",
    description=(
        "Returns paginated notifications for the currently authenticated user. "
        "Can be filtered by read status and notification type."
    ),
)
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    notification_type: Optional[str] = Query(
        None,
        description="reminder | transfer | maintenance | audit | allocation | booking | system"
    ),
    current_user: UserResponse = Depends(get_current_user),
) -> PaginatedResponse[NotificationResponse]:
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = NotificationService(get_database())
    return await service.get_user_notifications(current_user.id, params, is_read, notification_type)


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notification count",
    description=(
        "Returns the count of unread notifications for the current user. "
        "Use this endpoint to power the notification badge in the UI."
    ),
)
async def get_unread_count(
    current_user: UserResponse = Depends(get_current_user),
) -> UnreadCountResponse:
    service = NotificationService(get_database())
    return await service.get_unread_count(current_user.id)


@router.post(
    "/read-all",
    response_model=MessageResponse,
    summary="Mark all notifications as read",
    description="Marks every unread notification for the current user as read in bulk.",
)
async def mark_all_read(
    current_user: UserResponse = Depends(get_current_user),
) -> MessageResponse:
    service = NotificationService(get_database())
    result = await service.mark_all_read(current_user.id)
    return MessageResponse(message=result["message"])


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
    description=(
        "Mark a specific notification as read. "
        "Only the owner of the notification can mark it as read."
    ),
)
async def mark_as_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
) -> NotificationResponse:
    service = NotificationService(get_database())
    return await service.mark_as_read(notification_id, current_user.id)
