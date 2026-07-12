"""
File upload service - supports local storage and Cloudinary.
Validates file types and sizes for images, PDFs, and documents.
"""

import os
import uuid
from pathlib import Path
from typing import List, Optional, Tuple

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()


class FileUploadService:
    """Handles file uploads with validation and storage."""

    def __init__(self):
        self.upload_mode = settings.upload_mode
        if self.upload_mode == "cloudinary":
            self._init_cloudinary()

    def _init_cloudinary(self) -> None:
        """Initialize Cloudinary SDK if configured."""
        import cloudinary
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
        )

    async def validate_file(
        self,
        file: UploadFile,
        allowed_types: List[str],
    ) -> None:
        """Validate file type and size."""
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file.content_type}' not allowed. Allowed: {allowed_types}",
            )

        # Read content to check size
        content = await file.read()
        await file.seek(0)  # Reset for subsequent reads

        if len(content) > settings.max_upload_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max size: {settings.max_upload_size_mb}MB",
            )

    async def upload_image(self, file: UploadFile, subfolder: str = "images") -> str:
        """Upload an image file."""
        await self.validate_file(file, settings.allowed_image_types_list)
        return await self._store_file(file, subfolder)

    async def upload_document(self, file: UploadFile, subfolder: str = "documents") -> str:
        """Upload a document (PDF, etc.)."""
        await self.validate_file(file, settings.allowed_document_types_list)
        return await self._store_file(file, subfolder)

    async def _store_file(self, file: UploadFile, subfolder: str) -> str:
        """Store file locally or upload to Cloudinary."""
        if self.upload_mode == "cloudinary":
            return await self._upload_to_cloudinary(file, subfolder)
        return await self._upload_local(file, subfolder)

    async def _upload_local(self, file: UploadFile, subfolder: str) -> str:
        """Save file to local uploads directory."""
        upload_dir = Path(settings.upload_dir) / subfolder
        upload_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(file.filename or "file").suffix or ".bin"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = upload_dir / unique_name

        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        return f"/{settings.upload_dir}/{subfolder}/{unique_name}"

    async def _upload_to_cloudinary(self, file: UploadFile, subfolder: str) -> str:
        """Upload file to Cloudinary CDN."""
        import cloudinary.uploader

        content = await file.read()
        result = cloudinary.uploader.upload(
            content,
            folder=f"assetflow/{subfolder}",
            resource_type="auto",
        )
        return result.get("secure_url", result.get("url", ""))

    async def upload_multiple(
        self,
        files: List[UploadFile],
        file_type: str = "image",
        subfolder: str = "images",
    ) -> List[str]:
        """Upload multiple files and return list of URLs."""
        urls = []
        for file in files:
            if file_type == "image":
                url = await self.upload_image(file, subfolder)
            else:
                url = await self.upload_document(file, subfolder)
            urls.append(url)
        return urls
