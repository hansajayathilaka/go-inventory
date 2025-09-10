import { apiClient } from './api'

// Product interface matching backend POS-ready response
export interface Product {
  id: string
  name: string
  sku?: string
  barcode?: string
  retail_price: number
  cost_price?: number
  quantity: number
  tax_category?: string
  quick_sale?: boolean
  is_active: boolean
  // Legacy fields for compatibility
  price?: number // Maps to retail_price
  stock_quantity?: number // Maps to quantity
}

// Full product interface matching inventory system
export interface FullProduct {
  id: string
  name: string
  description?: string
  sku?: string
  price: number
  cost_price?: number
  category_id?: string
  brand_id?: string
  stock_quantity: number
  min_stock_level?: number
  max_stock_level?: number
  unit?: string
  barcode?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductSearchParams {
  search?: string
  category_id?: number
  brand_id?: number
  is_active?: boolean
  limit?: number
  page?: number
}

export interface ProductSearchResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export const productService = {
  /**
   * Search products with filters
   */
  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.search) queryParams.append('search', params.search)
    if (params.category_id) queryParams.append('category_id', params.category_id.toString())
    if (params.brand_id) queryParams.append('brand_id', params.brand_id.toString())
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.page) queryParams.append('page', params.page.toString())

    const endpoint = params.search 
      ? `/products/search?${queryParams.toString()}`
      : `/products?${queryParams.toString()}`

    const response = await apiClient.get<ProductSearchResponse>(endpoint)
    return response.data
  },

  /**
   * Get all products with pagination
   */
  async getProducts(page = 1, limit = 20): Promise<ProductSearchResponse> {
    return this.searchProducts({ page, limit })
  },

  /**
   * Get POS-ready products (active products with stock)
   */
  async getPOSReadyProducts(limit = 100): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(`/products/pos-ready?limit=${limit}`)
    return response.data.map((product: any) => ({
      ...product,
      // Add compatibility fields
      price: product.retail_price,
      stock_quantity: product.quantity
    }))
  },

  /**
   * Get single product by ID
   */
  async getProduct(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`)
    return response.data
  },

  /**
   * Search products for POS (optimized for quick lookup)
   */
  async posLookup(query: string, limit = 10): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(`/pos/lookup?q=${encodeURIComponent(query)}&limit=${limit}`)
    return response.data.map((product: any) => ({
      ...product,
      // Add compatibility fields
      price: product.retail_price,
      stock_quantity: product.quantity
    }))
  },

  /**
   * Create new product
   */
  async createProduct(productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<Product>('/products', productData)
    return response.data
  },

  /**
   * Update existing product
   */
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, productData)
    return response.data
  },

  /**
   * Delete product
   */
  async deleteProduct(id: number): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  },

  /**
   * Get product inventory information
   */
  async getProductInventory(id: number): Promise<{
    product: Product
    current_stock: number
    reserved_stock?: number
    available_stock: number
    last_movement?: {
      date: string
      type: string
      quantity: number
      reason?: string
    }
  }> {
    const response = await apiClient.get(`/products/${id}/inventory`)
    return response.data
  }
}