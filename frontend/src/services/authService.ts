import { apiClient } from './api';
import type { LoginCredentials, AuthResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse['data']>('/auth/login', credentials);
    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors - we'll clear local state anyway
      console.warn('Logout API call failed:', error);
    }
  },

  async validateToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.get<any>('/auth/me');
      console.log('Validate token API response:', response);

      return {
        success: true,
        message: 'Token validated',
        data: {
          user: response.data || response, // Handle different response structures
          token: this.getToken() || '' // Use existing token
        }
      };
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  },

  // Token management
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  },

  clearToken(): void {
    localStorage.removeItem('auth_token');
  },

  hasToken(): boolean {
    return !!this.getToken();
  },
};