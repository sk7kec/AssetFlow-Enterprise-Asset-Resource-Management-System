"""
Asset category and asset registration schemas.
Includes warranty fields, status enums, and validation.
"""

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─── Enums ────────────────────────────────────────────────────────

class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ALLOCATED = "allocated"
    RESERVED = "reserved"
    UNDER_MAINTENANCE = "under_maintenance"
    LOST = "lost"
    DISPOSED = "disposed"
    RETIRED = "retired"


class AssetCondition(str, Enum):
    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    DAMAGED = "damaged"


# ─── Asset Category Schemas ───────────────────────────────────────

class AssetCategoryCreate(BaseModel):
    """Create asset category with optional warranty configuration."""

    name: str = Field(..., min_length=2, max_length=100, examples=["Laptops"])
    description: Optional[str] = Field(None, max_length=500)
    depreciation_years: Optional[int] = Field(None, ge=1, le=50, examples=[3])
    warranty_months: Optional[int] = Field(None, ge=0, le=120, examples=[12])
    requires_serial_number: bool = Field(default=True)
    is_bookable: bool = Field(default=False)
    custom_fields: Optional[List[str]] = Field(default_factory=list)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Laptops",
                "description": "Portable computing devices",
                "depreciation_years": 3,
                "warranty_months": 12,
                "requires_serial_number": True,
                "is_bookable": False,
            }
        }
    )


class AssetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    depreciation_years: Optional[int] = Field(None, ge=1, le=50)
    warranty_months: Optional[int] = Field(None, ge=0, le=120)
    requires_serial_number: Optional[bool] = None
    is_bookable: Optional[bool] = None
    custom_fields: Optional[List[str]] = None
    is_active: Optional[bool] = None


class AssetCategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    depreciation_years: Optional[int] = None
    warranty_months: Optional[int] = None
    requires_serial_number: bool = True
    is_bookable: bool = False
    custom_fields: List[str] = []
    asset_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Laptops",
                "depreciation_years": 3,
                "warranty_months": 12,
                "asset_count": 45,
                "is_active": True,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    )


# ─── Asset Schemas ────────────────────────────────────────────────

class AssetCreate(BaseModel):
    """Register a new asset."""

    name: str = Field(..., min_length=2, max_length=200, examples=["Dell Latitude 5540"])
    category_id: str = Field(..., description="Asset category ObjectId")
    serial_number: Optional[str] = Field(None, max_length=100, examples=["SN123456789"])
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200, examples=["Building A, Floor 3"])
    condition: AssetCondition = Field(default=AssetCondition.NEW)
    purchase_cost: Optional[float] = Field(None, ge=0, examples=[1299.99])
    purchase_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    is_bookable: bool = Field(default=False)
    department_id: Optional[str] = None
    manufacturer: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    custom_field_values: Optional[dict] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Dell Latitude 5540",
                "category_id": "507f1f77bcf86cd799439011",
                "serial_number": "SN123456789",
                "location": "Building A, Floor 3",
                "condition": "new",
                "purchase_cost": 1299.99,
                "purchase_date": "2026-01-10",
                "is_bookable": False,
            }
        }
    )


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    condition: Optional[AssetCondition] = None
    purchase_cost: Optional[float] = Field(None, ge=0)
    purchase_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    is_bookable: Optional[bool] = None
    department_id: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    status: Optional[AssetStatus] = None
    custom_field_values: Optional[dict] = None


class AssetResponse(BaseModel):
    id: str
    asset_tag: str
    name: str
    category_id: str
    category_name: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    condition: str
    purchase_cost: Optional[float] = None
    purchase_date: Optional[date] = None
    warranty_expiry: Optional[date] = None
    is_bookable: bool = False
    status: str
    department_id: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    qr_code_url: Optional[str] = None
    barcode_url: Optional[str] = None
    image_urls: List[str] = []
    document_urls: List[str] = []
    custom_field_values: Optional[dict] = None
    allocated_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "asset_tag": "AF-0001",
                "name": "Dell Latitude 5540",
                "category_id": "507f1f77bcf86cd799439011",
                "serial_number": "SN123456789",
                "status": "available",
                "condition": "new",
                "qr_code_url": "/uploads/qr/AF-0001.png",
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-01-15T10:00:00Z",
            }
        }
    )


class AssetHistoryResponse(BaseModel):
    id: str
    asset_id: str
    action: str
    performed_by: str
    performed_by_name: Optional[str] = None
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime
