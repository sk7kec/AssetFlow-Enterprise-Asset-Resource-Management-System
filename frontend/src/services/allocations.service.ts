import api from './api';
import { Allocation, AllocationHistory, PaginatedResponse } from '../types';

export const allocationsService = {
  /**
   * Allocate asset.
   */
  async allocate(data: {
    asset_id: string;
    employee_id: string;
    due_date?: string;
    notes?: string;
  }): Promise<Allocation> {
    const response = await api.post('/allocations', data);
    return response.data;
  },

  /**
   * Return asset (marks allocation as returned).
   */
  async returnAsset(
    allocationId: string,
    data: { condition_on_return: string; return_notes?: string }
  ): Promise<Allocation> {
    const response = await api.post(`/allocations/${allocationId}/return`, data);
    return response.data;
  },

  /**
   * Request asset transfer to another employee.
   */
  async transfer(data: {
    allocation_id: string;
    target_employee_id: string;
    reason?: string;
  }): Promise<{ message: string }> {
    const response = await api.post('/allocations/transfer', data);
    return response.data;
  },

  /**
   * Approve asset transfer (called by department head).
   */
  async approveTransfer(
    allocationId: string,
    data: { approve: boolean; rejection_reason?: string }
  ): Promise<Allocation> {
    const response = await api.post(`/allocations/${allocationId}/approve-transfer`, data);
    return response.data;
  },

  /**
   * List allocations.
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    employee_id?: string;
    asset_id?: string;
  }): Promise<PaginatedResponse<Allocation>> {
    const response = await api.get('/allocations', { params });
    return response.data;
  },

  /**
   * Check for overdue allocations and trigger notifications.
   */
  async checkOverdue(): Promise<{ message: string; overdue_count: number }> {
    const response = await api.post('/allocations/admin/check-overdue');
    return response.data;
  },

  /**
   * Get allocation audit history.
   */
  async getHistory(
    allocationId: string,
    params?: { page?: number }
  ): Promise<PaginatedResponse<AllocationHistory>> {
    const response = await api.get(`/allocations/${allocationId}/history`, { params });
    return response.data;
  },
};
