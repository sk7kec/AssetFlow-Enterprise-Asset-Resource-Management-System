import api from './api';
import { User, TokenResponse } from '../types';

export const authService = {
  /**
   * Register a new user.
   */
  async signup(data: any): Promise<User> {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  /**
   * Login user and save tokens.
   */
  async login(data: any): Promise<TokenResponse> {
    const response = await api.post('/auth/login', data);
    const { access_token, refresh_token } = response.data;
    
    localStorage.setItem('assetflow_access_token', access_token);
    localStorage.setItem('assetflow_refresh_token', refresh_token);
    
    return response.data;
  },

  /**
   * Request password reset token.
   */
  async forgotPassword(data: { email: string }): Promise<{ message: string; reset_token?: string }> {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Reset password with token.
   */
  async resetPassword(data: any): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Get the current authenticated user's profile.
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Update profile.
   */
  async updateProfile(data: any): Promise<User> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  /**
   * Change password.
   */
  async changePassword(data: any): Promise<{ message: string }> {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },

  /**
   * Logs out user by removing tokens from storage.
   */
  logout(): void {
    localStorage.removeItem('assetflow_access_token');
    localStorage.removeItem('assetflow_refresh_token');
    window.dispatchEvent(new Event('auth_logout'));
  },
};
