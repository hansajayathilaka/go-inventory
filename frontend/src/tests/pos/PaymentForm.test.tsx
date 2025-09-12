import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { PaymentForm } from '@/components/pos/PaymentForm'
import {
  renderWithProviders,
  resetMocks,
  createTestCustomer,
  checkAccessibility,
  keyboardUtils,
} from './test-utils'

// Mock payment processing service
const mockPaymentService = {
  processPayment: vi.fn(),
  validateCardNumber: vi.fn(),
  calculateChange: vi.fn(),
}

vi.mock('@/services/paymentService', () => ({
  PaymentService: () => mockPaymentService,
}))

describe('PaymentForm', () => {
  const mockOnPaymentComplete = vi.fn()
  const mockOnCancel = vi.fn()
  
  const defaultProps = {
    totalAmount: 85.99,
    customer: createTestCustomer(),
    onPaymentComplete: mockOnPaymentComplete,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    resetMocks()
    mockOnPaymentComplete.mockClear()
    mockOnCancel.mockClear()
    mockPaymentService.processPayment.mockResolvedValue({ success: true })
    mockPaymentService.calculateChange.mockReturnValue(14.01)
  })

  describe('Basic Rendering', () => {
    it('renders payment form with correct total', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByText('Total: $85.99')).toBeInTheDocument()
      expect(screen.getByText('Payment')).toBeInTheDocument()
    })

    it('shows customer information', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    it('displays payment method options', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByText('Cash')).toBeInTheDocument()
      expect(screen.getByText('Card')).toBeInTheDocument()
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
    })

    it('has process payment and cancel buttons', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /process payment/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Cash Payment', () => {
    it('selects cash payment by default', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      const cashRadio = screen.getByRole('radio', { name: /cash/i })
      expect(cashRadio).toBeChecked()
    })

    it('shows amount received input for cash payment', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByLabelText(/amount received/i)).toBeInTheDocument()
    })

    it('calculates change correctly', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      await waitFor(() => {
        expect(screen.getByText('Change: $14.01')).toBeInTheDocument()
      })
    })

    it('shows insufficient payment error', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '50')

      await waitFor(() => {
        expect(screen.getByText(/insufficient payment/i)).toBeInTheDocument()
      })
    })

    it('processes cash payment successfully', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: 85.99,
        type: 'cash',
        amountReceived: 100,
        change: 14.01,
      })

      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalled()
      })
    })
  })

  describe('Card Payment', () => {
    beforeEach(async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)
    })

    it('shows card details form when card is selected', async () => {
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument()
    })

    it('validates card number format', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)

      const cardNumberInput = screen.getByLabelText(/card number/i)
      await user.type(cardNumberInput, '1234')

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument()
      })
    })

    it('formats card number with spaces', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)

      const cardNumberInput = screen.getByLabelText(/card number/i)
      await user.type(cardNumberInput, '4111111111111111')

      expect(cardNumberInput).toHaveValue('4111 1111 1111 1111')
    })

    it('validates expiry date', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)

      const expiryInput = screen.getByLabelText(/expiry date/i)
      await user.type(expiryInput, '01/20') // Past date

      await waitFor(() => {
        expect(screen.getByText(/card has expired/i)).toBeInTheDocument()
      })
    })

    it('validates CVV', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)

      const cvvInput = screen.getByLabelText(/cvv/i)
      await user.type(cvvInput, '12') // Too short

      await waitFor(() => {
        expect(screen.getByText(/invalid cvv/i)).toBeInTheDocument()
      })
    })

    it('processes card payment successfully', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const cardRadio = screen.getByRole('radio', { name: /card/i })
      await user.click(cardRadio)

      // Fill in card details
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111')
      await user.type(screen.getByLabelText(/expiry date/i), '12/25')
      await user.type(screen.getByLabelText(/cvv/i), '123')
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: 85.99,
        type: 'card',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'John Doe',
      })
    })
  })

  describe('Bank Transfer Payment', () => {
    beforeEach(async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const transferRadio = screen.getByRole('radio', { name: /bank transfer/i })
      await user.click(transferRadio)
    })

    it('shows bank transfer details form', async () => {
      expect(screen.getByLabelText(/reference number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/account number/i)).toBeInTheDocument()
    })

    it('validates reference number', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const transferRadio = screen.getByRole('radio', { name: /bank transfer/i })
      await user.click(transferRadio)

      const referenceInput = screen.getByLabelText(/reference number/i)
      await user.type(referenceInput, '123') // Too short

      await waitFor(() => {
        expect(screen.getByText(/reference number must be at least/i)).toBeInTheDocument()
      })
    })

    it('processes bank transfer successfully', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)
      const transferRadio = screen.getByRole('radio', { name: /bank transfer/i })
      await user.click(transferRadio)

      await user.type(screen.getByLabelText(/reference number/i), 'REF123456789')
      await user.type(screen.getByLabelText(/account number/i), '1234567890')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: 85.99,
        type: 'bank_transfer',
        referenceNumber: 'REF123456789',
        accountNumber: '1234567890',
      })
    })
  })

  describe('Split Payment', () => {
    it('shows split payment option', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByText(/split payment/i)).toBeInTheDocument()
    })

    it('enables split payment mode', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const splitToggle = screen.getByRole('switch', { name: /split payment/i })
      await user.click(splitToggle)

      expect(screen.getByText(/add payment method/i)).toBeInTheDocument()
    })

    it('allows multiple payment methods in split mode', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const splitToggle = screen.getByRole('switch', { name: /split payment/i })
      await user.click(splitToggle)

      // Add cash payment
      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '50')

      const addPaymentButton = screen.getByRole('button', { name: /add payment method/i })
      await user.click(addPaymentButton)

      // Should show second payment form
      expect(screen.getAllByRole('radio', { name: /cash/i })).toHaveLength(2)
    })

    it('validates split payment totals', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const splitToggle = screen.getByRole('switch', { name: /split payment/i })
      await user.click(splitToggle)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '30') // Less than total

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(screen.getByText(/total payments must equal/i)).toBeInTheDocument()
    })
  })

  describe('Quick Cash Buttons', () => {
    it('shows quick cash amount buttons', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: '$90' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '$100' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Exact' })).toBeInTheDocument()
    })

    it('sets amount when quick cash button is clicked', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const quickButton = screen.getByRole('button', { name: '$100' })
      await user.click(quickButton)

      const amountInput = screen.getByLabelText(/amount received/i)
      expect(amountInput).toHaveValue('100')
    })

    it('sets exact amount when exact button is clicked', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const exactButton = screen.getByRole('button', { name: 'Exact' })
      await user.click(exactButton)

      const amountInput = screen.getByLabelText(/amount received/i)
      expect(amountInput).toHaveValue('85.99')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('supports F1 for cash payment', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      await keyboardUtils.pressKey(user, 'F1')

      const cashRadio = screen.getByRole('radio', { name: /cash/i })
      expect(cashRadio).toBeChecked()
    })

    it('supports F2 for card payment', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      await keyboardUtils.pressKey(user, 'F2')

      const cardRadio = screen.getByRole('radio', { name: /card/i })
      expect(cardRadio).toBeChecked()
    })

    it('supports F3 for bank transfer', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      await keyboardUtils.pressKey(user, 'F3')

      const transferRadio = screen.getByRole('radio', { name: /bank transfer/i })
      expect(transferRadio).toBeChecked()
    })

    it('supports Enter to process payment', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      await keyboardUtils.pressKey(user, 'Enter')

      expect(mockPaymentService.processPayment).toHaveBeenCalled()
    })

    it('supports Escape to cancel', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      await keyboardUtils.pressKey(user, 'Escape')

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Loading and Processing States', () => {
    it('shows loading state during payment processing', async () => {
      mockPaymentService.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(screen.getByText(/processing payment/i)).toBeInTheDocument()
      expect(processButton).toBeDisabled()
    })

    it('disables form during processing', async () => {
      mockPaymentService.processPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      )

      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      expect(amountInput).toBeDisabled()
      expect(screen.getByRole('radio', { name: /cash/i })).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('handles payment processing errors', async () => {
      mockPaymentService.processPayment.mockRejectedValue(
        new Error('Payment declined')
      )

      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      await waitFor(() => {
        expect(screen.getByText(/payment declined/i)).toBeInTheDocument()
      })
    })

    it('handles network connection errors', async () => {
      mockPaymentService.processPayment.mockRejectedValue(
        new Error('Network error')
      )

      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('allows retrying failed payments', async () => {
      mockPaymentService.processPayment
        .mockRejectedValueOnce(new Error('Payment failed'))
        .mockResolvedValueOnce({ success: true })

      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      const processButton = screen.getByRole('button', { name: /process payment/i })
      await user.click(processButton)

      await waitFor(() => {
        expect(screen.getByText(/payment failed/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockOnPaymentComplete).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      expect(checkAccessibility.hasAriaLabel(amountInput)).toBeTruthy()

      const paymentMethods = screen.getAllByRole('radio')
      paymentMethods.forEach(radio => {
        expect(checkAccessibility.hasAriaLabel(radio)).toBeTruthy()
      })
    })

    it('announces payment status to screen readers', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '100')

      // Should have live region for status updates
      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toBeInTheDocument()
    })

    it('has proper heading structure', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      const paymentHeading = screen.getByRole('heading', { name: /payment/i })
      expect(paymentHeading).toBeInTheDocument()
    })

    it('groups related form controls', () => {
      renderWithProviders(<PaymentForm {...defaultProps} />)

      const paymentMethodGroup = screen.getByRole('radiogroup', { name: /payment method/i })
      expect(paymentMethodGroup).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('validates input in real-time without excessive API calls', async () => {
      const { user } = renderWithProviders(<PaymentForm {...defaultProps} />)

      const amountInput = screen.getByLabelText(/amount received/i)
      await user.type(amountInput, '12345', { delay: 10 })

      // Should debounce validation calls
      expect(mockPaymentService.validateCardNumber).toHaveBeenCalledTimes(0)
    })

    it('renders large payment history efficiently', () => {
      const propsWithHistory = {
        ...defaultProps,
        paymentHistory: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          amount: 50 + i,
          method: 'cash',
          timestamp: new Date(),
        })),
      }

      const startTime = performance.now()
      renderWithProviders(<PaymentForm {...propsWithHistory} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})