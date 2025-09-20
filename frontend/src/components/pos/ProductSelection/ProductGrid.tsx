import { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { productService, type Product, type ProductSearchParams } from '@/services/productService';
import { usePOSCartStore } from '@/stores/pos/posCartStore';

interface ProductGridProps {
  activeSessionId: string | null;
  searchQuery?: string;
  selectedCategoryId?: string;
  onProductSelect?: (product: Product) => void;
}

export function ProductGrid({
  activeSessionId,
  searchQuery = '',
  selectedCategoryId,
  onProductSelect
}: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = usePOSCartStore();

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let products: Product[] = [];

      if (searchQuery.trim()) {
        // Use POS lookup for search queries
        products = await productService.posLookup(searchQuery.trim(), 50);

        // Apply category filter client-side if both search and category are specified
        if (selectedCategoryId && selectedCategoryId !== 'all') {
          products = products.filter(product =>
            product.category_id === selectedCategoryId
          );
        }
      } else {
        // Use regular product search for category filtering or loading all products
        const params: ProductSearchParams = {
          page: 1,
          limit: 50,
          is_active: true
        };

        // Add category filter if selected (but not 'all')
        if (selectedCategoryId && selectedCategoryId !== 'all') {
          params.category_id = selectedCategoryId;
        }

        const response = await productService.searchProducts(params);
        products = response.products || [];
      }

      setProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products');
      // Fallback to empty array on error
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategoryId]);

  // Load products when search/filter changes or on initial mount
  useEffect(() => {
    loadProducts();
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (quantity <= 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="font-semibold mb-2">Loading products...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold mb-2">Error loading products</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadProducts} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No products found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery ? `No products match "${searchQuery}"` : 'No products available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Add</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="w-32">Price</TableHead>
              <TableHead className="w-24">Stock</TableHead>
              <TableHead className="w-32">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stock = product.quantity || product.stock_quantity || 0;
              const stockStatus = getStockStatus(stock);
              const price = product.retail_price || product.price || 0;

              return (
                <TableRow
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleProductClick(product)}
                >
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {(product as any).description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {(product as any).description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-1 rounded">
                      {product.sku || 'N/A'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatPrice(price)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{stock}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant}>
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {products.length} products
      </div>
    </div>
  );
}