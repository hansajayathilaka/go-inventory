import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Wallet,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { usePOSPaymentStore } from '@/stores/pos/posPaymentStore';
import type { CardPaymentData } from '@/types/pos/payment';

interface CardPaymentProps {
  sessionId: string;
  totalAmount: number;
  paymentMethod: 'credit_card' | 'debit_card';
  onComplete: () => void;
  onCancel: () => void;
}

type PaymentStep = 'insert_card' | 'processing' | 'enter_pin' | 'completed' | 'failed';

export function CardPayment({ sessionId, totalAmount, paymentMethod, onComplete, onCancel }: CardPaymentProps) {
  const {
    activePayment,
    initiateCardPayment,
    completeCardPayment,
    cancelPayment,
    error
  } = usePOSPaymentStore();

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<PaymentStep>('insert_card');
  const [progress, setProgress] = useState(0);
  const [pin, setPin] = useState('');
  const [cardData, setCardData] = useState<CardPaymentData>({});

  // Initialize card payment on mount
  useEffect(() => {
    const id = initiateCardPayment(sessionId, totalAmount, paymentMethod);
    setPaymentId(id);

    return () => {
      // Cleanup: cancel payment if component unmounts without completion
      if (id && activePayment?.status === 'pending') {
        cancelPayment(id);
      }
    };
  }, [sessionId, totalAmount, paymentMethod, initiateCardPayment, cancelPayment, activePayment?.status]);

  const handleInsertCard = () => {
    setCurrentStep('processing');
    setProgress(20);

    // Simulate card processing
    setTimeout(() => {
      setProgress(60);
      setCardData({
        cardNumber: '**** **** **** 1234',
        cardType: 'Visa',
      });

      if (paymentMethod === 'debit_card') {
        setCurrentStep('enter_pin');
        setProgress(80);
      } else {
        // Credit card - skip PIN entry
        handleProcessingComplete();
      }
    }, 2000);
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      return;
    }

    setProgress(100);
    handleProcessingComplete();
  };

  const handleProcessingComplete = () => {
    if (!paymentId) return;

    // Simulate final processing
    setTimeout(() => {
      const finalCardData: CardPaymentData = {
        ...cardData,
        authCode: `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        transactionId: `TXN${Date.now()}`,
      };

      completeCardPayment(paymentId, finalCardData);
      setCurrentStep('completed');

      // Auto-complete after showing success
      setTimeout(() => {
        onComplete();
      }, 2000);
    }, 1000);
  };

  const handleCancel = () => {
    if (paymentId) {
      cancelPayment(paymentId);
    }
    onCancel();
  };

  const handleTryAgain = () => {
    setCurrentStep('insert_card');
    setProgress(0);
    setPin('');
    setCardData({});
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'insert_card':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                {paymentMethod === 'credit_card' ? (
                  <CreditCard className="h-8 w-8 text-blue-600" />
                ) : (
                  <Wallet className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-medium mb-2">Insert or Swipe Card</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please insert your {paymentMethod === 'credit_card' ? 'credit' : 'debit'} card or swipe it
              </p>
              <Button onClick={handleInsertCard} className="mt-4">
                Simulate Card Insert
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Processing Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please wait while we process your payment...
              </p>
              <Progress value={progress} className="w-full max-w-xs mx-auto" />
            </div>
          </div>
        );

      case 'enter_pin':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Enter PIN</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please enter your 4-digit PIN to complete the transaction
              </p>

              <div className="max-w-xs mx-auto space-y-4">
                <Input
                  type="password"
                  placeholder="• • • •"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={4}
                  autoFocus
                />

                <Button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 4}
                  className="w-full"
                >
                  Submit PIN
                </Button>
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-green-600">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your payment has been processed successfully
              </p>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-red-600">Payment Failed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There was an issue processing your payment. Please try again.
              </p>
              <Button onClick={handleTryAgain} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
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
          disabled={currentStep === 'processing' || currentStep === 'completed'}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          {paymentMethod === 'credit_card' ? (
            <CreditCard className="h-5 w-5" />
          ) : (
            <Wallet className="h-5 w-5" />
          )}
          <h3 className="text-lg font-semibold">
            {paymentMethod === 'credit_card' ? 'Credit Card' : 'Debit Card'} Payment
          </h3>
        </div>
      </div>

      {/* Transaction Summary */}
      <Card className="p-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="font-medium">
              {paymentMethod === 'credit_card' ? 'Credit Card' : 'Debit Card'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Amount:</span>
            <span className="font-medium">${totalAmount.toFixed(2)}</span>
          </div>
          {cardData.cardNumber && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span>Card:</span>
                <span className="font-medium">
                  {cardData.cardType} {cardData.cardNumber}
                </span>
              </div>
            </>
          )}
          {cardData.authCode && (
            <div className="flex justify-between">
              <span>Auth Code:</span>
              <span className="font-medium">{cardData.authCode}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Step Content */}
      {getStepContent()}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cancel Button (only show when not processing or completed) */}
      {currentStep !== 'processing' && currentStep !== 'completed' && (
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full"
        >
          Cancel Payment
        </Button>
      )}
    </div>
  );
}