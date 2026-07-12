import api from './api';
import { Asset, AssetHistory, PaginatedResponse } from '../types';

export const assetsService = {
  /**
   * List assets with paginated filters.
   */
  async list(params: {
    page?: number;
    page_size?: number;
    search?: string;
    category_id?: string;
    status?: string;
    condition?: string;
    is_shared?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Asset>> {
    const response = await api.get('/assets', { params });
    return response.data;
  },

  /**
   * Get asset details by MongoDB ObjectId.
   */
  async getById(id: string): Promise<Asset> {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  /**
   * Get asset details by unique asset tag (e.g. AF-000001) for scanning.
   */
  async getByTag(tag: string): Promise<Asset> {
    const response = await api.get(`/assets/tag/${tag}`);
    return response.data;
  },

  /**
   * Register a new asset (automatically generates QR/barcode on backend).
   */
  async create(data: any): Promise<Asset> {
    const response = await api.post('/assets', data);
    return response.data;
  },

  /**
   * Update an existing asset.
   */
  async update(id: string, data: any): Promise<Asset> {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },

  /**
   * Delete an asset.
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  /**
   * Get historical audit trail of the asset.
   */
  async getHistory(
    id: string,
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<AssetHistory>> {
    const response = await api.get(`/assets/${id}/history`, { params });
    return response.data;
  },

  /**
   * Upload image to asset gallery.
   */
  async uploadImage(id: string, file: File): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/assets/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Upload document/attachment to asset records.
   */
  async uploadDocument(id: string, file: File): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/assets/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
