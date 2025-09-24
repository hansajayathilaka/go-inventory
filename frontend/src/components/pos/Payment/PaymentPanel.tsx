import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
      <div className="space-y-3">
        <div className="grid gap-2">
          {paymentMethods.filter(method => method.enabled).map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.id}
                variant={method.primary ? "default" : "outline"}
                className="justify-start h-12"
                onClick={() => handlePaymentSelect(method.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                <span>{method.name}</span>
                <span className="ml-auto text-sm font-medium">
                  ${cartSummary.total.toFixed(2)}
                </span>
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full h-10"
          onClick={handleSplitPaymentToggle}
        >
          <Split className="h-4 w-4 mr-2" />
          Split Payment
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
            <DialogTitle className="flex items-center justify-between">
              <span>Process Payment</span>
              <span className="text-lg font-bold">${cartSummary.total.toFixed(2)}</span>
            </DialogTitle>
          </DialogHeader>

          {renderPaymentContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}