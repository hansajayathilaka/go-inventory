import { useMemo, useCallback } from 'react';
import { DiscountValidationService, type ValidationContext, type EnhancedDiscountValidation } from '@/services/pos/discountValidationService';

export type { EnhancedDiscountValidation };
import type { DiscountType, DiscountRule } from '@/types/pos/discount';
import type { CartItem } from '@/types/pos/cart';

/**
 * Configuration for the validation hook
 */
interface UseDiscountValidationConfig {
  userRole?: ValidationContext['userRole'];
  userId?: string;
  customerType?: ValidationContext['customerType'];
  enableTimeRestrictions?: boolean;
  maxTransactionDiscount?: number;
}

/**
 * Hook return type
 */
interface UseDiscountValidationReturn {
  validateSingleDiscount: (
    type: DiscountType,
    value: number,
    originalAmount: number,
    reason?: string
  ) => EnhancedDiscountValidation;

  validateTransactionDiscounts: (
    cartItems: CartItem[],
    billDiscount: number,
    existingRules?: DiscountRule[]
  ) => EnhancedDiscountValidation;

  validateRuleCompatibility: (
    newRule: DiscountRule,
    existingRules: DiscountRule[],
    cartItems: CartItem[]
  ) => EnhancedDiscountValidation;

  getMaxAllowedDiscount: (type: DiscountType, originalAmount: number) => number;

  requiresApproval: (discountPercentage: number) => boolean;

  requiresReason: (discountPercentage: number) => boolean;

  validationService: DiscountValidationService;
}

/**
 * Custom hook for discount validation
 */
export function useDiscountValidation(
  sessionId: string,
  config: UseDiscountValidationConfig = {}
): UseDiscountValidationReturn {
  const {
    userRole = 'cashier',
    userId,
    customerType = 'regular',
    enableTimeRestrictions = false,
    maxTransactionDiscount = 1000
  } = config;

  // Create validation service with custom configuration
  const validationService = useMemo(() => {
    return new DiscountValidationService({
      maxTransactionDiscount,
      timeBasedRestrictions: {
        enabled: enableTimeRestrictions,
        restrictedHours: { start: 22, end: 6 },
        weekendRestrictions: enableTimeRestrictions
      }
    });
  }, [maxTransactionDiscount, enableTimeRestrictions]);

  // Create validation context
  const context = useMemo((): ValidationContext => ({
    userRole,
    userId,
    sessionId,
    timestamp: new Date(),
    transactionValue: 0, // Will be updated per validation
    customerType
  }), [userRole, userId, sessionId, customerType]);

  // Validate single discount
  const validateSingleDiscount = useCallback((
    type: DiscountType,
    value: number,
    originalAmount: number,
    reason?: string
  ): EnhancedDiscountValidation => {
    const validationContext = {
      ...context,
      transactionValue: originalAmount,
      timestamp: new Date()
    };

    return validationService.validateDiscount(
      type,
      value,
      originalAmount,
      validationContext,
      reason
    );
  }, [validationService, context]);

  // Validate transaction-level discounts
  const validateTransactionDiscounts = useCallback((
    cartItems: CartItem[],
    billDiscount: number,
    existingRules: DiscountRule[] = []
  ): EnhancedDiscountValidation => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const validationContext = {
      ...context,
      transactionValue: subtotal,
      timestamp: new Date()
    };

    return validationService.validateTransactionDiscounts(
      cartItems,
      billDiscount,
      validationContext,
      existingRules
    );
  }, [validationService, context]);

  // Validate rule compatibility
  const validateRuleCompatibility = useCallback((
    newRule: DiscountRule,
    existingRules: DiscountRule[],
    cartItems: CartItem[]
  ): EnhancedDiscountValidation => {
    return validationService.validateRuleCompatibility(
      newRule,
      existingRules,
      cartItems
    );
  }, [validationService]);

  // Get maximum allowed discount for user role
  const getMaxAllowedDiscount = useCallback((
    type: DiscountType,
    originalAmount: number
  ): number => {
    const config = validationService.getConfig();
    const roleLimits = config.roleBasedLimits[userRole];

    if (type === 'percentage') {
      return Math.min(roleLimits.maxPercentage, config.maxPercentageDiscount);
    } else {
      return Math.min(roleLimits.maxFixed, Math.min(originalAmount, config.maxFixedDiscount));
    }
  }, [validationService, userRole]);

  // Check if discount requires approval
  const requiresApproval = useCallback((discountPercentage: number): boolean => {
    const config = validationService.getConfig();
    const roleLimits = config.roleBasedLimits[userRole];

    return discountPercentage > config.requireApprovalAbovePercentage ||
           roleLimits.requiresApproval;
  }, [validationService, userRole]);

  // Check if discount requires reason
  const requiresReason = useCallback((discountPercentage: number): boolean => {
    const config = validationService.getConfig();
    return discountPercentage > config.requireReasonAbovePercentage;
  }, [validationService]);

  return {
    validateSingleDiscount,
    validateTransactionDiscounts,
    validateRuleCompatibility,
    getMaxAllowedDiscount,
    requiresApproval,
    requiresReason,
    validationService
  };
}

/**
 * Validation utilities
 */
export const DiscountValidationUtils = {
  /**
   * Format validation error for display
   */
  formatValidationError(validation: EnhancedDiscountValidation): string {
    if (validation.isValid) return '';

    let message = validation.errorMessage || 'Invalid discount';

    if (validation.maxAllowedValue !== undefined) {
      message += ` (Maximum: ${validation.maxAllowedValue})`;
    }

    return message;
  },

  /**
   * Format validation warnings for display
   */
  formatValidationWarnings(validation: EnhancedDiscountValidation): string[] {
    return validation.warnings || [];
  },

  /**
   * Check if validation requires user action
   */
  requiresUserAction(validation: EnhancedDiscountValidation): boolean {
    return validation.requiresApproval || !validation.isValid || (validation.warnings?.length || 0) > 0;
  },

  /**
   * Get validation severity level
   */
  getValidationSeverity(validation: EnhancedDiscountValidation): 'error' | 'warning' | 'info' | 'success' {
    if (!validation.isValid) return 'error';
    if (validation.requiresApproval) return 'warning';
    if (validation.warnings && validation.warnings.length > 0) return 'info';
    return 'success';
  }
};