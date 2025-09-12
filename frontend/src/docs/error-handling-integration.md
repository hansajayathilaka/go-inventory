# POS Error Handling & Validation System Integration Guide

This document provides a comprehensive guide for integrating and using the POS error handling and validation system.

## Overview

The POS error handling system provides:

- **Zod Schema Validation**: Real-time form validation with custom error messages
- **Error Boundaries**: JavaScript error catching and graceful recovery
- **Network Error Handling**: Intelligent retry logic and offline mode support
- **Toast Notifications**: User-friendly error messages with action buttons
- **Session Recovery**: Automatic backup and recovery of POS session data

## Quick Start

### 1. Wrap Your App with Providers

```tsx
import { ToastProvider } from '@/components/ui/toast'
import { POSErrorBoundary } from '@/components/pos/POSErrorBoundary'

function App() {
  return (
    <ToastProvider showNetworkStatus={true}>
      <POSErrorBoundary>
        <YourPOSComponents />
      </POSErrorBoundary>
    </ToastProvider>
  )
}
```

### 2. Use Validation in Forms

```tsx
import { validatePaymentForm } from '@/schemas/posValidation'
import { usePOSToast } from '@/components/ui/toast'

function PaymentComponent() {
  const toast = usePOSToast()
  
  const handleSubmit = (paymentData) => {
    const result = validatePaymentForm(paymentData)
    
    if (!result.success) {
      const errors = result.error.errors
      toast.validationError('Payment', errors[0].message)
      return
    }
    
    // Process valid payment
    processPayment(result.data)
  }
}
```

### 3. Handle Network Operations

```tsx
import { posService } from '@/services/posService'

function ProductSearch() {
  const handleSearch = async (query) => {
    try {
      const results = await posService.searchProducts(query)
      // Handle results
    } catch (error) {
      // Error automatically handled by posService
      // Toast notifications shown automatically
    }
  }
}
```

## Components Reference

### POSErrorBoundary

Catches JavaScript errors and provides recovery options.

```tsx
<POSErrorBoundary 
  sessionData={currentSession}
  onError={(error, errorInfo) => {
    // Optional custom error handling
  }}
>
  <YourComponent />
</POSErrorBoundary>
```

**Features:**
- Automatic error catching
- Session data backup
- User-friendly error display
- Recovery mechanisms
- Error logging

### Toast System

Provides user-friendly notifications.

```tsx
import { usePOSToast } from '@/components/ui/toast'

function Component() {
  const toast = usePOSToast()
  
  // Success messages
  toast.success('Payment Complete', 'Transaction processed successfully')
  
  // Error messages with retry
  toast.error('Payment Failed', 'Card was declined', {
    label: 'Retry',
    handler: () => retryPayment()
  })
  
  // Validation errors
  toast.validationError('Amount', 'Amount must be greater than zero')
  
  // Network issues
  toast.networkError('Save transaction', () => retrySave())
}
```

### Network Service

Handles API calls with error recovery.

```tsx
import { posService } from '@/services/posService'

// Basic API call with error handling
const data = await posService.makeRequest(
  () => apiClient.get('/products'),
  'Load products',
  { 
    queueOnOffline: true,
    showToast: true 
  }
)

// Check network status
const isOnline = posService.isOnline
const queueSize = posService.queueSize

// Subscribe to network changes
const unsubscribe = posService.subscribeToNetworkStatus((isOnline) => {
  console.log('Network status:', isOnline)
})
```

## Validation Schemas

### Payment Validation

```tsx
import { PaymentFormSchema } from '@/schemas/posValidation'

const paymentData = {
  amount: 50.99,
  type: 'card',
  reference: '****1234',
  timestamp: new Date()
}

const result = PaymentFormSchema.safeParse(paymentData)
if (result.success) {
  // Valid payment data
  const validatedData = result.data
} else {
  // Handle validation errors
  result.error.errors.forEach(error => {
    console.log(error.message)
  })
}
```

### Cart Validation

```tsx
import { CartItemSchema, ShoppingCartSchema } from '@/schemas/posValidation'

// Validate individual cart item
const cartItem = {
  productId: 1,
  productName: 'Test Product',
  quantity: 2,
  unitPrice: 25.50,
  totalPrice: 51.00,
  discount: 0,
  isActive: true,
  stockQuantity: 10
}

const itemResult = CartItemSchema.safeParse(cartItem)

// Validate entire cart
const cart = {
  items: [cartItem],
  subtotal: 51.00,
  tax: 4.08,
  discount: 0,
  total: 55.08
}

const cartResult = ShoppingCartSchema.safeParse(cart)
```

### Transaction Validation

```tsx
import { POSTransactionSchema } from '@/schemas/posValidation'

const transaction = {
  session: {
    sessionId: 'uuid-here',
    cashierId: 1,
    status: 'checkout',
    createdAt: new Date(),
    lastActivity: new Date()
  },
  customer: { customerId: 1 },
  cart: { /* cart data */ },
  payments: { /* payment data */ }
}

const result = POSTransactionSchema.safeParse(transaction)
```

## Error Types

### POSErrorType Enum

- `PAYMENT_PROCESSING`: Payment-related errors
- `NETWORK_FAILURE`: Connection and API errors
- `COMPONENT_RENDER`: React component errors
- `STATE_MANAGEMENT`: Session and state errors
- `SESSION_CORRUPTION`: Session data corruption
- `VALIDATION_ERROR`: Data validation failures
- `UNKNOWN`: Unclassified errors

### Creating Custom Errors

```tsx
import { POSError, POSErrorType } from '@/components/pos/POSErrorBoundary'

const error = new POSError(
  'Payment processing failed',
  POSErrorType.PAYMENT_PROCESSING,
  true, // recoverable
  { transactionId: '123' }, // session data
  'process payment' // user action
)

throw error
```

## Session Recovery

### Automatic Backup

```tsx
import { SessionRecovery } from '@/components/pos/POSErrorBoundary'

// Automatically save session data
SessionRecovery.saveEmergencyBackup({
  cart: currentCart,
  customer: currentCustomer,
  sessionId: sessionId
})

// Check for existing backup
if (SessionRecovery.hasEmergencyBackup()) {
  const backup = SessionRecovery.getEmergencyBackup()
  // Restore session from backup
}

// Clear backup when no longer needed
SessionRecovery.clearEmergencyBackup()
```

## Testing Error Scenarios

### Development Testing

```tsx
import { POSErrorTesting, DEV_ERROR_TESTING } from '@/utils/posErrorTesting'

// Test network failures
await POSErrorTesting.testNetworkFailure()
await POSErrorTesting.testNetworkRecovery()

// Test validation errors
const invalidData = POSErrorTesting.getInvalidPaymentData()

// Run comprehensive tests
await POSErrorTesting.runErrorScenarios()

// Development-only error throwing
DEV_ERROR_TESTING.throwTestError('Test component error')
await DEV_ERROR_TESTING.throwAsyncError(1000)
```

### Error Demo Component

Use the `ErrorHandlingDemo` component to test all error scenarios:

```tsx
import { ErrorHandlingDemo } from '@/components/pos/ErrorHandlingDemo'

function DevTools() {
  return (
    <div>
      <h2>Error Handling Test Suite</h2>
      <ErrorHandlingDemo />
    </div>
  )
}
```

## Best Practices

### 1. Always Validate User Input

```tsx
// Bad
const processPayment = (amount) => {
  // Direct processing without validation
}

// Good
const processPayment = (paymentData) => {
  const result = PaymentFormSchema.safeParse(paymentData)
  if (!result.success) {
    toast.validationError('Payment', result.error.errors[0].message)
    return
  }
  // Process validated data
}
```

### 2. Handle Network Errors Gracefully

```tsx
// Bad
const saveData = async () => {
  await apiClient.post('/save', data) // No error handling
}

// Good
const saveData = async () => {
  try {
    await posService.makeRequest(
      () => apiClient.post('/save', data),
      'Save data',
      { queueOnOffline: true }
    )
    toast.success('Saved', 'Data saved successfully')
  } catch (error) {
    // Error automatically handled by posService
  }
}
```

### 3. Provide Recovery Options

```tsx
// Show retry option for recoverable errors
toast.error('Operation Failed', error.message, {
  label: 'Retry',
  handler: () => retryOperation()
})

// Save session data before risky operations
sessionRecovery.saveEmergencyBackup(currentSession)
```

### 4. Use Error Boundaries Strategically

```tsx
// Wrap major components
<POSErrorBoundary sessionData={session}>
  <PaymentForm />
</POSErrorBoundary>

<POSErrorBoundary sessionData={session}>
  <ShoppingCart />
</POSErrorBoundary>
```

## Performance Considerations

- Validation schemas are compiled once and reused
- Error boundaries don't affect normal rendering performance
- Toast notifications are automatically limited to prevent spam
- Session backups are throttled to prevent excessive localStorage writes
- Network retry logic uses exponential backoff to avoid server overload

## Troubleshooting

### Common Issues

1. **Validation Errors Not Showing**
   - Check that ToastProvider is installed
   - Verify schema imports are correct
   - Ensure validation is called properly

2. **Error Boundary Not Catching Errors**
   - Async errors need to be caught manually
   - Event handler errors aren't caught by boundaries
   - Use try-catch for promise-based code

3. **Network Errors Not Handling**
   - Check that posService is imported correctly
   - Verify network status detection
   - Test with actual network interruption

4. **Session Recovery Not Working**
   - Check localStorage permissions
   - Verify backup data structure
   - Test backup age limits

### Debug Mode

Enable debug logging in development:

```tsx
// Add to window for debugging
if (process.env.NODE_ENV === 'development') {
  window.POSErrorTesting = POSErrorTesting
  window.DEV_ERROR_TESTING = DEV_ERROR_TESTING
}
```

Access debug tools in browser console:
```javascript
// Test network failure
POSErrorTesting.testNetworkFailure()

// Run all error tests
POSErrorTesting.runErrorScenarios()

// Throw test error
DEV_ERROR_TESTING.throwTestError()
```

## Migration Guide

### From Basic Error Handling

1. Wrap components with POSErrorBoundary
2. Replace manual validation with Zod schemas
3. Use posService for API calls
4. Replace alert() with toast notifications
5. Add session backup for critical operations

### Example Migration

```tsx
// Before
const PaymentForm = () => {
  const handleSubmit = (data) => {
    if (!data.amount || data.amount <= 0) {
      alert('Invalid amount')
      return
    }
    
    fetch('/api/payment', { method: 'POST', body: JSON.stringify(data) })
      .then(response => {
        if (!response.ok) throw new Error('Payment failed')
        alert('Payment successful')
      })
      .catch(error => {
        alert('Error: ' + error.message)
      })
  }
}

// After
const PaymentForm = () => {
  const toast = usePOSToast()
  
  const handleSubmit = async (data) => {
    const result = PaymentFormSchema.safeParse(data)
    if (!result.success) {
      toast.validationError('Payment', result.error.errors[0].message)
      return
    }
    
    try {
      await posService.makeRequest(
        () => apiClient.post('/payment', result.data),
        'Process payment'
      )
      toast.paymentSuccess(`$${data.amount}`, data.type)
    } catch (error) {
      // Error handled automatically by posService
    }
  }
}
```

This comprehensive error handling system ensures that your POS application provides excellent user experience even when things go wrong, with clear error messages, recovery options, and data protection.