import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TransactionReview, TransactionSummary, TransactionItem, TransactionReceipt, TransactionActions } from '@/types/pos/transaction';
import type { CartItem } from '@/types/pos/cart';
import type { PaymentTransaction } from '@/types/pos/payment';

interface TransactionState {
  transactions: TransactionReview[];
  currentTransactionId: string | null;
  isGeneratingReceipt: boolean;
  error: string | null;
}

interface TransactionStore extends TransactionState, TransactionActions {}

export const usePOSTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      currentTransactionId: null,
      isGeneratingReceipt: false,
      error: null,

      createTransaction: (sessionId: string): string => {
        // Get session data from other stores (would need to import them)
        // For now, we'll create a basic transaction structure
        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newTransaction: TransactionReview = {
          id: transactionId,
          sessionId,
          items: [], // Will be populated from cart items
          summary: {
            sessionId,
            sessionName: 'Session',
            itemCount: 0,
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            total: 0,
            billDiscountAmount: 0,
            lineDiscountAmount: 0,
            taxRate: 0.08, // 8% default tax rate
            itemDiscountsBreakdown: []
          },
          payments: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          transactions: [...state.transactions, newTransaction],
          currentTransactionId: transactionId,
          error: null
        }));

        return transactionId;
      },

      updateTransactionStatus: (transactionId: string, status: TransactionReview['status']) => {
        set(state => ({
          transactions: state.transactions.map(txn =>
            txn.id === transactionId
              ? {
                  ...txn,
                  status,
                  updatedAt: new Date(),
                  ...(status === 'completed' && { completedAt: new Date() })
                }
              : txn
          ),
          error: null
        }));
      },

      voidTransaction: (transactionId: string, reason: string) => {
        set(state => ({
          transactions: state.transactions.map(txn =>
            txn.id === transactionId
              ? {
                  ...txn,
                  status: 'voided' as const,
                  voidedAt: new Date(),
                  voidReason: reason,
                  updatedAt: new Date()
                }
              : txn
          ),
          error: null
        }));
      },

      getTransactionById: (transactionId: string): TransactionReview | null => {
        const state = get();
        return state.transactions.find(txn => txn.id === transactionId) || null;
      },

      getSessionTransactions: (sessionId: string): TransactionReview[] => {
        const state = get();
        return state.transactions.filter(txn => txn.sessionId === sessionId);
      },

      getAllTransactions: (): TransactionReview[] => {
        const state = get();
        return [...state.transactions].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      generateReceipt: (transactionId: string, printOptions?: Partial<TransactionReceipt['printOptions']>): TransactionReceipt => {
        const transaction = get().getTransactionById(transactionId);
        if (!transaction) {
          throw new Error('Transaction not found');
        }

        set({ isGeneratingReceipt: true });

        try {
          const receipt: TransactionReceipt = {
            transactionId: transaction.id,
            receiptNumber: `RCP-${transaction.id.slice(-8).toUpperCase()}`,
            businessInfo: {
              name: 'Hardware Store Inventory',
              address: [
                '123 Main Street',
                'City, ST 12345'
              ],
              phone: '(555) 123-4567',
              email: 'info@hardwarestore.com',
              taxId: 'TX123456789'
            },
            customer: {
              id: transaction.summary.customerId,
              name: transaction.summary.customerName || 'Walk-in Customer',
              type: transaction.summary.customerType || 'walk-in'
            },
            items: transaction.items,
            summary: transaction.summary,
            payments: transaction.payments,
            timestamps: {
              created: transaction.createdAt,
              completed: transaction.completedAt || transaction.updatedAt
            },
            cashier: {
              id: 'current_user', // Would come from auth store
              name: 'Current User' // Would come from auth store
            },
            printOptions: {
              showItemCodes: true,
              showCategories: false,
              showDiscountReasons: true,
              includeBusinessLogo: false,
              ...printOptions
            }
          };

          set({ isGeneratingReceipt: false });
          return receipt;
        } catch (error) {
          set({
            isGeneratingReceipt: false,
            error: error instanceof Error ? error.message : 'Failed to generate receipt'
          });
          throw error;
        }
      },

      // Helper method to build transaction from current session data
      buildTransactionFromSession: (
        sessionId: string,
        sessionName: string,
        cartItems: CartItem[],
        cartSummary: unknown,
        customer: unknown,
        payments: PaymentTransaction[]
      ): TransactionReview => {
        const transactionItems: TransactionItem[] = cartItems.map(item => ({
          ...item,
          originalPrice: item.price + (item.lineDiscount || 0), // Calculate original price
          productCode: item.productSku,
          categoryName: undefined, // Would need to fetch from product data
          brandName: undefined // Would need to fetch from product data
        }));

        const lineDiscountAmount = cartItems.reduce((sum, item) => sum + (item.lineDiscount || 0), 0);

        const summary: TransactionSummary = {
          ...cartSummary,
          sessionId,
          sessionName,
          customerId: customer?.id,
          customerName: customer?.name,
          customerType: customer?.type || 'walk-in',
          billDiscountAmount: cartSummary.discountAmount - lineDiscountAmount,
          lineDiscountAmount,
          taxRate: 0.08, // Default 8% tax rate
          itemDiscountsBreakdown: cartItems
            .filter(item => (item.lineDiscount || 0) > 0)
            .map(item => ({
              itemId: item.id,
              itemName: item.productName,
              discountAmount: item.lineDiscount || 0
            }))
        };

        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const transaction: TransactionReview = {
          id: transactionId,
          sessionId,
          items: transactionItems,
          summary,
          payments,
          status: payments.length > 0 && payments.every(p => p.status === 'completed') ? 'paid' : 'pending_payment',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add transaction to store
        set(state => ({
          transactions: [...state.transactions, transaction],
          error: null
        }));

        return transaction;
      }
    }),
    {
      name: 'pos-transaction-store',
      partialize: (state) => ({
        transactions: state.transactions
      })
    }
  )
);