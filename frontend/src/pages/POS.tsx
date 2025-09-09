import { useState } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import type { Product } from '@/types/inventory'

interface POSProps {
  sessionId?: string
}

export function POS(_props: POSProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const handleProductSelect = (product: Product) => {
    console.log('Product selected:', product)
    // Add to cart logic would go here
    setSelectedProducts(prev => [...prev, product])
  }

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode)
    // Additional barcode handling logic would go here
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
              
              {/* Debug info for testing */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Selected Products (Debug):</h3>
                  <div className="space-y-1">
                    {selectedProducts.map((product, index) => (
                      <div key={`${product.id}-${index}`} className="text-xs text-gray-600">
                        {product.name} - ${product.price} ({product.stock_quantity} in stock)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Shopping Cart Area */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>
            <div className="h-full flex items-center justify-center text-gray-500">
              Shopping cart component will go here
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}