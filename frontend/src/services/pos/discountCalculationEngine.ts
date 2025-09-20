import type { CartItem } from '@/types/pos/cart';
import type {
  DiscountType,
  DiscountCalculation,
  DiscountValidation,
  DiscountRule,
  DiscountCondition,
  TransactionDiscountSummary,
  DiscountEngineOptions
} from '@/types/pos/discount';

/**
 * Advanced discount calculation engine for POS system
 * Handles complex discount scenarios, stacking, validation, and comprehensive calculations
 */
export class DiscountCalculationEngine {
  private options: DiscountEngineOptions;

  constructor(options?: Partial<DiscountEngineOptions>) {
    this.options = {
      maxDiscountPercentage: 95,
      allowStacking: true,
      taxAfterDiscount: true,
      roundingPrecision: 2,
      ...options
    };
  }

  /**
   * Calculate comprehensive transaction summary with all discounts applied
   */
  calculateTransactionSummary(
    cartItems: CartItem[],
    billDiscountAmount: number,
    taxRate: number,
    appliedRules: DiscountRule[] = []
  ): TransactionDiscountSummary {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calculate line item discounts
    const lineItemDiscounts = cartItems.reduce((sum, item) => sum + item.lineDiscount, 0);

    // Calculate discounted subtotal
    const discountedSubtotal = Math.max(0, subtotal - lineItemDiscounts - billDiscountAmount);

    // Calculate tax (after discounts if configured)
    const taxAmount = this.options.taxAfterDiscount
      ? discountedSubtotal * taxRate
      : subtotal * taxRate;

    // Calculate final total
    const finalTotal = discountedSubtotal + taxAmount;

    // Total discounts
    const totalDiscounts = lineItemDiscounts + billDiscountAmount;

    return this.roundValues({
      subtotal,
      lineItemDiscounts,
      billLevelDiscounts: billDiscountAmount,
      totalDiscounts,
      discountedSubtotal,
      taxAmount,
      finalTotal,
      appliedRules
    });
  }

  /**
   * Validate if a discount can be applied
   */
  validateDiscount(
    type: DiscountType,
    value: number,
    originalAmount: number,
    currentDiscounts: number = 0
  ): DiscountValidation {
    // Basic validation
    if (value < 0) {
      return {
        isValid: false,
        errorMessage: 'Discount value cannot be negative'
      };
    }

    // Calculate potential discount amount
    let discountAmount = 0;
    if (type === 'percentage') {
      if (value > 100) {
        return {
          isValid: false,
          errorMessage: 'Percentage discount cannot exceed 100%',
          maxAllowedValue: 100
        };
      }
      discountAmount = (originalAmount * value) / 100;
    } else if (type === 'fixed') {
      if (value > originalAmount) {
        return {
          isValid: false,
          errorMessage: 'Fixed discount cannot exceed item total',
          maxAllowedValue: originalAmount
        };
      }
      discountAmount = value;
    }

    // Check maximum discount percentage
    const totalDiscountPercentage = ((currentDiscounts + discountAmount) / originalAmount) * 100;
    if (totalDiscountPercentage > this.options.maxDiscountPercentage) {
      return {
        isValid: false,
        errorMessage: `Total discount cannot exceed ${this.options.maxDiscountPercentage}%`,
        maxAllowedValue: (originalAmount * this.options.maxDiscountPercentage / 100) - currentDiscounts
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate discount amount with advanced logic
   */
  calculateDiscount(
    type: DiscountType,
    value: number,
    originalAmount: number,
    stackedDiscounts: number = 0
  ): DiscountCalculation {
    let discountAmount = 0;
    const baseAmount = Math.max(0, originalAmount - stackedDiscounts);

    if (type === 'percentage') {
      discountAmount = (baseAmount * value) / 100;
    } else if (type === 'fixed') {
      discountAmount = Math.min(value, baseAmount);
    }

    discountAmount = Math.max(0, discountAmount);
    const finalAmount = Math.max(0, originalAmount - stackedDiscounts - discountAmount);

    return this.roundCalculation({
      originalAmount,
      discountAmount,
      finalAmount
    });
  }

  /**
   * Apply multiple discount rules to a transaction
   */
  applyDiscountRules(
    cartItems: CartItem[],
    rules: DiscountRule[],
    taxRate: number
  ): TransactionDiscountSummary {
    // Sort rules by priority (highest first)
    const sortedRules = rules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    const appliedRules: DiscountRule[] = [];
    let totalBillDiscount = 0;

    // Apply each rule
    for (const rule of sortedRules) {
      if (this.evaluateRuleConditions(rule, cartItems)) {
        if (rule.type === 'percentage' || rule.type === 'fixed') {
          const currentSubtotal = cartItems.reduce((sum, item) =>
            sum + (item.price * item.quantity) - item.lineDiscount, 0);

          const validation = this.validateDiscount(
            rule.type,
            rule.value,
            currentSubtotal,
            totalBillDiscount
          );

          if (validation.isValid) {
            const calculation = this.calculateDiscount(
              rule.type,
              rule.value,
              currentSubtotal,
              totalBillDiscount
            );

            totalBillDiscount += calculation.discountAmount;
            appliedRules.push(rule);

            // Stop if stacking is not allowed
            if (!this.options.allowStacking) {
              break;
            }
          }
        }
      }
    }

    return this.calculateTransactionSummary(cartItems, totalBillDiscount, taxRate, appliedRules);
  }

  /**
   * Evaluate discount rule conditions
   */
  private evaluateRuleConditions(rule: DiscountRule, cartItems: CartItem[]): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // No conditions means always applicable
    }

    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'min_amount': {
          const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return this.evaluateCondition(subtotal, condition.operator, Number(condition.value));
        }
        case 'max_amount': {
          const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          return this.evaluateCondition(subtotal, condition.operator, Number(condition.value));
        }
        case 'quantity': {
          const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          return this.evaluateCondition(totalQuantity, condition.operator, Number(condition.value));
        }
        case 'category':
          // TODO: Implement category-based conditions when category data is available
          return true;
        case 'product':
          return cartItems.some(item =>
            this.evaluateCondition(item.productId, condition.operator, String(condition.value))
          );
        default:
          return false;
      }
    });
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    actualValue: number | string,
    operator: DiscountCondition['operator'],
    expectedValue: number | string
  ): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      default:
        return false;
    }
  }

  /**
   * Calculate optimal discount combination
   */
  calculateOptimalDiscounts(
    cartItems: CartItem[],
    availableRules: DiscountRule[],
    taxRate: number
  ): TransactionDiscountSummary {
    const activeRules = availableRules.filter(rule => rule.isActive);

    if (activeRules.length === 0) {
      return this.calculateTransactionSummary(cartItems, 0, taxRate);
    }

    // Try different combinations and find the one with maximum savings
    let bestSummary = this.calculateTransactionSummary(cartItems, 0, taxRate);

    // Single rule applications
    for (const rule of activeRules) {
      const summary = this.applyDiscountRules(cartItems, [rule], taxRate);
      if (summary.totalDiscounts > bestSummary.totalDiscounts) {
        bestSummary = summary;
      }
    }

    // If stacking is allowed, try combinations
    if (this.options.allowStacking && activeRules.length > 1) {
      const summary = this.applyDiscountRules(cartItems, activeRules, taxRate);
      if (summary.totalDiscounts > bestSummary.totalDiscounts) {
        bestSummary = summary;
      }
    }

    return bestSummary;
  }

  /**
   * Format discount for display
   */
  formatDiscountDisplay(type: DiscountType, value: number): string {
    if (type === 'percentage') {
      return `${value}% OFF`;
    } else {
      return `$${this.roundToDecimal(value, this.options.roundingPrecision)} OFF`;
    }
  }

  /**
   * Round calculation values
   */
  private roundCalculation(calculation: DiscountCalculation): DiscountCalculation {
    return {
      originalAmount: this.roundToDecimal(calculation.originalAmount, this.options.roundingPrecision),
      discountAmount: this.roundToDecimal(calculation.discountAmount, this.options.roundingPrecision),
      finalAmount: this.roundToDecimal(calculation.finalAmount, this.options.roundingPrecision)
    };
  }

  /**
   * Round summary values
   */
  private roundValues(summary: TransactionDiscountSummary): TransactionDiscountSummary {
    const precision = this.options.roundingPrecision;
    return {
      ...summary,
      subtotal: this.roundToDecimal(summary.subtotal, precision),
      lineItemDiscounts: this.roundToDecimal(summary.lineItemDiscounts, precision),
      billLevelDiscounts: this.roundToDecimal(summary.billLevelDiscounts, precision),
      totalDiscounts: this.roundToDecimal(summary.totalDiscounts, precision),
      discountedSubtotal: this.roundToDecimal(summary.discountedSubtotal, precision),
      taxAmount: this.roundToDecimal(summary.taxAmount, precision),
      finalTotal: this.roundToDecimal(summary.finalTotal, precision)
    };
  }

  /**
   * Round to specified decimal places
   */
  private roundToDecimal(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  /**
   * Get engine configuration
   */
  getOptions(): DiscountEngineOptions {
    return { ...this.options };
  }

  /**
   * Update engine configuration
   */
  updateOptions(newOptions: Partial<DiscountEngineOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}