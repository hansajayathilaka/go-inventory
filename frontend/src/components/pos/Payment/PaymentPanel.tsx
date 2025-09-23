import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Banknote,
  Receipt,
  Wallet,
  Gift,
  Split
} from 'lucide-react';
import { CashPayment } from './CashPayment';
import { CardPayment } from './CardPayment';
import { SplitPayment } from './SplitPayment';
import type { PaymentMethod } from '@/types/pos/payment';
import type { CartSummary } from '@/types/pos/cart';

interface PaymentPanelProps {
  sessionId: string;
  cartSummary: CartSummary;
  onPaymentComplete: () => void;
  className?: string;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  enabled: boolean;
  primary?: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'cash',
    name: 'Cash',
    icon: Banknote,
    description: 'Accept cash payment with change calculation',
    enabled: true,
    primary: true,
  },
  {
    id: 'credit_card',
    name: 'Credit Card',
    icon: CreditCard,
    description: 'Process credit card payment',
    enabled: true,
  },
  {
    id: 'debit_card',
    name: 'Debit Card',
    icon: Wallet,
    description: 'Process debit card payment',
    enabled: true,
  },
  {
    id: 'store_credit',
    name: 'Store Credit',
    icon: Receipt,
    description: 'Apply store credit or gift card',
    enabled: false, // Not implemented yet
  },
  {
    id: 'gift_card',
    name: 'Gift Card',
    icon: Gift,
    description: 'Redeem gift card balance',
    enabled: false, // Not implemented yet
  },
];

export function PaymentPanel({ sessionId, cartSummary, onPaymentComplete, className }: PaymentPanelProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showSplitPayment, setShowSplitPayment] = useState(false);

  const handlePaymentSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentComplete = () => {
    setIsPaymentDialogOpen(false);
    setSelectedPaymentMethod(null);
    setShowSplitPayment(false);
    onPaymentComplete();
  };

  const handleSplitPaymentToggle = () => {
    setShowSplitPayment(!showSplitPayment);
    setSelectedPaymentMethod(null);
  };

  const canProcessPayment = cartSummary.itemCount > 0 && cartSummary.total > 0;

  const renderPaymentContent = () => {
    if (showSplitPayment) {
      return (
        <SplitPayment
          sessionId={sessionId}
          totalAmount={cartSummary.total}
          onComplete={handlePaymentComplete}
          onCancel={() => setShowSplitPayment(false)}
        />
      );
    }

    if (selectedPaymentMethod === 'cash') {
      return (
        <CashPayment
          sessionId={sessionId}
          totalAmount={cartSummary.total}
          onComplete={handlePaymentComplete}
          onCancel={() => setSelectedPaymentMethod(null)}
        />
      );
    }

    if (selectedPaymentMethod === 'credit_card' || selectedPaymentMethod === 'debit_card') {
      return (
        <CardPayment
          sessionId={sessionId}
          totalAmount={cartSummary.total}
          paymentMethod={selectedPaymentMethod}
          onComplete={handlePaymentComplete}
          onCancel={() => setSelectedPaymentMethod(null)}
        />
      );
    }

    // Payment method selection
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how the customer wants to pay for this transaction.
          </p>
        </div>

        <div className="grid gap-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.id}
                variant={method.primary ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                disabled={!method.enabled}
                onClick={() => handlePaymentSelect(method.id)}
              >
                <Icon className="h-5 w-5 mr-3" />
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.name}</span>
                    {!method.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>

        <Separator />

        <Button
          variant="outline"
          className="w-full h-auto p-4"
          onClick={handleSplitPaymentToggle}
        >
          <Split className="h-5 w-5 mr-3" />
          <div className="text-left flex-1">
            <div className="font-medium">Split Payment</div>
            <p className="text-sm text-muted-foreground mt-1">
              Use multiple payment methods for this transaction
            </p>
          </div>
        </Button>
      </div>
    );
  };

  return (
    <div className={className}>
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full"
            disabled={!canProcessPayment}
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Total amount: <span className="font-semibold">${cartSummary.total.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transaction Summary */}
            <Card className="p-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items ({cartSummary.itemCount}):</span>
                  <span>${cartSummary.subtotal.toFixed(2)}</span>
                </div>
                {cartSummary.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${cartSummary.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${cartSummary.taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>${cartSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {renderPaymentContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}