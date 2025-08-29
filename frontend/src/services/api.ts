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

  // Brand Management
  brands: {
    // List all brands with pagination and filtering
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string;
      is_active?: boolean;
      country_code?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      if (params?.country_code) searchParams.append('country_code', params.country_code);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/brands${queryString ? '?' + queryString : ''}`);
    },

    // Get active brands for dropdowns
    getActive: () => apiClient.get('/brands?is_active=true&limit=1000'),

    // Get single brand by ID
    getById: (id: string) => apiClient.get(`/brands/${id}`),

    // Create new brand
    create: (data: {
      name: string;
      code?: string;
      description?: string;
      website?: string;
      country_code?: string;
      logo_url?: string;
    }) => apiClient.post('/brands', data),

    // Update existing brand
    update: (id: string, data: {
      name?: string;
      code?: string;
      description?: string;
      website?: string;
      country_code?: string;
      logo_url?: string;
      is_active?: boolean;
    }) => apiClient.put(`/brands/${id}`, data),

    // Delete brand
    delete: (id: string) => apiClient.delete(`/brands/${id}`),

    // Activate brand
    activate: (id: string) => apiClient.put(`/brands/${id}/activate`),

    // Deactivate brand
    deactivate: (id: string) => apiClient.put(`/brands/${id}/deactivate`),

    // Get brands by country
    getByCountry: (countryCode: string) => 
      apiClient.get(`/brands?country_code=${countryCode}&is_active=true`),

    // Search brands
    search: (query: string) => 
      apiClient.get(`/brands?search=${encodeURIComponent(query)}&is_active=true&limit=50`),
  },

  // Vehicle Brand Management
  vehicleBrands: {
    // List all vehicle brands with pagination and filtering
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string;
      is_active?: boolean;
      country_code?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      if (params?.country_code) searchParams.append('country_code', params.country_code);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-brands${queryString ? '?' + queryString : ''}`);
    },

    // Get active vehicle brands for dropdowns
    getActive: () => apiClient.get('/vehicle-brands?is_active=true&limit=1000'),

    // Get single vehicle brand by ID
    getById: (id: string) => apiClient.get(`/vehicle-brands/${id}`),

    // Get vehicle brand with models
    getWithModels: (id: string) => apiClient.get(`/vehicle-brands/${id}/models`),

    // Create new vehicle brand
    create: (data: {
      name: string;
      code?: string;
      description?: string;
      country_code?: string;
      logo_url?: string;
    }) => apiClient.post('/vehicle-brands', data),

    // Update existing vehicle brand
    update: (id: string, data: {
      name?: string;
      code?: string;
      description?: string;
      country_code?: string;
      logo_url?: string;
      is_active?: boolean;
    }) => apiClient.put(`/vehicle-brands/${id}`, data),

    // Delete vehicle brand
    delete: (id: string) => apiClient.delete(`/vehicle-brands/${id}`),

    // Activate vehicle brand
    activate: (id: string) => apiClient.put(`/vehicle-brands/${id}/activate`),

    // Deactivate vehicle brand
    deactivate: (id: string) => apiClient.put(`/vehicle-brands/${id}/deactivate`),

    // Get vehicle brands by country
    getByCountry: (countryCode: string) => 
      apiClient.get(`/vehicle-brands?country_code=${countryCode}&is_active=true`),

    // Search vehicle brands
    search: (query: string) => 
      apiClient.get(`/vehicle-brands?search=${encodeURIComponent(query)}&is_active=true&limit=50`),
  },

  // Customer Management
  customers: {
    // List all customers with pagination and filtering
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string;
      customer_type?: string;
      is_active?: boolean;
      city?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.customer_type) searchParams.append('customer_type', params.customer_type);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      if (params?.city) searchParams.append('city', params.city);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/customers${queryString ? '?' + queryString : ''}`);
    },

    // Get active customers for dropdowns
    getActive: () => apiClient.get('/customers?is_active=true&limit=1000'),

    // Get single customer by ID
    getById: (id: string) => apiClient.get(`/customers/${id}`),

    // Create new customer
    create: (data: {
      name: string;
      code?: string;
      customer_type: 'individual' | 'business';
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      tax_number?: string;
      credit_limit?: number;
      notes?: string;
    }) => apiClient.post('/customers', data),

    // Update existing customer
    update: (id: string, data: {
      name?: string;
      code?: string;
      customer_type?: 'individual' | 'business';
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      tax_number?: string;
      credit_limit?: number;
      notes?: string;
      is_active?: boolean;
    }) => apiClient.put(`/customers/${id}`, data),

    // Delete customer
    delete: (id: string) => apiClient.delete(`/customers/${id}`),

    // Activate customer
    activate: (id: string) => apiClient.put(`/customers/${id}/activate`),

    // Deactivate customer
    deactivate: (id: string) => apiClient.put(`/customers/${id}/deactivate`),

    // Search customers
    search: (query: string) => 
      apiClient.get(`/customers?search=${encodeURIComponent(query)}&is_active=true&limit=50`),

    // Get customer statistics
    getStats: () => apiClient.get('/customers/stats'),
  },
};