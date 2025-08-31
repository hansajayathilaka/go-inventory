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
  supplier_id?: string;
  supplier?: Supplier;
  brand_id?: string;
  brand?: Brand;
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

// API Response types (Standardized)
export interface StandardResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp: string;
}

export interface StandardListResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  pagination: StandardPagination;
  error?: string;
  timestamp: string;
}

export interface StandardPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface StandardErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
}

// Legacy API Response types (maintained for backward compatibility)
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

export interface UserListResponse {
  users: User[];
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
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

// =============================================================================
// VEHICLE SPARE PARTS SHOP - NEW TYPES
// =============================================================================

// Enums
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';
export type GRNStatus = 'draft' | 'received' | 'partial' | 'completed' | 'cancelled';

// Customer Management
export interface Customer {
  id: string;
  name: string;
  code: string;
  customer_type: 'individual' | 'business';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  tax_number?: string;
  credit_limit: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
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
}

export interface UpdateCustomerRequest {
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
}

export interface CustomerListResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  message: string;
  success: boolean;
}

export interface CustomerListRequest {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  city?: string;
  state?: string;
}

// Brand Management
export interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
  website?: string;
  country_code?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBrandRequest {
  name: string;
  code?: string;
  description?: string;
  website?: string;
  country_code?: string;
  logo_url?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  code?: string;
  description?: string;
  website?: string;
  country_code?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface BrandListRequest {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  country_code?: string;
}

// Vehicle Brand Management
export interface VehicleBrand {
  id: string;
  name: string;
  code: string;
  description?: string;
  country_code?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleBrandWithModels extends VehicleBrand {
  vehicle_models?: VehicleModel[];
}

export interface CreateVehicleBrandRequest {
  name: string;
  code?: string;
  description?: string;
  country_code?: string;
  logo_url?: string;
}

export interface UpdateVehicleBrandRequest {
  name?: string;
  code?: string;
  description?: string;
  country_code?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface VehicleBrandListRequest {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  country_code?: string;
}

// Vehicle Model Management
export interface VehicleModel {
  id: string;
  name: string;
  code: string;
  description?: string;
  vehicle_brand_id: string;
  year_from: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
  engine_size?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleModelWithBrand extends VehicleModel {
  vehicle_brand: VehicleBrand;
}

export interface CreateVehicleModelRequest {
  name: string;
  code?: string;
  description?: string;
  vehicle_brand_id: string;
  year_from: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
  engine_size?: string;
}

export interface UpdateVehicleModelRequest {
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
}

export interface VehicleModelListRequest {
  page?: number;
  limit?: number;
  search?: string;
  vehicle_brand_id?: string;
  is_active?: boolean;
  year_from?: number;
  year_to?: number;
  fuel_type?: string;
  transmission?: string;
}

// Purchase Order Management
export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date?: string;
  delivery_date?: string;
  sub_total: number;
  tax_amount: number;
  tax_rate: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  reference?: string;
  created_by_id: string;
  approved_by_id?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  received_quantity: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  order_date: string;
  expected_date?: string;
  tax_rate?: number;
  shipping_cost?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  reference?: string;
  items?: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  notes?: string;
}

export interface UpdatePurchaseOrderRequest {
  supplier_id?: string;
  order_date?: string;
  expected_date?: string;
  delivery_date?: string;
  tax_rate?: number;
  shipping_cost?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  terms?: string;
  reference?: string;
}

export interface UpdatePurchaseOrderItemRequest {
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  notes?: string;
}

export interface PurchaseOrderListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}

// GRN (Goods Received Note) Management
export interface GRN {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  supplier_id: string;
  status: GRNStatus;
  received_date: string;
  delivery_note?: string;
  invoice_number?: string;
  invoice_date?: string;
  vehicle_number?: string;
  driver_name?: string;
  quality_check: boolean;
  quality_notes?: string;
  sub_total: number;
  tax_amount: number;
  tax_rate: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  received_by_id: string;
  verified_by_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  items?: GRNItem[];
}

export interface GRNItem {
  id: string;
  grn_id: string;
  purchase_order_item_id: string;
  product_id: string;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  damaged_quantity: number;
  unit_price: number;
  total_price: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string;
  quality_status: string;
  quality_notes?: string;
  stock_updated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGRNRequest {
  purchase_order_id: string;
  received_date: string;
  delivery_note?: string;
  invoice_number?: string;
  invoice_date?: string;
  vehicle_number?: string;
  driver_name?: string;
  quality_check: boolean;
  quality_notes?: string;
  tax_rate?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  received_by_id: string;
  items?: CreateGRNItemRequest[];
}

export interface CreateGRNItemRequest {
  purchase_order_item_id: string;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity?: number;
  damaged_quantity?: number;
  unit_price: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string;
  quality_status?: string;
  quality_notes?: string;
}

export interface UpdateGRNRequest {
  received_date?: string;
  delivery_note?: string;
  invoice_number?: string;
  invoice_date?: string;
  vehicle_number?: string;
  driver_name?: string;
  quality_check?: boolean;
  quality_notes?: string;
  tax_rate?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  received_by_id?: string;
}

export interface UpdateGRNItemRequest {
  received_quantity?: number;
  accepted_quantity?: number;
  rejected_quantity?: number;
  damaged_quantity?: number;
  unit_price?: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string;
  quality_status?: string;
  quality_notes?: string;
}

export interface GRNListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: GRNStatus;
  purchase_order_id?: string;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}

// Vehicle Compatibility Management
export interface VehicleCompatibility {
  id: string;
  product_id: string;
  vehicle_model_id: string;
  year_from: number;
  year_to: number;
  notes?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleCompatibilityWithDetails extends VehicleCompatibility {
  product?: Product;
  vehicle_model?: VehicleModelWithBrand;
}

export interface CreateVehicleCompatibilityRequest {
  product_id: string;
  vehicle_model_id: string;
  year_from?: number;
  year_to?: number;
  notes?: string;
}

export interface UpdateVehicleCompatibilityRequest {
  product_id?: string;
  vehicle_model_id?: string;
  year_from?: number;
  year_to?: number;
  notes?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface VehicleCompatibilityListRequest {
  page?: number;
  limit?: number;
  product_id?: string;
  vehicle_model_id?: string;
  year?: number;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface BulkVehicleCompatibilityRequest {
  ids: string[];
}

export interface BulkCreateVehicleCompatibilityRequest {
  compatibilities: CreateVehicleCompatibilityRequest[];
}

export interface VehicleCompatibilitySearchRequest {
  product_id?: string;
  vehicle_model_id?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface VehicleCompatibilityStats {
  total: number;
  active: number;
  verified: number;
  unverified: number;
}

// Enhanced Product Filters with Brand Support
export interface ProductFiltersExtended extends ProductFilters {
  brand_id?: string;
}

// List Response Types for New Entities
export interface CustomerListResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface BrandListResponse {
  data: Brand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VehicleBrandListResponse {
  data: VehicleBrand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VehicleModelListResponse {
  data: VehicleModelWithBrand[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface GRNListResponse {
  data: GRN[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface VehicleCompatibilityListResponse {
  data: VehicleCompatibilityWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// =============================================================================
// PURCHASE RECEIPT (UNIFIED PO + GRN) TYPES
// =============================================================================

export type PurchaseReceiptStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'partial' | 'completed' | 'cancelled';

// Purchase Receipt Management (Unified Purchase Order + GRN)
export interface PurchaseReceipt {
  id: string;
  receipt_number: string;
  supplier_id: string;
  supplier?: Supplier;
  status: PurchaseReceiptStatus;
  
  // Order Information
  order_date: string;
  expected_date?: string;
  reference?: string;
  terms?: string;
  order_notes?: string;
  
  // Receipt Information (populated when goods are received)
  received_date?: string;
  delivery_date?: string;
  delivery_note?: string;
  invoice_number?: string;
  invoice_date?: string;
  vehicle_number?: string;
  driver_name?: string;
  quality_check: boolean;
  quality_notes?: string;
  receipt_notes?: string;
  
  // Financial Information
  sub_total: number;
  tax_amount: number;
  tax_rate: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  
  // User Tracking
  created_by_id: string;
  created_by?: User;
  approved_by_id?: string;
  approved_by?: User;
  approved_at?: string;
  received_by_id?: string;
  received_by?: User;
  verified_by_id?: string;
  verified_by?: User;
  verified_at?: string;
  
  created_at: string;
  updated_at: string;
  items?: PurchaseReceiptItem[];
}

export interface PurchaseReceiptItem {
  id: string;
  purchase_receipt_id: string;
  product_id: string;
  product?: Product;
  
  // Order Information
  ordered_quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  tax_amount: number;
  order_notes?: string;
  
  // Receipt Information (populated during goods receipt)
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  damaged_quantity: number;
  expiry_date?: string;
  batch_number?: string;
  serial_numbers?: string;
  quality_status: string;
  quality_notes?: string;
  receipt_notes?: string;
  stock_updated: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseReceiptRequest {
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
  items?: CreatePurchaseReceiptItemRequest[];
}

export interface CreatePurchaseReceiptItemRequest {
  product_id: string;
  ordered_quantity: number;
  unit_price: number;
  discount_amount?: number;
  order_notes?: string;
}

export interface UpdatePurchaseReceiptRequest {
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
}

export interface UpdatePurchaseReceiptItemRequest {
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
}

export interface PurchaseReceiptListRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseReceiptStatus;
  supplier_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface PurchaseReceiptListResponse {
  data: PurchaseReceipt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}