// Common types for the hardware store inventory system

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  level: number;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string;
  category?: Category;
  supplier_id: string;
  supplier?: Supplier;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
  // POS-ready fields
  tax_category?: string;
  quick_sale?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store' | 'supplier';
  address: string;
  capacity?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface InventoryRecord {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  last_updated: string;
  // POS-ready fields
  available_quantity?: number;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  location_id: string;
  location?: Location;
  movement_type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reference_id?: string;
  notes?: string;
  user_id: string;
  user?: User;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  user?: User;
  timestamp: string;
}

// Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string;
  level: number;
  children_count: number;
  has_children: boolean;
}

export interface DashboardStats {
  total_products: number;
  in_stock_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  total_categories: number;
  total_suppliers: number;
  recent_movements: StockMovement[];
}

// Filter and search types
export interface ProductFilters {
  category_id?: string;
  supplier_id?: string;
  status?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CategoryListResponse {
  categories: Category[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

export interface SupplierListResponse {
  suppliers: Supplier[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
  };
}

// Single-location inventory types for hardware store
export interface LowStockItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  reorder_level: number;
  deficit: number;
  barcode?: string;
}

export interface ZeroStockItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  last_updated: string;
  barcode?: string;
}

export interface StockAdjustmentRequest {
  product_id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  notes?: string;
  reason?: 'sale' | 'damage' | 'receiving' | 'correction' | 'other';
}

export interface CreateInventoryRequest {
  product_id: string;
  quantity: number;
  reserved_quantity?: number;
  reorder_level: number;
}

// POS-ready types for future integration
export interface POSProduct {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  retail_price: number;
  quantity: number;
  tax_category?: string;
  quick_sale?: boolean;
}

export interface POSLookupRequest {
  barcode?: string;
  sku?: string;
  name?: string;
}

export interface InventoryListResponse {
  data: InventoryRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message: string;
  success: boolean;
}