import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Product } from '@/types/inventory';
import { getDisplayPrice, getStockQuantity } from '@/utils/productUtils';
import { usePOSSessionStore } from './posSessionStore';

// Note: Removed batchCartUpdates to fix infinite loop issues

// Cart-specific interfaces
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  maxQuantity?: number; // Stock limit
}

export interface CartDiscount {
  amount: number;
  type: 'fixed' | 'percentage';
}

export interface POSCartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number; // Configurable, default 10%
  discount: number;
  discountConfig?: CartDiscount;
  total: number;
  itemCount: number;
  sessionId: string;
  
  // Actions
  addItem: (product: Product, quantity?: number) => Promise<boolean>;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  applyDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
  removeDiscount: () => void;
  clearCart: () => void;
  validateStock: () => Promise<boolean>;
  calculateTotals: () => void;
  loadFromSession: (sessionData: unknown) => void;
  getCurrentSessionId: () => string | null;
  clearCurrentSession: () => void;
  
  // Internal methods
  _findItemIndex: (productId: string) => number;
  _createSessionId: () => string;
}

// Helper function to generate session ID
const generateSessionId = (): string => {
  return `pos_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Helper function to validate quantity against stock
const validateQuantityAgainstStock = (product: Product, requestedQuantity: number): boolean => {
  if (!product.is_active) {
    console.warn(`Product ${product.name} is not active`);
    return false;
  }
  
  if (getStockQuantity(product) < requestedQuantity) {
    console.warn(`Insufficient stock for ${product.name}. Available: ${getStockQuantity(product)}, Requested: ${requestedQuantity}`);
    return false;
  }
  
  return true;
};

// Performance optimized helper functions with memoization
const itemTotalCache = new Map<string, number>();

const calculateItemTotal = (unitPrice: number, quantity: number, discount = 0): number => {
  const cacheKey = `${unitPrice}_${quantity}_${discount}`;
  
  if (itemTotalCache.has(cacheKey)) {
    return itemTotalCache.get(cacheKey)!;
  }
  
  const subtotal = unitPrice * quantity;
  const total = subtotal - discount;
  
  // Cache result for future use
  itemTotalCache.set(cacheKey, total);
  
  // Limit cache size to prevent memory leaks
  if (itemTotalCache.size > 1000) {
    const firstKey = itemTotalCache.keys().next().value;
    if (firstKey !== undefined) {
      itemTotalCache.delete(firstKey);
    }
  }
  
  return total;
};

// Memoized tax calculation service
const taxCalculationCache = new Map<string, number>();

const calculateTaxAmount = (taxableAmount: number, taxRate: number): number => {
  const cacheKey = `${taxableAmount.toFixed(2)}_${taxRate}`;
  
  if (taxCalculationCache.has(cacheKey)) {
    return taxCalculationCache.get(cacheKey)!;
  }
  
  const taxAmount = taxableAmount * taxRate;
  
  taxCalculationCache.set(cacheKey, taxAmount);
  
  // Limit cache size
  if (taxCalculationCache.size > 500) {
    const firstKey = taxCalculationCache.keys().next().value;
    if (firstKey !== undefined) {
      taxCalculationCache.delete(firstKey);
    }
  }
  
  return taxAmount;
};

// Optimized discount calculation for bulk operations
const calculateDiscountAmount = (subtotal: number, discountConfig?: CartDiscount): number => {
  if (!discountConfig) return 0;
  
  if (discountConfig.type === 'fixed') {
    return Math.min(discountConfig.amount, subtotal);
  } else {
    return (subtotal * discountConfig.amount) / 100;
  }
};

export const usePOSCartStore = create<POSCartState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        items: [],
        subtotal: 0,
        tax: 0,
        taxRate: 0.10, // 10% default tax rate
        discount: 0,
        discountConfig: undefined,
        total: 0,
        itemCount: 0,
        sessionId: generateSessionId(),

      // Add item to cart
      addItem: async (product: Product, quantity = 1): Promise<boolean> => {
        const state = get();
        
        // Validate stock
        if (!validateQuantityAgainstStock(product, quantity)) {
          return false;
        }
        
        const existingItemIndex = state._findItemIndex(product.id || 'unknown');
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const existingItem = state.items[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;
          
          // Check if new quantity exceeds stock
          if (!validateQuantityAgainstStock(product, newQuantity)) {
            return false;
          }
          
          const updatedItems = [...state.items];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: calculateItemTotal(existingItem.unitPrice, newQuantity, existingItem.discount),
            maxQuantity: getStockQuantity(product)
          };
          
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            product,
            quantity,
            unitPrice: getDisplayPrice(product),
            totalPrice: calculateItemTotal(getDisplayPrice(product), quantity),
            maxQuantity: getStockQuantity(product)
          };
          
          set({ items: [...state.items, newItem] });
        }
        
        // Recalculate totals immediately without batching to prevent loops
        get().calculateTotals();
        return true;
      },

      // Remove item from cart
      removeItem: (productId: string) => {
        const state = get();
        const filteredItems = state.items.filter(item => item.product.id !== productId);
        set({ items: filteredItems });
        get().calculateTotals();
      },

      // Update item quantity
      updateQuantity: async (productId: string, quantity: number): Promise<boolean> => {
        const state = get();
        const itemIndex = state._findItemIndex(productId || 'unknown');
        
        if (itemIndex < 0) {
          console.warn(`Item with product ID ${productId} not found in cart`);
          return false;
        }
        
        const item = state.items[itemIndex];
        
        // If quantity is 0 or negative, remove item
        if (quantity <= 0) {
          state.removeItem(productId);
          return true;
        }
        
        // Validate stock
        if (!validateQuantityAgainstStock(item.product, quantity)) {
          return false;
        }
        
        const updatedItems = [...state.items];
        updatedItems[itemIndex] = {
          ...item,
          quantity,
          totalPrice: calculateItemTotal(item.unitPrice, quantity, item.discount),
          maxQuantity: getStockQuantity(item.product)
        };
        
        set({ items: updatedItems });
        get().calculateTotals();
        return true;
      },

      // Apply discount to cart
      applyDiscount: (amount: number, type: 'fixed' | 'percentage') => {
        if (amount < 0) {
          console.warn('Discount amount cannot be negative');
          return;
        }
        
        if (type === 'percentage' && amount > 100) {
          console.warn('Percentage discount cannot exceed 100%');
          return;
        }
        
        set({
          discountConfig: { amount, type }
        });
        
        get().calculateTotals();
      },

      // Remove discount
      removeDiscount: () => {
        set({
          discountConfig: undefined,
          discount: 0
        });
        get().calculateTotals();
      },

      // Clear entire cart
      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          discountConfig: undefined,
          total: 0,
          itemCount: 0,
          sessionId: generateSessionId() // Generate new session ID
        });
      },

      // Validate all items against current stock
      validateStock: async (): Promise<boolean> => {
        const state = get();
        
        for (const item of state.items) {
          if (!validateQuantityAgainstStock(item.product, item.quantity)) {
            return false;
          }
        }
        
        return true;
      },

      // Performance optimized total calculations with memoization
      calculateTotals: () => {
        const state = get();
        
        // Early return if no items
        if (state.items.length === 0) {
          const emptyState = {
            subtotal: 0,
            discount: 0,
            tax: 0,
            total: 0,
            itemCount: 0
          };
          set(emptyState);
          return;
        }
        
        // Memoized subtotal calculation
        const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Optimized discount calculation
        const discountAmount = calculateDiscountAmount(subtotal, state.discountConfig);
        
        // Calculate taxable amount
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        
        // Memoized tax calculation
        const taxAmount = calculateTaxAmount(taxableAmount, state.taxRate);
        
        // Calculate final total
        const total = taxableAmount + taxAmount;
        
        // Optimized item count calculation
        const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Batch state update
        const newState = {
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total,
          itemCount
        };
        
        set(newState);

        // Async session sync with performance optimization (but avoid during calculation)
        // Note: Removed session sync from calculateTotals to prevent circular updates
      },

      // Internal method to find item index
      _findItemIndex: (productId: string): number => {
        const state = get();
        return state.items.findIndex(item => item.product.id === productId);
      },

      // Internal method to create session ID
      _createSessionId: generateSessionId,

      // Load cart from session
      loadFromSession: (sessionData: unknown) => {
        if (sessionData && typeof sessionData === 'object' && sessionData !== null) {
          const data = sessionData as Record<string, unknown>;
          const cartItems = Array.isArray(data.cartItems) ? data.cartItems : [];
          
          set({
            items: cartItems,
            subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
            tax: typeof data.tax === 'number' ? data.tax : 0,
            discount: typeof data.discount === 'number' ? data.discount : 0,
            total: typeof data.total === 'number' ? data.total : 0,
            itemCount: cartItems.reduce((sum: number, item: unknown) => {
              if (item && typeof item === 'object' && 'quantity' in item) {
                const quantity = (item as { quantity: unknown }).quantity;
                return typeof quantity === 'number' ? sum + quantity : sum;
              }
              return sum;
            }, 0),
            sessionId: typeof data.id === 'string' ? data.id : generateSessionId()
          });
        }
      },

      // Get current session ID
      getCurrentSessionId: () => {
        const sessionStore = usePOSSessionStore.getState();
        return sessionStore.activeSessionId || get().sessionId;
      },

      // Clear cart for current session only
      clearCurrentSession: () => {
        const sessionStore = usePOSSessionStore.getState();
        const activeSessionId = sessionStore.activeSessionId;
        
        if (activeSessionId) {
          // Clear session cart data
          sessionStore.updateSessionCart(activeSessionId, [], 0, 0, 0, 0);
          
          // Clear local cart state
          set({
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            discountConfig: undefined,
            total: 0,
            itemCount: 0
          });
        }
      },
    }),
    {
      name: 'pos-cart-storage', // Storage key
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      },
      // Performance optimized rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear caches on rehydration for fresh start
          itemTotalCache.clear();
          taxCalculationCache.clear();
          
          // Calculate totals immediately after rehydration
          if (state.calculateTotals) {
            state.calculateTotals();
          }
        }
      },
    }
    )
  )
);

// Performance optimized hooks with selective subscriptions

// Memoized hook for cart totals - only re-renders when totals change
export const useCartTotals = () => {
  const subtotal = usePOSCartStore((state) => state.subtotal);
  const tax = usePOSCartStore((state) => state.tax);
  const taxRate = usePOSCartStore((state) => state.taxRate);
  const discount = usePOSCartStore((state) => state.discount);
  const total = usePOSCartStore((state) => state.total);
  const itemCount = usePOSCartStore((state) => state.itemCount);

  return useMemo(() => ({
    subtotal,
    tax,
    taxRate,
    discount,
    total,
    itemCount,
  }), [subtotal, tax, taxRate, discount, total, itemCount]);
};

// Memoized hook for cart actions - properly memoized to prevent re-renders
export const useCartActions = () => {
  const addItem = usePOSCartStore((state) => state.addItem);
  const removeItem = usePOSCartStore((state) => state.removeItem);
  const updateQuantity = usePOSCartStore((state) => state.updateQuantity);
  const applyDiscount = usePOSCartStore((state) => state.applyDiscount);
  const removeDiscount = usePOSCartStore((state) => state.removeDiscount);
  const clearCart = usePOSCartStore((state) => state.clearCart);
  const validateStock = usePOSCartStore((state) => state.validateStock);

  return useMemo(() => ({
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    removeDiscount,
    clearCart,
    validateStock,
  }), [addItem, removeItem, updateQuantity, applyDiscount, removeDiscount, clearCart, validateStock]);
};

// Optimized hook for cart items - only re-renders when items array changes
export const useCartItems = () => {
  return usePOSCartStore((state) => state.items);
};

// Performance monitoring hook for debugging
export const useCartPerformance = () => {
  const itemCount = usePOSCartStore((state) => state.items.length);
  const totalValue = usePOSCartStore((state) => state.total);

  return useMemo(() => ({
    itemCount,
    totalValue,
  }), [itemCount, totalValue]);
};

// Performance optimized session synchronization
export const synchronizeCartWithSession = () => {
  console.log('Cart-session sync initialized (performance optimized)');
  
  // Use batched updates for session sync
  let syncTimeout: NodeJS.Timeout;
  
  const unsubscribe = usePOSCartStore.subscribe(
    (state) => ({
      items: state.items,
      totals: {
        subtotal: state.subtotal,
        tax: state.tax,
        discount: state.discount,
        total: state.total
      }
    }),
    (state) => {
      // Debounce session sync to improve performance
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        try {
          const sessionStore = usePOSSessionStore.getState();
          const activeSessionId = sessionStore.activeSessionId;
          if (activeSessionId && state.items.length > 0) {
            sessionStore.updateSessionCart(
              activeSessionId,
              state.items,
              state.totals.subtotal,
              state.totals.tax,
              state.totals.discount,
              state.totals.total
            );
          }
        } catch (error) {
          console.warn('Failed to sync cart with session store:', error);
        }
      }, 200); // 200ms debounce for session sync
    },
    {
      equalityFn: (a, b) => {
        // Only sync when meaningful changes occur
        return a.items.length === b.items.length &&
               a.totals.total === b.totals.total;
      }
    }
  );
  
  return () => {
    clearTimeout(syncTimeout);
    unsubscribe();
  };
};

// Initialize performance optimized session-cart synchronization
export const initializeCartSessionSync = () => {
  return synchronizeCartWithSession();
};

// Performance utilities
export const clearCartCaches = () => {
  itemTotalCache.clear();
  taxCalculationCache.clear();
  console.log('Cart calculation caches cleared');
};

export const getCartCacheStats = () => {
  return {
    itemTotalCacheSize: itemTotalCache.size,
    taxCalculationCacheSize: taxCalculationCache.size,
    // Removed update queue stats since batching was removed
  };
};