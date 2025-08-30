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

  // Vehicle Models Management
  vehicleModels: {
    // List all vehicle models with pagination and filtering
    list: (params?: { 
      page?: number; 
      limit?: number; 
      search?: string;
      vehicle_brand_id?: string;
      is_active?: boolean;
      year_from?: number;
      year_to?: number;
      fuel_type?: string;
      transmission?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.vehicle_brand_id) searchParams.append('vehicle_brand_id', params.vehicle_brand_id);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      if (params?.year_from) searchParams.append('year_from', params.year_from.toString());
      if (params?.year_to) searchParams.append('year_to', params.year_to.toString());
      if (params?.fuel_type) searchParams.append('fuel_type', params.fuel_type);
      if (params?.transmission) searchParams.append('transmission', params.transmission);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-models${queryString ? '?' + queryString : ''}`);
    },

    // Get active vehicle models for dropdowns
    getActive: () => apiClient.get('/vehicle-models?is_active=true&limit=1000'),

    // Get single vehicle model by ID
    getById: (id: string) => apiClient.get(`/vehicle-models/${id}`),

    // Get vehicle models by brand
    getByBrand: (brandId: string) => apiClient.get(`/vehicle-models?vehicle_brand_id=${brandId}&is_active=true`),

    // Create new vehicle model
    create: (data: {
      name: string;
      code?: string;
      description?: string;
      vehicle_brand_id: string;
      year_from: number;
      year_to?: number;
      fuel_type?: string;
      transmission?: string;
      engine_size?: string;
    }) => apiClient.post('/vehicle-models', data),

    // Update existing vehicle model
    update: (id: string, data: {
      name?: string;
      code?: string;
      description?: string;
      vehicle_brand_id?: string;
      year_from?: number;
      year_to?: number;
      fuel_type?: string;
      transmission?: string;
      engine_size?: string;
      is_active?: boolean;
    }) => apiClient.put(`/vehicle-models/${id}`, data),

    // Delete vehicle model
    delete: (id: string) => apiClient.delete(`/vehicle-models/${id}`),

    // Activate vehicle model
    activate: (id: string) => apiClient.put(`/vehicle-models/${id}/activate`),

    // Deactivate vehicle model
    deactivate: (id: string) => apiClient.put(`/vehicle-models/${id}/deactivate`),

    // Search vehicle models
    search: (query: string) => 
      apiClient.get(`/vehicle-models?search=${encodeURIComponent(query)}&is_active=true&limit=50`),

    // Generate model code
    generateCode: (brandId: string) => apiClient.post('/vehicle-models/generate-code', { vehicle_brand_id: brandId }),
  },

  // Vehicle Compatibility Management
  vehicleCompatibilities: {
    // List all vehicle compatibilities with pagination and filtering
    list: (params?: { 
      page?: number; 
      limit?: number; 
      product_id?: string;
      vehicle_model_id?: string;
      year?: number;
      is_verified?: boolean;
      is_active?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.product_id) searchParams.append('product_id', params.product_id);
      if (params?.vehicle_model_id) searchParams.append('vehicle_model_id', params.vehicle_model_id);
      if (params?.year) searchParams.append('year', params.year.toString());
      if (params?.is_verified !== undefined) searchParams.append('is_verified', params.is_verified.toString());
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-compatibilities${queryString ? '?' + queryString : ''}`);
    },

    // Get active vehicle compatibilities
    getActive: () => apiClient.get('/vehicle-compatibilities/active'),

    // Get verified vehicle compatibilities
    getVerified: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-compatibilities/verified${queryString ? '?' + queryString : ''}`);
    },

    // Get unverified vehicle compatibilities
    getUnverified: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-compatibilities/unverified${queryString ? '?' + queryString : ''}`);
    },

    // Get single vehicle compatibility by ID
    getById: (id: string) => apiClient.get(`/vehicle-compatibilities/${id}`),

    // Get compatible products for a vehicle model
    getCompatibleProducts: (params: {
      vehicle_model_id: string;
      year?: number;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('vehicle_model_id', params.vehicle_model_id);
      if (params.year) searchParams.append('year', params.year.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-compatibilities/compatible-products?${queryString}`);
    },

    // Get compatible vehicles for a product
    getCompatibleVehicles: (params: {
      product_id: string;
      year?: number;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('product_id', params.product_id);
      if (params.year) searchParams.append('year', params.year.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/vehicle-compatibilities/compatible-vehicles?${queryString}`);
    },

    // Create new vehicle compatibility
    create: (data: {
      product_id: string;
      vehicle_model_id: string;
      year_from?: number;
      year_to?: number;
      notes?: string;
    }) => apiClient.post('/vehicle-compatibilities', data),

    // Update existing vehicle compatibility
    update: (id: string, data: {
      product_id?: string;
      vehicle_model_id?: string;
      year_from?: number;
      year_to?: number;
      notes?: string;
      is_verified?: boolean;
      is_active?: boolean;
    }) => apiClient.put(`/vehicle-compatibilities/${id}`, data),

    // Delete vehicle compatibility
    delete: (id: string) => apiClient.delete(`/vehicle-compatibilities/${id}`),

    // Verify compatibility
    verify: (id: string) => apiClient.post(`/vehicle-compatibilities/${id}/verify`),

    // Unverify compatibility
    unverify: (id: string) => apiClient.post(`/vehicle-compatibilities/${id}/unverify`),

    // Activate compatibility
    activate: (id: string) => apiClient.post(`/vehicle-compatibilities/${id}/activate`),

    // Deactivate compatibility
    deactivate: (id: string) => apiClient.post(`/vehicle-compatibilities/${id}/deactivate`),

    // Bulk operations
    bulkCreate: (data: {
      compatibilities: Array<{
        product_id: string;
        vehicle_model_id: string;
        year_from?: number;
        year_to?: number;
        notes?: string;
      }>;
    }) => apiClient.post('/vehicle-compatibilities/bulk', data),

    bulkVerify: (data: { ids: string[] }) => 
      apiClient.post('/vehicle-compatibilities/bulk/verify', data),

    bulkUnverify: (data: { ids: string[] }) => 
      apiClient.post('/vehicle-compatibilities/bulk/unverify', data),

    bulkActivate: (data: { ids: string[] }) => 
      apiClient.post('/vehicle-compatibilities/bulk/activate', data),

    bulkDeactivate: (data: { ids: string[] }) => 
      apiClient.post('/vehicle-compatibilities/bulk/deactivate', data),

    // Get compatibility statistics
    getStats: () => apiClient.get('/vehicle-compatibilities/stats'),
  },

  // Purchase Receipt Management (Unified PO + GRN)
  purchaseReceipts: {
    // List purchase receipts with filters
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'partial' | 'completed' | 'cancelled';
      supplier_id?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.status) searchParams.append('status', params.status);
      if (params?.supplier_id) searchParams.append('supplier_id', params.supplier_id);
      if (params?.start_date) searchParams.append('start_date', params.start_date);
      if (params?.end_date) searchParams.append('end_date', params.end_date);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/purchase-receipts${queryString ? '?' + queryString : ''}`);
    },

    // Get all purchase receipts (simplified list for dropdowns)
    getAll: () => apiClient.get('/purchase-receipts'),

    // Get single purchase receipt by ID with items
    getById: (id: string) => apiClient.get(`/purchase-receipts/${id}`),

    // Create new purchase receipt
    create: (data: {
      supplier_id: string;
      order_date: string;
      expected_date?: string;
      reference?: string;
      terms?: string;
      order_notes?: string;
      tax_rate?: number;
      shipping_cost?: number;
      discount_amount?: number;
      currency?: string;
      items?: Array<{
        product_id: string;
        ordered_quantity: number;
        unit_price: number;
        discount_amount?: number;
        order_notes?: string;
      }>;
    }) => apiClient.post('/purchase-receipts', data),

    // Update existing purchase receipt
    update: (id: string, data: {
      supplier_id?: string;
      order_date?: string;
      expected_date?: string;
      delivery_date?: string;
      reference?: string;
      terms?: string;
      order_notes?: string;
      received_date?: string;
      delivery_note?: string;
      invoice_number?: string;
      invoice_date?: string;
      vehicle_number?: string;
      driver_name?: string;
      quality_check?: boolean;
      quality_notes?: string;
      receipt_notes?: string;
      tax_rate?: number;
      shipping_cost?: number;
      discount_amount?: number;
      currency?: string;
    }) => apiClient.put(`/purchase-receipts/${id}`, data),

    // Delete purchase receipt
    delete: (id: string) => apiClient.delete(`/purchase-receipts/${id}`),

    // Status management operations (Order phase)
    approve: (id: string) => apiClient.post(`/purchase-receipts/${id}/approve`),
    send: (id: string) => apiClient.post(`/purchase-receipts/${id}/send`),
    cancel: (id: string) => apiClient.post(`/purchase-receipts/${id}/cancel`),

    // Receipt processing operations
    receive: (id: string, data: {
      received_date: string;
      delivery_note?: string;
      invoice_number?: string;
      invoice_date?: string;
      vehicle_number?: string;
      driver_name?: string;
      quality_check: boolean;
      quality_notes?: string;
      receipt_notes?: string;
    }) => apiClient.post(`/purchase-receipts/${id}/receive`, data),
    
    complete: (id: string) => apiClient.post(`/purchase-receipts/${id}/complete`),

    // Purchase receipt items management
    addItem: (receiptId: string, data: {
      product_id: string;
      ordered_quantity: number;
      unit_price: number;
      discount_amount?: number;
      order_notes?: string;
    }) => apiClient.post(`/purchase-receipts/${receiptId}/items`, data),

    updateItem: (receiptId: string, itemId: string, data: {
      ordered_quantity?: number;
      unit_price?: number;
      discount_amount?: number;
      order_notes?: string;
      received_quantity?: number;
      accepted_quantity?: number;
      rejected_quantity?: number;
      damaged_quantity?: number;
      expiry_date?: string;
      batch_number?: string;
      serial_numbers?: string;
      quality_status?: string;
      quality_notes?: string;
      receipt_notes?: string;
    }) => apiClient.put(`/purchase-receipts/${receiptId}/items/${itemId}`, data),

    removeItem: (receiptId: string, itemId: string) => 
      apiClient.delete(`/purchase-receipts/${receiptId}/items/${itemId}`),

    // Get purchase receipt items
    getItems: (receiptId: string) => apiClient.get(`/purchase-receipts/${receiptId}/items`),

    // Search purchase receipts
    search: (params: {
      query: string;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      searchParams.append('query', params.query);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/purchase-receipts/search?${queryString}`);
    },

    // Financial operations
    calculateTotals: (receiptId: string) => apiClient.get(`/purchase-receipts/${receiptId}/calculate-totals`),
    
    // Reporting
    getStatistics: () => apiClient.get('/purchase-receipts/statistics'),
    generateReport: (params: {
      start_date?: string;
      end_date?: string;
      status?: string;
      supplier_id?: string;
      format?: 'json' | 'csv' | 'excel';
    }) => {
      const searchParams = new URLSearchParams();
      if (params.start_date) searchParams.append('start_date', params.start_date);
      if (params.end_date) searchParams.append('end_date', params.end_date);
      if (params.status) searchParams.append('status', params.status);
      if (params.supplier_id) searchParams.append('supplier_id', params.supplier_id);
      if (params.format) searchParams.append('format', params.format);
      
      const queryString = searchParams.toString();
      return apiClient.get(`/purchase-receipts/report${queryString ? '?' + queryString : ''}`);
    },
  },

  // Supplier Management
  suppliers: {
    // List suppliers with filters
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      is_active?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/suppliers${queryString ? '?' + queryString : ''}`);
    },

    // Get all suppliers (simplified list for dropdowns)
    getAll: () => apiClient.get('/suppliers'),

    // Get active suppliers for dropdowns
    getActive: () => apiClient.get('/suppliers?is_active=true&limit=1000'),

    // Get single supplier by ID
    getById: (id: string) => apiClient.get(`/suppliers/${id}`),

    // Create new supplier
    create: (data: {
      name: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country: string;
      tax_number?: string;
      payment_terms?: string;
      notes?: string;
    }) => apiClient.post('/suppliers', data),

    // Update existing supplier
    update: (id: string, data: {
      name?: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      tax_number?: string;
      payment_terms?: string;
      notes?: string;
      is_active?: boolean;
    }) => apiClient.put(`/suppliers/${id}`, data),

    // Delete supplier
    delete: (id: string) => apiClient.delete(`/suppliers/${id}`),
  },

  // Product Management
  products: {
    // List products with filters
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      category_id?: string;
      brand_id?: string;
      supplier_id?: string;
      is_active?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.category_id) searchParams.append('category_id', params.category_id);
      if (params?.brand_id) searchParams.append('brand_id', params.brand_id);
      if (params?.supplier_id) searchParams.append('supplier_id', params.supplier_id);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/products${queryString ? '?' + queryString : ''}`);
    },

    // Get all products (simplified list for dropdowns)
    getAll: () => apiClient.get('/products'),

    // Get active products for dropdowns
    getActive: () => apiClient.get('/products?is_active=true&limit=1000'),

    // Get single product by ID
    getById: (id: string) => apiClient.get(`/products/${id}`),

    // Create new product
    create: (data: {
      name: string;
      sku?: string;
      description?: string;
      category_id: string;
      brand_id?: string;
      supplier_id?: string;
      cost_price: number;
      retail_price: number;
      wholesale_price?: number;
      barcode?: string;
      weight?: number;
      dimensions?: string;
      image_urls?: string[];
    }) => apiClient.post('/products', data),

    // Update existing product
    update: (id: string, data: {
      name?: string;
      sku?: string;
      description?: string;
      category_id?: string;
      brand_id?: string;
      supplier_id?: string;
      cost_price?: number;
      retail_price?: number;
      wholesale_price?: number;
      barcode?: string;
      weight?: number;
      dimensions?: string;
      image_urls?: string[];
      is_active?: boolean;
    }) => apiClient.put(`/products/${id}`, data),

    // Delete product
    delete: (id: string) => apiClient.delete(`/products/${id}`),

    // Search products
    search: (query: string) => 
      apiClient.get(`/products/search?query=${encodeURIComponent(query)}`),

    // Get product inventory
    getInventory: (id: string) => apiClient.get(`/products/${id}/inventory`),

    // Brand-related operations
    getByBrand: (brandId: string) => apiClient.get(`/products/brand/${brandId}`),
    getWithoutBrand: () => apiClient.get('/products/without-brand'),
    setBrand: (productId: string, brandId: string) => 
      apiClient.put(`/products/${productId}/brand`, { brand_id: brandId }),
    removeBrand: (productId: string) => 
      apiClient.delete(`/products/${productId}/brand`),

    // POS operations
    posLookup: (query: string) => 
      apiClient.get(`/products/pos/lookup?query=${encodeURIComponent(query)}`),
    getPOSReady: () => apiClient.get('/products/pos-ready'),
  },


  // User Management
  users: {
    // List users with filters
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      is_active?: boolean;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      if (params?.role) searchParams.append('role', params.role);
      if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
      
      const queryString = searchParams.toString();
      return apiClient.get(`/users${queryString ? '?' + queryString : ''}`);
    },

    // Get all users (simplified list for dropdowns)
    getAll: () => apiClient.get('/users'),

    // Get active users for dropdowns
    getActive: () => apiClient.get('/users?is_active=true&limit=1000'),

    // Get single user by ID
    getById: (id: string) => apiClient.get(`/users/${id}`),

    // Create new user
    create: (data: {
      username: string;
      email: string;
      password: string;
      role: string;
      first_name?: string;
      last_name?: string;
    }) => apiClient.post('/users', data),

    // Update existing user
    update: (id: string, data: {
      username?: string;
      email?: string;
      role?: string;
      first_name?: string;
      last_name?: string;
      is_active?: boolean;
    }) => apiClient.put(`/users/${id}`, data),

    // Delete user
    delete: (id: string) => apiClient.delete(`/users/${id}`),

    // Change password
    changePassword: (id: string, data: {
      current_password: string;
      new_password: string;
    }) => apiClient.put(`/users/${id}/password`, data),
  },
};