import {
  UserRole,
  AssetStatus,
  AssetCondition,
  AllocationStatus,
  BookingType,
  BookingStatus,
  MaintenancePriority,
  MaintenanceStatus,
  AuditStatus,
  AuditVerificationStatus,
} from '../constants';

// --- API Commons ---
export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// --- Auth & User ---
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// --- Organization ---
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  parent_department_id?: string;
  parent_department_name?: string;
  created_at: string;
  updated_at: string;
  manager?: User;
}

export interface Employee {
  id: string;
  employee_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  department_id: string;
  department_name?: string;
  role: string;
  status: 'active' | 'inactive';
  joined_date: string;
  created_at: string;
  updated_at: string;
}

// --- Asset Category ---
export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  depreciation_years: number;
  depreciation_method: 'linear' | 'double_declining' | 'sum_of_years';
  requires_serial_number: boolean;
  warranty_months?: number;
  is_bookable: boolean;
  created_at: string;
  updated_at: string;
}

// --- Asset ---
export interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  description?: string;
  category_id: string;
  category_name?: string;
  serial_number?: string;
  model_number?: string;
  manufacturer?: string;
  purchase_date: string;
  purchase_cost: number;
  condition: AssetCondition;
  status: AssetStatus;
  location: {
    building?: string;
    floor?: string;
    room?: string;
    coordinates?: string;
  };
  supplier?: string;
  warranty_expiry?: string;
  is_shared: boolean;
  assigned_to_id?: string;
  assigned_to_name?: string;
  department_id?: string;
  department_name?: string;
  image_urls: string[];
  document_urls: string[];
  qr_code_url?: string;
  barcode_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetHistory {
  id: string;
  asset_id: string;
  action: string;
  performed_by_id: string;
  performed_by_name: string;
  notes?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// --- Allocation & Return ---
export interface Allocation {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  employee_id: string;
  employee_name: string;
  allocated_by_id: string;
  allocated_by_name: string;
  allocated_at: string;
  due_date?: string;
  returned_at?: string;
  status: AllocationStatus;
  condition_on_allocation: AssetCondition;
  condition_on_return?: AssetCondition;
  notes?: string;
  return_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AllocationHistory {
  id: string;
  allocation_id: string;
  action: string;
  performed_by_name: string;
  notes?: string;
  created_at: string;
}

export interface TransferRequest {
  id: string;
  allocation_id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  current_employee_id: string;
  current_employee_name: string;
  target_employee_id: string;
  target_employee_name: string;
  requested_by_id: string;
  requested_by_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  approved_by_id?: string;
  approved_by_name?: string;
  created_at: string;
}

// --- Booking ---
export interface Booking {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  user_id: string;
  user_name: string;
  booking_type: BookingType;
  start_time: string;
  end_time: string;
  purpose: string;
  status: BookingStatus;
  approved_by_id?: string;
  approved_by_name?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// --- Maintenance ---
export interface MaintenanceRequest {
  id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  reported_by_id: string;
  reported_by_name: string;
  technician_id?: string;
  technician_name?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  issue_description: string;
  resolution_notes?: string;
  cost?: number;
  scheduled_start?: string;
  completed_at?: string;
  attachments: string[];
  history: Array<{
    status: MaintenanceStatus;
    updated_by_name: string;
    updated_at: string;
    notes?: string;
  }>;
  created_at: string;
  updated_at: string;
}

// --- Audit ---
export interface AuditCycle {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: AuditStatus;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuditVerification {
  id: string;
  cycle_id: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  verified_by_id: string;
  verified_by_name: string;
  verified_at: string;
  status: AuditVerificationStatus;
  condition: AssetCondition;
  location_matched: boolean;
  notes?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

// --- Dashboard ---
export interface DashboardKPIs {
  kpis: {
    total_assets: number;
    assets_available: number;
    assets_allocated: number;
    assets_under_maintenance: number;
    assets_overdue: number;
    todays_maintenance: number;
    active_bookings: number;
    pending_transfers: number;
    active_audits: number;
    unread_notifications: number;
  };
  charts: {
    assets_by_status: ChartDataPoint[];
    assets_by_category: ChartDataPoint[];
    assets_by_department: ChartDataPoint[];
    maintenance_by_priority: ChartDataPoint[];
    bookings_by_type: ChartDataPoint[];
    monthly_allocations: ChartDataPoint[];
  };
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user_name: string;
  }>;
  upcoming_maintenance: Array<{
    id: string;
    asset_name: string;
    scheduled_start: string;
    priority: string;
  }>;
  overdue_allocations: Array<{
    id: string;
    asset_name: string;
    employee_name: string;
    due_date: string;
    days_overdue: number;
  }>;
}

// --- Notification ---
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}
