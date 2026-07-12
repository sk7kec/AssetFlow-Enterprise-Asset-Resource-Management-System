import api from './api';
import { AssetCategory, PaginatedResponse } from '../types';

export const categoriesService = {
  /**
   * List categories with optional pagination.
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<PaginatedResponse<AssetCategory>> {
    const response = await api.get('/asset-categories', { params });
    return response.data;
  },

  /**
   * Get category details.
   */
  async getById(id: string): Promise<AssetCategory> {
    const response = await api.get(`/asset-categories/${id}`);
    return response.data;
  },

  /**
   * Create category.
   */
  async create(data: any): Promise<AssetCategory> {
    const response = await api.post('/asset-categories', data);
    return response.data;
  },

  /**
   * Update category.
   */
  async update(id: string, data: any): Promise<AssetCategory> {
    const response = await api.put(`/asset-categories/${id}`, data);
    return response.data;
  },

  /**
   * Delete category.
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/asset-categories/${id}`);
    return response.data;
  },
};
