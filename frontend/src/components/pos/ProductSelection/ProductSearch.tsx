import { useState, useEffect, useCallback } from 'react';
import { Search, Scan, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { productService, type Product } from '@/services/productService';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface ProductSearchProps {
  activeSessionId: string | null;
  onProductSelect?: (product: Product) => void;
}

interface SearchResult extends Product {
  highlighted?: boolean;
}

export function ProductSearch({ activeSessionId, onProductSelect }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { addItem } = usePOSCartStore();

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use the optimized POS lookup for better performance
      const results = await productService.posLookup(query, 10);
      setSearchResults(results.map((product, index) => ({
        ...product,
        highlighted: index === 0 // Highlight first result by default
      })));
      setShowResults(true);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search with useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleProductSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleProductSelect = (product: Product) => {
    if (!activeSessionId) return;

    // Add to cart
    addItem(activeSessionId, {
      productId: product.id,
      productName: product.name,
      productSku: product.sku || '',
      price: product.retail_price || product.price || 0,
    });

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);

    // Callback for additional handling
    onProductSelect?.(product);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleBarcodeScanner = () => {
    // TODO: Implement barcode scanner integration
    console.log('Barcode scanner not yet implemented');
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products, SKU, or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBarcodeScanner}
          className="flex items-center space-x-1"
        >
          <Scan className="h-4 w-4" />
          <span>Scan</span>
        </Button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="p-2">
            <div className="text-sm text-muted-foreground">Searching...</div>
          </Card>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="max-h-96 overflow-y-auto shadow-lg">
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </div>
              <div className="space-y-1">
                {searchResults.map((product, index) => (
                  <div
                    key={product.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>SKU: {product.sku || 'N/A'}</span>
                          {product.barcode && (
                            <span>• Barcode: {product.barcode}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Stock: {product.quantity || product.stock_quantity || 0}
                          </Badge>
                          {product.quick_sale && (
                            <Badge variant="secondary" className="text-xs">
                              Quick Sale
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          ${(product.retail_price || product.price || 0).toFixed(2)}
                        </div>
                        {product.cost_price && (
                          <div className="text-xs text-muted-foreground">
                            Cost: ${product.cost_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !isLoading && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground text-center">
              No products found for "{searchQuery}"
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}