import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CartItem, CartSummary, AddToCartParams, UpdateCartItemParams, CartActions } from '@/types/pos/cart';

interface CartState {
  sessionCarts: Record<string, CartItem[]>;
  sessionDiscounts: Record<string, number>; // Bill-level discounts per session
  taxRate: number;
}

interface POSCartStore extends CartState, CartActions {}

const generateCartItemId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const calculateCartSummary = (items: CartItem[], billDiscount: number, taxRate: number): CartSummary => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lineDiscounts = items.reduce((sum, item) => sum + item.lineDiscount, 0);
  const discountedSubtotal = subtotal - lineDiscounts;
  const totalDiscountAmount = lineDiscounts + billDiscount;
  const finalSubtotal = Math.max(0, discountedSubtotal - billDiscount);
  const taxAmount = finalSubtotal * taxRate;
  const total = finalSubtotal + taxAmount;

  return {
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal,
    discountAmount: totalDiscountAmount,
    taxAmount,
    total,
  };
};

export const usePOSCartStore = create<POSCartStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessionCarts: {},
        sessionDiscounts: {},
        taxRate: 0.08, // 8% tax rate

        // Actions
        addItem: (sessionId: string, item: AddToCartParams) => {
          const itemId = generateCartItemId();
          const quantity = item.quantity || 1;

          const cartItem: CartItem = {
            id: itemId,
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            price: item.price,
            quantity,
            lineDiscount: 0,
            lineTotal: item.price * quantity,
            addedAt: new Date(),
          };

          set((state) => ({
            sessionCarts: {
              ...state.sessionCarts,
              [sessionId]: [...(state.sessionCarts[sessionId] || []), cartItem],
            },
          }));

          return itemId;
        },

        removeItem: (sessionId: string, itemId: string) => {
          set((state) => {
            const currentCart = state.sessionCarts[sessionId] || [];
            const updatedCart = currentCart.filter(item => item.id !== itemId);

            return {
              sessionCarts: {
                ...state.sessionCarts,
                [sessionId]: updatedCart,
              },
            };
          });
        },

        updateItem: (sessionId: string, itemId: string, updates: UpdateCartItemParams) => {
          set((state) => {
            const currentCart = state.sessionCarts[sessionId] || [];
            const updatedCart = currentCart.map(item => {
              if (item.id !== itemId) return item;

              const updatedItem = { ...item };
              if (updates.quantity !== undefined) {
                updatedItem.quantity = Math.max(0, updates.quantity);
              }
              if (updates.lineDiscount !== undefined) {
                updatedItem.lineDiscount = Math.max(0, updates.lineDiscount);
              }

              // Recalculate line total
              updatedItem.lineTotal = (updatedItem.price * updatedItem.quantity) - updatedItem.lineDiscount;

              return updatedItem;
            });

            return {
              sessionCarts: {
                ...state.sessionCarts,
                [sessionId]: updatedCart,
              },
            };
          });
        },

        clearCart: (sessionId: string) => {
          set((state) => ({
            sessionCarts: {
              ...state.sessionCarts,
              [sessionId]: [],
            },
            sessionDiscounts: {
              ...state.sessionDiscounts,
              [sessionId]: 0,
            },
          }));
        },

        getCartItems: (sessionId: string) => {
          return get().sessionCarts[sessionId] || [];
        },

        getCartSummary: (sessionId: string) => {
          const state = get();
          const items = state.sessionCarts[sessionId] || [];
          const billDiscount = state.sessionDiscounts[sessionId] || 0;
          return calculateCartSummary(items, billDiscount, state.taxRate);
        },

        applyBillDiscount: (sessionId: string, discountAmount: number) => {
          set((state) => ({
            sessionDiscounts: {
              ...state.sessionDiscounts,
              [sessionId]: Math.max(0, discountAmount),
            },
          }));
        },
      }),
      {
        name: 'pos-cart-store',
        partialize: (state) => ({
          sessionCarts: state.sessionCarts,
          sessionDiscounts: state.sessionDiscounts,
          taxRate: state.taxRate,
        }),
      }
    ),
    {
      name: 'pos-cart-store',
    }
  )
);