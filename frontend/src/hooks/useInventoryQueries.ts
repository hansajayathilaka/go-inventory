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
  SupplierFormData 
} from '../types/inventory';
import type { PaginatedResponse, DashboardStats } from '../types/api';

// Query Keys
export const QUERY_KEYS = {
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  categories: ['categories'] as const,
  category: (id: number) => ['categories', id] as const,
  brands: ['brands'] as const,
  brand: (id: number) => ['brands', id] as const,
  suppliers: ['suppliers'] as const,
  supplier: (id: number) => ['suppliers', id] as const,
  purchaseReceipts: ['purchase-receipts'] as const,
  purchaseReceipt: (id: number) => ['purchase-receipts', id] as const,
} as const;

// Products
export function useProducts(params?: { 
  search?: string; 
  page?: number; 
  limit?: number;
  category_id?: number;
  brand_id?: number;
  supplier_id?: number;
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
      
      const response = await apiClient.get<PaginatedResponse<Product>>(`/products${queryString}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: number) {
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
    mutationFn: async ({ id, data }: { id: number; data: ProductFormData }): Promise<Product> => {
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
    mutationFn: async (id: number): Promise<void> => {
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
  supplier_id?: number;
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
      
      const response = await apiClient.get<PaginatedResponse<PurchaseReceipt>>(`/purchase-receipts${queryString}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - purchase receipts change more frequently
  });
}

export function usePurchaseReceipt(id: number) {
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