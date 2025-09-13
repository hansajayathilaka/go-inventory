import { useState, useCallback, useEffect } from 'react'
import { 
  CreditCard, 
  Banknote, 
  Building, 
  Plus, 
  X, 
  Calculator,
  Check,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks'
import { ShortcutTooltip, KeyboardShortcutBadge } from '@/components/ui/keyboard-shortcut-badge'
import { cn } from '@/lib/utils'
import { 
  PaymentFormSchema, 
  PaymentsCollectionSchema, 
  QuickCashSchema,
  ChangeCalculationSchema,
  type PaymentFormData,
  type PaymentsCollectionData
} from '@/schemas/posValidation'
import { usePOSToast } from '@/components/ui/toast'
import { POSErrorBoundary } from './POSErrorBoundary'

// Payment method interface
export interface PaymentMethod {
  id: string
  type: 'cash' | 'card' | 'bank_transfer'
  amount: number
  reference?: string
  timestamp: Date
}

interface PaymentFormProps {
  totalAmount: number
  onPaymentComplete: (payments: PaymentMethod[], change: number) => void
  onCancel: () => void
  className?: string
}

interface PaymentState {
  payments: PaymentMethod[]
  remainingAmount: number
  paidAmount: number
  changeAmount: number
  activePaymentType: 'cash' | 'card' | 'bank_transfer' | null
  currentPaymentAmount: string
  cardReference: string
  bankReference: string
  validationErrors: {
    amount?: string
    reference?: string
    payments?: string
    general?: string
  }
  isValidating: boolean
}

const QUICK_CASH_AMOUNTS = [5, 10, 20, 50, 100]

export function PaymentForm({
  totalAmount,
  onPaymentComplete,
  onCancel,
  className
}: PaymentFormProps) {
  const toast = usePOSToast()
  
  const [state, setState] = useState<PaymentState>({
    payments: [],
    remainingAmount: totalAmount,
    paidAmount: 0,
    changeAmount: 0,
    activePaymentType: null,
    currentPaymentAmount: '',
    cardReference: '',
    bankReference: '',
    validationErrors: {},
    isValidating: false
  })

  // Calculate amounts
  useEffect(() => {
    const paidAmount = state.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = Math.max(0, totalAmount - paidAmount)
    const changeAmount = Math.max(0, paidAmount - totalAmount)

    setState(prev => ({
      ...prev,
      paidAmount,
      remainingAmount,
      changeAmount
    }))
  }, [state.payments, totalAmount])

  // Validate payment data
  const validatePayment = useCallback((paymentData: Partial<PaymentFormData>): string | null => {
    const result = PaymentFormSchema.safeParse(paymentData)
    
    if (!result.success) {
      const errors = result.error.issues
      return errors[0]?.message || 'Invalid payment data'
    }
    
    return null
  }, [])

  // Validate payments collection
  const validatePaymentsCollection = useCallback((payments: PaymentMethod[], total: number, change: number): string | null => {
    const collectionData: PaymentsCollectionData = {
      payments: payments.map(p => ({
        amount: p.amount,
        type: p.type,
        reference: p.reference,
        timestamp: p.timestamp
      })),
      totalAmount: total,
      changeAmount: change
    }
    
    const result = PaymentsCollectionSchema.safeParse(collectionData)
    
    if (!result.success) {
      const errors = result.error.issues
      return errors[0]?.message || 'Invalid payments collection'
    }
    
    return null
  }, [])

  // Clear validation errors
  const clearValidationErrors = useCallback((field?: keyof PaymentState['validationErrors']) => {
    setState(prev => ({
      ...prev,
      validationErrors: field
        ? { ...prev.validationErrors, [field]: undefined }
        : {}
    }))
  }, [])

  // Add payment with validation
  const addPayment = useCallback((type: 'cash' | 'card' | 'bank_transfer', amount: number, reference?: string) => {
    setState(prev => ({ ...prev, isValidating: true }))
    clearValidationErrors()
    
    // Validate payment data
    const paymentData: PaymentFormData = {
      amount,
      type,
      reference: reference || undefined,
      timestamp: new Date()
    }
    
    const validationError = validatePayment(paymentData)
    
    if (validationError) {
      setState(prev => ({
        ...prev,
        validationErrors: { general: validationError },
        isValidating: false
      }))
      toast.validationError('Payment', validationError)
      return
    }

    const payment: PaymentMethod = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      reference,
      timestamp: new Date()
    }

    setState(prev => {
      const newPayments = [...prev.payments, payment]
      const newPaidAmount = newPayments.reduce((sum, payment) => sum + payment.amount, 0)
      const newChangeAmount = Math.max(0, newPaidAmount - totalAmount)
      
      // Validate the new payments collection
      const collectionError = validatePaymentsCollection(newPayments, totalAmount, newChangeAmount)
      
      if (collectionError) {
        toast.validationError('Payments', collectionError)
        return {
          ...prev,
          validationErrors: { payments: collectionError },
          isValidating: false
        }
      }
      
      toast.success('Payment Added', `${type} payment of $${amount.toFixed(2)} added successfully`)
      
      return {
        ...prev,
        payments: newPayments,
        activePaymentType: null,
        currentPaymentAmount: '',
        cardReference: '',
        bankReference: '',
        validationErrors: {},
        isValidating: false
      }
    })
  }, [totalAmount, validatePayment, validatePaymentsCollection, clearValidationErrors, toast])

  // Remove payment
  const removePayment = useCallback((paymentId: string) => {
    setState(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== paymentId)
    }))
  }, [])

  // Handle payment type selection
  const selectPaymentType = useCallback((type: 'cash' | 'card' | 'bank_transfer') => {
    setState(prev => ({
      ...prev,
      activePaymentType: type,
      currentPaymentAmount: state.remainingAmount > 0 ? state.remainingAmount.toFixed(2) : ''
    }))
  }, [state.remainingAmount])

  // Handle amount input with real-time validation
  const handleAmountChange = useCallback((value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setState(prev => ({
        ...prev,
        currentPaymentAmount: value
      }))
      
      // Clear amount validation error when user starts typing
      clearValidationErrors('amount')
      
      // Real-time validation for amount
      if (value && !isNaN(parseFloat(value))) {
        const amount = parseFloat(value)
        
        if (amount <= 0) {
          setState(prev => ({
            ...prev,
            validationErrors: { ...prev.validationErrors, amount: 'Amount must be greater than zero' }
          }))
        } else if (amount > 999999.99) {
          setState(prev => ({
            ...prev,
            validationErrors: { ...prev.validationErrors, amount: 'Amount cannot exceed $999,999.99' }
          }))
        }
      }
    }
  }, [clearValidationErrors])

  // Handle quick cash amount with validation
  const handleQuickCash = useCallback((amount: number) => {
    // Validate quick cash amount
    const quickCashData = {
      amount,
      totalDue: state.remainingAmount
    }
    
    const result = QuickCashSchema.safeParse(quickCashData)
    
    if (!result.success) {
      const error = result.error.issues[0]?.message || 'Invalid quick cash amount'
      toast.validationError('Quick Cash', error)
      return
    }
    
    addPayment('cash', amount)
  }, [addPayment, state.remainingAmount, toast])

  // Handle exact amount
  const handleExactAmount = useCallback(() => {
    if (state.remainingAmount > 0) {
      addPayment('cash', state.remainingAmount)
    }
  }, [state.remainingAmount, addPayment])

  // Add current payment with comprehensive validation
  const addCurrentPayment = useCallback(() => {
    if (!state.activePaymentType) return
    
    const amount = parseFloat(state.currentPaymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setState(prev => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, amount: 'Please enter a valid amount' }
      }))
      return
    }

    let reference: string | undefined
    if (state.activePaymentType === 'card') {
      if (!state.cardReference.trim()) {
        setState(prev => ({
          ...prev,
          validationErrors: { ...prev.validationErrors, reference: 'Card reference is required' }
        }))
        return
      }
      reference = state.cardReference.trim()
    } else if (state.activePaymentType === 'bank_transfer') {
      if (!state.bankReference.trim()) {
        setState(prev => ({
          ...prev,
          validationErrors: { ...prev.validationErrors, reference: 'Bank transfer reference is required' }
        }))
        return
      }
      reference = state.bankReference.trim()
    }

    addPayment(state.activePaymentType, amount, reference)
  }, [state.currentPaymentAmount, state.activePaymentType, state.cardReference, state.bankReference, addPayment])

  // Complete payment with final validation
  const completePayment = useCallback(() => {
    if (state.remainingAmount > 0) {
      toast.validationError('Payment Incomplete', `$${state.remainingAmount.toFixed(2)} remaining to be paid`)
      return
    }
    
    if (state.payments.length === 0) {
      toast.validationError('No Payments', 'Please add at least one payment method')
      return
    }
    
    // Validate change calculation
    const changeData = {
      totalPaid: state.paidAmount,
      totalDue: totalAmount,
      changeDue: state.changeAmount
    }
    
    const changeResult = ChangeCalculationSchema.safeParse(changeData)
    
    if (!changeResult.success) {
      const error = changeResult.error.issues[0]?.message || 'Change calculation error'
      toast.validationError('Change Calculation', error)
      return
    }
    
    // Final validation of payments collection
    const collectionError = validatePaymentsCollection(state.payments, totalAmount, state.changeAmount)
    
    if (collectionError) {
      toast.validationError('Payment Validation', collectionError)
      return
    }
    
    try {
      onPaymentComplete(state.payments, state.changeAmount)
      toast.success('Payment Complete', 'Transaction processed successfully')
    } catch (error: any) {
      toast.error('Payment Error', error.message || 'Failed to complete payment')
    }
  }, [state.remainingAmount, state.payments, state.changeAmount, state.paidAmount, totalAmount, onPaymentComplete, validatePaymentsCollection, toast])

  // Check if current payment is valid with detailed validation
  const isCurrentPaymentValid = useCallback(() => {
    if (!state.activePaymentType) return false
    
    const amount = parseFloat(state.currentPaymentAmount)
    if (isNaN(amount) || amount <= 0) return false
    
    // Check for validation errors
    if (state.validationErrors.amount || state.validationErrors.reference) return false
    
    if (state.activePaymentType === 'card' && !state.cardReference.trim()) return false
    if (state.activePaymentType === 'bank_transfer' && !state.bankReference.trim()) return false
    
    return true
  }, [state.activePaymentType, state.currentPaymentAmount, state.cardReference, state.bankReference, state.validationErrors])

  // Keyboard shortcut handlers for payment
  const shortcutHandlers: ShortcutHandlers = {
    onProcessPayment: useCallback(() => {
      if (state.remainingAmount <= 0 && state.payments.length > 0) {
        completePayment()
      }
    }, [state.remainingAmount, state.payments.length, completePayment]),

    onReturnToCart: useCallback(() => {
      onCancel()
    }, [onCancel])
  }

  // Initialize keyboard shortcuts for payment form
  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.PAYMENT,
    handlers: shortcutHandlers,
    enabled: true
  })

  const getPaymentMethodIcon = (type: string) => {
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

  const getPaymentMethodName = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Cash'
      case 'card':
        return 'Card'
      case 'bank_transfer':
        return 'Bank Transfer'
      default:
        return type
    }
  }

  return (
    <POSErrorBoundary sessionData={{ payments: state.payments, totalAmount, remainingAmount: state.remainingAmount }}>
      <div className={cn("w-full max-w-4xl mx-auto space-y-4", className)}>
      {/* Payment Summary Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Payment Processing</span>
            <ShortcutTooltip
              shortcut="Escape"
              description="Return to cart"
            >
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                aria-keyshortcuts="escape"
              >
                <X className="h-4 w-4" />
                <KeyboardShortcutBadge 
                  shortcut="Esc" 
                  className="ml-1"
                  size="sm"
                />
              </Button>
            </ShortcutTooltip>
          </CardTitle>
        </CardHeader>
        
        {/* General validation errors */}
        {state.validationErrors.general && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{state.validationErrors.general}</span>
            </div>
          </div>
        )}
        
        {/* Payments collection errors */}
        {state.validationErrors.payments && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{state.validationErrors.payments}</span>
            </div>
          </div>
        )}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${state.paidAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
            <div>
              <div className={cn(
                "text-2xl font-bold",
                state.remainingAmount > 0 ? "text-orange-600" : "text-green-600"
              )}>
                ${state.remainingAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${state.changeAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Change</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Add Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={state.activePaymentType === 'cash' ? 'default' : 'outline'}
                className="h-16 flex flex-col gap-2"
                onClick={() => selectPaymentType('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span className="text-sm">Cash</span>
              </Button>
              <Button
                variant={state.activePaymentType === 'card' ? 'default' : 'outline'}
                className="h-16 flex flex-col gap-2"
                onClick={() => selectPaymentType('card')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Card</span>
              </Button>
              <Button
                variant={state.activePaymentType === 'bank_transfer' ? 'default' : 'outline'}
                className="h-16 flex flex-col gap-2"
                onClick={() => selectPaymentType('bank_transfer')}
              >
                <Building className="h-6 w-6" />
                <span className="text-sm">Bank Transfer</span>
              </Button>
            </div>

            {/* Quick Cash Amounts */}
            {state.activePaymentType === 'cash' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_CASH_AMOUNTS.map(amount => (
                    <Button
                      key={amount}
                      variant="outline"
                      className="h-12"
                      onClick={() => handleQuickCash(amount)}
                      disabled={amount > state.remainingAmount + 1000}
                    >
                      ${amount}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={handleExactAmount}
                    disabled={state.remainingAmount <= 0}
                  >
                    Exact
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Amount Input */}
            {state.activePaymentType && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="payment-amount">Amount</Label>
                  <Input
                    id="payment-amount"
                    type="text"
                    placeholder="0.00"
                    value={state.currentPaymentAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={cn(
                      "text-lg h-12",
                      state.validationErrors.amount && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {state.validationErrors.amount && (
                    <div className="flex items-center gap-1 mt-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">{state.validationErrors.amount}</span>
                    </div>
                  )}
                </div>

                {/* Reference Input for Non-Cash */}
                {state.activePaymentType === 'card' && (
                  <div>
                    <Label htmlFor="card-reference">Card Reference/Last 4 Digits</Label>
                    <Input
                      id="card-reference"
                      type="text"
                      placeholder="****1234"
                      value={state.cardReference}
                      onChange={(e) => {
                        setState(prev => ({ ...prev, cardReference: e.target.value }))
                        clearValidationErrors('reference')
                      }}
                      maxLength={50}
                      className={cn(
                        state.validationErrors.reference && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    {state.validationErrors.reference && state.activePaymentType === 'card' && (
                      <div className="flex items-center gap-1 mt-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">{state.validationErrors.reference}</span>
                      </div>
                    )}
                  </div>
                )}

                {state.activePaymentType === 'bank_transfer' && (
                  <div>
                    <Label htmlFor="bank-reference">Transfer Reference</Label>
                    <Input
                      id="bank-reference"
                      type="text"
                      placeholder="Transfer reference number"
                      value={state.bankReference}
                      onChange={(e) => {
                        setState(prev => ({ ...prev, bankReference: e.target.value }))
                        clearValidationErrors('reference')
                      }}
                      maxLength={100}
                      className={cn(
                        state.validationErrors.reference && "border-red-500 focus:border-red-500 focus:ring-red-500"
                      )}
                    />
                    {state.validationErrors.reference && state.activePaymentType === 'bank_transfer' && (
                      <div className="flex items-center gap-1 mt-1 text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">{state.validationErrors.reference}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={addCurrentPayment}
                  disabled={!isCurrentPaymentValid() || state.isValidating}
                  className="w-full h-12"
                >
                  {state.isValidating ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2 animate-pulse" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {state.payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payments added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {state.payments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(payment.type)}
                        <div>
                          <div className="font-medium">
                            {getPaymentMethodName(payment.type)} #{index + 1}
                          </div>
                          {payment.reference && (
                            <div className="text-sm text-muted-foreground">
                              Ref: {payment.reference}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          ${payment.amount.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePayment(payment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t my-3" />

              {/* Change Display */}
              {state.changeAmount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Change Due: ${state.changeAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Complete Payment Button */}
              <ShortcutTooltip
                shortcut="Enter"
                description="Complete payment"
              >
                <Button
                  onClick={completePayment}
                  disabled={state.remainingAmount > 0}
                  className="w-full h-12 text-lg relative"
                  variant={state.remainingAmount <= 0 ? "default" : "secondary"}
                  aria-keyshortcuts="enter"
                >
                  {state.remainingAmount > 0 ? (
                    <>
                      <AlertCircle className="h-5 w-5 mr-2" />
                      ${state.remainingAmount.toFixed(2)} Remaining
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Complete Payment
                      <KeyboardShortcutBadge 
                        shortcut="⏎" 
                        className="ml-auto"
                        variant="outline"
                      />
                    </>
                  )}
                </Button>
              </ShortcutTooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </POSErrorBoundary>
  )
}