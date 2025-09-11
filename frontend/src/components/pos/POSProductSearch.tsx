import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { productService, type Product } from '@/services/productService'

interface POSProductSearchProps {
  onProductSelect: (product: Product) => void
  className?: string
}

export function POSProductSearch({ onProductSelect, className }: POSProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial products
  useEffect(() => {
    loadInitialProducts()
  }, [])

  const loadInitialProducts = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const products = await productService.getPOSReadyProducts(20)
      setProducts(products)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }

  // Search products
  useEffect(() => {
    if (!searchTerm.trim()) {
      loadInitialProducts()
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const results = await productService.posLookup(searchTerm, 20)
        setProducts(results)
      } catch (err) {
        console.error('Search failed:', err)
        setError('Search failed')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  const handleProductSelect = (product: Product) => {
    onProductSelect(product)
    setSearchTerm('')
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products by name, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="text-red-600 text-sm">
            {error}
            <Button 
              variant="link" 
              size="sm" 
              onClick={loadInitialProducts}
              className="ml-2 p-0 h-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4 text-gray-500">
            Loading products...
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="p-3">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{product.name}</div>
                    {product.sku && (
                      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-600">
                        ${(product.retail_price || product.price || 0).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.quantity || product.stock_quantity || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && products.length === 0 && !error && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
          </div>
        )}
      </div>
    </div>
  )
}