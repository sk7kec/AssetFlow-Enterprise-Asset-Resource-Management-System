import api from './api';
import { MaintenanceRequest, PaginatedResponse } from '../types';

export const maintenanceService = {
  /**
   * Raise a new maintenance request for an asset.
   */
  async create(data: {
    asset_id: string;
    priority: string;
    issue_description: string;
  }): Promise<MaintenanceRequest> {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  /**
   * List maintenance requests (useful for Kanban board layout).
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    priority?: string;
    asset_id?: string;
  }): Promise<PaginatedResponse<MaintenanceRequest>> {
    const response = await api.get('/maintenance', { params });
    return response.data;
  },

  /**
   * Approve a pending maintenance request.
   */
  async approve(
    requestId: string,
    data: { approve: boolean; rejection_reason?: string }
  ): Promise<MaintenanceRequest> {
    const response = await api.post(`/maintenance/${requestId}/approve`, data);
    return response.data;
  },

  /**
   * Assign a technician to a maintenance request.
   */
  async assignTechnician(requestId: string, technicianId: string): Promise<MaintenanceRequest> {
    const response = await api.post(`/maintenance/${requestId}/assign/${technicianId}`);
    return response.data;
  },

  /**
   * Update status of a maintenance ticket (e.g. mark IN_PROGRESS, RESOLVED, etc.).
   */
  async updateStatus(
    requestId: string,
    newStatus: string,
    resolutionNotes?: string
  ): Promise<MaintenanceRequest> {
    const response = await api.patch(`/maintenance/${requestId}/status/${newStatus}`, null, {
      params: { resolution_notes: resolutionNotes },
    });
    return response.data;
  },

  /**
   * Upload image attachments for verification of issues or resolutions.
   */
  async uploadImages(requestId: string, files: File[]): Promise<MaintenanceRequest> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post(`/maintenance/${requestId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
