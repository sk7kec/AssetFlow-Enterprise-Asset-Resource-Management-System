import api from './api';
import { PaginatedResponse } from '../types';

export interface SearchResults {
  query: string;
  total: number;
  results: {
    assets: Array<{ id: string; name: string; tag: string; status: string }>;
    maintenance: Array<{ id: string; description: string; tag: string; status: string }>;
    employees: Array<{ id: string; name: string; email: string; department: string }>;
  };
}

export const searchService = {
  /**
   * Perform a global search across all modules (minimum 2 chars query).
   */
  async global(q: string): Promise<SearchResults> {
    const response = await api.get('/search', { params: { q } });
    return response.data;
  },

  /**
   * Perform module-specific search (e.g. assets, employees, bookings, maintenance).
   */
  async searchModule(
    module: 'assets' | 'employees' | 'maintenance' | 'bookings',
    q: string,
    params?: { page?: number; page_size?: number }
  ): Promise<PaginatedResponse<any>> {
    const response = await api.get(`/search/${module}`, {
      params: { q, ...params },
    });
    return response.data;
  },
};
