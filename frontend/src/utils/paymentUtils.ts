/**
 * Payment utility functions for handling monetary calculations
 * with proper decimal precision and rounding
 */

/**
 * Rounds a monetary amount to 2 decimal places
 * Uses proper rounding to avoid floating point precision issues
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Safely parses a monetary amount from string input
 * Returns 0 if parsing fails or result is invalid
 */
export function parseMonetaryAmount(value: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }
  return roundToTwoDecimals(Math.max(0, parsed));
}

/**
 * Formats a monetary amount for display
 * Always shows 2 decimal places
 */
export function formatMoney(amount: number): string {
  return roundToTwoDecimals(amount).toFixed(2);
}

/**
 * Calculates change amount with proper rounding
 */
export function calculateChange(amountTendered: number, totalAmount: number): number {
  return roundToTwoDecimals(Math.max(0, amountTendered - totalAmount));
}

/**
 * Checks if two monetary amounts are equal within tolerance
 * Useful for comparing floating point monetary values
 */
export function isMoneyEqual(amount1: number, amount2: number, tolerance: number = 0.01): boolean {
  return Math.abs(roundToTwoDecimals(amount1) - roundToTwoDecimals(amount2)) < tolerance;
}

/**
 * Validates if a payment amount is sufficient for the total
 */
export function isPaymentSufficient(paymentAmount: number, totalAmount: number): boolean {
  return roundToTwoDecimals(paymentAmount) >= roundToTwoDecimals(totalAmount);
}

/**
 * Calculates remaining amount for split payments
 */
export function calculateRemainingAmount(totalAmount: number, paidAmount: number): number {
  return roundToTwoDecimals(Math.max(0, totalAmount - paidAmount));
}

/**
 * Validates if split payments total equals the required amount
 */
export function isSplitPaymentComplete(totalAmount: number, paidAmount: number): boolean {
  return isMoneyEqual(totalAmount, paidAmount);
}