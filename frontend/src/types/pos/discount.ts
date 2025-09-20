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

export interface DiscountRule {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  priority: number; // Higher priority applies first
  isActive: boolean;
  conditions?: DiscountCondition[];
}

export interface DiscountCondition {
  type: 'min_amount' | 'max_amount' | 'category' | 'product' | 'quantity';
  value: number | string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface TransactionDiscountSummary {
  subtotal: number;
  lineItemDiscounts: number;
  billLevelDiscounts: number;
  totalDiscounts: number;
  discountedSubtotal: number;
  taxAmount: number;
  finalTotal: number;
  appliedRules: DiscountRule[];
}

export interface DiscountEngineOptions {
  maxDiscountPercentage: number; // Maximum total discount allowed (e.g., 95%)
  allowStacking: boolean; // Whether multiple discounts can be stacked
  taxAfterDiscount: boolean; // Whether tax is calculated after discounts
  roundingPrecision: number; // Decimal places for rounding
}