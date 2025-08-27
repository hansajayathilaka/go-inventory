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
  weight?: number;
  dimensions?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
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
  location_id: string;
  location?: Location;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  last_updated: string;
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