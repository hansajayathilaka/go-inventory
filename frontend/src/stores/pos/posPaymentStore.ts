import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  PaymentState,
  PaymentActions,
  PaymentTransaction,
  PaymentMethod,
  SplitPayment,
  CardPaymentData,
  PaymentValidationResult,
  PaymentValidationRules
} from '@/types/pos/payment';

interface POSPaymentStore extends PaymentState, PaymentActions {}

const generatePaymentId = (): string => {
  return `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const validateCashPayment = (
  totalAmount: number,
  amountTendered: number,
  rules: PaymentValidationRules = {}
): PaymentValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum amount
  if (rules.minCashAmount && amountTendered < rules.minCashAmount) {
    errors.push(`Minimum cash amount is $${rules.minCashAmount.toFixed(2)}`);
  }

  // Check maximum amount
  if (rules.maxCashAmount && amountTendered > rules.maxCashAmount) {
    errors.push(`Maximum cash amount is $${rules.maxCashAmount.toFixed(2)}`);
  }

  // Check if payment covers the total
  if (amountTendered < totalAmount) {
    errors.push(`Amount tendered ($${amountTendered.toFixed(2)}) is less than total ($${totalAmount.toFixed(2)})`);
  }

  // Check for exact change requirement
  if (rules.requireExactChange && amountTendered !== totalAmount) {
    errors.push('Exact change is required');
  }

  // Warn about large overpayment
  const overpayment = amountTendered - totalAmount;
  if (overpayment > 100) {
    warnings.push(`Large overpayment: $${overpayment.toFixed(2)} change required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const usePOSPaymentStore = create<POSPaymentStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activePayment: null,
        splitPayments: {},
        paymentHistory: [],
        isProcessing: false,
        error: null,

        // Cash payment actions
        initiateCashPayment: (sessionId: string, totalAmount: number) => {
          const paymentId = generatePaymentId();
          const payment: PaymentTransaction = {
            id: paymentId,
            sessionId,
            method: 'cash',
            amount: totalAmount,
            status: 'pending',
            timestamp: new Date(),
          };

          set(() => ({
            activePayment: payment,
            isProcessing: false,
            error: null,
          }));

          return paymentId;
        },

        setCashAmountTendered: (paymentId: string, amount: number) => {
          set((state) => {
            if (state.activePayment?.id !== paymentId) {
              return { error: 'Payment not found or not active' };
            }

            const changeAmount = Math.max(0, amount - state.activePayment.amount);

            return {
              ...state,
              activePayment: {
                ...state.activePayment,
                amountTendered: amount,
                changeAmount,
              },
              error: null,
            };
          });
        },

        completeCashPayment: (paymentId: string) => {
          set((state) => {
            if (state.activePayment?.id !== paymentId) {
              return { error: 'Payment not found or not active' };
            }

            const payment = state.activePayment;
            if (!payment.amountTendered) {
              return { error: 'Amount tendered not set' };
            }

            // Validate payment
            const validation = validateCashPayment(payment.amount, payment.amountTendered);
            if (!validation.isValid) {
              return { error: validation.errors.join(', ') };
            }

            const completedPayment: PaymentTransaction = {
              ...payment,
              status: 'completed',
              timestamp: new Date(),
            };

            return {
              activePayment: null,
              paymentHistory: [...state.paymentHistory, completedPayment],
              isProcessing: false,
              error: null,
            };
          });
        },

        // Card payment actions
        initiateCardPayment: (sessionId: string, totalAmount: number, method: 'credit_card' | 'debit_card') => {
          const paymentId = generatePaymentId();
          const payment: PaymentTransaction = {
            id: paymentId,
            sessionId,
            method,
            amount: totalAmount,
            status: 'pending',
            timestamp: new Date(),
          };

          set(() => ({
            activePayment: payment,
            isProcessing: true,
            error: null,
          }));

          return paymentId;
        },

        completeCardPayment: (paymentId: string, cardData: CardPaymentData) => {
          set((state) => {
            if (state.activePayment?.id !== paymentId) {
              return { error: 'Payment not found or not active' };
            }

            const completedPayment: PaymentTransaction = {
              ...state.activePayment,
              cardData,
              status: 'completed',
              timestamp: new Date(),
            };

            return {
              ...state,
              activePayment: null,
              paymentHistory: [...state.paymentHistory, completedPayment],
              isProcessing: false,
              error: null,
            };
          });
        },

        // Split payment actions
        initiateSplitPayment: (sessionId: string, totalAmount: number) => {
          set((state) => ({
            splitPayments: {
              ...state.splitPayments,
              [sessionId]: {
                transactions: [],
                totalAmount,
                remainingAmount: totalAmount,
                isComplete: false,
              },
            },
            error: null,
          }));
        },

        addSplitPayment: (sessionId: string, method: PaymentMethod, amount: number) => {
          const paymentId = generatePaymentId();

          set((state) => {
            const splitPayment = state.splitPayments[sessionId];
            if (!splitPayment) {
              return { error: 'Split payment not initiated' };
            }

            if (amount > splitPayment.remainingAmount) {
              return { error: 'Payment amount exceeds remaining balance' };
            }

            const payment: PaymentTransaction = {
              id: paymentId,
              sessionId,
              method,
              amount,
              status: 'completed',
              timestamp: new Date(),
            };

            const newRemainingAmount = splitPayment.remainingAmount - amount;
            const updatedSplitPayment: SplitPayment = {
              ...splitPayment,
              transactions: [...splitPayment.transactions, payment],
              remainingAmount: newRemainingAmount,
              isComplete: newRemainingAmount <= 0,
            };

            return {
              splitPayments: {
                ...state.splitPayments,
                [sessionId]: updatedSplitPayment,
              },
              paymentHistory: [...state.paymentHistory, payment],
              error: null,
            };
          });

          return paymentId;
        },

        completeSplitPayment: (sessionId: string) => {
          set((state) => {
            const splitPayment = state.splitPayments[sessionId];
            if (!splitPayment || !splitPayment.isComplete) {
              return { error: 'Split payment not complete' };
            }

            const updatedSplitPayments = { ...state.splitPayments };
            delete updatedSplitPayments[sessionId];

            return {
              splitPayments: updatedSplitPayments,
              error: null,
            };
          });
        },

        // General actions
        cancelPayment: (paymentId: string) => {
          set((state) => {
            if (state.activePayment?.id === paymentId) {
              return {
                activePayment: null,
                isProcessing: false,
                error: null,
              };
            }

            // Handle cancelling payments in split payment scenarios
            const updatedSplitPayments = { ...state.splitPayments };
            for (const [sessionId, splitPayment] of Object.entries(updatedSplitPayments)) {
              const transactionIndex = splitPayment.transactions.findIndex(t => t.id === paymentId);
              if (transactionIndex !== -1) {
                const cancelledTransaction = splitPayment.transactions[transactionIndex];
                const updatedTransactions = splitPayment.transactions.filter(t => t.id !== paymentId);

                updatedSplitPayments[sessionId] = {
                  ...splitPayment,
                  transactions: updatedTransactions,
                  remainingAmount: splitPayment.remainingAmount + cancelledTransaction.amount,
                  isComplete: false,
                };
                break;
              }
            }

            return {
              splitPayments: updatedSplitPayments,
              error: null,
            };
          });
        },

        clearPaymentHistory: () => {
          set(() => ({
            paymentHistory: [],
          }));
        },

        getPaymentById: (paymentId: string) => {
          const state = get();
          return state.paymentHistory.find(p => p.id === paymentId) ||
                 state.activePayment?.id === paymentId ? state.activePayment : null;
        },

        getSessionPayments: (sessionId: string) => {
          const state = get();
          return state.paymentHistory.filter(p => p.sessionId === sessionId);
        },

        getSplitPayment: (sessionId: string) => {
          const state = get();
          return state.splitPayments[sessionId] || null;
        },
      }),
      {
        name: 'pos-payment-store',
        partialize: (state) => ({
          paymentHistory: state.paymentHistory,
          splitPayments: state.splitPayments,
        }),
      }
    ),
    {
      name: 'pos-payment-store',
    }
  )
);