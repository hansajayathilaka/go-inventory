import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types/inventory';

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
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => Promise<boolean>;
  applyDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
  removeDiscount: () => void;
  clearCart: () => void;
  validateStock: () => Promise<boolean>;
  calculateTotals: () => void;
  
  // Internal methods
  _findItemIndex: (productId: number) => number;
  _createSessionId: () => string;
}

// Helper function to generate session ID
const generateSessionId = (): string => {
  return `pos_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to validate quantity against stock
const validateQuantityAgainstStock = (product: Product, requestedQuantity: number): boolean => {
  if (!product.is_active) {
    console.warn(`Product ${product.name} is not active`);
    return false;
  }
  
  if (product.stock_quantity < requestedQuantity) {
    console.warn(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${requestedQuantity}`);
    return false;
  }
  
  return true;
};

// Helper function to calculate item total
const calculateItemTotal = (unitPrice: number, quantity: number, discount = 0): number => {
  const subtotal = unitPrice * quantity;
  return subtotal - discount;
};

export const usePOSCartStore = create<POSCartState>()(
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
        
        const existingItemIndex = state._findItemIndex(product.id);
        
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
            maxQuantity: product.stock_quantity
          };
          
          set({ items: updatedItems });
        } else {
          // Add new item
          const newItem: CartItem = {
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: calculateItemTotal(product.price, quantity),
            maxQuantity: product.stock_quantity
          };
          
          set({ items: [...state.items, newItem] });
        }
        
        // Recalculate totals
        get().calculateTotals();
        return true;
      },

      // Remove item from cart
      removeItem: (productId: number) => {
        const state = get();
        const filteredItems = state.items.filter(item => item.product.id !== productId);
        set({ items: filteredItems });
        get().calculateTotals();
      },

      // Update item quantity
      updateQuantity: async (productId: number, quantity: number): Promise<boolean> => {
        const state = get();
        const itemIndex = state._findItemIndex(productId);
        
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
          maxQuantity: item.product.stock_quantity
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

      // Calculate all totals
      calculateTotals: () => {
        const state = get();
        
        // Calculate subtotal
        const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
        
        // Calculate discount amount
        let discountAmount = 0;
        if (state.discountConfig) {
          if (state.discountConfig.type === 'fixed') {
            discountAmount = Math.min(state.discountConfig.amount, subtotal);
          } else {
            discountAmount = (subtotal * state.discountConfig.amount) / 100;
          }
        }
        
        // Calculate taxable amount
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        
        // Calculate tax
        const taxAmount = taxableAmount * state.taxRate;
        
        // Calculate final total
        const total = taxableAmount + taxAmount;
        
        // Calculate item count
        const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
        
        set({
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total,
          itemCount
        });
      },

      // Internal method to find item index
      _findItemIndex: (productId: number): number => {
        const state = get();
        return state.items.findIndex(item => item.product.id === productId);
      },

      // Internal method to create session ID
      _createSessionId: generateSessionId,
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
      // Restore computed values after hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.calculateTotals();
        }
      },
    }
  )
);

// Hook for easy access to cart totals
export const useCartTotals = () => {
  return usePOSCartStore((state) => ({
    subtotal: state.subtotal,
    tax: state.tax,
    taxRate: state.taxRate,
    discount: state.discount,
    total: state.total,
    itemCount: state.itemCount,
  }));
};

// Hook for cart actions
export const useCartActions = () => {
  return usePOSCartStore((state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
    applyDiscount: state.applyDiscount,
    removeDiscount: state.removeDiscount,
    clearCart: state.clearCart,
    validateStock: state.validateStock,
  }));
};

// Hook for cart items
export const useCartItems = () => {
  return usePOSCartStore((state) => state.items);
};