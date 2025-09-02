// Base types for inventory management

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  unit: string;
  category_id?: number;
  brand_id?: number;
  supplier_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data (populated by API)
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface CategoryHierarchyNode {
  category: Category;
  children: CategoryHierarchyNode[];
}

export interface CategoryHierarchy {
  category: Category;
  children: CategoryHierarchyNode[];
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  products?: Product[];
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  products?: Product[];
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseReceipt {
  id: number;
  receipt_number: string;
  supplier_id?: number;
  status: PurchaseReceiptStatus;
  order_date: string;
  expected_date?: string;
  received_date?: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relationships
  supplier?: Supplier;
  items: PurchaseReceiptItem[];
}

export interface PurchaseReceiptItem {
  id: number;
  purchase_receipt_id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  
  // Relationships
  product: Product;
  purchase_receipt: PurchaseReceipt;
}

export type PurchaseReceiptStatus = 
  | 'draft'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: StockMovementType;
  quantity: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  created_at: string;
  
  // Relationships
  product: Product;
}

export type StockMovementType = 
  | 'purchase'
  | 'sale'
  | 'adjustment'
  | 'transfer'
  | 'return';

// Vehicle-related types
export interface VehicleBrand {
  id: number;
  name: string;
  country?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  models?: VehicleModel[];
}

export interface VehicleModel {
  id: number;
  name: string;
  vehicle_brand_id: number;
  year_from?: number;
  year_to?: number;
  engine_types?: string[];
  fuel_types?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  vehicle_brand: VehicleBrand;
  compatibilities?: VehicleCompatibility[];
}

export interface VehicleCompatibility {
  id: number;
  product_id: number;
  vehicle_model_id: number;
  notes?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  product: Product;
  vehicle_model: VehicleModel;
}

// Form types
export interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost_price?: number;
  stock_quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  unit: string;
  category_id?: number;
  brand_id?: number;
  supplier_id?: number;
  is_active: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
}

export interface BrandFormData {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
}

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  payment_terms?: string;
  is_active: boolean;
}