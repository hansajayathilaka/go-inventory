import type { CartItem, CartSummary } from './cart';
import type { PaymentTransaction } from './payment';

export interface TransactionItem extends CartItem {
  productCode?: string; // For receipt display
  categoryName?: string;
  brandName?: string;
  originalPrice: number; // Before any discounts
}

export interface TransactionSummary extends CartSummary {
  sessionId: string;
  sessionName: string;
  customerId?: string;
  customerName?: string;
  customerType?: 'customer' | 'walk-in' | 'quick';
  billDiscountAmount: number;
  billDiscountReason?: string;
  lineDiscountAmount: number;
  taxRate: number;
  itemDiscountsBreakdown: Array<{
    itemId: string;
    itemName: string;
    discountAmount: number;
  }>;
}

export interface TransactionReview {
  id: string;
  sessionId: string;
  items: TransactionItem[];
  summary: TransactionSummary;
  payments: PaymentTransaction[];
  status: 'draft' | 'pending_payment' | 'paid' | 'completed' | 'voided';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  notes?: string;
}

export interface TransactionReceipt {
  transactionId: string;
  receiptNumber: string;
  businessInfo: {
    name: string;
    address: string[];
    phone?: string;
    email?: string;
    taxId?: string;
  };
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    type: 'customer' | 'walk-in' | 'quick';
  };
  items: TransactionItem[];
  summary: TransactionSummary;
  payments: PaymentTransaction[];
  timestamps: {
    created: Date;
    completed: Date;
  };
  cashier: {
    id: string;
    name: string;
  };
  printOptions: {
    showItemCodes: boolean;
    showCategories: boolean;
    showDiscountReasons: boolean;
    includeBusinessLogo: boolean;
  };
}

export interface TransactionActions {
  createTransaction: (sessionId: string) => string;
  updateTransactionStatus: (transactionId: string, status: TransactionReview['status']) => void;
  voidTransaction: (transactionId: string, reason: string) => void;
  getTransactionById: (transactionId: string) => TransactionReview | null;
  getSessionTransactions: (sessionId: string) => TransactionReview[];
  getAllTransactions: () => TransactionReview[];
  generateReceipt: (transactionId: string, printOptions?: Partial<TransactionReceipt['printOptions']>) => TransactionReceipt;
  buildTransactionFromSession: (
    sessionId: string,
    sessionName: string,
    cartItems: CartItem[],
    cartSummary: CartSummary,
    customer: unknown,
    payments: PaymentTransaction[]
  ) => TransactionReview;
}

export interface TransactionSearchFilters {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  cashierId?: string;
  status?: TransactionReview['status'];
  amountMin?: number;
  amountMax?: number;
  receiptNumber?: string;
}

export interface TransactionReport {
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalTransactions: number;
    totalSales: number;
    totalDiscounts: number;
    totalTax: number;
    averageTransactionValue: number;
  };
  paymentMethods: Record<string, {
    count: number;
    amount: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  transactions: TransactionReview[];
}