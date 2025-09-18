import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { productService, type Product, type ProductSearchParams } from '@/services/productService';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface ProductGridProps {
  activeSessionId: string | null;
  searchQuery?: string;
  selectedCategoryId?: string | null;
  onProductSelect?: (product: Product) => void;
}

export function ProductGrid({
  activeSessionId,
  searchQuery = '',
  selectedCategoryId,
  onProductSelect
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { addItem } = usePOSCartStore();

  const loadProducts = useCallback(async (page = 1, reset = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const params: ProductSearchParams = {
        page,
        limit: 20,
        is_active: true
      };

      // Add search query if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter if selected
      if (selectedCategoryId) {
        params.category_id = parseInt(selectedCategoryId);
      }

      const response = await productService.searchProducts(params);

      setProducts(prev => reset ? (response.products || []) : [...(prev || []), ...(response.products || [])]);
      setHasMore(response.has_more);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
      // Use mock data for development
      if (page === 1) {
        setProducts(getMockProducts());
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategoryId]);

  const getMockProducts = (): Product[] => [
    {
      id: '1',
      name: 'Brake Pads - Front Set',
      sku: 'BP-FRONT-001',
      barcode: '1234567890123',
      retail_price: 45.99,
      cost_price: 25.00,
      quantity: 15,
      tax_category: 'standard',
      quick_sale: true,
      is_active: true,
      price: 45.99,
      stock_quantity: 15
    },
    {
      id: '2',
      name: 'Motor Oil 5W-30',
      sku: 'OIL-5W30-4L',
      barcode: '1234567890124',
      retail_price: 32.99,
      cost_price: 18.50,
      quantity: 48,
      tax_category: 'standard',
      quick_sale: false,
      is_active: true,
      price: 32.99,
      stock_quantity: 48
    },
    {
      id: '3',
      name: 'Air Filter',
      sku: 'AF-STD-001',
      barcode: '1234567890125',
      retail_price: 18.99,
      cost_price: 10.00,
      quantity: 25,
      tax_category: 'standard',
      quick_sale: false,
      is_active: true,
      price: 18.99,
      stock_quantity: 25
    },
    {
      id: '4',
      name: 'Spark Plugs (Set of 4)',
      sku: 'SP-SET4-001',
      barcode: '1234567890126',
      retail_price: 28.99,
      cost_price: 16.00,
      quantity: 12,
      tax_category: 'standard',
      quick_sale: true,
      is_active: true,
      price: 28.99,
      stock_quantity: 12
    },
    {
      id: '5',
      name: 'Windshield Wipers',
      sku: 'WW-24IN-001',
      barcode: '1234567890127',
      retail_price: 22.99,
      cost_price: 12.50,
      quantity: 8,
      tax_category: 'standard',
      quick_sale: false,
      is_active: true,
      price: 22.99,
      stock_quantity: 8
    },
    {
      id: '6',
      name: 'Car Battery',
      sku: 'BAT-12V-001',
      barcode: '1234567890128',
      retail_price: 89.99,
      cost_price: 55.00,
      quantity: 6,
      tax_category: 'standard',
      quick_sale: false,
      is_active: true,
      price: 89.99,
      stock_quantity: 6
    },
    {
      id: '7',
      name: 'Tire Pressure Gauge',
      sku: 'TPG-DIGITAL-001',
      barcode: '1234567890129',
      retail_price: 15.99,
      cost_price: 8.00,
      quantity: 20,
      tax_category: 'standard',
      quick_sale: true,
      is_active: true,
      price: 15.99,
      stock_quantity: 20
    },
    {
      id: '8',
      name: 'Coolant Fluid',
      sku: 'COOL-1L-001',
      barcode: '1234567890130',
      retail_price: 12.99,
      cost_price: 7.50,
      quantity: 35,
      tax_category: 'standard',
      quick_sale: false,
      is_active: true,
      price: 12.99,
      stock_quantity: 35
    }
  ];

  // Reload products when search or category changes
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  const handleProductClick = (product: Product) => {
    if (!activeSessionId) return;

    // Add to cart
    addItem(activeSessionId, {
      productId: product.id,
      productName: product.name,
      productSku: product.sku || '',
      price: product.retail_price || product.price || 0,
    });

    // Callback for additional handling
    onProductSelect?.(product);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadProducts(currentPage + 1, false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 5) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'outline' as const };
  };

  if (error && (!products || products.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Failed to load products</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadProducts(1, true)}>
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading && (!products || products.length === 0)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="aspect-square bg-muted rounded-md mb-2"></div>
            <div className="h-4 bg-muted rounded mb-1"></div>
            <div className="h-3 bg-muted rounded mb-2"></div>
            <div className="h-5 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No products found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery
            ? `No products match "${searchQuery}"`
            : selectedCategoryId
            ? 'No products in this category'
            : 'No products available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(products || []).map((product) => {
          const stockStatus = getStockStatus(product.quantity || product.stock_quantity || 0);
          const price = product.retail_price || product.price || 0;

          return (
            <Card
              key={product.id}
              className="p-4 cursor-pointer hover:bg-accent transition-colors group"
              onClick={() => handleProductClick(product)}
            >
              <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    SKU: {product.sku || 'N/A'}
                  </p>

                  <div className="flex items-center justify-between">
                    <Badge variant={stockStatus.variant} className="text-xs">
                      {stockStatus.label}
                    </Badge>
                    {product.quick_sale && (
                      <Badge variant="secondary" className="text-xs">
                        Quick
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-semibold text-primary">
                    ${price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.quantity || product.stock_quantity || 0}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Products'}
          </Button>
        </div>
      )}

      {/* Loading indicator for additional products */}
      {isLoading && products && products.length > 0 && (
        <div className="flex justify-center">
          <div className="text-sm text-muted-foreground">Loading more products...</div>
        </div>
      )}
    </div>
  );
}