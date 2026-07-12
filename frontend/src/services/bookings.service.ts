import api from './api';
import { Booking, PaginatedResponse } from '../types';

export const bookingsService = {
  /**
   * Create a booking for a shared asset.
   */
  async create(data: {
    asset_id: string;
    start_time: string;
    end_time: string;
    purpose: string;
  }): Promise<Booking> {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  /**
   * List bookings.
   */
  async list(params?: {
    page?: number;
    page_size?: number;
    booking_type?: string;
    status?: string;
    resource_id?: string;
  }): Promise<PaginatedResponse<Booking>> {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  /**
   * Get calendar schedule for resource booking overlays.
   */
  async getCalendar(
    start_date: string,
    end_date: string,
    resource_id?: string
  ): Promise<Booking[]> {
    const response = await api.get('/bookings/calendar', {
      params: { start_date, end_date, resource_id },
    });
    return response.data;
  },

  /**
   * Update an active booking.
   */
  async update(bookingId: string, data: any): Promise<Booking> {
    const response = await api.put(`/bookings/${bookingId}`, data);
    return response.data;
  },

  /**
   * Cancel a booking.
   */
  async cancel(bookingId: string): Promise<Booking> {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },
};
