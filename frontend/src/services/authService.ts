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
    const response = await apiClient.get<AuthResponse['data']>('/auth/me');
    return {
      success: response.success,
      message: response.message,
      data: response.data,
    };
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