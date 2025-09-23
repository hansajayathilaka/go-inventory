export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'store_credit' | 'gift_card';

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: string;
  enabled: boolean;
  requiresAmountInput?: boolean;
  supportsSplit?: boolean;
}

export interface CashPaymentData {
  amountTendered: number;
  changeAmount: number;
}

export interface CardPaymentData {
  cardNumber?: string; // Last 4 digits for display
  cardType?: string; // Visa, Mastercard, etc.
  authCode?: string;
  transactionId?: string;
}

export interface PaymentTransaction {
  id: string;
  sessionId: string;
  method: PaymentMethod;
  amount: number;
  amountTendered?: number; // For cash payments
  changeAmount?: number; // For cash payments
  cardData?: CardPaymentData;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SplitPayment {
  transactions: PaymentTransaction[];
  totalAmount: number;
  remainingAmount: number;
  isComplete: boolean;
}

export interface PaymentState {
  activePayment: PaymentTransaction | null;
  splitPayments: Record<string, SplitPayment>; // sessionId -> SplitPayment
  paymentHistory: PaymentTransaction[];
  isProcessing: boolean;
  error: string | null;
}

export interface PaymentActions {
  // Cash payment actions
  initiateCashPayment: (sessionId: string, totalAmount: number) => string;
  setCashAmountTendered: (paymentId: string, amount: number) => void;
  completeCashPayment: (paymentId: string) => void;

  // Card payment actions
  initiateCardPayment: (sessionId: string, totalAmount: number, method: 'credit_card' | 'debit_card') => string;
  completeCardPayment: (paymentId: string, cardData: CardPaymentData) => void;

  // Split payment actions
  initiateSplitPayment: (sessionId: string, totalAmount: number) => void;
  addSplitPayment: (sessionId: string, method: PaymentMethod, amount: number) => string;
  completeSplitPayment: (sessionId: string) => void;

  // General actions
  cancelPayment: (paymentId: string) => void;
  clearPaymentHistory: () => void;
  getPaymentById: (paymentId: string) => PaymentTransaction | null;
  getSessionPayments: (sessionId: string) => PaymentTransaction[];
  getSplitPayment: (sessionId: string) => SplitPayment | null;
}

// Payment validation
export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PaymentValidationRules {
  minCashAmount?: number;
  maxCashAmount?: number;
  allowOverpayment?: boolean;
  requireExactChange?: boolean;
}