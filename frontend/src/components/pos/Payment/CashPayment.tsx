import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Banknote,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { usePOSPaymentStore } from '@/stores/pos/posPaymentStore';
import {
  roundToTwoDecimals,
  parseMonetaryAmount,
  formatMoney,
  calculateChange,
  isPaymentSufficient
} from '@/utils/paymentUtils';

interface CashPaymentProps {
  sessionId: string;
  totalAmount: number;
  onComplete: () => void;
  onCancel: () => void;
}


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

    // Set exact amount as default
    const exactAmount = formatMoney(totalAmount);
    setAmountTendered(exactAmount);
    setCashAmountTendered(id, totalAmount);

    return () => {
      // Cleanup: cancel payment if component unmounts without completion
      if (id && activePayment?.status === 'pending') {
        cancelPayment(id);
      }
    };
  }, [sessionId, totalAmount, initiateCashPayment, cancelPayment, activePayment?.status, setCashAmountTendered]);

  // Calculate change amount with proper rounding
  const changeAmount = useMemo(() => {
    const tendered = parseMonetaryAmount(amountTendered);
    return calculateChange(tendered, totalAmount);
  }, [amountTendered, totalAmount]);

  // Validation with proper rounding
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const tendered = parseMonetaryAmount(amountTendered);

    if (tendered <= 0) {
      errors.push('Please enter an amount');
    } else if (!isPaymentSufficient(tendered, totalAmount)) {
      const shortfall = roundToTwoDecimals(totalAmount - tendered);
      errors.push(`Amount is $${formatMoney(shortfall)} short`);
    }

    return errors;
  }, [amountTendered, totalAmount]);

  const isValid = validationErrors.length === 0 && parseMonetaryAmount(amountTendered) > 0;

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
      const amount = parseMonetaryAmount(numericValue);
      if (amount > 0) {
        setCashAmountTendered(paymentId, amount);
      }
    }
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


      {/* Calculation Summary */}
      <Card className="p-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">${formatMoney(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Tendered:</span>
            <span className="font-medium">
              ${formatMoney(parseMonetaryAmount(amountTendered))}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-base">
            <span>Change Due:</span>
            <span className={`font-semibold ${changeAmount > 0 ? 'text-green-600' : ''}`}>
              ${formatMoney(changeAmount)}
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
            Large change amount: ${formatMoney(changeAmount)}. Please confirm with customer.
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
              ${formatMoney(changeAmount)}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}