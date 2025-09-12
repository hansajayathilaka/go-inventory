import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ShoppingCart } from '@/components/pos/ShoppingCart'
import {
  renderWithProviders,
  resetMocks,
  createTestCartItem,
  createTestProduct,
  mockCartStore,
  checkAccessibility,
  keyboardUtils,
} from './test-utils'

describe('ShoppingCart', () => {
  const mockOnCheckout = vi.fn()

  beforeEach(() => {
    resetMocks()
    mockOnCheckout.mockClear()
  })

  describe('Empty Cart', () => {
    it('displays empty cart message when no items', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText(/cart is empty/i)).toBeInTheDocument()
      expect(screen.getByText(/add products to get started/i)).toBeInTheDocument()
    })

    it('shows empty cart icon', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const emptyIcon = screen.getByTestId('empty-cart-icon') // Assuming icon has this test id
      expect(emptyIcon).toBeInTheDocument()
    })

    it('disables checkout button when cart is empty', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      expect(checkoutButton).toBeDisabled()
    })
  })

  describe('Cart with Items', () => {
    beforeEach(() => {
      const testItems = [
        createTestCartItem({
          product: createTestProduct({ id: '1', name: 'Product 1', price: 29.99 }),
          quantity: 2,
          totalPrice: 59.98,
        }),
        createTestCartItem({
          product: createTestProduct({ id: '2', name: 'Product 2', price: 15.50 }),
          quantity: 1,
          totalPrice: 15.50,
        }),
      ]

      mockCartStore.items = testItems
      mockCartStore.itemCount = 3
      mockCartStore.subtotal = 75.48
      mockCartStore.tax = 7.55
      mockCartStore.discount = 0
      mockCartStore.total = 83.03
    })

    it('displays cart items', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText('Product 1')).toBeInTheDocument()
      expect(screen.getByText('Product 2')).toBeInTheDocument()
    })

    it('shows correct quantities', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInputs = screen.getAllByRole('spinbutton')
      expect(quantityInputs[0]).toHaveValue(2)
      expect(quantityInputs[1]).toHaveValue(1)
    })

    it('displays correct prices', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText('$59.98')).toBeInTheDocument() // Product 1 total
      expect(screen.getByText('$15.50')).toBeInTheDocument() // Product 2 total
    })

    it('shows cart totals', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText('Subtotal: $75.48')).toBeInTheDocument()
      expect(screen.getByText('Tax: $7.55')).toBeInTheDocument()
      expect(screen.getByText('Total: $83.03')).toBeInTheDocument()
    })

    it('enables checkout button when items exist', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      expect(checkoutButton).toBeEnabled()
    })
  })

  describe('Quantity Management', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
        quantity: 3,
        maxQuantity: 10,
      })

      mockCartStore.items = [testItem]
      mockCartStore.itemCount = 3
    })

    it('allows quantity increase', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i })
      await user.click(increaseButton)

      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('1', 4)
    })

    it('allows quantity decrease', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i })
      await user.click(decreaseButton)

      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('1', 2)
    })

    it('allows direct quantity input', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInput = screen.getByRole('spinbutton')
      await user.clear(quantityInput)
      await user.type(quantityInput, '5')

      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('1', 5)
    })

    it('prevents quantity increase beyond stock limit', async () => {
      // Set up item at max quantity
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
        quantity: 10,
        maxQuantity: 10,
      })
      mockCartStore.items = [testItem]

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i })
      expect(increaseButton).toBeDisabled()
    })

    it('prevents quantity decrease below 1', async () => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
        quantity: 1,
      })
      mockCartStore.items = [testItem]

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i })
      await user.click(decreaseButton)

      // Should call removeItem instead of updating quantity to 0
      expect(mockCartStore.removeItem).toHaveBeenCalledWith('1')
    })

    it('validates quantity input limits', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInput = screen.getByRole('spinbutton')
      await user.clear(quantityInput)
      await user.type(quantityInput, '15') // Above max quantity

      // Should show validation error
      expect(screen.getByText(/only 10 available/i)).toBeInTheDocument()
    })
  })

  describe('Item Removal', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
      })
      mockCartStore.items = [testItem]
      mockCartStore.itemCount = 1
    })

    it('removes item when remove button is clicked', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const removeButton = screen.getByRole('button', { name: /remove item/i })
      await user.click(removeButton)

      expect(mockCartStore.removeItem).toHaveBeenCalledWith('1')
    })

    it('shows confirmation dialog before removal', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const removeButton = screen.getByRole('button', { name: /remove item/i })
      await user.click(removeButton)

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('cancels removal when cancel is clicked', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const removeButton = screen.getByRole('button', { name: /remove item/i })
      await user.click(removeButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockCartStore.removeItem).not.toHaveBeenCalled()
    })
  })

  describe('Discounts', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product', price: 100 }),
        quantity: 1,
        totalPrice: 100,
      })

      mockCartStore.items = [testItem]
      mockCartStore.subtotal = 100
      mockCartStore.discount = 10
      mockCartStore.total = 90
    })

    it('displays discount amount', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText('Discount: -$10.00')).toBeInTheDocument()
    })

    it('shows discount application button', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const discountButton = screen.getByRole('button', { name: /apply discount/i })
      expect(discountButton).toBeInTheDocument()
    })

    it('opens discount dialog when button is clicked', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const discountButton = screen.getByRole('button', { name: /apply discount/i })
      await user.click(discountButton)

      expect(screen.getByText(/apply discount/i)).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /discount amount/i })).toBeInTheDocument()
    })

    it('applies percentage discount', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const discountButton = screen.getByRole('button', { name: /apply discount/i })
      await user.click(discountButton)

      const amountInput = screen.getByRole('textbox', { name: /discount amount/i })
      await user.type(amountInput, '10')

      const percentageRadio = screen.getByRole('radio', { name: /percentage/i })
      await user.click(percentageRadio)

      const applyButton = screen.getByRole('button', { name: /apply/i })
      await user.click(applyButton)

      expect(mockCartStore.applyDiscount).toHaveBeenCalledWith(10, 'percentage')
    })

    it('applies fixed discount', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const discountButton = screen.getByRole('button', { name: /apply discount/i })
      await user.click(discountButton)

      const amountInput = screen.getByRole('textbox', { name: /discount amount/i })
      await user.type(amountInput, '15')

      const fixedRadio = screen.getByRole('radio', { name: /fixed amount/i })
      await user.click(fixedRadio)

      const applyButton = screen.getByRole('button', { name: /apply/i })
      await user.click(applyButton)

      expect(mockCartStore.applyDiscount).toHaveBeenCalledWith(15, 'fixed')
    })

    it('removes discount when remove button is clicked', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const removeDiscountButton = screen.getByRole('button', { name: /remove discount/i })
      await user.click(removeDiscountButton)

      expect(mockCartStore.removeDiscount).toHaveBeenCalled()
    })
  })

  describe('Checkout Process', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
      })
      mockCartStore.items = [testItem]
      mockCartStore.total = 32.99
    })

    it('calls onCheckout when checkout button is clicked', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      await user.click(checkoutButton)

      expect(mockOnCheckout).toHaveBeenCalled()
    })

    it('validates stock before checkout', async () => {
      mockCartStore.validateStock.mockResolvedValue(false)

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      await user.click(checkoutButton)

      expect(mockCartStore.validateStock).toHaveBeenCalled()
      expect(mockOnCheckout).not.toHaveBeenCalled()
      expect(screen.getByText(/insufficient stock/i)).toBeInTheDocument()
    })

    it('shows loading state during checkout validation', async () => {
      mockCartStore.validateStock.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      )

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      await user.click(checkoutButton)

      expect(screen.getByText(/validating/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(mockOnCheckout).toHaveBeenCalled()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      const testItems = [
        createTestCartItem({
          product: createTestProduct({ id: '1', name: 'Product 1' }),
          quantity: 2,
        }),
        createTestCartItem({
          product: createTestProduct({ id: '2', name: 'Product 2' }),
          quantity: 1,
        }),
      ]
      mockCartStore.items = testItems
    })

    it('supports Tab navigation through cart items', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      await user.tab() // First quantity input
      expect(screen.getAllByRole('spinbutton')[0]).toHaveFocus()

      await user.tab() // Increase button
      expect(screen.getAllByRole('button')[0]).toHaveFocus()

      await user.tab() // Decrease button
      expect(screen.getAllByRole('button')[1]).toHaveFocus()
    })

    it('supports Enter key for quantity changes', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInput = screen.getAllByRole('spinbutton')[0]
      quantityInput.focus()

      await user.clear(quantityInput)
      await user.type(quantityInput, '5')
      await keyboardUtils.pressKey(user, 'Enter')

      expect(mockCartStore.updateQuantity).toHaveBeenCalledWith('1', 5)
    })

    it('supports Delete key for item removal', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const firstItem = screen.getByText('Product 1').closest('[data-testid="cart-item"]')
      firstItem?.focus()

      await keyboardUtils.pressKey(user, 'Delete')

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
      })
      mockCartStore.items = [testItem]
    })

    it('has proper ARIA labels', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInput = screen.getByRole('spinbutton')
      expect(checkAccessibility.hasAriaLabel(quantityInput)).toBeTruthy()

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i })
      expect(checkAccessibility.hasAriaLabel(increaseButton)).toBeTruthy()
    })

    it('announces quantity changes to screen readers', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i })
      await user.click(increaseButton)

      // Should have live region for announcements
      const liveRegion = screen.getByRole('status', { name: /cart updates/i })
      expect(liveRegion).toBeInTheDocument()
    })

    it('has proper heading hierarchy', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const cartHeading = screen.getByRole('heading', { name: /shopping cart/i })
      expect(cartHeading).toBeInTheDocument()
      expect(cartHeading).toHaveAttribute('aria-level', '2')
    })

    it('supports keyboard shortcuts help', () => {
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      expect(screen.getByText(/press delete to remove item/i)).toBeInTheDocument()
      expect(screen.getByText(/enter to update quantity/i)).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large number of items efficiently', () => {
      const largeItemList = Array.from({ length: 100 }, (_, i) =>
        createTestCartItem({
          product: createTestProduct({ id: i.toString(), name: `Product ${i}` }),
        })
      )
      mockCartStore.items = largeItemList

      const startTime = performance.now()
      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should render quickly
    })

    it('virtualizes long cart lists', () => {
      const largeItemList = Array.from({ length: 100 }, (_, i) =>
        createTestCartItem({
          product: createTestProduct({ id: i.toString(), name: `Product ${i}` }),
        })
      )
      mockCartStore.items = largeItemList

      renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      // Should only render visible items (assuming virtualization is implemented)
      const renderedItems = screen.getAllByTestId('cart-item')
      expect(renderedItems.length).toBeLessThan(100)
    })

    it('debounces quantity input changes', async () => {
      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const quantityInput = screen.getByRole('spinbutton')
      
      await user.clear(quantityInput)
      await user.type(quantityInput, '12345', { delay: 10 })

      // Should only call updateQuantity once after debounce
      await waitFor(() => {
        expect(mockCartStore.updateQuantity).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      const testItem = createTestCartItem({
        product: createTestProduct({ id: '1', name: 'Test Product' }),
      })
      mockCartStore.items = [testItem]
    })

    it('handles quantity update errors', async () => {
      mockCartStore.updateQuantity.mockResolvedValue(false)

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i })
      await user.click(increaseButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to update quantity/i)).toBeInTheDocument()
      })
    })

    it('handles item removal errors', async () => {
      mockCartStore.removeItem.mockImplementation(() => {
        throw new Error('Remove failed')
      })

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const removeButton = screen.getByRole('button', { name: /remove item/i })
      await user.click(removeButton)

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to remove item/i)).toBeInTheDocument()
      })
    })

    it('handles checkout validation errors', async () => {
      mockCartStore.validateStock.mockRejectedValue(new Error('Validation failed'))

      const { user } = renderWithProviders(<ShoppingCart onCheckout={mockOnCheckout} />)

      const checkoutButton = screen.getByRole('button', { name: /checkout/i })
      await user.click(checkoutButton)

      await waitFor(() => {
        expect(screen.getByText(/checkout validation failed/i)).toBeInTheDocument()
      })
    })
  })
})