import { apiClient } from './api'

export interface SaleItem {
  id?: string
  product_id: number
  product_name?: string
  sku?: string
  quantity: number
  unit_price: number
  unit_cost?: number
  discount_percent?: number
  discount_amount?: number
  tax_amount?: number
  total_price: number
  sub_total: number
}

export interface PaymentRecord {
  id?: string
  method: 'cash' | 'card' | 'bank_transfer' | 'ewallet' | 'check'
  amount: number
  reference?: string
  created_at?: string
}

export interface Sale {
  id?: string
  bill_number: string
  customer_id?: string
  customer_name?: string
  customer_code?: string
  cashier_id: string
  cashier_name?: string
  sub_total: number
  discount_percent: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  notes?: string
  created_at?: string
  updated_at?: string
  items?: SaleItem[]
  payments?: PaymentRecord[]
}

export interface CreateSaleRequest {
  bill_number: string
  customer_id?: string
  cashier_id: string
  sub_total: number
  discount_percent?: number
  discount_amount?: number
  tax_amount: number
  total_amount: number
  notes?: string
  items: {
    product_id: number
    quantity: number
    unit_price: number
    unit_cost?: number
    discount_percent?: number
    discount_amount?: number
    tax_amount?: number
  }[]
  payments: {
    method: string
    amount: number
    reference?: string
  }[]
}

export interface SalesSearchParams {
  cashier_id?: number
  customer_id?: number
  start_date?: string
  end_date?: string
  limit?: number
  page?: number
}

export interface SalesSearchResponse {
  sales: Sale[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface SalesSummary {
  total_sales: number
  total_revenue: number
  total_items: number
  average_sale: number
  period_start: string
  period_end: string
  top_products?: {
    product_name: string
    quantity_sold: number
    revenue: number
  }[]
}

export const salesService = {
  /**
   * Create a new sale transaction
   */
  async createSale(saleData: CreateSaleRequest): Promise<Sale> {
    const response = await apiClient.post<Sale>('/sales', saleData)
    return response.data
  },

  /**
   * Get sales with filters
   */
  async getSales(params: SalesSearchParams): Promise<SalesSearchResponse> {
    const queryParams = new URLSearchParams()
    
    if (params.cashier_id) queryParams.append('cashier_id', params.cashier_id.toString())
    if (params.customer_id) queryParams.append('customer_id', params.customer_id.toString())
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.page) queryParams.append('page', params.page.toString())

    const response = await apiClient.get<SalesSearchResponse>(`/sales?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get sales for a specific cashier (for personal history)
   */
  async getCashierSales(cashierId: number, params?: {
    start_date?: string
    end_date?: string
    limit?: number
    page?: number
  }): Promise<SalesSearchResponse> {
    return this.getSales({
      cashier_id: cashierId,
      ...params
    })
  },

  /**
   * Get single sale by ID
   */
  async getSale(id: number): Promise<Sale> {
    const response = await apiClient.get<Sale>(`/sales/${id}`)
    return response.data
  },

  /**
   * Get sale by bill number
   */
  async getSaleByBillNumber(billNumber: string): Promise<Sale> {
    const response = await apiClient.get<Sale>(`/sales/bill/${billNumber}`)
    return response.data
  },

  /**
   * Get sales summary/analytics
   */
  async getSalesSummary(params: {
    cashier_id?: number
    start_date?: string
    end_date?: string
    include_products?: boolean
  }): Promise<SalesSummary> {
    const queryParams = new URLSearchParams()
    
    if (params.cashier_id) queryParams.append('cashier_id', params.cashier_id.toString())
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)
    if (params.include_products) queryParams.append('include_products', 'true')

    const response = await apiClient.get<SalesSummary>(`/sales/summary?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Void a sale (for managers/admins only)
   */
  async voidSale(id: number, reason?: string): Promise<void> {
    await apiClient.post(`/sales/${id}/void`, { reason })
  },

  /**
   * Generate next bill number
   */
  async generateBillNumber(): Promise<{ bill_number: string }> {
    const response = await apiClient.get<{ bill_number: string }>('/sales/generate-bill-number')
    return response.data
  },

  /**
   * Validate sale data before submission
   */
  validateSaleData(saleData: CreateSaleRequest): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Validate required fields
    if (!saleData.cashier_id) {
      errors.push('Cashier ID is required')
    }

    if (!saleData.total_amount || saleData.total_amount <= 0) {
      errors.push('Total amount must be greater than 0')
    }

    if (!saleData.items || saleData.items.length === 0) {
      errors.push('At least one item is required')
    }

    if (!saleData.payments || saleData.payments.length === 0) {
      errors.push('At least one payment method is required')
    }

    // Validate items
    saleData.items?.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (!item.unit_price || item.unit_price <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`)
      }
    })

    // Validate payments
    const totalPayments = saleData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    if (Math.abs(totalPayments - saleData.total_amount) > 0.01) {
      errors.push('Total payments must equal total amount')
    }

    saleData.payments?.forEach((payment, index) => {
      if (!payment.method) {
        errors.push(`Payment ${index + 1}: Method is required`)
      }
      if (!payment.amount || payment.amount <= 0) {
        errors.push(`Payment ${index + 1}: Amount must be greater than 0`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}