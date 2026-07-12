"""
File Upload router — Part 13.

Endpoints:
  POST /uploads/images              Upload one or more images
  POST /uploads/documents           Upload one or more documents
  GET  /uploads/{subfolder}/{file}  Serve uploaded file (local mode)

Supports local storage and Cloudinary.
Validates file types and sizes before storage.
All endpoints require authentication.

Image types: JPEG, PNG, WebP, GIF
Document types: PDF, DOC, DOCX
Max size: Configured via MAX_UPLOAD_SIZE_MB env var (default 10 MB)
"""

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.config import get_settings
from app.dependencies.auth import get_current_user
from app.schemas.auth import UserResponse
from app.services.file_upload_service import FileUploadService
from pathlib import Path

settings = get_settings()
router = APIRouter(prefix="/uploads", tags=["File Uploads"])


@router.post(
    "/images",
    status_code=status.HTTP_201_CREATED,
    summary="Upload image files",
    description=(
        "Upload one or more image files (JPEG, PNG, WebP, GIF). "
        f"Maximum file size: {settings.max_upload_size_mb}MB. "
        "Returns a list of accessible URLs for the uploaded images. "
        "Use the returned URLs to associate images with assets or maintenance requests."
    ),
    response_model=dict,
)
async def upload_images(
    files: List[UploadFile] = File(..., description="Image files to upload"),
    subfolder: str = "images",
    current_user: UserResponse = Depends(get_current_user),
) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    service = FileUploadService()
    urls = await service.upload_multiple(files, file_type="image", subfolder=subfolder)
    return {
        "uploaded": len(urls),
        "urls": urls,
        "message": f"{len(urls)} image(s) uploaded successfully",
    }


@router.post(
    "/documents",
    status_code=status.HTTP_201_CREATED,
    summary="Upload document files",
    description=(
        "Upload one or more document files (PDF, DOC, DOCX). "
        f"Maximum file size: {settings.max_upload_size_mb}MB. "
        "Returns a list of accessible URLs for the uploaded documents. "
        "Use the returned URLs to associate documents with asset records."
    ),
    response_model=dict,
)
async def upload_documents(
    files: List[UploadFile] = File(..., description="Document files to upload"),
    subfolder: str = "documents",
    current_user: UserResponse = Depends(get_current_user),
) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    service = FileUploadService()
    urls = await service.upload_multiple(files, file_type="document", subfolder=subfolder)
    return {
        "uploaded": len(urls),
        "urls": urls,
        "message": f"{len(urls)} document(s) uploaded successfully",
    }


@router.get(
    "/{subfolder}/{filename}",
    summary="Serve uploaded file",
    description=(
        "Serve a locally stored uploaded file. "
        "Only available when UPLOAD_MODE=local. "
        "For Cloudinary uploads, use the CDN URL directly."
    ),
)
async def serve_file(
    subfolder: str,
    filename: str,
    current_user: UserResponse = Depends(get_current_user),
):
    if settings.upload_mode != "local":
        raise HTTPException(
            status_code=400,
            detail="File serving is only available in local upload mode. Use Cloudinary CDN URL.",
        )

    file_path = Path(settings.upload_dir) / subfolder / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        filename=filename,
    )
