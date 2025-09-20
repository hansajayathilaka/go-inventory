import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { DiscountCalculationEngine } from '@/services/pos/discountCalculationEngine';
import type {
  DiscountRule,
  DiscountEngineOptions,
  TransactionDiscountSummary
} from '@/types/pos/discount';
import type { CartItem } from '@/types/pos/cart';

interface DiscountState {
  engine: DiscountCalculationEngine;
  rules: DiscountRule[];
  isEngineEnabled: boolean;
}

interface DiscountActions {
  // Engine management
  updateEngineOptions: (options: Partial<DiscountEngineOptions>) => void;
  toggleEngine: (enabled: boolean) => void;

  // Rule management
  addRule: (rule: DiscountRule) => void;
  updateRule: (ruleId: string, updates: Partial<DiscountRule>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string, active: boolean) => void;
  clearRules: () => void;

  // Calculation methods
  calculateTransactionSummary: (
    cartItems: CartItem[],
    billDiscountAmount: number,
    taxRate: number
  ) => TransactionDiscountSummary;

  calculateOptimalDiscounts: (
    cartItems: CartItem[],
    taxRate: number
  ) => TransactionDiscountSummary;

  // Utility methods
  getActiveRules: () => DiscountRule[];
  getRuleById: (ruleId: string) => DiscountRule | undefined;
}

interface POSDiscountStore extends DiscountState, DiscountActions {}

// Default discount rules for common scenarios
const getDefaultRules = (): DiscountRule[] => [
  {
    id: 'bulk-discount-10',
    name: '10% Bulk Discount',
    type: 'percentage',
    value: 10,
    priority: 1,
    isActive: true,
    conditions: [
      {
        type: 'min_amount',
        value: 100,
        operator: 'greater_than'
      }
    ]
  },
  {
    id: 'bulk-discount-15',
    name: '15% Large Bulk Discount',
    type: 'percentage',
    value: 15,
    priority: 2,
    isActive: true,
    conditions: [
      {
        type: 'min_amount',
        value: 250,
        operator: 'greater_than'
      }
    ]
  },
  {
    id: 'quantity-discount',
    name: '5% Multi-Item Discount',
    type: 'percentage',
    value: 5,
    priority: 1,
    isActive: true,
    conditions: [
      {
        type: 'quantity',
        value: 5,
        operator: 'greater_than'
      }
    ]
  }
];

export const usePOSDiscountStore = create<POSDiscountStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        engine: new DiscountCalculationEngine(),
        rules: getDefaultRules(),
        isEngineEnabled: true,

        // Engine management
        updateEngineOptions: (options: Partial<DiscountEngineOptions>) => {
          set((state) => {
            state.engine.updateOptions(options);
            return { engine: state.engine };
          });
        },

        toggleEngine: (enabled: boolean) => {
          set({ isEngineEnabled: enabled });
        },

        // Rule management
        addRule: (rule: DiscountRule) => {
          set((state) => ({
            rules: [...state.rules, rule]
          }));
        },

        updateRule: (ruleId: string, updates: Partial<DiscountRule>) => {
          set((state) => ({
            rules: state.rules.map(rule =>
              rule.id === ruleId ? { ...rule, ...updates } : rule
            )
          }));
        },

        removeRule: (ruleId: string) => {
          set((state) => ({
            rules: state.rules.filter(rule => rule.id !== ruleId)
          }));
        },

        toggleRule: (ruleId: string, active: boolean) => {
          set((state) => ({
            rules: state.rules.map(rule =>
              rule.id === ruleId ? { ...rule, isActive: active } : rule
            )
          }));
        },

        clearRules: () => {
          set({ rules: [] });
        },

        // Calculation methods
        calculateTransactionSummary: (
          cartItems: CartItem[],
          billDiscountAmount: number,
          taxRate: number
        ) => {
          const state = get();
          if (!state.isEngineEnabled) {
            // Fallback to simple calculation
            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const lineItemDiscounts = cartItems.reduce((sum, item) => sum + item.lineDiscount, 0);
            const discountedSubtotal = Math.max(0, subtotal - lineItemDiscounts - billDiscountAmount);
            const taxAmount = discountedSubtotal * taxRate;
            const finalTotal = discountedSubtotal + taxAmount;

            return {
              subtotal,
              lineItemDiscounts,
              billLevelDiscounts: billDiscountAmount,
              totalDiscounts: lineItemDiscounts + billDiscountAmount,
              discountedSubtotal,
              taxAmount,
              finalTotal,
              appliedRules: []
            };
          }

          return state.engine.calculateTransactionSummary(
            cartItems,
            billDiscountAmount,
            taxRate,
            state.getActiveRules()
          );
        },

        calculateOptimalDiscounts: (cartItems: CartItem[], taxRate: number) => {
          const state = get();
          if (!state.isEngineEnabled) {
            return state.calculateTransactionSummary(cartItems, 0, taxRate);
          }

          return state.engine.calculateOptimalDiscounts(
            cartItems,
            state.getActiveRules(),
            taxRate
          );
        },

        // Utility methods
        getActiveRules: () => {
          return get().rules.filter(rule => rule.isActive);
        },

        getRuleById: (ruleId: string) => {
          return get().rules.find(rule => rule.id === ruleId);
        }
      }),
      {
        name: 'pos-discount-store',
        partialize: (state) => ({
          rules: state.rules,
          isEngineEnabled: state.isEngineEnabled
        }),
        // Don't persist the engine instance - it will be recreated
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.engine = new DiscountCalculationEngine();
          }
        }
      }
    ),
    {
      name: 'pos-discount-store'
    }
  )
);