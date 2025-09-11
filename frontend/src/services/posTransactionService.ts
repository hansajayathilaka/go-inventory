import { apiClient } from './api'
import type { CartItem } from '@/stores/posCartStore'
import type { PaymentMethod } from '@/components/pos/PaymentForm'

// Request/Response interfaces for transaction completion
export interface CompleteSaleRequest {
  sessionId: string
  customerId?: number
  customerName?: string
  items: CartItem[]
  payments: PaymentMethod[]
  totals: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
  cashierId: number
}

export interface CompleteSaleResponse {
  saleId: number
  receiptNumber: string
  timestamp: string
  status: 'completed' | 'failed'
  message?: string
}

export interface SaleItem {
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  discount?: number
}

export interface SalePayment {
  type: 'cash' | 'card' | 'bank_transfer'
  amount: number
  reference?: string
  timestamp: string
}

// Backend API request format
interface CreateSaleRequest {
  customer_id?: number
  session_id: string
  items: SaleItem[]
  payments: SalePayment[]
  subtotal: number
  tax: number
  discount: number
  total: number
  cashier_id: number
}

// Backend API response format
interface CreateSaleResponse {
  sale_id: number
  receipt_number: string
  timestamp: string
  status: string
}

/**
 * Complete a POS sale transaction
 */
export const completeSale = async (request: CompleteSaleRequest): Promise<CompleteSaleResponse> => {
  try {
    // Transform frontend data to backend API format
    const apiRequest: CreateSaleRequest = {
      customer_id: request.customerId,
      session_id: request.sessionId,
      items: request.items.map(item => ({
        product_id: Number(item.product.id),
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        discount: item.discount || 0
      })),
      payments: request.payments.map(payment => ({
        type: payment.type,
        amount: payment.amount,
        reference: payment.reference,
        timestamp: payment.timestamp.toISOString()
      })),
      subtotal: request.totals.subtotal,
      tax: request.totals.tax,
      discount: request.totals.discount,
      total: request.totals.total,
      cashier_id: request.cashierId
    }

    // Make API call to create sale
    const response = await apiClient.post<CreateSaleResponse>('/sales', apiRequest)

    return {
      saleId: response.data.sale_id,
      receiptNumber: response.data.receipt_number,
      timestamp: response.data.timestamp,
      status: 'completed'
    }
  } catch (error: any) {
    console.error('Sale completion failed:', error)
    
    // Handle specific error cases
    let message = 'Transaction failed. Please try again.'
    
    if (error.response?.status === 400) {
      message = 'Invalid transaction data. Please check your cart and try again.'
    } else if (error.response?.status === 409) {
      message = 'Stock conflict detected. Some items may no longer be available.'
    } else if (error.response?.status === 401) {
      message = 'Authentication required. Please log in again.'
    } else if (error.response?.data?.message) {
      message = error.response.data.message
    }

    return {
      saleId: 0,
      receiptNumber: '',
      timestamp: new Date().toISOString(),
      status: 'failed',
      message
    }
  }
}

/**
 * Validate transaction data before submission
 */
export const validateTransaction = (request: CompleteSaleRequest): string[] => {
  const errors: string[] = []

  // Validate items
  if (!request.items || request.items.length === 0) {
    errors.push('Cart is empty')
  }

  request.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1} has invalid quantity`)
    }
    if (item.unitPrice <= 0) {
      errors.push(`Item ${index + 1} has invalid price`)
    }
    if (!item.product.is_active) {
      errors.push(`Item "${item.product.name}" is no longer active`)
    }
  })

  // Validate payments
  if (!request.payments || request.payments.length === 0) {
    errors.push('No payment methods provided')
  }

  const totalPayments = request.payments.reduce((sum, payment) => sum + payment.amount, 0)
  if (Math.abs(totalPayments - request.totals.total) > 0.01) {
    errors.push('Payment total does not match transaction total')
  }

  request.payments.forEach((payment, index) => {
    if (payment.amount <= 0) {
      errors.push(`Payment ${index + 1} has invalid amount`)
    }
    if ((payment.type === 'card' || payment.type === 'bank_transfer') && !payment.reference) {
      errors.push(`Payment ${index + 1} requires a reference`)
    }
  })

  // Validate totals
  if (request.totals.total <= 0) {
    errors.push('Transaction total must be greater than zero')
  }

  if (request.totals.subtotal < 0 || request.totals.tax < 0 || request.totals.discount < 0) {
    errors.push('Invalid calculation amounts')
  }

  // Validate cashier
  if (!request.cashierId) {
    errors.push('Cashier information is required')
  }

  return errors
}

/**
 * Get sale details for receipt generation
 */
export const getSaleDetails = async (saleId: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/sales/${saleId}`)
    return response.data
  } catch (error) {
    console.error('Failed to get sale details:', error)
    throw new Error('Failed to retrieve sale details')
  }
}

/**
 * Cancel a sale transaction (if supported)
 */
export const cancelSale = async (saleId: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/sales/${saleId}`)
    return true
  } catch (error) {
    console.error('Failed to cancel sale:', error)
    return false
  }
}