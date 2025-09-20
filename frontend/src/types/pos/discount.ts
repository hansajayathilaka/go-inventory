// Discount System Types

export type DiscountType = 'percentage' | 'fixed';

export interface LineItemDiscount {
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  appliedAmount: number; // Calculated discount amount
}

export interface BillDiscount {
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  appliedAmount: number; // Calculated discount amount
  reason?: string; // Optional reason for discount
}

export interface DiscountCalculation {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface DiscountValidation {
  isValid: boolean;
  errorMessage?: string;
  maxAllowedValue?: number;
}

export interface DiscountPreview {
  lineItemDiscounts: Record<string, DiscountCalculation>; // itemId -> calculation
  billDiscountCalculation: DiscountCalculation;
  totalSavings: number;
  finalTotal: number;
}