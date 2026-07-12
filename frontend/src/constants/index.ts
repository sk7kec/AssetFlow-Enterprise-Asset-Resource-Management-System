/**
 * AssetFlow constants.
 * Aligned with MongoDB backend schemas and roles.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'AssetFlow';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

export enum UserRole {
  ADMIN = 'admin',
  ASSET_MANAGER = 'asset_manager',
  DEPARTMENT_HEAD = 'department_head',
  EMPLOYEE = 'employee',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'System Administrator',
  [UserRole.ASSET_MANAGER]: 'Asset Manager',
  [UserRole.DEPARTMENT_HEAD]: 'Department Head',
  [UserRole.EMPLOYEE]: 'Employee / Staff',
};

export enum AssetStatus {
  AVAILABLE = 'available',
  ALLOCATED = 'allocated',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
  DISPOSED = 'disposed',
  LOST = 'lost',
}

export const ASSET_STATUS_COLORS: Record<AssetStatus, { bg: string; text: string; dot: string }> = {
  [AssetStatus.AVAILABLE]: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  [AssetStatus.ALLOCATED]: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
  [AssetStatus.MAINTENANCE]: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  [AssetStatus.RESERVED]: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', dot: 'bg-cyan-500' },
  [AssetStatus.DISPOSED]: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500' },
  [AssetStatus.LOST]: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
};

export enum AssetCondition {
  NEW = 'new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  BROKEN = 'broken',
}

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
  [AssetCondition.NEW]: 'Brand New',
  [AssetCondition.EXCELLENT]: 'Excellent',
  [AssetCondition.GOOD]: 'Good',
  [AssetCondition.FAIR]: 'Fair / Used',
  [AssetCondition.POOR]: 'Poor',
  [AssetCondition.BROKEN]: 'Broken / Non-functional',
};

export enum AllocationStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
  PENDING_TRANSFER = 'pending_transfer',
}

export enum BookingType {
  ROOM = 'room',
  VEHICLE = 'vehicle',
  EQUIPMENT = 'equipment',
}

export enum BookingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MaintenanceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export const MAINTENANCE_PRIORITY_COLORS: Record<MaintenancePriority, { bg: string; text: string; border: string }> = {
  [MaintenancePriority.LOW]: { bg: 'bg-slate-100 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800' },
  [MaintenancePriority.MEDIUM]: { bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900/50' },
  [MaintenancePriority.HIGH]: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/50' },
  [MaintenancePriority.CRITICAL]: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/50' },
};

export enum AuditStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum AuditVerificationStatus {
  VERIFIED = 'verified',
  DISCREPANCY = 'discrepancy',
  MISSING = 'missing',
}
