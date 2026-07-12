import api from './api';
import { API_BASE_URL } from '../constants';

export const reportsService = {
  /**
   * Fetch utilization summary dashboard metrics.
   */
  async getAssetUtilization(): Promise<any> {
    const response = await api.get('/reports/utilization');
    return response.data;
  },

  /**
   * Fetch department summary reporting metrics.
   */
  async getDepartmentSummary(): Promise<any> {
    const response = await api.get('/reports/departments');
    return response.data;
  },

  /**
   * Fetch asset depreciation projection and current asset net value.
   */
  async getDepreciationValuation(): Promise<any> {
    const response = await api.get('/reports/depreciation');
    return response.data;
  },

  /**
   * Fetch maintenance analysis totals and expenses.
   */
  async getMaintenanceSummary(): Promise<any> {
    const response = await api.get('/reports/maintenance');
    return response.data;
  },

  /**
   * Fetch booking utilization heatmap calendar.
   */
  async getBookingHeatmap(): Promise<any[]> {
    const response = await api.get('/reports/booking-heatmap');
    return response.data;
  },

  /**
   * Helper: Download files from the report export endpoints as binary blob.
   */
  async downloadExport(
    module: 'assets' | 'allocations' | 'maintenance',
    format: 'csv' | 'xlsx' | 'pdf',
    filters?: Record<string, any>
  ): Promise<void> {
    const token = localStorage.getItem('assetflow_access_token');
    
    // Construct search params
    const queryParams = new URLSearchParams({ format });
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, String(filters[key]));
        }
      });
    }

    const downloadUrl = `${API_BASE_URL}/reports/export/${module}?${queryParams.toString()}`;

    // Use axios to fetch the file as a blob to preserve authentication headers
    const response = await api.get(`/reports/export/${module}`, {
      params: { format, ...filters },
      responseType: 'blob',
    });

    // Create browser download link and click it
    const contentType = (response.headers as any)['content-type'] || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const extension = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
    link.setAttribute('download', `${module}_report_${new Date().toISOString().split('T')[0]}.${extension}`);
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
