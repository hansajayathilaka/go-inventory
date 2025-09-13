import { useState } from 'react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import type { Product } from '@/types/inventory'
import { getDisplayPrice, getStockQuantity } from '@/utils/productUtils'

interface POSProps {
  sessionId?: string
}

export function POSMinimal(_props: POSProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const handleProductSelect = (product: Product) => {
    console.log('Product selected:', product)
    setSelectedProducts(prev => [...prev, product])
  }

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode)
  }

  return (
    <div className="h-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Point of Sale System - Minimal Mode
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
              
              {/* Selected Products Display */}
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Selected Products:</h3>
                  <div className="space-y-1">
                    {selectedProducts.map((product, index) => (
                      <div key={`${product.id}-${index}`} className="text-xs text-gray-600 flex justify-between">
                        <span>{product.name}</span>
                        <span>${getDisplayPrice(product)} (Stock: {getStockQuantity(product)})</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-sm font-semibold">
                      Total Items: {selectedProducts.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Simple Cart Area */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Cart (Minimal)</h2>
            <div className="text-center text-gray-500">
              <p className="mb-2">🛒 Simple Cart</p>
              <p className="text-sm">
                Products will appear here as you select them.
                This version avoids the complex cart store to prevent infinite loops.
              </p>
              
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-800 font-medium">{selectedProducts.length} items selected</p>
                  <button 
                    onClick={() => setSelectedProducts([])}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}