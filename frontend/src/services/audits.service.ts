import api from './api';
import { AuditCycle, AuditVerification, PaginatedResponse } from '../types';

export const auditsService = {
  /**
   * Create an audit cycle (Admin only).
   */
  async createCycle(data: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
  }): Promise<AuditCycle> {
    const response = await api.post('/audits', data);
    return response.data;
  },

  /**
   * List all audit cycles.
   */
  async listCycles(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse<AuditCycle>> {
    const response = await api.get('/audits', { params });
    return response.data;
  },

  /**
   * Transition an audit cycle to ACTIVE.
   */
  async startCycle(cycleId: string): Promise<AuditCycle> {
    const response = await api.post(`/audits/${cycleId}/start`);
    return response.data;
  },

  /**
   * Log verification of a specific asset during an active audit.
   */
  async verifyAsset(
    cycleId: string,
    data: {
      asset_tag: string;
      status: string;
      condition: string;
      location_matched: boolean;
      notes?: string;
    }
  ): Promise<AuditVerification> {
    const response = await api.post(`/audits/${cycleId}/verify`, data);
    return response.data;
  },

  /**
   * Get all verified assets in the current cycle.
   */
  async getVerifications(
    cycleId: string,
    params?: { page?: number }
  ): Promise<PaginatedResponse<AuditVerification>> {
    const response = await api.get(`/audits/${cycleId}/verifications`, { params });
    return response.data;
  },

  /**
   * Generate discrepancy report (missing/displaced assets).
   */
  async getDiscrepancyReport(cycleId: string): Promise<{
    cycle_name: string;
    total_assets: number;
    verified: number;
    discrepancies: AuditVerification[];
    missing_assets: any[];
  }> {
    const response = await api.get(`/audits/${cycleId}/discrepancy-report`);
    return response.data;
  },

  /**
   * Close/finalize audit cycle (updates state and generates statistics).
   */
  async closeCycle(cycleId: string): Promise<AuditCycle> {
    const response = await api.post(`/audits/${cycleId}/close`);
    return response.data;
  },
};
