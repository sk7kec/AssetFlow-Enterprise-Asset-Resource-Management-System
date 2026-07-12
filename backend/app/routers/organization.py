"""Organization setup API routes - departments, employees, roles, activity logs."""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin, require_asset_manager, require_department_head
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.schemas.organization import (
    ActivityLogResponse,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    RoleCreate,
    RoleResponse,
    RoleUpdate,
)
from app.services.activity_log_service import ActivityLogService
from app.services.department_service import DepartmentService
from app.services.employee_service import EmployeeService
from app.services.role_service import RoleService

router = APIRouter(prefix="/organization", tags=["Organization"])


def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP from request headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# ─── Department Routes ────────────────────────────────────────────

@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create department",
)
async def create_department(
    data: DepartmentCreate,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = DepartmentService(get_database())
    return await service.create(data, current_user, get_client_ip(request))


@router.get("/departments", response_model=PaginatedResponse[DepartmentResponse], summary="List departments")
async def list_departments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = DepartmentService(get_database())
    return await service.list_all(params, search, is_active)


@router.get("/departments/{department_id}", response_model=DepartmentResponse, summary="Get department")
async def get_department(
    department_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    service = DepartmentService(get_database())
    return await service.get_by_id(department_id)


@router.put("/departments/{department_id}", response_model=DepartmentResponse, summary="Update department")
async def update_department(
    department_id: str,
    data: DepartmentUpdate,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = DepartmentService(get_database())
    return await service.update(department_id, data, current_user, get_client_ip(request))


@router.delete("/departments/{department_id}", response_model=MessageResponse, summary="Delete department")
async def delete_department(
    department_id: str,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = DepartmentService(get_database())
    result = await service.delete(department_id, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


# ─── Employee Routes ──────────────────────────────────────────────

@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create employee",
)
async def create_employee(
    data: EmployeeCreate,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = EmployeeService(get_database())
    return await service.create(data, current_user, get_client_ip(request))


@router.get("/employees", response_model=PaginatedResponse[EmployeeResponse], summary="List employees")
async def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = EmployeeService(get_database())
    return await service.list_all(params, search, department_id, is_active)


@router.get("/employees/{employee_id}", response_model=EmployeeResponse, summary="Get employee")
async def get_employee(
    employee_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    service = EmployeeService(get_database())
    return await service.get_by_id(employee_id)


@router.put("/employees/{employee_id}", response_model=EmployeeResponse, summary="Update employee")
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    request: Request,
    current_user: UserResponse = Depends(require_department_head),
):
    service = EmployeeService(get_database())
    return await service.update(employee_id, data, current_user, get_client_ip(request))


@router.delete("/employees/{employee_id}", response_model=MessageResponse, summary="Delete employee")
async def delete_employee(
    employee_id: str,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = EmployeeService(get_database())
    result = await service.delete(employee_id, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


# ─── Role Routes ──────────────────────────────────────────────────

@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create custom role",
)
async def create_role(
    data: RoleCreate,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = RoleService(get_database())
    return await service.create(data, current_user, get_client_ip(request))


@router.get("/roles", response_model=PaginatedResponse[RoleResponse], summary="List roles")
async def list_roles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    is_active: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = RoleService(get_database())
    return await service.list_all(params, is_active)


@router.get("/roles/{role_id}", response_model=RoleResponse, summary="Get role")
async def get_role(
    role_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    service = RoleService(get_database())
    return await service.get_by_id(role_id)


@router.put("/roles/{role_id}", response_model=RoleResponse, summary="Update role")
async def update_role(
    role_id: str,
    data: RoleUpdate,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = RoleService(get_database())
    return await service.update(role_id, data, current_user, get_client_ip(request))


@router.delete("/roles/{role_id}", response_model=MessageResponse, summary="Delete role")
async def delete_role(
    role_id: str,
    request: Request,
    current_user: UserResponse = Depends(require_admin),
):
    service = RoleService(get_database())
    result = await service.delete(role_id, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


# ─── Activity Log Routes ──────────────────────────────────────────

@router.get("/activity-logs", response_model=PaginatedResponse[ActivityLogResponse], summary="List activity logs")
async def list_activity_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    module: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    current_user: UserResponse = Depends(require_asset_manager),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    service = ActivityLogService(get_database())
    return await service.get_logs(params, module, user_id, action)
