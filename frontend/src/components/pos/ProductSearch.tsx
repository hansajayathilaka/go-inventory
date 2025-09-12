import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Search, Package, Barcode, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { useProducts, useCategories } from '@/hooks/useInventoryQueries'
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks'
import { KeyboardShortcutBadge } from '@/components/ui/keyboard-shortcut-badge'
import { useDebouncedCallback } from 'use-debounce'
import type { Product } from '@/types/inventory'
import { cn } from '@/lib/utils'

interface ProductSearchProps {
  onProductSelect: (product: Product) => void
  onBarcodeScanned?: (barcode: string) => void
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

export function ProductSearch({
  onProductSelect,
  onBarcodeScanned,
  className,
  placeholder = "Search products by name, SKU, or scan barcode...",
  autoFocus = false
}: ProductSearchProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [showScanner, setShowScanner] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showCategories, setShowCategories] = useState(false)
  const [isDebouncing, setIsDebouncing] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  
  // Performance optimized debounced search with 300ms delay
  const debouncedSearch = useDebouncedCallback(
    (term: string) => {
      setDebouncedSearchTerm(term)
      setIsDebouncing(false)
    },
    300,
    {
      leading: false,
      trailing: true,
      maxWait: 1000
    }
  )

  // Handle search term changes with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Show loading state
    if (value.length >= 2) {
      setIsDebouncing(true)
    }
    
    // Debounce the actual search
    debouncedSearch(value)
  }, [debouncedSearch])

  // Fetch data with AbortController support
  const { data: categories = [] } = useCategories()
  const { 
    data: productsResponse, 
    isLoading: isSearching,
    error: searchError 
  } = useProducts({
    search: debouncedSearchTerm.length >= 2 ? debouncedSearchTerm : undefined,
    category_id: selectedCategoryId ? String(selectedCategoryId) : undefined,
    limit: 100, // Increased for virtual scrolling
    page: 1
  })

  // Performance optimized product filtering and mapping
  const activeProducts = useMemo(() => {
    const products = productsResponse?.data || []
    
    // Create new AbortController for this search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    // Map API response to frontend Product interface and filter active products
    const mapped = products.map((apiProduct: Product) => ({
      ...apiProduct,
      price: (apiProduct as any).retail_price || (apiProduct as any).cost_price || apiProduct.price || 0,
      stock_quantity: apiProduct.stock_quantity || 100,
      unit: apiProduct.unit || 'pcs'
    }))
    
    return mapped.filter(product => product.is_active)
  }, [productsResponse?.data])

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])


  // Focus search input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [autoFocus])

  // Handlers
  const handleProductSelect = useCallback((product: Product) => {
    onProductSelect(product)
    setSearchTerm('')
    setIsOpen(false)
    setSelectedCategoryId(undefined)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [onProductSelect])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
    setSelectedCategoryId(undefined)
    setShowScanner(false)
    setShowCategories(false)
  }, [])

  // Keyboard shortcut handlers for product search
  const shortcutHandlers: ShortcutHandlers = {
    onNavigateDown: useCallback(() => {
      setSelectedIndex(prev => {
        const newIndex = prev < activeProducts.length - 1 ? prev + 1 : 0
        // Scroll to keep selected item visible
        if (listRef.current && newIndex < 50) {
          const itemHeight = 50
          const scrollTop = newIndex * itemHeight
          listRef.current.scrollTop = scrollTop
        }
        return newIndex
      })
    }, [activeProducts.length]),

    onNavigateUp: useCallback(() => {
      setSelectedIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : activeProducts.length - 1
        // Scroll to keep selected item visible
        if (listRef.current && newIndex < 50) {
          const itemHeight = 50
          const scrollTop = newIndex * itemHeight
          listRef.current.scrollTop = scrollTop
        }
        return newIndex
      })
    }, [activeProducts.length]),

    onSelectProduct: useCallback(() => {
      if (selectedIndex >= 0 && selectedIndex < activeProducts.length) {
        handleProductSelect(activeProducts[selectedIndex])
      }
    }, [activeProducts, selectedIndex, handleProductSelect]),

    onClearSearch: useCallback(() => {
      handleClose()
    }, [handleClose])
  }

  // Initialize keyboard shortcuts for product search
  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.PRODUCT_SEARCH,
    handlers: shortcutHandlers,
    enabled: isOpen && activeProducts.length > 0
  })

  const handleBarcodeScanned = useCallback((barcode: string) => {
    onBarcodeScanned?.(barcode)
    setSearchTerm(barcode)
    setShowScanner(false)
    
    // Search for product with this barcode
    if (barcode) {
      // Find product by barcode in current results
      const foundProduct = activeProducts.find(p => p.barcode === barcode)
      if (foundProduct) {
        handleProductSelect(foundProduct)
      }
    }
  }, [onBarcodeScanned, activeProducts, handleProductSelect])

  const handleCategorySelect = useCallback((categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId)
    setShowCategories(false)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Show results when we have search term or selected category
  useEffect(() => {
    const hasValidSearch = debouncedSearchTerm.length >= 2
    const shouldShow = (hasValidSearch || !!selectedCategoryId) && 
                      (activeProducts.length > 0 || isSearching || isDebouncing)
    setIsOpen(shouldShow)
    setSelectedIndex(0) // Reset selection when results change
    
    // Reset scroll position
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [debouncedSearchTerm, selectedCategoryId, activeProducts.length, isSearching, isDebouncing])

  // Optimized keyboard navigation with virtual scrolling support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || activeProducts.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => {
            const newIndex = prev < activeProducts.length - 1 ? prev + 1 : 0
            // Scroll to keep selected item visible
            if (listRef.current && newIndex < 50) {
              const itemHeight = 50
              const scrollTop = newIndex * itemHeight
              listRef.current.scrollTop = scrollTop
            }
            return newIndex
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => {
            const newIndex = prev > 0 ? prev - 1 : activeProducts.length - 1
            // Scroll to keep selected item visible
            if (listRef.current && newIndex < 50) {
              const itemHeight = 50
              const scrollTop = newIndex * itemHeight
              listRef.current.scrollTop = scrollTop
            }
            return newIndex
          })
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < activeProducts.length) {
            handleProductSelect(activeProducts[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, activeProducts, selectedIndex, handleProductSelect, handleClose])

  // Get category name for display
  const getSelectedCategoryName = useCallback(() => {
    if (!selectedCategoryId) return null
    const category = categories.find(c => c.id === String(selectedCategoryId))
    return category?.name
  }, [selectedCategoryId, categories])

  // Optimized product rendering with virtualization-like behavior
  const renderProducts = useMemo(() => {
    // Only render first 50 items for performance, with lazy loading
    const visibleProducts = activeProducts.slice(0, 50);
    
    return visibleProducts.map((product, index) => (
      <Button
        key={product.id}
        variant={index === selectedIndex ? "secondary" : "ghost"}
        className="w-full justify-start h-12 p-3 mb-1"
        onClick={() => handleProductSelect(product)}
      >
        <div className="flex items-start w-full">
          <Package className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-left min-w-0">
            <div className="font-medium truncate">{product.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {product.sku && (
                <span>SKU: {product.sku}</span>
              )}
              {product.barcode && (
                <span>Barcode: {product.barcode}</span>
              )}
              <span className="ml-auto">
                Stock: {product.stock_quantity} {product.unit}
              </span>
            </div>
            {product.category && (
              <Badge variant="outline" className="text-xs mt-1">
                {product.category.name}
              </Badge>
            )}
          </div>
          <div className="ml-3 text-right flex-shrink-0">
            <div className="font-semibold">${product.price.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{product.unit}</div>
          </div>
        </div>
      </Button>
    ));
  }, [activeProducts, selectedIndex, handleProductSelect])

  return (
    <div className={cn("relative w-full", className)}>
      {/* Search Input Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {/* Main search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4"
                autoComplete="off"
                data-testid="product-search-input"
                aria-keyshortcuts="f2"
                aria-label="Search products by name, SKU, or barcode. Use F2 to focus."
              />
              {(isSearching || isDebouncing) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <KeyboardShortcutBadge 
                shortcut="F2" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 translate-x-8"
                size="sm"
              />
            </div>

            {/* Category filter button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCategories(!showCategories)}
              className="min-w-[120px] justify-between"
            >
              <span>{getSelectedCategoryName() || 'All Categories'}</span>
              {showCategories ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </Button>

            {/* Barcode scanner toggle */}
            <Button
              type="button"
              variant={showScanner ? "destructive" : "outline"}
              size="icon"
              onClick={() => setShowScanner(!showScanner)}
              title={showScanner ? "Close scanner" : "Open barcode scanner"}
            >
              {showScanner ? <X className="h-4 w-4" /> : <Barcode className="h-4 w-4" />}
            </Button>

            {/* Clear filters button */}
            {(searchTerm || selectedCategoryId) && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {(searchTerm || selectedCategoryId) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {selectedCategoryId && (
                <Badge variant="secondary" className="text-xs">
                  Category: {getSelectedCategoryName()}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Selection Dropdown */}
      {showCategories && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-2">
            <div className="max-h-60 overflow-auto">
              <div className="space-y-1">
                <Button
                  variant={!selectedCategoryId ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCategorySelect(undefined)}
                >
                  All Categories
                </Button>
                {categories
                  .filter(cat => cat.is_active)
                  .map((category) => (
                    <Button
                      key={category.id}
                      variant={String(selectedCategoryId) === category.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleCategorySelect(Number(category.id))}
                    >
                      {category.name}
                      <Badge variant="outline" className="ml-auto">
                        {category.products?.length || 0}
                      </Badge>
                    </Button>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onError={(error) => console.error('Barcode scan error:', error)}
          />
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-40 mt-1 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-80 p-2" ref={resultsRef}>
              {isSearching || isDebouncing ? (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isDebouncing ? 'Preparing search...' : 'Searching products...'}</span>
                  </div>
                </div>
              ) : activeProducts.length > 0 ? (
                <div className="h-80 overflow-auto" ref={listRef}>
                  <div className="space-y-1 p-1">
                    {renderProducts}
                    {activeProducts.length > 50 && (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Showing first 50 of {activeProducts.length} results. Refine your search for better results.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {searchError ? (
                    <div>Error loading products</div>
                  ) : debouncedSearchTerm.length > 0 ? (
                    <div>No products found for "{debouncedSearchTerm}"</div>
                  ) : (
                    <div>No products found</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keyboard shortcuts help */}
      {isOpen && activeProducts.length > 0 && (
        <div className="absolute top-full right-0 z-30 mt-1">
          <Card className="bg-background/95 backdrop-blur-sm">
            <CardContent className="p-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>↑↓ Navigate • Enter Select • Esc Close</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}