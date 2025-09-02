// API Response types

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ApiError {
  message: string;
  errors?: string[];
  status?: number;
}

// Dashboard Statistics
export interface DashboardStats {
  total_products: number;
  low_stock_products: number;
  total_suppliers: number;
  total_customers: number;
  pending_purchase_receipts: number;
  total_categories: number;
  total_brands: number;
  inventory_value: number;
}

// Stock Movement Statistics
export interface StockMovementStats {
  daily_movements: {
    date: string;
    purchases: number;
    sales: number;
    adjustments: number;
  }[];
  monthly_movements: {
    month: string;
    purchases: number;
    sales: number;
    adjustments: number;
  }[];
}

// Product Statistics
export interface ProductStats {
  top_selling_products: {
    product_id: number;
    product_name: string;
    total_sold: number;
  }[];
  low_stock_products: {
    product_id: number;
    product_name: string;
    current_stock: number;
    min_stock: number;
  }[];
}

// Supplier Performance
export interface SupplierPerformance {
  supplier_id: number;
  supplier_name: string;
  total_orders: number;
  on_time_deliveries: number;
  average_delivery_days: number;
  total_value: number;
}

// Purchase Receipt Statistics
export interface PurchaseReceiptStats {
  monthly_purchases: {
    month: string;
    total_orders: number;
    total_value: number;
    average_delivery_time: number;
  }[];
  status_breakdown: {
    draft: number;
    ordered: number;
    partially_received: number;
    received: number;
    cancelled: number;
  };
}