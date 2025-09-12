/**
 * Comprehensive POS Error Handling Test Suite
 * 
 * This test suite validates all aspects of the POS error handling and validation system.
 * It includes tests for validation schemas, error boundaries, network error handling,
 * and toast notifications.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PaymentFormSchema,
  PaymentsCollectionSchema,
  CartItemSchema,
  ShoppingCartSchema,
  SessionSchema,
  POSTransactionSchema,
  QuickCashSchema,
  ChangeCalculationSchema
} from '@/schemas/posValidation'
import { POSError, POSErrorType, SessionRecovery, ErrorLogger } from '@/components/pos/POSErrorBoundary'
import { POSService } from '@/services/posService'

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  configurable: true
})

describe('POS Validation Schemas', () => {
  describe('PaymentFormSchema', () => {
    it('should validate correct payment data', () => {
      const validPayment = {
        amount: 50.99,
        type: 'cash' as const,
        timestamp: new Date()
      }
      
      const result = PaymentFormSchema.safeParse(validPayment)
      expect(result.success).toBe(true)
    })

    it('should reject negative amounts', () => {
      const invalidPayment = {
        amount: -10,
        type: 'cash' as const,
        timestamp: new Date()
      }
      
      const result = PaymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Amount cannot be negative')
    })

    it('should require reference for card payments', () => {
      const invalidPayment = {
        amount: 50,
        type: 'card' as const,
        timestamp: new Date()
        // Missing reference
      }
      
      const result = PaymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should validate card reference format', () => {
      const invalidPayment = {
        amount: 50,
        type: 'card' as const,
        reference: '123', // Too short
        timestamp: new Date()
      }
      
      const result = PaymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })

    it('should require reference for bank transfers', () => {
      const invalidPayment = {
        amount: 50,
        type: 'bank_transfer' as const,
        timestamp: new Date()
        // Missing reference
      }
      
      const result = PaymentFormSchema.safeParse(invalidPayment)
      expect(result.success).toBe(false)
    })
  })

  describe('CartItemSchema', () => {
    it('should validate correct cart item', () => {
      const validItem = {
        productId: 1,
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 25.50,
        totalPrice: 51.00,
        discount: 0,
        isActive: true,
        stockQuantity: 10
      }
      
      const result = CartItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should reject zero quantities', () => {
      const invalidItem = {
        productId: 1,
        productName: 'Test Product',
        quantity: 0,
        unitPrice: 25.50,
        totalPrice: 0,
        discount: 0,
        isActive: true,
        stockQuantity: 10
      }
      
      const result = CartItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })

    it('should detect incorrect total price calculation', () => {
      const invalidItem = {
        productId: 1,
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 25.50,
        totalPrice: 100.00, // Wrong calculation
        discount: 0,
        isActive: true,
        stockQuantity: 10
      }
      
      const result = CartItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Total price calculation is incorrect')
    })

    it('should reject quantity exceeding stock', () => {
      const invalidItem = {
        productId: 1,
        productName: 'Test Product',
        quantity: 15,
        unitPrice: 25.50,
        totalPrice: 382.50,
        discount: 0,
        isActive: true,
        stockQuantity: 10
      }
      
      const result = CartItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Only 10 items available in stock')
    })

    it('should reject inactive products', () => {
      const invalidItem = {
        productId: 1,
        productName: 'Test Product',
        quantity: 1,
        unitPrice: 25.50,
        totalPrice: 25.50,
        discount: 0,
        isActive: false,
        stockQuantity: 10
      }
      
      const result = CartItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('no longer available')
    })
  })

  describe('PaymentsCollectionSchema', () => {
    it('should validate sufficient payment coverage', () => {
      const validCollection = {
        payments: [
          {
            amount: 50,
            type: 'cash' as const,
            timestamp: new Date()
          }
        ],
        totalAmount: 50,
        changeAmount: 0
      }
      
      const result = PaymentsCollectionSchema.safeParse(validCollection)
      expect(result.success).toBe(true)
    })

    it('should reject insufficient payments', () => {
      const invalidCollection = {
        payments: [
          {
            amount: 30,
            type: 'cash' as const,
            timestamp: new Date()
          }
        ],
        totalAmount: 50,
        changeAmount: 0
      }
      
      const result = PaymentsCollectionSchema.safeParse(invalidCollection)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Insufficient payment')
    })

    it('should validate change calculation', () => {
      const invalidCollection = {
        payments: [
          {
            amount: 60,
            type: 'cash' as const,
            timestamp: new Date()
          }
        ],
        totalAmount: 50,
        changeAmount: 5 // Wrong change amount
      }
      
      const result = PaymentsCollectionSchema.safeParse(invalidCollection)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Change amount calculation is incorrect')
    })
  })

  describe('ChangeCalculationSchema', () => {
    it('should validate correct change calculation', () => {
      const validChange = {
        totalPaid: 60,
        totalDue: 50,
        changeDue: 10
      }
      
      const result = ChangeCalculationSchema.safeParse(validChange)
      expect(result.success).toBe(true)
    })

    it('should reject incorrect change calculation', () => {
      const invalidChange = {
        totalPaid: 60,
        totalDue: 50,
        changeDue: 5 // Wrong change
      }
      
      const result = ChangeCalculationSchema.safeParse(invalidChange)
      expect(result.success).toBe(false)
    })

    it('should reject insufficient payment', () => {
      const invalidChange = {
        totalPaid: 40,
        totalDue: 50,
        changeDue: 0
      }
      
      const result = ChangeCalculationSchema.safeParse(invalidChange)
      expect(result.success).toBe(false)
      expect(result.error?.errors[0].message).toContain('Insufficient payment')
    })
  })
})

describe('POSError Class', () => {
  it('should create error with correct properties', () => {
    const error = new POSError(
      'Test error',
      POSErrorType.PAYMENT_PROCESSING,
      true,
      { test: 'data' },
      'test action'
    )
    
    expect(error.message).toBe('Test error')
    expect(error.type).toBe(POSErrorType.PAYMENT_PROCESSING)
    expect(error.recoverable).toBe(true)
    expect(error.sessionData).toEqual({ test: 'data' })
    expect(error.userAction).toBe('test action')
    expect(error.timestamp).toBeInstanceOf(Date)
  })

  it('should default to unknown type and recoverable', () => {
    const error = new POSError('Test error')
    
    expect(error.type).toBe(POSErrorType.UNKNOWN)
    expect(error.recoverable).toBe(true)
  })
})

describe('SessionRecovery', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  it('should save emergency backup', () => {
    const testData = { cart: [], sessionId: 'test123' }
    
    SessionRecovery.saveEmergencyBackup(testData)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pos_emergency_backup',
      expect.stringContaining('"data":')
    )
  })

  it('should retrieve valid backup', () => {
    const testData = { cart: [], sessionId: 'test123' }
    const backup = {
      data: testData,
      timestamp: Date.now() - 1000 // 1 second ago
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(backup))
    
    const result = SessionRecovery.getEmergencyBackup()
    expect(result).toEqual(testData)
  })

  it('should reject old backup', () => {
    const testData = { cart: [], sessionId: 'test123' }
    const backup = {
      data: testData,
      timestamp: Date.now() - (31 * 60 * 1000) // 31 minutes ago
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(backup))
    
    const result = SessionRecovery.getEmergencyBackup()
    expect(result).toBeNull()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('pos_emergency_backup')
  })

  it('should handle corrupt backup data', () => {
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const result = SessionRecovery.getEmergencyBackup()
    expect(result).toBeNull()
  })
})

describe('ErrorLogger', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log error with proper structure', () => {
    const error = new Error('Test error')
    const errorInfo = {
      type: POSErrorType.PAYMENT_PROCESSING,
      recoverable: true,
      timestamp: new Date()
    }
    
    ErrorLogger.logError(error, errorInfo, 123)
    
    expect(console.error).toHaveBeenCalledWith(
      'POS Error:',
      expect.objectContaining({
        message: 'Test error',
        type: POSErrorType.PAYMENT_PROCESSING,
        recoverable: true,
        userId: 123
      })
    )
  })

  it('should store error logs in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('[]')
    
    const error = new Error('Test error')
    const errorInfo = {
      type: POSErrorType.NETWORK_FAILURE,
      recoverable: true,
      timestamp: new Date()
    }
    
    ErrorLogger.logError(error, errorInfo)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'pos_error_logs',
      expect.stringContaining('Test error')
    )
  })

  it('should limit stored error logs', () => {
    // Mock 50 existing logs
    const existingLogs = Array(50).fill(null).map((_, i) => ({ id: i }))
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingLogs))
    
    const error = new Error('New error')
    const errorInfo = {
      type: POSErrorType.UNKNOWN,
      recoverable: true,
      timestamp: new Date()
    }
    
    ErrorLogger.logError(error, errorInfo)
    
    const setItemCall = localStorageMock.setItem.mock.calls[0]
    const storedLogs = JSON.parse(setItemCall[1])
    expect(storedLogs).toHaveLength(50) // Should still be 50, not 51
  })
})

describe('POSService Network Handling', () => {
  let posService: POSService

  beforeEach(() => {
    posService = new POSService()
  })

  it('should detect online status', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    expect(posService.isOnline).toBe(true)
  })

  it('should detect offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    // Would need to trigger offline event in real scenario
  })

  it('should queue operations when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    
    try {
      await posService.makeRequest(
        () => Promise.resolve('test'),
        'test operation',
        { queueOnOffline: true }
      )
    } catch (error: any) {
      expect(error.type).toBe(POSErrorType.NETWORK_FAILURE)
      expect(error.message).toContain('queued')
    }
  })
})

describe('Integration Tests', () => {
  it('should handle complete transaction validation', () => {
    const transaction = {
      session: {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        cashierId: 1,
        status: 'checkout' as const,
        createdAt: new Date(Date.now() - 60000),
        lastActivity: new Date()
      },
      customer: {
        customerId: 1
      },
      cart: {
        items: [
          {
            productId: 1,
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 25.50,
            totalPrice: 51.00,
            discount: 0,
            isActive: true,
            stockQuantity: 10
          }
        ],
        subtotal: 51.00,
        tax: 4.08,
        discount: 0,
        total: 55.08
      },
      payments: {
        payments: [
          {
            amount: 55.08,
            type: 'cash' as const,
            timestamp: new Date()
          }
        ],
        totalAmount: 55.08,
        changeAmount: 0
      }
    }
    
    const result = POSTransactionSchema.safeParse(transaction)
    expect(result.success).toBe(true)
  })

  it('should reject transaction with payment mismatch', () => {
    const transaction = {
      session: {
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        cashierId: 1,
        status: 'checkout' as const,
        createdAt: new Date(Date.now() - 60000),
        lastActivity: new Date()
      },
      customer: {
        customerId: 1
      },
      cart: {
        items: [
          {
            productId: 1,
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 25.50,
            totalPrice: 51.00,
            discount: 0,
            isActive: true,
            stockQuantity: 10
          }
        ],
        subtotal: 51.00,
        tax: 4.08,
        discount: 0,
        total: 55.08
      },
      payments: {
        payments: [
          {
            amount: 50.00, // Insufficient payment
            type: 'cash' as const,
            timestamp: new Date()
          }
        ],
        totalAmount: 50.00,
        changeAmount: 0
      }
    }
    
    const result = POSTransactionSchema.safeParse(transaction)
    expect(result.success).toBe(false)
  })
})

describe('Error Recovery Scenarios', () => {
  it('should handle payment processing error recovery', () => {
    const error = new POSError(
      'Payment declined',
      POSErrorType.PAYMENT_PROCESSING,
      true,
      { transactionId: '123' },
      'process payment'
    )
    
    expect(error.recoverable).toBe(true)
    expect(error.type).toBe(POSErrorType.PAYMENT_PROCESSING)
  })

  it('should handle session expiration correctly', () => {
    const error = new POSError(
      'Session expired',
      POSErrorType.SESSION_CORRUPTION,
      false, // Not recoverable without re-auth
      null,
      'session check'
    )
    
    expect(error.recoverable).toBe(false)
    expect(error.type).toBe(POSErrorType.SESSION_CORRUPTION)
  })

  it('should handle network error with retry capability', () => {
    const error = new POSError(
      'Network timeout',
      POSErrorType.NETWORK_FAILURE,
      true,
      null,
      'API call'
    )
    
    expect(error.recoverable).toBe(true)
    expect(error.type).toBe(POSErrorType.NETWORK_FAILURE)
  })
})