import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Split,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Banknote,
  CreditCard,
  Wallet
} from 'lucide-react';
import { usePOSPaymentStore } from '@/stores/pos/posPaymentStore';
import type { PaymentMethod } from '@/types/pos/payment';
import {
  roundToTwoDecimals,
  parseMonetaryAmount,
  formatMoney,
  calculateRemainingAmount,
  isSplitPaymentComplete
} from '@/utils/paymentUtils';

interface SplitPaymentProps {
  sessionId: string;
  totalAmount: number;
  onComplete: () => void;
  onCancel: () => void;
}

interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  amount: string;
  isValid: boolean;
}

const paymentMethodOptions = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'debit_card', label: 'Debit Card', icon: Wallet },
] as const;

export function SplitPayment({ sessionId, totalAmount, onComplete, onCancel }: SplitPaymentProps) {
  const {
    initiateSplitPayment,
    addSplitPayment,
    completeSplitPayment,
    getSplitPayment,
    error
  } = usePOSPaymentStore();

  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([
    { id: '1', method: 'cash', amount: '', isValid: false }
  ]);

  const splitPayment = getSplitPayment(sessionId);

  // Initialize split payment on mount
  useEffect(() => {
    if (!splitPayment) {
      initiateSplitPayment(sessionId, totalAmount);
    }
  }, [sessionId, totalAmount, splitPayment, initiateSplitPayment]);

  const addPaymentEntry = () => {
    const newEntry: PaymentEntry = {
      id: Date.now().toString(),
      method: 'cash',
      amount: '',
      isValid: false,
    };
    setPaymentEntries([...paymentEntries, newEntry]);
  };

  const removePaymentEntry = (id: string) => {
    if (paymentEntries.length > 1) {
      setPaymentEntries(paymentEntries.filter(entry => entry.id !== id));
    }
  };

  const updatePaymentEntry = (id: string, field: keyof PaymentEntry, value: string | PaymentMethod) => {
    setPaymentEntries(entries =>
      entries.map(entry => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };
          if (field === 'amount') {
            const amount = parseMonetaryAmount(value as string);
            const maxAllowed = roundToTwoDecimals(getRemainingAmount() + getCurrentEntryAmount(id));
            updated.isValid = amount > 0 && amount <= maxAllowed;
          }
          return updated;
        }
        return entry;
      })
    );
  };

  const getCurrentEntryAmount = (entryId: string): number => {
    const entry = paymentEntries.find(e => e.id === entryId);
    return entry ? parseMonetaryAmount(entry.amount) : 0;
  };

  const getTotalEnteredAmount = (): number => {
    return roundToTwoDecimals(
      paymentEntries.reduce((sum, entry) => sum + parseMonetaryAmount(entry.amount), 0)
    );
  };

  const getRemainingAmount = (): number => {
    const appliedAmount = splitPayment?.transactions.reduce((sum, t) => sum + t.amount, 0) || 0;
    return calculateRemainingAmount(totalAmount, appliedAmount);
  };

  const getUnprocessedAmount = (): number => {
    return roundToTwoDecimals(getRemainingAmount() - getTotalEnteredAmount());
  };

  const isReadyToProcess = (): boolean => {
    const hasValidEntries = paymentEntries.some(entry => entry.isValid);
    const totalEntered = getTotalEnteredAmount();
    const remaining = getRemainingAmount();
    return hasValidEntries && totalEntered > 0 && totalEntered <= remaining;
  };

  const processCurrentEntries = () => {
    const validEntries = paymentEntries.filter(entry => entry.isValid);

    validEntries.forEach(entry => {
      const amount = parseMonetaryAmount(entry.amount);
      addSplitPayment(sessionId, entry.method, amount);
    });

    // Clear processed entries
    setPaymentEntries([{ id: Date.now().toString(), method: 'cash', amount: '', isValid: false }]);
  };

  const handleComplete = () => {
    if (splitPayment?.isComplete) {
      completeSplitPayment(sessionId);
      onComplete();
    } else if (splitPayment) {
      const paidAmount = (splitPayment.totalAmount || 0) - (splitPayment.remainingAmount || 0);
      if (isSplitPaymentComplete(totalAmount, paidAmount)) {
        completeSplitPayment(sessionId);
        onComplete();
      }
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  const getMethodIcon = (method: PaymentMethod) => {
    const option = paymentMethodOptions.find(opt => opt.value === method);
    return option?.icon || Banknote;
  };

  const remainingAmount = getRemainingAmount();
  const unprocessedAmount = getUnprocessedAmount();

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
          <Split className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Split Payment</h3>
        </div>
      </div>

      {/* Payment Summary */}
      <Card className="p-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">${formatMoney(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining:</span>
            <span className={`font-medium ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ${formatMoney(remainingAmount)}
            </span>
          </div>
          {splitPayment?.transactions.length ? (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="font-medium text-xs text-muted-foreground">Applied Payments:</span>
                {splitPayment.transactions.map((transaction) => {
                  const Icon = getMethodIcon(transaction.method);
                  return (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        <span className="text-xs capitalize">
                          {transaction.method.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        ${formatMoney(transaction.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </Card>

      {/* Payment Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Add Payments</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addPaymentEntry}
            disabled={paymentEntries.length >= 4}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        {paymentEntries.map((entry, index) => (
          <Card key={entry.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Payment {index + 1}</span>
                {paymentEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePaymentEntry(entry.id)}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Method</Label>
                  <Select
                    value={entry.method}
                    onValueChange={(value: PaymentMethod) => updatePaymentEntry(entry.id, 'method', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3 w-3" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">
                      $
                    </span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={entry.amount}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        updatePaymentEntry(entry.id, 'amount', value);
                      }}
                      className="pl-6 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {entry.amount && !entry.isValid && (
                <div className="text-xs text-destructive">
                  Amount exceeds remaining balance (${formatMoney(remainingAmount)})
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Unprocessed Amount Display */}
      {unprocessedAmount !== 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {unprocessedAmount < 0
              ? `Entries exceed remaining amount by $${formatMoney(Math.abs(unprocessedAmount))}`
              : `$${formatMoney(unprocessedAmount)} still needed to complete payment`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Process Current Entries */}
        {isReadyToProcess() && (
          <Button
            onClick={processCurrentEntries}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Apply These Payments
          </Button>
        )}

        {/* Complete Split Payment */}
        {splitPayment?.isComplete && (
          <Button
            onClick={handleComplete}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Split Payment
          </Button>
        )}

        {/* Cancel */}
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full"
        >
          Cancel
        </Button>
      </div>

      {/* Status Badge */}
      {splitPayment?.isComplete && (
        <div className="text-center">
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payment Complete
          </Badge>
        </div>
      )}
    </div>
  );
}