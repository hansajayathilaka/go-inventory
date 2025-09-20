import type {
  DiscountType,
  DiscountValidation,
  DiscountRule
} from '@/types/pos/discount';
import type { CartItem } from '@/types/pos/cart';

/**
 * Enhanced validation result with detailed information
 */
export interface EnhancedDiscountValidation extends DiscountValidation {
  warnings?: string[];
  requiresApproval?: boolean;
  approvalReason?: string;
  maxAllowedPercentage?: number;
  context?: ValidationContext;
}

/**
 * Validation context for business rule evaluation
 */
export interface ValidationContext {
  userRole: 'cashier' | 'supervisor' | 'manager' | 'admin';
  userId?: string;
  sessionId: string;
  timestamp: Date;
  transactionValue: number;
  customerType?: 'regular' | 'vip' | 'employee' | 'wholesale';
}

/**
 * Discount validation configuration
 */
export interface DiscountValidationConfig {
  // Maximum discount limits
  maxPercentageDiscount: number;
  maxFixedDiscount: number;
  maxTransactionDiscount: number;

  // Role-based limits
  roleBasedLimits: {
    cashier: { maxPercentage: number; maxFixed: number; requiresApproval: boolean };
    supervisor: { maxPercentage: number; maxFixed: number; requiresApproval: boolean };
    manager: { maxPercentage: number; maxFixed: number; requiresApproval: boolean };
    admin: { maxPercentage: number; maxFixed: number; requiresApproval: boolean };
  };

  // Business rules
  requireReasonAbovePercentage: number;
  requireApprovalAbovePercentage: number;
  allowStackingDiscounts: boolean;
  maxCombinedDiscountPercentage: number;

  // Time-based restrictions
  timeBasedRestrictions: {
    enabled: boolean;
    restrictedHours?: { start: number; end: number }; // 24-hour format
    weekendRestrictions?: boolean;
  };
}

/**
 * Default validation configuration
 */
const DEFAULT_VALIDATION_CONFIG: DiscountValidationConfig = {
  maxPercentageDiscount: 50,
  maxFixedDiscount: 500,
  maxTransactionDiscount: 1000,

  roleBasedLimits: {
    cashier: { maxPercentage: 10, maxFixed: 50, requiresApproval: true },
    supervisor: { maxPercentage: 25, maxFixed: 200, requiresApproval: false },
    manager: { maxPercentage: 50, maxFixed: 500, requiresApproval: false },
    admin: { maxPercentage: 100, maxFixed: 1000, requiresApproval: false }
  },

  requireReasonAbovePercentage: 15,
  requireApprovalAbovePercentage: 25,
  allowStackingDiscounts: true,
  maxCombinedDiscountPercentage: 75,

  timeBasedRestrictions: {
    enabled: false,
    restrictedHours: { start: 22, end: 6 }, // 10 PM to 6 AM
    weekendRestrictions: false
  }
};

/**
 * Comprehensive discount validation service
 */
export class DiscountValidationService {
  private config: DiscountValidationConfig;

  constructor(config?: Partial<DiscountValidationConfig>) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  /**
   * Validate a single discount application
   */
  validateDiscount(
    type: DiscountType,
    value: number,
    originalAmount: number,
    context: ValidationContext,
    reason?: string
  ): EnhancedDiscountValidation {
    const result: EnhancedDiscountValidation = {
      isValid: true,
      warnings: [],
      context
    };

    // Basic validation
    const basicValidation = this.validateBasicRules(type, value, originalAmount);
    if (!basicValidation.isValid) {
      return { ...basicValidation, context };
    }

    // Role-based validation
    const roleValidation = this.validateRoleBasedLimits(type, value, context.userRole);
    if (!roleValidation.isValid) {
      return { ...roleValidation, context };
    }

    // Calculate discount amount and percentage
    const discountAmount = type === 'percentage'
      ? (originalAmount * value) / 100
      : Math.min(value, originalAmount);

    const discountPercentage = (discountAmount / originalAmount) * 100;

    // Check if reason is required
    if (discountPercentage > this.config.requireReasonAbovePercentage && !reason?.trim()) {
      result.isValid = false;
      result.errorMessage = `Discount reason is required for discounts above ${this.config.requireReasonAbovePercentage}%`;
      return result;
    }

    // Check if approval is required
    if (discountPercentage > this.config.requireApprovalAbovePercentage) {
      result.requiresApproval = true;
      result.approvalReason = `Discount of ${discountPercentage.toFixed(1)}% exceeds approval threshold`;
    }

    // Time-based restrictions
    const timeValidation = this.validateTimeRestrictions(context);
    if (!timeValidation.isValid) {
      if (context.userRole !== 'manager' && context.userRole !== 'admin') {
        return { ...timeValidation, context };
      } else {
        result.warnings?.push('Applying discount during restricted hours - manager override active');
      }
    }

    // High-value discount warnings
    if (discountAmount > 100) {
      result.warnings?.push(`High discount amount: $${discountAmount.toFixed(2)}`);
    }

    if (discountPercentage > 30) {
      result.warnings?.push(`High discount percentage: ${discountPercentage.toFixed(1)}%`);
    }

    // Customer type validation
    const customerValidation = this.validateCustomerTypeDiscount(discountPercentage, context.customerType);
    if (!customerValidation.isValid) {
      return { ...customerValidation, context };
    }

    return result;
  }

  /**
   * Validate transaction-level discount limits
   */
  validateTransactionDiscounts(
    cartItems: CartItem[],
    billDiscount: number,
    context: ValidationContext,
    _existingRules: DiscountRule[] = []
  ): EnhancedDiscountValidation {
    const result: EnhancedDiscountValidation = {
      isValid: true,
      warnings: [],
      context
    };

    // Calculate total discounts
    const lineItemDiscounts = cartItems.reduce((sum, item) => sum + item.lineDiscount, 0);
    const totalDiscounts = lineItemDiscounts + billDiscount;
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalDiscountPercentage = subtotal > 0 ? (totalDiscounts / subtotal) * 100 : 0;

    // Check maximum transaction discount
    if (totalDiscounts > this.config.maxTransactionDiscount) {
      result.isValid = false;
      result.errorMessage = `Total transaction discount ($${totalDiscounts.toFixed(2)}) exceeds maximum limit ($${this.config.maxTransactionDiscount})`;
      return result;
    }

    // Check combined discount percentage
    if (totalDiscountPercentage > this.config.maxCombinedDiscountPercentage) {
      result.isValid = false;
      result.errorMessage = `Combined discount percentage (${totalDiscountPercentage.toFixed(1)}%) exceeds maximum limit (${this.config.maxCombinedDiscountPercentage}%)`;
      result.maxAllowedPercentage = this.config.maxCombinedDiscountPercentage;
      return result;
    }

    // Check discount stacking rules
    if (!this.config.allowStackingDiscounts && lineItemDiscounts > 0 && billDiscount > 0) {
      result.isValid = false;
      result.errorMessage = 'Stacking line-item and bill-level discounts is not allowed';
      return result;
    }

    // Multiple discount validation warnings
    const discountCount = cartItems.filter(item => item.lineDiscount > 0).length + (billDiscount > 0 ? 1 : 0);
    if (discountCount > 3) {
      result.warnings?.push(`Multiple discounts applied (${discountCount} total) - verify transaction`);
    }

    // High-value transaction validation
    if (subtotal > 1000 && totalDiscountPercentage > 20) {
      result.warnings?.push('High-value transaction with significant discount - consider review');
    }

    return result;
  }

  /**
   * Validate discount rules compatibility
   */
  validateRuleCompatibility(
    newRule: DiscountRule,
    existingRules: DiscountRule[],
    cartItems: CartItem[]
  ): EnhancedDiscountValidation {
    const result: EnhancedDiscountValidation = {
      isValid: true,
      warnings: []
    };

    // Check for conflicting rules
    const conflictingRules = existingRules.filter(rule =>
      rule.priority === newRule.priority && rule.type === newRule.type
    );

    if (conflictingRules.length > 0 && !this.config.allowStackingDiscounts) {
      result.isValid = false;
      result.errorMessage = `Rule conflicts with existing ${conflictingRules[0].name} - stacking not allowed`;
      return result;
    }

    // Validate rule conditions against cart
    if (newRule.conditions) {
      const conditionValidation = this.validateRuleConditions(newRule, cartItems);
      if (!conditionValidation.isValid) {
        return conditionValidation;
      }
    }

    return result;
  }

  /**
   * Get validation configuration
   */
  getConfig(): DiscountValidationConfig {
    return { ...this.config };
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<DiscountValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Private validation methods

  private validateBasicRules(
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
      if (value > this.config.maxPercentageDiscount) {
        return {
          isValid: false,
          errorMessage: `Percentage discount cannot exceed ${this.config.maxPercentageDiscount}%`,
          maxAllowedValue: this.config.maxPercentageDiscount
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
      if (value > this.config.maxFixedDiscount) {
        return {
          isValid: false,
          errorMessage: `Fixed discount cannot exceed $${this.config.maxFixedDiscount}`,
          maxAllowedValue: this.config.maxFixedDiscount
        };
      }
    }

    return { isValid: true };
  }

  private validateRoleBasedLimits(
    type: DiscountType,
    value: number,
    userRole: ValidationContext['userRole']
  ): EnhancedDiscountValidation {
    const limits = this.config.roleBasedLimits[userRole];

    if (type === 'percentage' && value > limits.maxPercentage) {
      return {
        isValid: false,
        errorMessage: `${userRole} role cannot apply discounts above ${limits.maxPercentage}%`,
        maxAllowedValue: limits.maxPercentage,
        requiresApproval: true,
        approvalReason: 'Discount exceeds role-based limits'
      };
    }

    if (type === 'fixed' && value > limits.maxFixed) {
      return {
        isValid: false,
        errorMessage: `${userRole} role cannot apply fixed discounts above $${limits.maxFixed}`,
        maxAllowedValue: limits.maxFixed,
        requiresApproval: true,
        approvalReason: 'Discount exceeds role-based limits'
      };
    }

    return { isValid: true };
  }

  private validateTimeRestrictions(context: ValidationContext): DiscountValidation {
    if (!this.config.timeBasedRestrictions.enabled) {
      return { isValid: true };
    }

    const currentHour = context.timestamp.getHours();
    const restrictions = this.config.timeBasedRestrictions;

    // Check restricted hours
    if (restrictions.restrictedHours) {
      const { start, end } = restrictions.restrictedHours;
      const isRestricted = start > end
        ? currentHour >= start || currentHour < end  // Overnight restriction
        : currentHour >= start && currentHour < end; // Same day restriction

      if (isRestricted) {
        return {
          isValid: false,
          errorMessage: 'Discounts are restricted during current hours - manager approval required'
        };
      }
    }

    // Check weekend restrictions
    if (restrictions.weekendRestrictions) {
      const day = context.timestamp.getDay();
      if (day === 0 || day === 6) { // Sunday or Saturday
        return {
          isValid: false,
          errorMessage: 'Weekend discounts require manager approval'
        };
      }
    }

    return { isValid: true };
  }

  private validateCustomerTypeDiscount(
    discountPercentage: number,
    customerType?: ValidationContext['customerType']
  ): DiscountValidation {
    // Special validation rules based on customer type
    switch (customerType) {
      case 'employee':
        if (discountPercentage > 20) {
          return {
            isValid: false,
            errorMessage: 'Employee discounts cannot exceed 20%'
          };
        }
        break;
      case 'wholesale':
        if (discountPercentage > 40) {
          return {
            isValid: false,
            errorMessage: 'Wholesale discounts cannot exceed 40%'
          };
        }
        break;
      case 'vip':
        // VIP customers can have higher discounts
        break;
      default:
        // Regular customers have standard limits
        break;
    }

    return { isValid: true };
  }

  private validateRuleConditions(
    rule: DiscountRule,
    cartItems: CartItem[]
  ): DiscountValidation {
    if (!rule.conditions) {
      return { isValid: true };
    }

    for (const condition of rule.conditions) {
      const conditionMet = this.evaluateCondition(condition, cartItems);
      if (!conditionMet) {
        return {
          isValid: false,
          errorMessage: `Rule condition not met: ${this.formatConditionError(condition)}`
        };
      }
    }

    return { isValid: true };
  }

  private evaluateCondition(condition: any, cartItems: CartItem[]): boolean {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    switch (condition.type) {
      case 'min_amount':
        return subtotal >= Number(condition.value);
      case 'max_amount':
        return subtotal <= Number(condition.value);
      case 'quantity':
        return totalQuantity >= Number(condition.value);
      case 'product':
        return cartItems.some(item => item.productId === condition.value);
      case 'category':
        // TODO: Implement category validation when category data is available
        return true;
      default:
        return false;
    }
  }

  private formatConditionError(condition: any): string {
    switch (condition.type) {
      case 'min_amount':
        return `Minimum amount of $${condition.value} required`;
      case 'max_amount':
        return `Maximum amount of $${condition.value} exceeded`;
      case 'quantity':
        return `Minimum quantity of ${condition.value} required`;
      case 'product':
        return `Required product not in cart`;
      case 'category':
        return `Required category not represented in cart`;
      default:
        return 'Condition not met';
    }
  }
}