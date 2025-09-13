import { z } from 'zod'

/**
 * POS Validation Schemas
 * 
 * This file contains comprehensive Zod schemas for validating all POS form data.
 * Each schema includes custom error messages specific to the POS context.
 */

// Base validation schemas
const PositiveNumberSchema = z.number().positive({
  message: "Amount must be greater than zero"
})

const NonNegativeNumberSchema = z.number().min(0, {
  message: "Amount cannot be negative"
})

const CurrencyAmountSchema = z.number()
  .multipleOf(0.01, { message: "Amount must be rounded to the nearest cent" })
  .min(0, { message: "Amount cannot be negative" })

const ProductIdSchema = z.number().int().positive({
  message: "Invalid product ID"
})

const QuantitySchema = z.number().int().positive({
  message: "Quantity must be a positive whole number"
}).max(9999, {
  message: "Quantity cannot exceed 9999 items"
})

// Customer validation schemas
const CustomerNameSchema = z.string()
  .min(1, { message: "Customer name is required" })
  .max(100, { message: "Customer name cannot exceed 100 characters" })
  .regex(/^[a-zA-Z\s\-'\.]+$/, {
    message: "Customer name can only contain letters, spaces, hyphens, apostrophes, and periods"
  })

const CustomerEmailSchema = z.string()
  .email({ message: "Please enter a valid email address" })
  .optional()
  .or(z.literal(''))

const CustomerPhoneSchema = z.string()
  .regex(/^[\+]?[0-9\-\s\(\)]{7,20}$/, {
    message: "Please enter a valid phone number"
  })
  .optional()
  .or(z.literal(''))

// Payment method validation schemas
const PaymentMethodTypeSchema = z.enum(['cash', 'card', 'bank_transfer'], {
  message: "Please select a valid payment method"
})


const CardReferenceSchema = z.string()
  .min(4, { message: "Card reference must be at least 4 characters" })
  .max(50, { message: "Card reference cannot exceed 50 characters" })
  .regex(/^[0-9*]+$/, {
    message: "Card reference should contain only numbers and asterisks"
  })

const BankReferenceSchema = z.string()
  .min(3, { message: "Bank transfer reference must be at least 3 characters" })
  .max(100, { message: "Bank transfer reference cannot exceed 100 characters" })
  .regex(/^[a-zA-Z0-9\-_]+$/, {
    message: "Bank transfer reference can only contain letters, numbers, hyphens, and underscores"
  })

// Core POS schemas

/**
 * Payment Form Schema
 * Validates payment amounts, methods, and change calculation
 */
export const PaymentFormSchema = z.object({
  amount: CurrencyAmountSchema
    .min(0.01, { message: "Payment amount must be at least $0.01" })
    .max(999999.99, { message: "Payment amount cannot exceed $999,999.99" }),
  
  type: PaymentMethodTypeSchema,
  
  reference: z.string().optional(),
  
  timestamp: z.date({
    message: "Payment timestamp is required"
  })
}).superRefine((data, ctx) => {
  // Validate reference requirements based on payment type
  if (data.type === 'card') {
    if (!data.reference || data.reference.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card reference is required for card payments",
        path: ['reference']
      })
    } else {
      const cardRefResult = CardReferenceSchema.safeParse(data.reference)
      if (!cardRefResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: cardRefResult.error.issues[0].message,
          path: ['reference']
        })
      }
    }
  }
  
  if (data.type === 'bank_transfer') {
    if (!data.reference || data.reference.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank transfer reference is required",
        path: ['reference']
      })
    } else {
      const bankRefResult = BankReferenceSchema.safeParse(data.reference)
      if (!bankRefResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: bankRefResult.error.issues[0].message,
          path: ['reference']
        })
      }
    }
  }
})

/**
 * Multiple Payments Schema
 * Validates a collection of payments and ensures total coverage
 */
export const PaymentsCollectionSchema = z.object({
  payments: z.array(PaymentFormSchema).min(1, {
    message: "At least one payment method is required"
  }),
  
  totalAmount: PositiveNumberSchema,
  
  changeAmount: NonNegativeNumberSchema
}).superRefine((data, ctx) => {
  const totalPaid = data.payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // Check if payment total matches transaction total (allowing for change)
  if (totalPaid < data.totalAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Insufficient payment. $${(data.totalAmount - totalPaid).toFixed(2)} remaining`,
      path: ['payments']
    })
  }
  
  // Validate change calculation
  const expectedChange = Math.max(0, totalPaid - data.totalAmount)
  if (Math.abs(data.changeAmount - expectedChange) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Change amount calculation is incorrect",
      path: ['changeAmount']
    })
  }
})

/**
 * Customer Selection Schema
 * Validates customer search, selection, and quick creation
 */
export const CustomerSelectSchema = z.object({
  customerId: z.number().int().positive().optional(),
  
  customerName: CustomerNameSchema.optional(),
  
  customerEmail: CustomerEmailSchema,
  
  customerPhone: CustomerPhoneSchema,
  
  isQuickCreate: z.boolean().default(false)
}).superRefine((data, ctx) => {
  // If not using existing customer, validate new customer data
  if (!data.customerId && data.isQuickCreate) {
    if (!data.customerName || data.customerName.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Customer name is required for new customers",
        path: ['customerName']
      })
    }
  }
  
  // Validate that either customer ID or customer name is provided
  if (!data.customerId && !data.customerName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select an existing customer or create a new one",
      path: ['customerId']
    })
  }
})

/**
 * Cart Item Schema
 * Validates product selection, quantity, and pricing
 */
export const CartItemSchema = z.object({
  productId: ProductIdSchema,
  
  productName: z.string().min(1, {
    message: "Product name is required"
  }),
  
  quantity: QuantitySchema,
  
  unitPrice: PositiveNumberSchema.max(999999.99, {
    message: "Unit price cannot exceed $999,999.99"
  }),
  
  totalPrice: PositiveNumberSchema,
  
  discount: NonNegativeNumberSchema.max(100, {
    message: "Discount cannot exceed 100%"
  }).default(0),
  
  isActive: z.boolean({
    message: "Product active status is required"
  }),
  
  stockQuantity: z.number().int().min(0, {
    message: "Stock quantity cannot be negative"
  })
}).superRefine((data, ctx) => {
  // Validate total price calculation
  const expectedTotal = (data.unitPrice * data.quantity) * (1 - data.discount / 100)
  if (Math.abs(data.totalPrice - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total price calculation is incorrect",
      path: ['totalPrice']
    })
  }
  
  // Validate product availability
  if (!data.isActive) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "This product is no longer available",
      path: ['productId']
    })
  }
  
  // Validate stock availability
  if (data.quantity > data.stockQuantity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Only ${data.stockQuantity} items available in stock`,
      path: ['quantity']
    })
  }
})

/**
 * Shopping Cart Schema
 * Validates the entire shopping cart with all items
 */
export const ShoppingCartSchema = z.object({
  items: z.array(CartItemSchema).min(1, {
    message: "Cart cannot be empty"
  }).max(100, {
    message: "Cart cannot contain more than 100 items"
  }),
  
  subtotal: NonNegativeNumberSchema,
  
  tax: NonNegativeNumberSchema,
  
  discount: NonNegativeNumberSchema,
  
  total: PositiveNumberSchema
}).superRefine((data, ctx) => {
  // Validate cart totals calculation
  const calculatedSubtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0)
  
  if (Math.abs(data.subtotal - calculatedSubtotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Subtotal calculation is incorrect",
      path: ['subtotal']
    })
  }
  
  const expectedTotal = data.subtotal + data.tax - data.discount
  if (Math.abs(data.total - expectedTotal) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total calculation is incorrect",
      path: ['total']
    })
  }
  
  // Validate discount doesn't exceed subtotal
  if (data.discount > data.subtotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Discount cannot exceed subtotal amount",
      path: ['discount']
    })
  }
})

/**
 * POS Session Schema
 * Validates session data, customer assignment, and cart state
 */
export const SessionSchema = z.object({
  sessionId: z.string().uuid({
    message: "Invalid session ID format"
  }),
  
  cashierId: z.number().int().positive({
    message: "Valid cashier ID is required"
  }),
  
  customerId: z.number().int().positive().optional(),
  
  cart: ShoppingCartSchema.optional(),
  
  status: z.enum(['active', 'checkout', 'completed', 'abandoned'], {
    message: "Invalid session status"
  }),
  
  createdAt: z.date({
    message: "Session creation date is required"
  }),
  
  lastActivity: z.date({
    message: "Last activity date is required"
  })
}).superRefine((data, ctx) => {
  // Validate session timing
  if (data.lastActivity < data.createdAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Last activity cannot be before session creation",
      path: ['lastActivity']
    })
  }
  
  // Validate session age (max 24 hours)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  const sessionAge = Date.now() - data.createdAt.getTime()
  
  if (sessionAge > maxAge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Session has expired. Please start a new session",
      path: ['createdAt']
    })
  }
  
  // Validate checkout requirements
  if (data.status === 'checkout') {
    if (!data.cart || !data.cart.items.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot proceed to checkout with empty cart",
        path: ['cart']
      })
    }
  }
})

/**
 * Complete POS Transaction Schema
 * Validates the entire transaction before submission
 */
export const POSTransactionSchema = z.object({
  session: SessionSchema,
  
  customer: CustomerSelectSchema,
  
  cart: ShoppingCartSchema,
  
  payments: PaymentsCollectionSchema
}).superRefine((data, ctx) => {
  // Validate transaction completeness
  if (data.session.status !== 'checkout') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Session must be in checkout status to complete transaction",
      path: ['session', 'status']
    })
  }
  
  // Validate payment coverage
  if (Math.abs(data.payments.totalAmount - data.cart.total) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Payment total must match cart total",
      path: ['payments', 'totalAmount']
    })
  }
  
  // Ensure all cart items are still valid
  const invalidItems = data.cart.items.filter(item => !item.isActive)
  if (invalidItems.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Some items are no longer available: ${invalidItems.map(i => i.productName).join(', ')}`,
      path: ['cart', 'items']
    })
  }
})

/**
 * Quick Cash Payment Schema
 * For predefined cash amounts
 */
export const QuickCashSchema = z.object({
  amount: z.enum(['5', '10', '20', '50', '100']).transform(val => Number(val)),
  
  totalDue: PositiveNumberSchema
}).superRefine((data, ctx) => {
  if (data.amount < data.totalDue && data.totalDue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Quick cash amount is insufficient for this transaction",
      path: ['amount']
    })
  }
})

/**
 * Change Calculation Schema
 * Validates change due calculations
 */
export const ChangeCalculationSchema = z.object({
  totalPaid: PositiveNumberSchema,
  
  totalDue: PositiveNumberSchema,
  
  changeDue: NonNegativeNumberSchema
}).superRefine((data, ctx) => {
  const expectedChange = Math.max(0, data.totalPaid - data.totalDue)
  
  if (Math.abs(data.changeDue - expectedChange) > 0.01) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Change calculation is incorrect",
      path: ['changeDue']
    })
  }
  
  if (data.totalPaid < data.totalDue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Insufficient payment received",
      path: ['totalPaid']
    })
  }
})

// Export additional utility types
export type PaymentFormData = z.infer<typeof PaymentFormSchema>
export type PaymentsCollectionData = z.infer<typeof PaymentsCollectionSchema>
export type CustomerSelectData = z.infer<typeof CustomerSelectSchema>
export type CartItemData = z.infer<typeof CartItemSchema>
export type ShoppingCartData = z.infer<typeof ShoppingCartSchema>
export type SessionData = z.infer<typeof SessionSchema>
export type POSTransactionData = z.infer<typeof POSTransactionSchema>
export type QuickCashData = z.infer<typeof QuickCashSchema>
export type ChangeCalculationData = z.infer<typeof ChangeCalculationSchema>

// Export validation helper functions
export const validatePaymentForm = (data: unknown) => PaymentFormSchema.safeParse(data)
export const validatePaymentsCollection = (data: unknown) => PaymentsCollectionSchema.safeParse(data)
export const validateCustomerSelect = (data: unknown) => CustomerSelectSchema.safeParse(data)
export const validateCartItem = (data: unknown) => CartItemSchema.safeParse(data)
export const validateShoppingCart = (data: unknown) => ShoppingCartSchema.safeParse(data)
export const validateSession = (data: unknown) => SessionSchema.safeParse(data)
export const validatePOSTransaction = (data: unknown) => POSTransactionSchema.safeParse(data)
export const validateQuickCash = (data: unknown) => QuickCashSchema.safeParse(data)
export const validateChangeCalculation = (data: unknown) => ChangeCalculationSchema.safeParse(data)