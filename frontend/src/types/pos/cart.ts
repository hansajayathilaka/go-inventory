// Shopping Cart Types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  price: number;
  quantity: number;
  lineDiscount: number;
  lineTotal: number;
  addedAt: Date;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface AddToCartParams {
  productId: string;
  productName: string;
  productSku: string;
  price: number;
  quantity?: number;
}

export interface UpdateCartItemParams {
  quantity?: number;
  lineDiscount?: number;
}

export interface CartActions {
  addItem: (sessionId: string, item: AddToCartParams) => string;
  removeItem: (sessionId: string, itemId: string) => void;
  updateItem: (sessionId: string, itemId: string, updates: UpdateCartItemParams) => void;
  clearCart: (sessionId: string) => void;
  getCartItems: (sessionId: string) => CartItem[];
  getCartSummary: (sessionId: string) => CartSummary;
  applyBillDiscount: (sessionId: string, discountAmount: number) => void;
}