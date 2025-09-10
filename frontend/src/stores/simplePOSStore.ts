import { create } from 'zustand';
import type { Product } from '@/types/inventory';

// Simplified cart item interface
export interface SimpleCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Simplified POS store state
export interface SimplePOSState {
  items: SimpleCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

// Helper function to calculate totals
const calculateTotals = (items: SimpleCartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { subtotal, tax, total, itemCount };
};

// Create the simplified store
export const useSimplePOSStore = create<SimplePOSState>((set, get) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,

  addItem: (product: Product, quantity = 1) => {
    const state = get();
    const existingItemIndex = state.items.findIndex(item => item.product.id === product.id);
    
    let newItems: SimpleCartItem[];
    
    if (existingItemIndex >= 0) {
      // Update existing item
      newItems = [...state.items];
      const existingItem = newItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: existingItem.unitPrice * newQuantity
      };
    } else {
      // Add new item
      const newItem: SimpleCartItem = {
        product,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity
      };
      newItems = [...state.items, newItem];
    }
    
    // Calculate new totals
    const totals = calculateTotals(newItems);
    
    set({
      items: newItems,
      ...totals
    });
  },

  removeItem: (productId: number) => {
    const state = get();
    const newItems = state.items.filter(item => item.product.id !== productId);
    const totals = calculateTotals(newItems);
    
    set({
      items: newItems,
      ...totals
    });
  },

  updateQuantity: (productId: number, quantity: number) => {
    const state = get();
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      get().removeItem(productId);
      return;
    }
    
    const newItems = state.items.map(item => 
      item.product.id === productId 
        ? {
            ...item,
            quantity,
            totalPrice: item.unitPrice * quantity
          }
        : item
    );
    
    const totals = calculateTotals(newItems);
    
    set({
      items: newItems,
      ...totals
    });
  },

  clearCart: () => {
    set({
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0
    });
  }
}));

// Stable selector functions to prevent infinite loops
const itemsSelector = (state: SimplePOSState) => state.items;
const subtotalSelector = (state: SimplePOSState) => state.subtotal;
const taxSelector = (state: SimplePOSState) => state.tax;
const totalSelector = (state: SimplePOSState) => state.total;
const itemCountSelector = (state: SimplePOSState) => state.itemCount;
const addItemSelector = (state: SimplePOSState) => state.addItem;
const removeItemSelector = (state: SimplePOSState) => state.removeItem;
const updateQuantitySelector = (state: SimplePOSState) => state.updateQuantity;
const clearCartSelector = (state: SimplePOSState) => state.clearCart;

// Simple hooks for accessing cart state with stable selectors
export const useSimpleCartItems = () => {
  return useSimplePOSStore(itemsSelector);
};

export const useSimpleCartSubtotal = () => {
  return useSimplePOSStore(subtotalSelector);
};

export const useSimpleCartTax = () => {
  return useSimplePOSStore(taxSelector);
};

export const useSimpleCartTotal = () => {
  return useSimplePOSStore(totalSelector);
};

export const useSimpleCartItemCount = () => {
  return useSimplePOSStore(itemCountSelector);
};

// Individual action hooks to prevent object recreation
export const useSimpleAddItem = () => {
  return useSimplePOSStore(addItemSelector);
};

export const useSimpleRemoveItem = () => {
  return useSimplePOSStore(removeItemSelector);
};

export const useSimpleUpdateQuantity = () => {
  return useSimplePOSStore(updateQuantitySelector);
};

export const useSimpleClearCart = () => {
  return useSimplePOSStore(clearCartSelector);
};