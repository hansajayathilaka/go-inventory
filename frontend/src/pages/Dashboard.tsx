import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useLowStockProducts } from '@/hooks';
import { useUiStore } from '@/stores';
import { Loader2, AlertTriangle, Package, ExternalLink, RefreshCw } from 'lucide-react';
import type { Product } from '@/types/inventory';

export function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: lowStockProducts, isLoading: lowStockLoading, error: lowStockError, refetch: refetchLowStock } = useLowStockProducts(10);
  const { setCurrentPage } = useUiStore();
  
  // Set current page for navigation
  React.useEffect(() => {
    setCurrentPage('Dashboard');
  }, [setCurrentPage]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Failed to load dashboard data</h3>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.total_products || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active products in inventory
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.low_stock_products || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below minimum stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.total_suppliers || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total active suppliers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.pending_purchase_receipts || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Low Stock Alerts
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchLowStock()}
              disabled={lowStockLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${lowStockLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockError ? (
              <div className="text-sm text-destructive">
                Failed to load low stock products
              </div>
            ) : lowStockLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !lowStockProducts?.length ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium text-green-800">All products well stocked!</p>
                <p className="text-xs text-muted-foreground">No items below minimum stock level</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product: Product) => {
                  const isOutOfStock = product.stock_quantity === 0
                  const stockPercentage = product.min_stock_level 
                    ? Math.round((product.stock_quantity / product.min_stock_level) * 100)
                    : 100

                  return (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <Badge variant={isOutOfStock ? 'destructive' : 'secondary'} className="text-xs">
                            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            <strong>{product.stock_quantity}</strong> {product.unit} remaining
                          </span>
                          {product.min_stock_level && (
                            <span>
                              Min: {product.min_stock_level} {product.unit}
                            </span>
                          )}
                          {product.brand && (
                            <span>
                              {product.brand.name}
                            </span>
                          )}
                        </div>
                        {/* Stock level bar */}
                        {product.min_stock_level && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isOutOfStock 
                                  ? 'bg-red-500' 
                                  : stockPercentage <= 50 
                                  ? 'bg-orange-500' 
                                  : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(2, stockPercentage))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {lowStockProducts.length > 5 && (
                  <div className="text-center pt-3 border-t">
                    <Button variant="outline" size="sm" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View All {lowStockProducts.length} Low Stock Items
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm">
              Add New Product
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm">
              Create Purchase Order
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm">
              Process Stock Receipt
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}