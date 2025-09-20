import type {
  DiscountType,
  DiscountCalculation,
  DiscountValidation,
  LineItemDiscount,
  BillDiscount
} from '@/types/pos/discount';

export class POSDiscountService {
  // Validate discount input
  static validateDiscount(
    type: DiscountType,
    value: number,
    originalAmount: number
  ): DiscountValidation {
    if (value < 0) {
      return {
        isValid: false,
        errorMessage: 'Discount value cannot be negative'
      };
    }

    if (type === 'percentage') {
      if (value > 100) {
        return {
          isValid: false,
          errorMessage: 'Percentage discount cannot exceed 100%',
          maxAllowedValue: 100
        };
      }
    } else if (type === 'fixed') {
      if (value > originalAmount) {
        return {
          isValid: false,
          errorMessage: 'Fixed discount cannot exceed item total',
          maxAllowedValue: originalAmount
        };
      }
    }

    return { isValid: true };
  }

  // Calculate discount amount
  static calculateDiscount(
    type: DiscountType,
    value: number,
    originalAmount: number
  ): DiscountCalculation {
    let discountAmount = 0;

    if (type === 'percentage') {
      discountAmount = (originalAmount * value) / 100;
    } else if (type === 'fixed') {
      discountAmount = Math.min(value, originalAmount);
    }

    discountAmount = Math.max(0, discountAmount);
    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return {
      originalAmount,
      discountAmount,
      finalAmount
    };
  }

  // Calculate line item discount
  static calculateLineItemDiscount(
    discount: LineItemDiscount,
    itemPrice: number,
    quantity: number
  ): DiscountCalculation {
    const lineTotal = itemPrice * quantity;
    return this.calculateDiscount(discount.type, discount.value, lineTotal);
  }

  // Calculate bill-level discount
  static calculateBillDiscount(
    discount: BillDiscount,
    subtotalAfterLineDiscounts: number
  ): DiscountCalculation {
    return this.calculateDiscount(discount.type, discount.value, subtotalAfterLineDiscounts);
  }

  // Format discount display text
  static formatDiscountDisplay(type: DiscountType, value: number): string {
    if (type === 'percentage') {
      return `${value}% OFF`;
    } else {
      return `$${value.toFixed(2)} OFF`;
    }
  }

  // Parse discount input string (e.g., "15%" or "$10.50")
  static parseDiscountInput(input: string): { type: DiscountType; value: number } | null {
    const trimmed = input.trim();

    // Check for percentage
    if (trimmed.endsWith('%')) {
      const numStr = trimmed.slice(0, -1);
      const value = parseFloat(numStr);
      if (!isNaN(value)) {
        return { type: 'percentage', value };
      }
    }

    // Check for fixed amount
    if (trimmed.startsWith('$')) {
      const numStr = trimmed.slice(1);
      const value = parseFloat(numStr);
      if (!isNaN(value)) {
        return { type: 'fixed', value };
      }
    }

    // Try to parse as plain number (assume percentage if < 1, fixed if >= 1)
    const value = parseFloat(trimmed);
    if (!isNaN(value)) {
      if (value <= 1) {
        return { type: 'percentage', value: value * 100 };
      } else if (value <= 100) {
        return { type: 'percentage', value };
      } else {
        return { type: 'fixed', value };
      }
    }

    return null;
  }
}