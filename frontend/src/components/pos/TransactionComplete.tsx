import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Receipt, 
  RotateCcw,
  X,
  CreditCard,
  Banknote,
  Building,
  User,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { 
  completeSale, 
  validateTransaction, 
  type CompleteSaleRequest, 
  type CompleteSaleResponse 
} from '@/services/posTransactionService'
import { usePOSSessionStore } from '@/stores/posSessionStore'
import { usePOSCartStore } from '@/stores/posCartStore'
import { useAuthStore } from '@/stores/authStore'
import type { PaymentMethod } from './PaymentForm'

interface TransactionCompleteProps {
  payments: PaymentMethod[]
  onSuccess: (result: CompleteSaleResponse) => void
  onCancel: () => void
  onRetry?: () => void
  className?: string
}

type TransactionState = 'validating' | 'processing' | 'success' | 'failed' | 'cancelled'

export function TransactionComplete({
  payments,
  onSuccess,
  onCancel,
  onRetry,
  className
}: TransactionCompleteProps) {
  const [state, setState] = useState<TransactionState>('validating')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CompleteSaleResponse | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  // Store hooks
  const { getActiveSession, getSessionCustomer } = usePOSSessionStore()
  const { items, subtotal, tax, discount, total, clearCurrentSession } = usePOSCartStore()
  const { user } = useAuthStore()

  // Process transaction
  useEffect(() => {
    const processTransaction = async () => {
      try {
        // Get current session and customer info
        const activeSession = getActiveSession()
        if (!activeSession) {
          throw new Error('No active session found')
        }

        const sessionCustomer = getSessionCustomer(activeSession.id)

        // Prepare transaction request
        const request: CompleteSaleRequest = {
          sessionId: activeSession.id,
          customerId: sessionCustomer?.id ? Number(sessionCustomer.id) : undefined,
          customerName: sessionCustomer?.name,
          items,
          payments,
          totals: {
            subtotal,
            tax,
            discount,
            total
          },
          cashierId: user?.id ? Number(user.id) : 0
        }

        // Validate transaction
        setState('validating')
        setProgress(20)
        const validationErrors = validateTransaction(request)
        
        if (validationErrors.length > 0) {
          setErrors(validationErrors)
          setState('failed')
          return
        }

        // Process transaction
        setState('processing')
        setProgress(60)

        const saleResult = await completeSale(request)
        
        setProgress(100)
        setResult(saleResult)

        if (saleResult.status === 'completed') {
          setState('success')
          // Clear session cart after successful transaction
          setTimeout(() => {
            clearCurrentSession()
          }, 1000)
        } else {
          setState('failed')
          if (saleResult.message) {
            setErrors([saleResult.message])
          }
        }

      } catch (error: any) {
        console.error('Transaction processing error:', error)
        setState('failed')
        setErrors([error.message || 'An unexpected error occurred'])
        setProgress(0)
      }
    }

    processTransaction()
  }, [])

  const handleRetry = () => {
    setErrors([])
    setResult(null)
    setProgress(0)
    setState('validating')
    if (onRetry) {
      onRetry()
    }
  }

  const handleViewReceipt = () => {
    if (result) {
      onSuccess(result)
    }
  }

  const getStateIcon = () => {
    switch (state) {
      case 'validating':
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-600" />
      default:
        return null
    }
  }

  const getStateMessage = () => {
    switch (state) {
      case 'validating':
        return 'Validating transaction...'
      case 'processing':
        return 'Processing payment...'
      case 'success':
        return 'Transaction completed successfully!'
      case 'failed':
        return 'Transaction failed'
      default:
        return ''
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'bank_transfer':
        return <Building className="h-4 w-4" />
      default:
        return null
    }
  }

  const activeSession = getActiveSession()
  const sessionCustomer = activeSession ? getSessionCustomer(activeSession.id) : null

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                {getStateIcon()}
                Transaction Processing
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          {(state === 'validating' || state === 'processing') && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {getStateMessage()}
              </p>
            </div>
          )}

          {/* Transaction Summary */}
          <div className="space-y-4">
            {/* Customer Info */}
            {sessionCustomer && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{sessionCustomer.name}</span>
              </div>
            )}

            {/* Transaction Details */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-sm text-muted-foreground">Items</div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Payment Methods:</div>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      {getPaymentIcon(payment.type)}
                      <span className="capitalize">
                        {payment.type.replace('_', ' ')} #{index + 1}
                      </span>
                      {payment.reference && (
                        <Badge variant="outline" className="text-xs">
                          {payment.reference}
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Success State */}
          {state === 'success' && result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <div className="font-medium">Payment processed successfully!</div>
                  <div className="text-sm">
                    Receipt #{result.receiptNumber} • {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {state === 'failed' && errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Transaction Failed</div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {state === 'success' && (
              <>
                <Button onClick={handleViewReceipt} className="flex-1">
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Close
                </Button>
              </>
            )}

            {state === 'failed' && (
              <>
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Transaction
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            )}

            {(state === 'validating' || state === 'processing') && (
              <Button variant="outline" onClick={onCancel} disabled>
                Processing...
              </Button>
            )}
          </div>

          {/* Session Info */}
          {activeSession && (
            <div className="text-center text-xs text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-3 w-3" />
                Session: {activeSession.name}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}