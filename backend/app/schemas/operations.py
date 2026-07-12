"""Allocation, booking, maintenance, and audit schemas."""

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


# ─── Allocation ───────────────────────────────────────────────────

class AllocationStatus(str, Enum):
    ACTIVE = "active"
    RETURNED = "returned"
    TRANSFERRED = "transferred"
    OVERDUE = "overdue"


class AllocationCreate(BaseModel):
    asset_id: str
    employee_id: str
    expected_return_date: Optional[date] = None
    notes: Optional[str] = None

    model_config = ConfigDict(json_schema_extra={
        "example": {"asset_id": "507f1f77bcf86cd799439011", "employee_id": "507f1f77bcf86cd799439012", "expected_return_date": "2026-06-01"}
    })


class AllocationReturn(BaseModel):
    notes: Optional[str] = None
    condition: Optional[str] = None


class TransferCreate(BaseModel):
    allocation_id: str
    to_employee_id: str
    notes: Optional[str] = None


class TransferApproval(BaseModel):
    approved: bool
    notes: Optional[str] = None


class AllocationResponse(BaseModel):
    id: str
    asset_id: str
    asset_tag: Optional[str] = None
    asset_name: Optional[str] = None
    employee_id: str
    employee_name: Optional[str] = None
    allocated_by: str
    allocated_by_name: Optional[str] = None
    status: str
    allocated_at: datetime
    expected_return_date: Optional[date] = None
    returned_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AllocationHistoryResponse(BaseModel):
    id: str
    allocation_id: str
    action: str
    from_employee_id: Optional[str] = None
    to_employee_id: Optional[str] = None
    performed_by: str
    notes: Optional[str] = None
    created_at: datetime


# ─── Booking ──────────────────────────────────────────────────────

class BookingType(str, Enum):
    ROOM = "room"
    VEHICLE = "vehicle"
    EQUIPMENT = "equipment"


class BookingStatus(str, Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingCreate(BaseModel):
    booking_type: BookingType
    resource_id: str = Field(..., description="Asset ID of bookable resource")
    title: str = Field(..., min_length=2, max_length=200)
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self

    model_config = ConfigDict(json_schema_extra={
        "example": {"booking_type": "room", "resource_id": "507f1f77bcf86cd799439011", "title": "Team Meeting", "start_time": "2026-07-15T10:00:00Z", "end_time": "2026-07-15T12:00:00Z"}
    })


class BookingUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[BookingStatus] = None


class BookingResponse(BaseModel):
    id: str
    booking_type: str
    resource_id: str
    resource_name: Optional[str] = None
    title: str
    booked_by: str
    booked_by_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ─── Maintenance ──────────────────────────────────────────────────

class MaintenancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MaintenanceStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TECHNICIAN_ASSIGNED = "technician_assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class MaintenanceCreate(BaseModel):
    asset_id: str
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    priority: MaintenancePriority = MaintenancePriority.MEDIUM

    model_config = ConfigDict(json_schema_extra={
        "example": {"asset_id": "507f1f77bcf86cd799439011", "title": "Screen flickering", "description": "Laptop screen flickers intermittently", "priority": "high"}
    })


class MaintenanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[MaintenancePriority] = None
    status: Optional[MaintenanceStatus] = None
    technician_id: Optional[str] = None
    resolution_notes: Optional[str] = None


class MaintenanceApproval(BaseModel):
    approved: bool
    notes: Optional[str] = None


class MaintenanceResponse(BaseModel):
    id: str
    asset_id: str
    asset_tag: Optional[str] = None
    title: str
    description: str
    priority: str
    status: str
    raised_by: str
    raised_by_name: Optional[str] = None
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    approved_by: Optional[str] = None
    image_urls: List[str] = []
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ─── Audit ────────────────────────────────────────────────────────

class AuditStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    MISSING = "missing"
    DAMAGED = "damaged"
    NOT_CHECKED = "not_checked"


class AuditCycleCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    start_date: date
    end_date: date
    department_ids: Optional[List[str]] = None
    auditor_ids: List[str] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class AuditVerificationCreate(BaseModel):
    asset_id: str
    status: VerificationStatus
    notes: Optional[str] = None
    condition_notes: Optional[str] = None


class AuditCycleResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    start_date: date
    end_date: date
    department_ids: List[str] = []
    auditor_ids: List[str] = []
    created_by: str
    total_assets: int = 0
    verified_count: int = 0
    missing_count: int = 0
    damaged_count: int = 0
    discrepancy_report: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


class AuditVerificationResponse(BaseModel):
    id: str
    audit_cycle_id: str
    asset_id: str
    asset_tag: Optional[str] = None
    status: str
    verified_by: str
    notes: Optional[str] = None
    condition_notes: Optional[str] = None
    created_at: datetime
