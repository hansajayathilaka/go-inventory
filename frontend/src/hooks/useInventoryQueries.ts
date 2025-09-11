import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { useUiStore } from '../stores/uiStore';
import type { 
  Product, 
  Category, 
  CategoryHierarchy,
  Brand, 
  Supplier, 
  PurchaseReceipt,
  ProductFormData,
  CategoryFormData,
  BrandFormData,
  SupplierFormData,
  StockAdjustmentFormData 
} from '../types/inventory';
import type { PaginatedResponse, DashboardStats } from '../types/api';

// Query Keys
export const QUERY_KEYS = {
  products: ['products'] as const,
  product: (id: string) => ['products', id] as const,
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  brands: ['brands'] as const,
  brand: (id: string) => ['brands', id] as const,
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  purchaseReceipts: ['purchase-receipts'] as const,
  purchaseReceipt: (id: string) => ['purchase-receipts', id] as const,
  inventory: ['inventory'] as const,
  productInventory: (id: string) => ['products', id, 'inventory'] as const,
} as const;

// Products
export function useProducts(params?: { 
  search?: string; 
  page?: number; 
  limit?: number;
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.products, params],
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      // Fetch products and inventory data in parallel
      const [productsResponse, inventoryResponse] = await Promise.all([
        apiClient.get(`/products${queryString}`),
        apiClient.get('/inventory')
      ]);
      
      // Create inventory lookup map by product_id
      const inventoryMap = new Map();
      if (inventoryResponse.data && Array.isArray(inventoryResponse.data)) {
        inventoryResponse.data.forEach((inv: any) => {
          inventoryMap.set(inv.product_id, {
            quantity: inv.quantity || 0,
            reserved_quantity: inv.reserved_quantity || 0,
            reorder_level: inv.reorder_level || 10,
          });
        });
      }
      
      // Transform the products to match frontend interface and include inventory data
      const transformedProducts = (productsResponse.data as any[]).map((product: any) => {
        const inventory = inventoryMap.get(product.id) || { quantity: 0, reserved_quantity: 0, reorder_level: 10 };
        
        return {
          ...product,
          // Map API fields to frontend interface
          price: product.retail_price || 0,
          stock_quantity: inventory.quantity,
          reserved_quantity: inventory.reserved_quantity || 0,
          unit: 'pcs', // Default unit
          min_stock_level: inventory.reorder_level,
          max_stock_level: 100, // Default max stock level
          // Keep API fields that match
          id: product.id, // UUID string from API
          name: product.name,
          description: product.description,
          sku: product.sku,
          barcode: product.barcode,
          cost_price: product.cost_price,
          category_id: product.category_id,
          supplier_id: product.supplier_id,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
          // Include related data
          category: product.category,
          supplier: product.supplier,
        };
      });
      
      return {
        data: transformedProducts,
        pagination: (productsResponse as any).pagination
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter stale time for POS usage
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.product(id),
    queryFn: async (): Promise<Product> => {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (data: ProductFormData): Promise<Product> => {
      const response = await apiClient.post<Product>('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      addNotification({
        type: 'success',
        title: 'Product created',
        message: 'Product has been created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to create product',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }): Promise<Product> => {
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(data.id) });
      addNotification({
        type: 'success',
        title: 'Product updated',
        message: 'Product has been updated successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to update product',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      addNotification({
        type: 'success',
        title: 'Product deleted',
        message: 'Product has been deleted successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to delete product',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: async (): Promise<Category[]> => {
      const response = await apiClient.get<Category[]>('/categories');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
}

export function useCategoryHierarchy() {
  return useQuery({
    queryKey: [...QUERY_KEYS.categories, 'hierarchy'],
    queryFn: async (): Promise<CategoryHierarchy> => {
      const response = await apiClient.get<CategoryHierarchy>('/categories/hierarchy');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (data: CategoryFormData): Promise<Category> => {
      const response = await apiClient.post<Category>('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      addNotification({
        type: 'success',
        title: 'Category created',
        message: 'Category has been created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to create category',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

// Brands
export function useBrands() {
  return useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async (): Promise<Brand[]> => {
      const response = await apiClient.get<Brand[]>('/brands');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (data: BrandFormData): Promise<Brand> => {
      const response = await apiClient.post<Brand>('/brands', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.brands });
      addNotification({
        type: 'success',
        title: 'Brand created',
        message: 'Brand has been created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to create brand',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

// Suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: async (): Promise<Supplier[]> => {
      const response = await apiClient.get<Supplier[]>('/suppliers');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (data: SupplierFormData): Promise<Supplier> => {
      const response = await apiClient.post<Supplier>('/suppliers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
      addNotification({
        type: 'success',
        title: 'Supplier created',
        message: 'Supplier has been created successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to create supplier',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

// Purchase Receipts
export function usePurchaseReceipts(params?: {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  supplier_id?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.purchaseReceipts, params],
    queryFn: async (): Promise<PaginatedResponse<PurchaseReceipt>> => {
      const queryString = params ? '?' + new URLSearchParams(
        Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
      // Fetch purchase receipts and suppliers in parallel
      const [receiptsResponse, suppliersResponse] = await Promise.all([
        apiClient.get<PaginatedResponse<PurchaseReceipt>>(`/purchase-receipts${queryString}`),
        apiClient.get<Supplier[]>('/suppliers?limit=1000') // Get all suppliers for lookup
      ]);
      
      // Create supplier lookup map
      const supplierMap = new Map();
      suppliersResponse.data.forEach((supplier: Supplier) => {
        supplierMap.set(supplier.id, supplier);
      });
      
      // Join purchase receipts with suppliers
      const receiptsWithSuppliers = receiptsResponse.data.data.map((receipt: PurchaseReceipt) => ({
        ...receipt,
        supplier: receipt.supplier_id ? supplierMap.get(receipt.supplier_id) : null
      }));
      
      return {
        data: receiptsWithSuppliers,
        pagination: receiptsResponse.data.pagination
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - purchase receipts change more frequently
  });
}

export function usePurchaseReceipt(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseReceipt(id),
    queryFn: async (): Promise<PurchaseReceipt> => {
      const response = await apiClient.get<PurchaseReceipt>(`/purchase-receipts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Dashboard Statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Low Stock Products
export function useLowStockProducts(limit: number = 10) {
  return useQuery({
    queryKey: ['inventory', 'low-stock', limit],
    queryFn: async (): Promise<Product[]> => {
      const response = await apiClient.get<Product[]>(`/inventory/low-stock?limit=${limit}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Stock Adjustments
export function useStockAdjustment() {
  const queryClient = useQueryClient();
  const { addNotification } = useUiStore();

  return useMutation({
    mutationFn: async (data: StockAdjustmentFormData): Promise<void> => {
      // Transform frontend data to backend format
      const backendData = {
        product_id: data.product_id,
        quantity: data.quantity,
        movement_type: data.adjustment_type === 'increase' ? 'IN' : 
                      data.adjustment_type === 'decrease' ? 'OUT' : 'ADJUSTMENT',
        reason: data.reason === 'damaged' ? 'damage' :
                data.reason === 'expired' ? 'corrections' :
                data.reason === 'lost' ? 'corrections' :
                data.reason === 'found' ? 'corrections' :
                data.reason === 'recount' ? 'inventory_count' :
                data.reason === 'correction' ? 'correction' :
                'other',
        notes: data.notes || null
      };
      
      await apiClient.post('/inventory/adjust', backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory });
      addNotification({
        type: 'success',
        title: 'Stock adjusted',
        message: 'Stock level has been adjusted successfully',
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Failed to adjust stock',
        message: error.response?.data?.message || error.message,
      });
    },
  });
}

// Inventory Management
export function useInventoryRecords() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory,
    queryFn: async () => {
      const response = await apiClient.get('/inventory');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get inventory for specific product
export function useProductInventory(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.productInventory(productId),
    queryFn: async () => {
      const response = await apiClient.get(`/products/${productId}/inventory`);
      return response.data;
    },
    enabled: !!productId,
    staleTime: 1 * 60 * 1000, // 1 minute for real-time POS usage
  });
}