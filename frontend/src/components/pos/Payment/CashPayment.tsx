import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Banknote,
  Calculator,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { usePOSPaymentStore } from '@/stores/pos/posPaymentStore';

interface CashPaymentProps {
  sessionId: string;
  totalAmount: number;
  onComplete: () => void;
  onCancel: () => void;
}

// Quick amount buttons for common cash denominations
const quickAmounts = [
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$20', value: 20 },
  { label: '$50', value: 50 },
  { label: '$100', value: 100 },
];

export function CashPayment({ sessionId, totalAmount, onComplete, onCancel }: CashPaymentProps) {
  const {
    activePayment,
    initiateCashPayment,
    setCashAmountTendered,
    completeCashPayment,
    cancelPayment,
    error,
    isProcessing
  } = usePOSPaymentStore();

  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Initialize cash payment on mount
  useEffect(() => {
    const id = initiateCashPayment(sessionId, totalAmount);
    setPaymentId(id);

    return () => {
      // Cleanup: cancel payment if component unmounts without completion
      if (id && activePayment?.status === 'pending') {
        cancelPayment(id);
      }
    };
  }, [sessionId, totalAmount, initiateCashPayment, cancelPayment, activePayment?.status]);

  // Calculate change amount
  const changeAmount = useMemo(() => {
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - totalAmount);
  }, [amountTendered, totalAmount]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const tendered = parseFloat(amountTendered) || 0;

    if (tendered <= 0) {
      errors.push('Please enter an amount');
    } else if (tendered < totalAmount) {
      errors.push(`Amount is $${(totalAmount - tendered).toFixed(2)} short`);
    }

    return errors;
  }, [amountTendered, totalAmount]);

  const isValid = validationErrors.length === 0 && parseFloat(amountTendered) > 0;

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setAmountTendered(numericValue);

    // Update payment store with the amount
    if (paymentId && numericValue) {
      const amount = parseFloat(numericValue);
      if (!isNaN(amount)) {
        setCashAmountTendered(paymentId, amount);
      }
    }
  };

  const handleQuickAmountClick = (amount: number) => {
    const newAmount = (parseFloat(amountTendered) || 0) + amount;
    handleAmountChange(newAmount.toString());
  };

  const handleExactAmountClick = () => {
    handleAmountChange(totalAmount.toFixed(2));
  };

  const handleProcessPayment = () => {
    if (!paymentId || !isValid) return;

    completeCashPayment(paymentId);
    onComplete();
  };

  const handleCancel = () => {
    if (paymentId) {
      cancelPayment(paymentId);
    }
    onCancel();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="p-1 h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Cash Payment</h3>
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount-tendered">Amount Tendered</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="amount-tendered"
            type="text"
            placeholder="0.00"
            value={amountTendered}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="pl-8 text-lg font-mono"
            autoFocus
          />
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="space-y-2">
        <Label>Quick Add</Label>
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((quick) => (
            <Button
              key={quick.value}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmountClick(quick.value)}
              className="text-sm"
            >
              {quick.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExactAmountClick}
            className="text-sm col-span-3"
          >
            <Calculator className="h-3 w-3 mr-1" />
            Exact Amount (${totalAmount.toFixed(2)})
          </Button>
        </div>
      </div>

      {/* Calculation Summary */}
      <Card className="p-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Tendered:</span>
            <span className="font-medium">
              ${parseFloat(amountTendered || '0').toFixed(2)}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-base">
            <span>Change Due:</span>
            <span className={`font-semibold ${changeAmount > 0 ? 'text-green-600' : ''}`}>
              ${changeAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationErrors.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Large Change Warning */}
      {changeAmount > 50 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Large change amount: ${changeAmount.toFixed(2)}. Please confirm with customer.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleProcessPayment}
          disabled={!isValid || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            'Processing...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Payment
            </>
          )}
        </Button>
      </div>

      {/* Change Due Display (Large) */}
      {isValid && changeAmount > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-center">
            <div className="text-sm font-medium text-green-800 mb-1">
              Change Due
            </div>
            <div className="text-2xl font-bold text-green-900">
              ${changeAmount.toFixed(2)}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}