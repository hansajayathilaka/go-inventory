// Base types for inventory management

export interface Product {
  id: string; // UUID from API
  sku: string; // Required in backend
  name: string;
  description: string;
  category_id: string; // Required in backend (UUID)
  supplier_id?: string; // Optional UUID
  brand_id?: string; // Optional UUID
  cost_price: number;
  retail_price: number; // Backend uses retail_price, not price
  wholesale_price: number;
  barcode: string;
  weight: number;
  dimensions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Related data (populated by API)
  category?: Category;
  brand?: Brand;
  supplier?: Supplier;
  
  // Inventory data (separate from product in backend)
  total_stock?: number; // From inventory
  inventory?: Inventory[];
}

// Separate Inventory interface to match backend
export interface Inventory {
  id: string;
  product_id: string;
  quantity: number; // Current stock
  reserved_quantity: number;
  reorder_level: number; // Min stock level
  max_level?: number; // Max stock level (not supported by backend)
  last_updated: string;
  created_at: string;
  updated_at: string;
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
  purchase_date: string; // Backend uses purchase_date, not order_date
  expected_date?: string;
  received_date?: string;
  total_amount: number;
  notes?: string;
  supplier_bill_number?: string;
  bill_discount_amount?: number;
  bill_discount_percentage?: number;
  created_at: string;
  updated_at: string;

  // Relationships
  supplier?: Supplier;
  items: PurchaseReceiptItem[];

  // Computed/Alias fields for backward compatibility
  order_date?: string; // Alias for purchase_date
}

export interface PurchaseReceiptItem {
  id: string; // UUID from API
  purchase_receipt_id: string;
  product_id: string;
  quantity: number; // Backend uses quantity, not quantity_ordered/quantity_received
  unit_cost: number;
  line_total: number; // Backend uses line_total, not total_cost

  // Relationships
  product?: Product; // Optional since it may not be populated
  purchase_receipt?: PurchaseReceipt; // Optional since it may not be populated

  // Computed/Alias fields for backward compatibility
  quantity_ordered?: number; // Alias for quantity
  quantity_received?: number; // Alias for quantity
  total_cost?: number; // Alias for line_total
}

export type PurchaseReceiptStatus =
  | 'pending'     // Initial state when created
  | 'received'    // Goods received from supplier
  | 'completed'   // Stock integrated, final state
  | 'cancelled';  // Order cancelled

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


// Form types - matches backend API exactly
export interface ProductFormData {
  sku: string; // Required in backend
  name: string;
  description: string;
  category_id: string; // Required UUID in backend
  supplier_id?: string; // Optional UUID
  brand_id?: string; // Optional UUID
  cost_price: number;
  retail_price: number; // Backend expects retail_price, not price
  wholesale_price: number;
  barcode: string;
  weight: number;
  dimensions: string;
  is_active: boolean;
}

// Separate form data for inventory (handled separately from product)
export interface InventoryFormData {
  product_id: string;
  quantity: number; // Current stock
  reorder_level: number; // Min stock level
}

// Combined form data for UI (includes both product and inventory)
export interface ProductWithInventoryFormData extends ProductFormData {
  // Inventory fields for UI convenience
  stock_quantity: number; // Maps to inventory.quantity
  min_stock_level?: number; // Maps to inventory.reorder_level
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