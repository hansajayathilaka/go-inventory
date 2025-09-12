import React, { useState } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Wifi,
  WifiOff,
  TestTube,
  Play,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  validatePaymentForm, 
  validatePaymentsCollection,
  validateCartItem,
  validateShoppingCart,
  validatePOSTransaction 
} from '@/schemas/posValidation'
import { usePOSToast } from '@/components/ui/toast'
import { POSErrorTesting, DEV_ERROR_TESTING } from '@/utils/posErrorTesting'
import { POSError, POSErrorType } from './POSErrorBoundary'
import { posService } from '@/services/posService'

/**
 * Error Handling and Validation Demo Component
 * 
 * This component demonstrates the comprehensive error handling and validation
 * system implemented for the POS interface.
 */

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function ErrorHandlingDemo() {
  const toast = usePOSToast()
  const [isNetworkOnline, setIsNetworkOnline] = useState(posService.isOnline)
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  const [testPayment, setTestPayment] = useState({
    amount: '',
    type: 'cash' as const,
    reference: ''
  })

  // Subscribe to network status changes
  React.useEffect(() => {
    const unsubscribe = posService.subscribeToNetworkStatus((isOnline) => {
      setIsNetworkOnline(isOnline)
    })
    
    return unsubscribe
  }, [])

  // Test validation schemas
  const testValidation = (testName: string, validator: (data: any) => any, testData: any) => {
    const result = validator(testData)
    const validationResult: ValidationResult = {
      isValid: result.success,
      errors: result.success ? [] : result.error.errors.map((err: any) => err.message)
    }
    
    setValidationResults(prev => ({
      ...prev,
      [testName]: validationResult
    }))
    
    if (result.success) {
      toast.success('Validation Passed', `${testName} validation successful`)
    } else {
      toast.error('Validation Failed', `${testName}: ${validationResult.errors[0]}`)
    }
  }

  // Error simulation functions
  const simulateNetworkError = () => {
    POSErrorTesting.testNetworkFailure()
    toast.networkError('Simulated network failure', () => {
      POSErrorTesting.testNetworkRecovery()
    })
  }

  const simulatePaymentError = () => {
    const error = POSErrorTesting.simulatePaymentDeclined()
    toast.paymentError(error.message, () => {
      toast.info('Retry Simulation', 'This would retry the payment')
    })
  }

  const simulateValidationError = () => {
    const invalidData = { amount: -50, type: 'invalid' as any }
    testValidation('Invalid Payment', validatePaymentForm, invalidData)
  }

  const simulateComponentError = () => {
    try {
      DEV_ERROR_TESTING.throwTestError('Demo component error')
    } catch (error) {
      toast.error('Component Error', 'Error boundary should catch this')
    }
  }

  const testAllValidationSchemas = () => {
    console.log('🧪 Testing all validation schemas...')
    
    // Test payment validation
    const validPayment = {
      amount: 50.99,
      type: 'card' as const,
      reference: '****1234',
      timestamp: new Date()
    }
    testValidation('Valid Payment', validatePaymentForm, validPayment)
    
    // Test invalid payment
    const invalidPayment = {
      amount: -10,
      type: 'card' as const,
      reference: '',
      timestamp: new Date()
    }
    testValidation('Invalid Payment', validatePaymentForm, invalidPayment)
    
    // Test cart item validation
    const validCartItem = {
      productId: 1,
      productName: 'Test Product',
      quantity: 2,
      unitPrice: 25.50,
      totalPrice: 51.00,
      discount: 0,
      isActive: true,
      stockQuantity: 10
    }
    testValidation('Valid Cart Item', validateCartItem, validCartItem)
    
    // Test invalid cart item (stock issue)
    const invalidCartItem = {
      productId: 1,
      productName: 'Test Product',
      quantity: 15, // More than stock
      unitPrice: 25.50,
      totalPrice: 382.50,
      discount: 0,
      isActive: true,
      stockQuantity: 10 // Less than quantity
    }
    testValidation('Invalid Cart Item', validateCartItem, invalidCartItem)
  }

  const runComprehensiveErrorTest = async () => {
    toast.info('Starting Tests', 'Running comprehensive error scenario tests...')
    await POSErrorTesting.runErrorScenarios()
    toast.success('Tests Complete', 'All error scenarios have been tested')
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            POS Error Handling & Validation Demo
          </CardTitle>
          <CardDescription>
            Comprehensive testing interface for error handling, validation, and recovery mechanisms
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Status & Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isNetworkOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Network Status & Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <div className={`w-3 h-3 rounded-full ${isNetworkOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {isNetworkOnline ? 'Online' : 'Offline'}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">
                Queue: {posService.queueSize} items
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                onClick={simulateNetworkError}
                className="w-full"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Simulate Network Failure
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => POSErrorTesting.testNetworkRecovery()}
                className="w-full"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Simulate Network Recovery
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Error Simulation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant="outline" 
                onClick={simulatePaymentError}
                className="w-full"
              >
                💳 Payment Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={simulateValidationError}
                className="w-full"
              >
                📝 Validation Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={simulateComponentError}
                className="w-full"
              >
                ⚛️ Component Error
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const error = POSErrorTesting.simulateSessionExpired()
                  toast.sessionExpired()
                }}
                className="w-full"
              >
                🔐 Session Expired
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Validation Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Test payment form */}
            <div className="space-y-2">
              <Label>Test Payment Amount</Label>
              <Input
                type="text"
                placeholder="Enter amount"
                value={testPayment.amount}
                onChange={(e) => setTestPayment(prev => ({ ...prev, amount: e.target.value }))}
              />
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const amount = parseFloat(testPayment.amount)
                  if (isNaN(amount)) {
                    toast.validationError('Amount', 'Please enter a valid number')
                    return
                  }
                  
                  testValidation('Live Payment', validatePaymentForm, {
                    amount,
                    type: testPayment.type,
                    reference: testPayment.reference || undefined,
                    timestamp: new Date()
                  })
                }}
                className="w-full"
              >
                Test Payment Validation
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={testAllValidationSchemas}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Test All Schemas
            </Button>
          </CardContent>
        </Card>

        {/* Validation Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(validationResults).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No validation tests run yet
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(validationResults).map(([testName, result]) => (
                  <div key={testName} className="flex items-start gap-2 p-2 rounded border">
                    {result.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{testName}</div>
                      {!result.isValid && (
                        <div className="text-xs text-red-600 mt-1">
                          {result.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-500" />
            Comprehensive Error Testing
          </CardTitle>
          <CardDescription>
            Run all error scenarios and validation tests to verify system robustness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runComprehensiveErrorTest}
            className="w-full"
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            Run All Error Tests
          </Button>
          
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">This test will:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Test all validation schemas with valid and invalid data</li>
              <li>• Simulate network failures and recovery</li>
              <li>• Test payment processing errors</li>
              <li>• Verify error boundary functionality</li>
              <li>• Check session management and recovery</li>
              <li>• Validate toast notification system</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Error Boundary Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Error Boundary Test (Use with Caution)
          </CardTitle>
          <CardDescription>
            These buttons will throw actual errors to test the error boundary system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="destructive"
              onClick={() => DEV_ERROR_TESTING.throwTestError('Synchronous test error')}
            >
              Throw Sync Error
            </Button>
            
            <Button 
              variant="destructive"
              onClick={async () => {
                try {
                  await DEV_ERROR_TESTING.throwAsyncError(1000)
                } catch (error) {
                  console.error('Caught async error:', error)
                }
              }}
            >
              Throw Async Error
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-medium">⚠️ Warning:</p>
            <p>These buttons will trigger real errors and may crash this component to test error recovery.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}