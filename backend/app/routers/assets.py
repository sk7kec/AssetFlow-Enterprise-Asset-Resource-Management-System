"""Asset category and asset registration API routes."""

from typing import List, Optional

from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status

from app.database import get_database
from app.dependencies.auth import get_current_user
from app.dependencies.role import require_admin, require_asset_manager
from app.schemas.asset import (
    AssetCategoryCreate,
    AssetCategoryResponse,
    AssetCategoryUpdate,
    AssetCreate,
    AssetHistoryResponse,
    AssetResponse,
    AssetUpdate,
)
from app.schemas.auth import MessageResponse, UserResponse
from app.schemas.common import PaginatedResponse, PaginationParams
from app.services.asset_category_service import AssetCategoryService
from app.services.asset_service import AssetService

router = APIRouter(tags=["Assets"])


def get_client_ip(request: Request) -> Optional[str]:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# ─── Asset Category Routes (Admin Only) ────────────────────────────

category_router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])


@category_router.post("", response_model=AssetCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(data: AssetCategoryCreate, request: Request, current_user: UserResponse = Depends(require_admin)):
    return await AssetCategoryService(get_database()).create(data, current_user, get_client_ip(request))


@category_router.get("", response_model=PaginatedResponse[AssetCategoryResponse])
async def list_categories(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"), sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None), is_active: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    return await AssetCategoryService(get_database()).list_all(params, search, is_active)


@category_router.get("/{category_id}", response_model=AssetCategoryResponse)
async def get_category(category_id: str, current_user: UserResponse = Depends(get_current_user)):
    return await AssetCategoryService(get_database()).get_by_id(category_id)


@category_router.put("/{category_id}", response_model=AssetCategoryResponse)
async def update_category(category_id: str, data: AssetCategoryUpdate, request: Request, current_user: UserResponse = Depends(require_admin)):
    return await AssetCategoryService(get_database()).update(category_id, data, current_user, get_client_ip(request))


@category_router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(category_id: str, request: Request, current_user: UserResponse = Depends(require_admin)):
    result = await AssetCategoryService(get_database()).delete(category_id, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


# ─── Asset Routes ─────────────────────────────────────────────────

asset_router = APIRouter(prefix="/assets", tags=["Assets"])


@asset_router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(data: AssetCreate, request: Request, current_user: UserResponse = Depends(require_asset_manager)):
    return await AssetService(get_database()).create(data, current_user, get_client_ip(request))


@asset_router.get("", response_model=PaginatedResponse[AssetResponse])
async def list_assets(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"), sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = Query(None), category_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None), condition: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None), location: Optional[str] = Query(None),
    is_bookable: Optional[bool] = Query(None),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size, sort_by=sort_by, sort_order=sort_order)
    return await AssetService(get_database()).list_all(
        params, search, category_id, status, condition, department_id, location, is_bookable
    )


@asset_router.get("/tag/{asset_tag}", response_model=AssetResponse)
async def get_asset_by_tag(asset_tag: str, current_user: UserResponse = Depends(get_current_user)):
    return await AssetService(get_database()).get_by_tag(asset_tag)


@asset_router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, current_user: UserResponse = Depends(get_current_user)):
    return await AssetService(get_database()).get_by_id(asset_id)


@asset_router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, data: AssetUpdate, request: Request, current_user: UserResponse = Depends(require_asset_manager)):
    return await AssetService(get_database()).update(asset_id, data, current_user, get_client_ip(request))


@asset_router.delete("/{asset_id}", response_model=MessageResponse)
async def delete_asset(asset_id: str, request: Request, current_user: UserResponse = Depends(require_asset_manager)):
    result = await AssetService(get_database()).delete(asset_id, current_user, get_client_ip(request))
    return MessageResponse(message=result["message"])


@asset_router.post("/{asset_id}/images", response_model=AssetResponse)
async def upload_asset_images(
    asset_id: str, files: List[UploadFile] = File(...),
    current_user: UserResponse = Depends(require_asset_manager),
):
    return await AssetService(get_database()).upload_images(asset_id, files, current_user)


@asset_router.post("/{asset_id}/documents", response_model=AssetResponse)
async def upload_asset_documents(
    asset_id: str, files: List[UploadFile] = File(...),
    current_user: UserResponse = Depends(require_asset_manager),
):
    return await AssetService(get_database()).upload_documents(asset_id, files, current_user)


@asset_router.get("/{asset_id}/history", response_model=PaginatedResponse[AssetHistoryResponse])
async def get_asset_history(
    asset_id: str,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await AssetService(get_database()).get_history(asset_id, params)
