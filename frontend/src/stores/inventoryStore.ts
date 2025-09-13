import { create } from 'zustand';
import type { Product, Category, Brand, Supplier } from '../types/inventory';
import { getStockQuantity, getReorderLevel, getDisplayPrice } from '@/utils/productUtils';

export interface InventoryState {
  // Products
  products: Product[];
  selectedProduct: Product | null;
  productFilters: ProductFilters;
  
  // Categories
  categories: Category[];
  selectedCategory: Category | null;
  
  // Brands
  brands: Brand[];
  selectedBrand: Brand | null;
  
  // Suppliers
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  
  // UI State
  isProductDialogOpen: boolean;
  isEditMode: boolean;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setProductFilters: (filters: Partial<ProductFilters>) => void;
  resetProductFilters: () => void;
  
  setCategories: (categories: Category[]) => void;
  setSelectedCategory: (category: Category | null) => void;
  
  setBrands: (brands: Brand[]) => void;
  setSelectedBrand: (brand: Brand | null) => void;
  
  setSuppliers: (suppliers: Supplier[]) => void;
  setSelectedSupplier: (supplier: Supplier | null) => void;
  
  setProductDialogOpen: (open: boolean) => void;
  setEditMode: (edit: boolean) => void;
  
  // Computed getters
  getFilteredProducts: () => Product[];
  getLowStockProducts: () => Product[];
  getProductsByCategory: (categoryId: number) => Product[];
}

export interface ProductFilters {
  search: string;
  categoryId: number | null;
  brandId: number | null;
  supplierId: number | null;
  minStock: number | null;
  lowStock: boolean;
  sortBy: 'name' | 'retail_price' | 'stock_quantity' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: ProductFilters = {
  search: '',
  categoryId: null,
  brandId: null,
  supplierId: null,
  minStock: null,
  lowStock: false,
  sortBy: 'name',
  sortOrder: 'asc',
};

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // Initial state
  products: [],
  selectedProduct: null,
  productFilters: defaultFilters,
  
  categories: [],
  selectedCategory: null,
  
  brands: [],
  selectedBrand: null,
  
  suppliers: [],
  selectedSupplier: null,
  
  isProductDialogOpen: false,
  isEditMode: false,

  // Product actions
  setProducts: (products: Product[]) => {
    set({ products });
  },

  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product });
  },

  setProductFilters: (filters: Partial<ProductFilters>) => {
    set((state) => ({
      productFilters: { ...state.productFilters, ...filters }
    }));
  },

  resetProductFilters: () => {
    set({ productFilters: defaultFilters });
  },

  // Category actions
  setCategories: (categories: Category[]) => {
    set({ categories });
  },

  setSelectedCategory: (category: Category | null) => {
    set({ selectedCategory: category });
  },

  // Brand actions
  setBrands: (brands: Brand[]) => {
    set({ brands });
  },

  setSelectedBrand: (brand: Brand | null) => {
    set({ selectedBrand: brand });
  },

  // Supplier actions
  setSuppliers: (suppliers: Supplier[]) => {
    set({ suppliers });
  },

  setSelectedSupplier: (supplier: Supplier | null) => {
    set({ selectedSupplier: supplier });
  },

  // UI actions
  setProductDialogOpen: (open: boolean) => {
    set({ isProductDialogOpen: open });
    if (!open) {
      set({ selectedProduct: null, isEditMode: false });
    }
  },

  setEditMode: (edit: boolean) => {
    set({ isEditMode: edit });
  },

  // Computed getters
  getFilteredProducts: () => {
    const state = get();
    let filtered = [...state.products];
    const filters = state.productFilters;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.categoryId) {
      filtered = filtered.filter(product => product.category_id === String(filters.categoryId));
    }

    // Brand filter
    if (filters.brandId) {
      filtered = filtered.filter(product => product.brand_id === String(filters.brandId));
    }

    // Supplier filter
    if (filters.supplierId) {
      filtered = filtered.filter(product => product.supplier_id === String(filters.supplierId));
    }

    // Stock range filters
    if (filters.minStock !== null) {
      filtered = filtered.filter(product => getStockQuantity(product) >= filters.minStock!);
    }

    // Low stock filter
    if (filters.lowStock) {
      filtered = filtered.filter(product => 
        getStockQuantity(product) <= getReorderLevel(product)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      const aVal = filters.sortBy === 'stock_quantity' ? getStockQuantity(a) : 
                   filters.sortBy === 'retail_price' ? getDisplayPrice(a) : 
                   (a as any)[filters.sortBy];
      const bVal = filters.sortBy === 'stock_quantity' ? getStockQuantity(b) : 
                   filters.sortBy === 'retail_price' ? getDisplayPrice(b) : 
                   (b as any)[filters.sortBy];
      const modifier = filters.sortOrder === 'desc' ? -1 : 1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * modifier;
      }
      
      return 0;
    });

    return filtered;
  },

  getLowStockProducts: () => {
    const state = get();
    return state.products.filter(product => 
      getStockQuantity(product) <= getReorderLevel(product)
    );
  },

  getProductsByCategory: (categoryId: number) => {
    const state = get();
    return state.products.filter(product => product.category_id === String(categoryId));
  },
}));