import { useState, useCallback, useEffect } from 'react'
import { 
  CreditCard, 
  Banknote, 
  Building, 
  Plus, 
  X, 
  Calculator,
  Check,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Removed separator import - using simple div instead
import { cn } from '@/lib/utils'

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
}

const QUICK_CASH_AMOUNTS = [5, 10, 20, 50, 100]

export function PaymentForm({
  totalAmount,
  onPaymentComplete,
  onCancel,
  className
}: PaymentFormProps) {
  const [state, setState] = useState<PaymentState>({
    payments: [],
    remainingAmount: totalAmount,
    paidAmount: 0,
    changeAmount: 0,
    activePaymentType: null,
    currentPaymentAmount: '',
    cardReference: '',
    bankReference: ''
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

  // Add payment
  const addPayment = useCallback((type: 'cash' | 'card' | 'bank_transfer', amount: number, reference?: string) => {
    if (amount <= 0 || amount > state.remainingAmount + 1000) return // Allow overpayment for change

    const payment: PaymentMethod = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      reference,
      timestamp: new Date()
    }

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, payment],
      activePaymentType: null,
      currentPaymentAmount: '',
      cardReference: '',
      bankReference: ''
    }))
  }, [state.remainingAmount])

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

  // Handle amount input
  const handleAmountChange = useCallback((value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setState(prev => ({
        ...prev,
        currentPaymentAmount: value
      }))
    }
  }, [])

  // Handle quick cash amount
  const handleQuickCash = useCallback((amount: number) => {
    addPayment('cash', amount)
  }, [addPayment])

  // Handle exact amount
  const handleExactAmount = useCallback(() => {
    if (state.remainingAmount > 0) {
      addPayment('cash', state.remainingAmount)
    }
  }, [state.remainingAmount, addPayment])

  // Add current payment
  const addCurrentPayment = useCallback(() => {
    const amount = parseFloat(state.currentPaymentAmount)
    if (isNaN(amount) || amount <= 0) return

    let reference: string | undefined
    if (state.activePaymentType === 'card' && state.cardReference.trim()) {
      reference = state.cardReference.trim()
    } else if (state.activePaymentType === 'bank_transfer' && state.bankReference.trim()) {
      reference = state.bankReference.trim()
    }

    addPayment(state.activePaymentType!, amount, reference)
  }, [state.currentPaymentAmount, state.activePaymentType, state.cardReference, state.bankReference, addPayment])

  // Complete payment
  const completePayment = useCallback(() => {
    if (state.remainingAmount <= 0 && state.payments.length > 0) {
      onPaymentComplete(state.payments, state.changeAmount)
    }
  }, [state.remainingAmount, state.payments, state.changeAmount, onPaymentComplete])

  // Check if current payment is valid
  const isCurrentPaymentValid = useCallback(() => {
    if (!state.activePaymentType) return false
    const amount = parseFloat(state.currentPaymentAmount)
    if (isNaN(amount) || amount <= 0) return false
    
    if (state.activePaymentType === 'card' && !state.cardReference.trim()) return false
    if (state.activePaymentType === 'bank_transfer' && !state.bankReference.trim()) return false
    
    return true
  }, [state.activePaymentType, state.currentPaymentAmount, state.cardReference, state.bankReference])

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
    <div className={cn("w-full max-w-4xl mx-auto space-y-4", className)}>
      {/* Payment Summary Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Payment Processing</span>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
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
                    className="text-lg h-12"
                  />
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
                      onChange={(e) => setState(prev => ({ ...prev, cardReference: e.target.value }))}
                      maxLength={50}
                    />
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
                      onChange={(e) => setState(prev => ({ ...prev, bankReference: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                )}

                <Button
                  onClick={addCurrentPayment}
                  disabled={!isCurrentPaymentValid()}
                  className="w-full h-12"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
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
              <Button
                onClick={completePayment}
                disabled={state.remainingAmount > 0}
                className="w-full h-12 text-lg"
                variant={state.remainingAmount <= 0 ? "default" : "secondary"}
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
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}