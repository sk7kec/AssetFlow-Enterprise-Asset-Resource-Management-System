import api from './api';
import { DashboardKPIs } from '../types';

export const dashboardService = {
  /**
   * Fetch aggregated analytics and KPIs for the landing dashboard.
   */
  async getSummary(): Promise<DashboardKPIs> {
    const response = await api.get('/dashboard');
    return response.data;
  },
};
