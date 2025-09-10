import { apiClient } from './api'

export interface Customer {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_purchases?: number
  last_purchase_date?: string
}

export interface CustomerSearchParams {
  search?: string
  is_active?: boolean
  limit?: number
  page?: number
}

export interface CustomerSearchResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface CreateCustomerRequest {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
}

export const customerService = {
  /**
   * Search customers with filters
   */
  async searchCustomers(params: CustomerSearchParams): Promise<CustomerSearchResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.search) queryParams.append('search', params.search)
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.page) queryParams.append('page', params.page.toString())

    const response = await apiClient.get<CustomerSearchResponse>(`/customers?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get all active customers
   */
  async getActiveCustomers(limit = 100): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>(`/customers/active?limit=${limit}`)
    return response.data
  },

  /**
   * Get single customer by ID
   */
  async getCustomer(id: number): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`)
    return response.data
  },

  /**
   * Get customer by code
   */
  async getCustomerByCode(code: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/code/${code}`)
    return response.data
  },

  /**
   * Create new customer
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', customerData)
    return response.data
  },

  /**
   * Update existing customer
   */
  async updateCustomer(id: number, customerData: Partial<CreateCustomerRequest>): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, customerData)
    return response.data
  },

  /**
   * Delete customer (soft delete - sets is_active to false)
   */
  async deleteCustomer(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`)
  },

  /**
   * Activate customer
   */
  async activateCustomer(id: number): Promise<Customer> {
    const response = await apiClient.post<Customer>(`/customers/${id}/activate`)
    return response.data
  },

  /**
   * Deactivate customer
   */
  async deactivateCustomer(id: number): Promise<Customer> {
    const response = await apiClient.post<Customer>(`/customers/${id}/deactivate`)
    return response.data
  },

  /**
   * Generate next customer code
   */
  async generateCustomerCode(): Promise<{ code: string }> {
    const response = await apiClient.get<{ code: string }>('/customers/generate-code')
    return response.data
  }
}