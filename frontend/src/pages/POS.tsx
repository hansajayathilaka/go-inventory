import { useState, useCallback } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { ShoppingCart } from '@/components/pos/ShoppingCart'
import { PaymentForm } from '@/components/pos/PaymentForm'
import { useCartActions, useCartTotals } from '@/stores/posCartStore'
import type { Product } from '@/types/inventory'

interface POSProps {
  sessionId?: string
}

export function POS(_props: POSProps) {
  const [showPayment, setShowPayment] = useState(false)
  const { addItem } = useCartActions()
  const { total } = useCartTotals()

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
    // The payment form should handle clearing the cart
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
          {/* Product Search Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Product Search</h2>
            <div className="space-y-4">
              <ProductSearch
                onProductSelect={handleProductSelect}
                onBarcodeScanned={handleBarcodeScanned}
                autoFocus={true}
              />
            </div>
          </div>
          
          {/* Shopping Cart Area */}
          <div className="flex flex-col h-full">
            <ShoppingCart 
              onCheckout={handleCheckout}
              showCheckoutButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}