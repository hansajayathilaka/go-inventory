import { useState, useEffect, useCallback } from 'react';
import { Search, Scan, X, Filter, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productService, type Product } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { usePOSCartStore } from '@/stores/pos/posCartStore';
import { BarcodeScanner } from '../BarcodeScanner/BarcodeScanner';
import { barcodeService } from '@/services/pos/barcodeService';
import type { BarcodeResult, BarcodeProductLookup } from '@/types/pos/barcode';
import type { Category } from '@/types/category';

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
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  const { addItem } = usePOSCartStore();

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const hierarchy = await categoryService.getCategoryHierarchy();
      // Flatten the hierarchy to get all categories
      const flatCategories = flattenCategories(hierarchy);
      setCategories(flatCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const flattenCategories = (category: any): Category[] => {
    const result: Category[] = [];
    if (category.id) {
      result.push(category);
    }
    if (category.children) {
      category.children.forEach((child: any) => {
        result.push(...flattenCategories(child));
      });
    }
    return result;
  };

  // Enhanced search function with filters
  const performSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      let results: Product[] = [];

      if (query.trim() || selectedCategoryId !== 'all' || stockFilter !== 'all' || priceRange !== 'all') {
        results = await productService.posLookup(query || '', 20);

        // Apply client-side filters
        if (stockFilter !== 'all') {
          results = results.filter(product => {
            const stock = product.quantity || product.stock_quantity || 0;
            switch (stockFilter) {
              case 'in_stock': return stock > 0;
              case 'low_stock': return stock > 0 && stock <= 10;
              case 'out_of_stock': return stock === 0;
              default: return true;
            }
          });
        }

        if (selectedCategoryId !== 'all') {
          results = results.filter(product => (product as any).category_id === selectedCategoryId);
        }

        if (priceRange !== 'all') {
          const getPrice = (product: Product) => product.retail_price || product.price || 0;
          results = results.filter(product => {
            switch (priceRange) {
              case 'under_10': return getPrice(product) < 10;
              case '10_50': return getPrice(product) >= 10 && getPrice(product) <= 50;
              case '50_100': return getPrice(product) >= 50 && getPrice(product) <= 100;
              case 'over_100': return getPrice(product) > 100;
              default: return true;
            }
          });
        }
      }

      setSearchResults(results.map((product, index) => ({
        ...product,
        highlighted: index === 0
      })));
      setShowResults(results.length > 0 || query.trim().length > 0);
      setSelectedIndex(results.length > 0 ? 0 : -1);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, stockFilter, priceRange]);

  // Debounce search with useEffect - trigger on query or filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategoryId, stockFilter, priceRange, performSearch]);

  const clearAllFilters = () => {
    setSelectedCategoryId('all');
    setStockFilter('all');
    setPriceRange('all');
  };

  const hasActiveFilters = selectedCategoryId !== 'all' || stockFilter !== 'all' || priceRange !== 'all';

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
    setShowBarcodeScanner(true);
  };

  const handleBarcodeDetected = async (result: BarcodeResult, productLookup?: BarcodeProductLookup) => {
    if (productLookup?.found && productLookup.productId) {
      // Product found, add to cart directly
      if (activeSessionId) {
        addItem(activeSessionId, {
          productId: productLookup.productId,
          productName: productLookup.productName || 'Unknown Product',
          productSku: result.text,
          price: productLookup.price || 0,
        });

        // Create a mock product for the callback
        const product: Product = {
          id: productLookup.productId,
          name: productLookup.productName || 'Unknown Product',
          sku: result.text,
          barcode: result.text,
          retail_price: productLookup.price || 0,
          quantity: 1,
          is_active: true
        };

        onProductSelect?.(product);
      }
    } else {
      // Product not found, use the barcode as search query
      const formattedBarcode = barcodeService.formatBarcodeForDisplay(result.text, result.format);
      setSearchQuery(formattedBarcode);

      // Trigger search with the barcode
      performSearch(result.text);
    }

    setShowBarcodeScanner(false);
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-1 ${hasActiveFilters ? 'bg-primary text-primary-foreground' : ''}`}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
              {[selectedCategoryId, stockFilter, priceRange].filter(val => val !== 'all').length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="mt-3 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Category</label>
              </div>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Stock Status</label>
              </div>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock (≤10)</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="h-4 w-4 text-muted-foreground">$</span>
                <label className="text-sm font-medium">Price Range</label>
              </div>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
                  <SelectItem value="under_10">Under $10</SelectItem>
                  <SelectItem value="10_50">$10 - $50</SelectItem>
                  <SelectItem value="50_100">$50 - $100</SelectItem>
                  <SelectItem value="over_100">Over $100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Actions */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                {selectedCategoryId !== 'all' && (
                  <Badge variant="outline">
                    Category: {categories.find(c => c.id === selectedCategoryId)?.name}
                  </Badge>
                )}
                {stockFilter !== 'all' && (
                  <Badge variant="outline">
                    Stock: {stockFilter.replace('_', ' ')}
                  </Badge>
                )}
                {priceRange !== 'all' && (
                  <Badge variant="outline">
                    Price: {priceRange.replace('_', ' - $')}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

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

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
        config={{
          autoClose: true,
          beepOnSuccess: true,
          vibrate: true
        }}
      />
    </div>
  );
}