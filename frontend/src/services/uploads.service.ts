import api from './api';

export interface UploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

export const uploadsService = {
  /**
   * Upload general file (image/document/contract) to server storage.
   */
  async upload(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Remove upload attachment from server storage.
   */
  async delete(filename: string): Promise<{ message: string }> {
    const response = await api.delete(`/uploads/${filename}`);
    return response.data;
  },
};
