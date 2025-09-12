import { useState, useCallback, useEffect } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { ShoppingCart } from '@/components/pos/ShoppingCart'
import { PaymentForm } from '@/components/pos/PaymentForm'
import { CustomerSelect } from '@/components/pos/CustomerSelect'
import { useCartActions, useCartTotals, useCartItems } from '@/stores/posCartStore'
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks'
import type { Product, Customer } from '@/types/inventory'

interface POSProps {
  sessionId?: string
}

export function POS(_props: POSProps) {
  const [showPayment, setShowPayment] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const { addItem } = useCartActions()
  const { total } = useCartTotals()
  const cartItems = useCartItems()

  const [currentFocus, setCurrentFocus] = useState<'product' | 'customer' | 'cart' | 'checkout'>('product')

  const handleProductSelect = useCallback(async (product: Product) => {
    console.log('Product selected:', product)
    try {
      await addItem(product, 1)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
    }
  }, [addItem])

  const handleBarcodeScanned = useCallback((barcode: string) => {
    console.log('Barcode scanned:', barcode)
    // Additional barcode handling logic would go here
  }, [])

  const handleCheckout = useCallback(() => {
    setShowPayment(true)
  }, [])

  const handlePaymentComplete = useCallback(() => {
    setShowPayment(false)
    setSelectedCustomer(null)
    setCurrentFocus('product')
    // The payment form should handle clearing the cart
  }, [])

  // Tab navigation handlers
  const navigateNext = useCallback(() => {
    switch (currentFocus) {
      case 'product': {
        setCurrentFocus('customer')
        const customerButton = document.querySelector('[data-testid="customer-search-input"], [aria-expanded="true"]') as HTMLElement
        if (customerButton) customerButton.focus()
        break
      }
      case 'customer': {
        setCurrentFocus('cart')
        // Focus cart area - scroll into view
        const cartArea = document.querySelector('[data-testid="shopping-cart"]') as HTMLElement
        if (cartArea) cartArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
      case 'cart': {
        if (cartItems.length > 0) {
          setCurrentFocus('checkout')
          const checkoutButton = document.querySelector('[data-testid="checkout-button"]') as HTMLButtonElement
          if (checkoutButton) checkoutButton.focus()
        }
        break
      }
      case 'checkout': {
        setCurrentFocus('product')
        const productSearch = document.querySelector('[data-testid="product-search-input"]') as HTMLInputElement
        if (productSearch) productSearch.focus()
        break
      }
    }
  }, [currentFocus, cartItems.length])

  const navigatePrev = useCallback(() => {
    switch (currentFocus) {
      case 'product': {
        if (cartItems.length > 0) {
          setCurrentFocus('checkout')
          const checkoutButton = document.querySelector('[data-testid="checkout-button"]') as HTMLButtonElement
          if (checkoutButton) checkoutButton.focus()
        }
        break
      }
      case 'customer': {
        setCurrentFocus('product')
        const productSearch = document.querySelector('[data-testid="product-search-input"]') as HTMLInputElement
        if (productSearch) productSearch.focus()
        break
      }
      case 'cart': {
        setCurrentFocus('customer')
        const customerButton = document.querySelector('[data-testid="customer-search-input"], [aria-expanded="true"]') as HTMLElement
        if (customerButton) customerButton.focus()
        break
      }
      case 'checkout': {
        setCurrentFocus('cart')
        const cartArea = document.querySelector('[data-testid="shopping-cart"]') as HTMLElement
        if (cartArea) cartArea.scrollIntoView({ behavior: 'smooth', block: 'center' })
        break
      }
    }
  }, [currentFocus, cartItems.length])

  // Keyboard shortcut handlers for global navigation
  const shortcutHandlers: ShortcutHandlers = {
    onNavigateNext: navigateNext,
    onNavigatePrev: navigatePrev
  }

  // Initialize keyboard shortcuts for POS navigation
  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.GLOBAL,
    handlers: shortcutHandlers,
    enabled: !showPayment
  })

  // Auto-focus product search on component mount
  useEffect(() => {
    const productSearch = document.querySelector('[data-testid="product-search-input"]') as HTMLInputElement
    if (productSearch) {
      productSearch.focus()
    }
  }, [])

  if (showPayment) {
    return (
      <div className="h-full p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <PaymentForm 
            totalAmount={total}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setShowPayment(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Point of Sale System
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column - Product Search and Customer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search Area */}
            <section id="product-search" className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
                Product Search
                <span className="text-sm font-normal text-muted-foreground">
                  Tab/Shift+Tab to navigate sections
                </span>
              </h2>
              <div className="space-y-4">
                <ProductSearch
                  onProductSelect={handleProductSelect}
                  onBarcodeScanned={handleBarcodeScanned}
                  autoFocus={true}
                />
              </div>
            </section>

            {/* Customer Selection */}
            <section id="customer-select" className="bg-white rounded-lg shadow-sm border p-4">
              <CustomerSelect
                selectedCustomer={selectedCustomer}
                onCustomerSelect={setSelectedCustomer}
              />
            </section>
          </div>
          
          {/* Right Column - Shopping Cart */}
          <section className="flex flex-col h-full">
            <div id="shopping-cart" data-testid="shopping-cart">
              <ShoppingCart 
                onCheckout={handleCheckout}
                showCheckoutButton={true}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}