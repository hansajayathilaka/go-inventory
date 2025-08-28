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

  // Single-Location Hardware Store Inventory Management
  inventory: {
    // Get inventory records for hardware store
    list: (params?: { 
      page?: number; 
      limit?: number; 
      product_id?: string; 
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.product_id) searchParams.append('product_id', params.product_id);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/inventory${queryString ? '?' + queryString : ''}`);
    },

    // Create new inventory record for single location
    create: (data: {
      product_id: string;
      quantity: number;
      reserved_quantity?: number;
      reorder_level: number;
    }) => apiClient.post('/inventory', data),

    // Stock adjustments for hardware store (receiving, sales, corrections)
    adjustStock: (data: {
      product_id: string;
      quantity: number;
      movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
      notes?: string;
      reason?: 'sale' | 'damage' | 'receiving' | 'correction' | 'other';
    }) => apiClient.post('/inventory/adjust', data),

    // Get low stock alerts for reordering
    getLowStock: () => apiClient.get('/inventory/low-stock'),

    // Get out of stock items
    getZeroStock: () => apiClient.get('/inventory/zero-stock'),

    // Update reorder levels for hardware store
    updateReorderLevels: (data: {
      reorder_levels: Array<{
        product_id: string;
        reorder_level: number;
      }>
    }) => apiClient.put('/inventory/reorder-levels', data),

    // POS-ready endpoints for future integration
    posLookup: (params: {
      barcode?: string;
      sku?: string;
      name?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params.barcode) searchParams.append('barcode', params.barcode);
      if (params.sku) searchParams.append('sku', params.sku);
      if (params.name) searchParams.append('name', params.name);
      
      return apiClient.get(`/inventory/pos-lookup?${searchParams.toString()}`);
    },

    // Get POS-ready products (with barcodes and stock)
    getPOSReady: () => apiClient.get('/inventory/pos-ready'),
  },

  // Hardware Store Configuration (future expansion)
  store: {
    // Get store settings and configuration
    getSettings: () => apiClient.get('/store/settings'),
    
    // Update store information
    updateSettings: (data: {
      name?: string;
      address?: string;
      phone?: string;
      email?: string;
      tax_rate?: number;
    }) => apiClient.put('/store/settings', data),
  },
};