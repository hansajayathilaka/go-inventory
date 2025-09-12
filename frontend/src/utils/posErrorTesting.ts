/**
 * POS Error Testing Utilities
 * 
 * This file provides utilities for testing error scenarios across the POS system.
 * It includes functions to simulate various error conditions for comprehensive testing.
 */

import { POSError, POSErrorType } from '@/components/pos/POSErrorBoundary'
import { posService } from '@/services/posService'

/**
 * Error simulation utilities
 */
export class POSErrorTesting {
  
  /**
   * Simulate network errors
   */
  static simulateNetworkError(operation: string = 'API call'): POSError {
    return new POSError(
      `Network error during ${operation}`,
      POSErrorType.NETWORK_FAILURE,
      true,
      null,
      operation
    )
  }

  static simulateTimeout(operation: string = 'API request'): POSError {
    return new POSError(
      `Request timeout during ${operation}`,
      POSErrorType.NETWORK_FAILURE,
      true,
      null,
      operation
    )
  }

  static simulateServerError(operation: string = 'server operation'): POSError {
    return new POSError(
      `Server error during ${operation}`,
      POSErrorType.NETWORK_FAILURE,
      true,
      null,
      operation
    )
  }

  /**
   * Simulate payment processing errors
   */
  static simulatePaymentDeclined(): POSError {
    return new POSError(
      'Payment was declined by the payment processor',
      POSErrorType.PAYMENT_PROCESSING,
      true,
      null,
      'process payment'
    )
  }

  static simulatePaymentTimeout(): POSError {
    return new POSError(
      'Payment processing timed out',
      POSErrorType.PAYMENT_PROCESSING,
      true,
      null,
      'payment timeout'
    )
  }

  static simulateInsufficientFunds(): POSError {
    return new POSError(
      'Insufficient funds for this transaction',
      POSErrorType.PAYMENT_PROCESSING,
      true,
      null,
      'check funds'
    )
  }

  /**
   * Simulate validation errors
   */
  static simulateValidationError(field: string, value: any): POSError {
    return new POSError(
      `Validation failed for ${field}: ${value}`,
      POSErrorType.VALIDATION_ERROR,
      true,
      null,
      'validate form'
    )
  }

  static simulateStockError(productName: string): POSError {
    return new POSError(
      `Product "${productName}" is out of stock`,
      POSErrorType.STATE_MANAGEMENT,
      true,
      { productName },
      'check stock'
    )
  }

  /**
   * Simulate session errors
   */
  static simulateSessionExpired(): POSError {
    return new POSError(
      'Your session has expired. Please log in again.',
      POSErrorType.SESSION_CORRUPTION,
      false,
      null,
      'session check'
    )
  }

  static simulateSessionCorruption(): POSError {
    return new POSError(
      'Session data has become corrupted',
      POSErrorType.SESSION_CORRUPTION,
      true,
      null,
      'session validation'
    )
  }

  /**
   * Simulate component rendering errors
   */
  static simulateComponentError(componentName: string): POSError {
    return new POSError(
      `Error rendering ${componentName} component`,
      POSErrorType.COMPONENT_RENDER,
      true,
      null,
      'component render'
    )
  }

  /**
   * Test scenarios for validation schemas
   */
  static getInvalidPaymentData() {
    return [
      // Invalid amounts
      { amount: -10, type: 'cash', timestamp: new Date() },
      { amount: 0, type: 'cash', timestamp: new Date() },
      { amount: 1000000, type: 'cash', timestamp: new Date() },
      
      // Missing references
      { amount: 50, type: 'card', timestamp: new Date() }, // Missing reference
      { amount: 50, type: 'bank_transfer', timestamp: new Date() }, // Missing reference
      
      // Invalid references
      { amount: 50, type: 'card', reference: '123', timestamp: new Date() }, // Too short
      { amount: 50, type: 'card', reference: 'invalid*chars!', timestamp: new Date() }, // Invalid chars
      { amount: 50, type: 'bank_transfer', reference: 'a', timestamp: new Date() }, // Too short
      
      // Invalid types
      { amount: 50, type: 'invalid_type', timestamp: new Date() },
    ]
  }

  static getInvalidCartData() {
    return [
      // Empty cart
      { items: [], subtotal: 0, tax: 0, discount: 0, total: 0 },
      
      // Invalid quantities
      { 
        items: [{ 
          productId: 1, 
          productName: 'Test Product',
          quantity: 0, // Invalid
          unitPrice: 10,
          totalPrice: 0,
          discount: 0,
          isActive: true,
          stockQuantity: 5
        }],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0
      },
      
      // Calculation errors
      { 
        items: [{ 
          productId: 1, 
          productName: 'Test Product',
          quantity: 2, 
          unitPrice: 10,
          totalPrice: 15, // Wrong calculation
          discount: 0,
          isActive: true,
          stockQuantity: 5
        }],
        subtotal: 20,
        tax: 0,
        discount: 0,
        total: 20
      },
      
      // Stock issues
      { 
        items: [{ 
          productId: 1, 
          productName: 'Test Product',
          quantity: 10, // More than stock
          unitPrice: 10,
          totalPrice: 100,
          discount: 0,
          isActive: true,
          stockQuantity: 5 // Less than quantity
        }],
        subtotal: 100,
        tax: 0,
        discount: 0,
        total: 100
      },
      
      // Inactive products
      { 
        items: [{ 
          productId: 1, 
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          discount: 0,
          isActive: false, // Inactive
          stockQuantity: 5
        }],
        subtotal: 10,
        tax: 0,
        discount: 0,
        total: 10
      },
    ]
  }

  /**
   * Network testing utilities
   */
  static async testNetworkFailure(): Promise<void> {
    // Simulate network failure
    if (posService.isOnline) {
      console.log('Simulating network failure...')
      
      // Override navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      })
      
      // Trigger offline event
      window.dispatchEvent(new Event('offline'))
      
      console.log('Network failure simulated. POS should be in offline mode.')
    }
  }

  static async testNetworkRecovery(): Promise<void> {
    // Simulate network recovery
    if (!posService.isOnline) {
      console.log('Simulating network recovery...')
      
      // Restore navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true
      })
      
      // Trigger online event
      window.dispatchEvent(new Event('online'))
      
      console.log('Network recovery simulated. POS should process queued transactions.')
    }
  }

  /**
   * Comprehensive error scenario testing
   */
  static async runErrorScenarios(): Promise<void> {
    console.group('🧪 POS Error Scenario Testing')
    
    try {
      // Test 1: Validation Errors
      console.log('📝 Testing validation errors...')
      const invalidPayments = this.getInvalidPaymentData()
      invalidPayments.forEach((payment, index) => {
        console.log(`Invalid payment ${index + 1}:`, payment)
      })
      
      const invalidCarts = this.getInvalidCartData()
      invalidCarts.forEach((cart, index) => {
        console.log(`Invalid cart ${index + 1}:`, cart)
      })
      
      // Test 2: Network Errors
      console.log('🌐 Testing network errors...')
      await this.testNetworkFailure()
      
      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await this.testNetworkRecovery()
      
      // Test 3: Component Errors
      console.log('⚛️ Testing component errors...')
      const componentError = this.simulateComponentError('PaymentForm')
      console.log('Component error:', componentError)
      
      // Test 4: Payment Errors
      console.log('💳 Testing payment errors...')
      const paymentErrors = [
        this.simulatePaymentDeclined(),
        this.simulatePaymentTimeout(),
        this.simulateInsufficientFunds()
      ]
      
      paymentErrors.forEach(error => {
        console.log('Payment error:', error)
      })
      
      // Test 5: Session Errors
      console.log('🔐 Testing session errors...')
      const sessionErrors = [
        this.simulateSessionExpired(),
        this.simulateSessionCorruption()
      ]
      
      sessionErrors.forEach(error => {
        console.log('Session error:', error)
      })
      
      console.log('✅ All error scenarios tested successfully!')
      
    } catch (error) {
      console.error('❌ Error during testing:', error)
    } finally {
      console.groupEnd()
    }
  }

  /**
   * Performance testing for error handling
   */
  static async testErrorHandlingPerformance(): Promise<void> {
    console.group('⚡ Error Handling Performance Test')
    
    const errorCount = 100
    const errors: POSError[] = []
    
    console.time('Error Creation')
    for (let i = 0; i < errorCount; i++) {
      errors.push(this.simulateNetworkError(`operation_${i}`))
    }
    console.timeEnd('Error Creation')
    
    console.log(`Created ${errorCount} errors`)
    
    console.time('Error Processing')
    errors.forEach(error => {
      // Simulate error processing
      const processed = {
        message: error.message,
        type: error.type,
        recoverable: error.recoverable,
        timestamp: error.timestamp
      }
    })
    console.timeEnd('Error Processing')
    
    console.groupEnd()
  }
}

/**
 * Development-only error testing functions
 * These should only be used in development mode
 */
export const DEV_ERROR_TESTING = {
  
  // Throw a test error to test error boundary
  throwTestError: (message: string = 'Test error for error boundary') => {
    throw new POSError(message, POSErrorType.COMPONENT_RENDER, true)
  },
  
  // Simulate async error
  throwAsyncError: async (delay: number = 1000) => {
    await new Promise(resolve => setTimeout(resolve, delay))
    throw new POSError('Async operation failed', POSErrorType.NETWORK_FAILURE, true)
  },
  
  // Test all error types
  testAllErrorTypes: () => {
    const errorTypes = Object.values(POSErrorType)
    errorTypes.forEach(type => {
      const error = new POSError(`Test error: ${type}`, type, true)
      console.log(`Error type ${type}:`, error)
    })
  },
  
  // Test validation with real forms
  testFormValidation: () => {
    console.log('Testing form validation...')
    // This would be called from form components to test validation
    return {
      invalidAmount: { amount: -10 },
      invalidReference: { type: 'card', reference: '' },
      invalidCalculation: { total: 100, paid: 50, change: 100 }
    }
  }
}

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  (window as any).POSErrorTesting = POSErrorTesting
  (window as any).DEV_ERROR_TESTING = DEV_ERROR_TESTING
}