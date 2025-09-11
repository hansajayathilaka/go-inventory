import { create } from 'zustand';
import type { Product } from '@/types/inventory';

// Basic cart item interface
export interface BasicCartItem {
  id: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  total: number;
  stock: number;
}

// Basic cart state
interface BasicCartState {
  items: BasicCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Basic cart actions
interface BasicCartActions {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

type BasicCartStore = BasicCartState & BasicCartActions;

// Create basic cart store
export const useBasicCartStore = create<BasicCartStore>((set, get) => ({
  // Initial state
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,

  // Add item action
  addItem: (product: Product, quantity = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex(item => item.id === product.id);
    
    let newItems: BasicCartItem[];
    
    if (existingIndex >= 0) {
      // Update existing item
      newItems = items.map((item, index) => 
        index === existingIndex 
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              total: (item.quantity + quantity) * item.price
            }
          : item
      );
    } else {
      // Add new item
      const newItem: BasicCartItem = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity,
        total: product.price * quantity,
        stock: product.stock_quantity
      };
      newItems = [...items, newItem];
    }

    // Calculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

    // Update state
    set({
      items: newItems,
      subtotal,
      tax,
      total,
      itemCount
    });
  },

  // Remove item action
  removeItem: (productId: string) => {
    const { items } = get();
    const newItems = items.filter(item => item.id !== productId);
    
    // Calculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

    set({
      items: newItems,
      subtotal,
      tax,
      total,
      itemCount
    });
  },

  // Update quantity action
  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const { items } = get();
    const newItems = items.map(item => 
      item.id === productId 
        ? { ...item, quantity, total: item.price * quantity }
        : item
    );

    // Calculate totals
    const subtotal = newItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

    set({
      items: newItems,
      subtotal,
      tax,
      total,
      itemCount
    });
  },

  // Clear cart action
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

// Basic hooks with direct property access
export const useCartItems = () => useBasicCartStore(state => state.items);
export const useCartSubtotal = () => useBasicCartStore(state => state.subtotal);
export const useCartTax = () => useBasicCartStore(state => state.tax);
export const useCartTotal = () => useBasicCartStore(state => state.total);
export const useCartItemCount = () => useBasicCartStore(state => state.itemCount);
export const useAddItem = () => useBasicCartStore(state => state.addItem);
export const useRemoveItem = () => useBasicCartStore(state => state.removeItem);
export const useUpdateQuantity = () => useBasicCartStore(state => state.updateQuantity);
export const useClearCart = () => useBasicCartStore(state => state.clearCart);