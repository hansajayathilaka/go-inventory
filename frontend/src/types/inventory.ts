// Base types for inventory management

export interface Product {
  id: string; // UUID from API
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
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data (populated by API)
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
}

export interface Category {
  id: string; // UUID from API
  name: string;
  description?: string;
  parent_id?: string;
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
  id: string; // UUID from API
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
  id: string; // UUID from API
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
  id: string; // UUID from API
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
  id: string; // UUID from API
  receipt_number: string;
  supplier_id?: string;
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
  id: string; // UUID from API
  purchase_receipt_id: string;
  product_id: string;
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
  | 'completed'
  | 'cancelled';

export interface StockMovement {
  id: string; // UUID from API
  product_id: string;
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
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
  is_active: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parent_id?: string;
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

export interface StockAdjustmentFormData {
  product_id: string;
  adjustment_type: 'increase' | 'decrease' | 'set';
  quantity: number;
  reason: 'damaged' | 'expired' | 'lost' | 'found' | 'recount' | 'correction' | 'other';
  notes?: string;
}