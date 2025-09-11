import { useState, useCallback } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { ShoppingCart } from '@/components/pos/ShoppingCart'
import { useCartActions } from '@/stores/posCartStore'
import type { Product } from '@/types/inventory'

interface POSProps {
  sessionId?: string
}

export function POSWorking(_props: POSProps) {
  const [showPayment, setShowPayment] = useState(false)
  const { addItem } = useCartActions()

  const handleProductSelect = useCallback(async (product: Product) => {
    console.log('Product selected:', product)
    try {
      const success = await addItem(product, 1)
      if (!success) {
        console.error('Failed to add product to cart - check stock availability')
      }
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
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">💳 Payment Processing</h2>
            <p className="text-gray-600 mb-6">
              Payment integration will be implemented here.
            </p>
            <div className="space-x-4">
              <button 
                onClick={handlePaymentComplete}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Complete Sale
              </button>
              <button 
                onClick={() => setShowPayment(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to POS
              </button>
            </div>
          </div>
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}