import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

// API Base Configuration
const API_BASE_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Common API functions
export const api = {
  // Generic CRUD operations
  get: <T>(url: string): Promise<AxiosResponse<T>> => apiClient.get(url),
  post: <T>(url: string, data?: unknown): Promise<AxiosResponse<T>> => apiClient.post(url, data),
  put: <T>(url: string, data?: unknown): Promise<AxiosResponse<T>> => apiClient.put(url, data),
  delete: <T>(url: string): Promise<AxiosResponse<T>> => apiClient.delete(url),
  
  // Authentication
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  
  // Health check
  health: () => apiClient.get('/health'),
};