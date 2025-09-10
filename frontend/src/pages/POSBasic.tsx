import { useState } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import { BasicCart } from '@/components/pos/BasicCart'
import { useAddItem } from '@/stores/basicCartStore'
import type { Product } from '@/types/inventory'

export function POSBasic() {
  const [showPayment, setShowPayment] = useState(false)
  const addItem = useAddItem()

  const handleProductSelect = (product: Product) => {
    console.log('Adding product:', product)
    addItem(product, 1)
  }

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode)
  }

  const handleCheckout = () => {
    setShowPayment(true)
  }

  if (showPayment) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg border p-6 text-center">
          <h2 className="text-xl font-bold mb-4">💳 Checkout</h2>
          <p className="mb-6">Payment processing placeholder</p>
          <div className="space-x-4">
            <button 
              onClick={() => setShowPayment(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Back
            </button>
            <button 
              onClick={() => {
                setShowPayment(false)
                // Would clear cart here after successful payment
              }}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Complete
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Point of Sale</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">Product Search</h2>
              <ProductSearch
                onProductSelect={handleProductSelect}
                onBarcodeScanned={handleBarcodeScanned}
                autoFocus={true}
              />
            </div>
          </div>
          
          <div>
            <BasicCart onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  )
}