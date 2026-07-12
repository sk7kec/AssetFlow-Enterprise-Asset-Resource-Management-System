import api from './api';
import { Notification, PaginatedResponse } from '../types';

export const notificationsService = {
  /**
   * List notifications for current user.
   */
  async list(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Notification>> {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get total number of unread notifications.
   */
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all user notifications as read.
   */
  async markAllRead(): Promise<{ message: string }> {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },
};
