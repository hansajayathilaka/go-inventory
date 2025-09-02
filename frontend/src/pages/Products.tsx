import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Filter, Plus, MoreHorizontal, Package, AlertTriangle, CheckCircle, XCircle, Edit, Scan } from 'lucide-react'
import { useProducts, useBrands, useCategories, useSuppliers } from '@/hooks/useInventoryQueries'
import { ProductForm } from '@/components/forms/ProductForm'
import { StockAdjustmentForm } from '@/components/forms/StockAdjustmentForm'
import type { Product } from '@/types/inventory'

export function Products() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [supplierFilter, setSupplierFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null)

  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = { page, limit }
    if (search.trim()) params.search = search.trim()
    if (categoryFilter && categoryFilter !== 'all') params.category_id = parseInt(categoryFilter)
    if (brandFilter && brandFilter !== 'all') params.brand_id = parseInt(brandFilter)
    if (supplierFilter && supplierFilter !== 'all') params.supplier_id = parseInt(supplierFilter)
    return params
  }, [search, categoryFilter, brandFilter, supplierFilter, page, limit])

  // Fetch data
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts(queryParams)
  const { data: categories = [] } = useCategories()
  const { data: brands = [] } = useBrands()
  const { data: suppliers = [] } = useSuppliers()

  const products = productsData?.data || []
  const totalCount = productsData?.pagination?.total || 0
  const totalPages = productsData?.pagination?.total_pages || 1

  // Stock status helpers
  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) return 'out-of-stock'
    if (product.min_stock_level && product.stock_quantity <= product.min_stock_level) return 'low-stock'
    return 'in-stock'
  }

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product)
    const config = {
      'out-of-stock': { variant: 'destructive' as const, icon: XCircle, text: 'Out of Stock' },
      'low-stock': { variant: 'secondary' as const, icon: AlertTriangle, text: 'Low Stock' },
      'in-stock': { variant: 'default' as const, icon: CheckCircle, text: 'In Stock' }
    }
    const { variant, icon: Icon, text } = config[status]
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    )
  }

  const clearFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setBrandFilter('')
    setSupplierFilter('')
    setPage(1)
  }

  const hasActiveFilters = search || categoryFilter || brandFilter || supplierFilter

  const handleBarcodeSearch = (barcode: string) => {
    setSearch(barcode)
    setShowBarcodeScanner(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product inventory with {totalCount.toLocaleString()} items
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              onSuccess={() => {
                setShowCreateDialog(false)
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or barcode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Scan barcode to search">
                      <Scan className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <BarcodeScanner
                      onScan={handleBarcodeSearch}
                      onError={(error) => console.error('Barcode search error:', error)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Brand Filter */}
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Supplier Filter */}
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Suppliers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Found {totalCount.toLocaleString()} products
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsError && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load products. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {productsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'No products match your current filters.'
                  : 'Get started by adding your first product to the inventory.'
                }
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <ProductForm
                      onSuccess={() => {
                        setShowCreateDialog(false)
                      }}
                      onCancel={() => setShowCreateDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {product.category?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {product.brand?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {product.stock_quantity.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {product.unit}
                          </span>
                        </div>
                        {product.min_stock_level && (
                          <div className="text-xs text-muted-foreground">
                            Min: {product.min_stock_level}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${product.price.toFixed(2)}
                        </div>
                        {product.cost_price && (
                          <div className="text-xs text-muted-foreground">
                            Cost: ${product.cost_price.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStockBadge(product)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingProduct(product as Product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdjustingStockProduct(product as Product)}>
                              <Package className="h-4 w-4 mr-2" />
                              Stock Adjustment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount.toLocaleString()} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSuccess={() => {
                setEditingProduct(null)
              }}
              onCancel={() => setEditingProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!adjustingStockProduct} onOpenChange={(open) => !open && setAdjustingStockProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {adjustingStockProduct && (
            <StockAdjustmentForm
              product={adjustingStockProduct}
              onSuccess={() => {
                setAdjustingStockProduct(null)
              }}
              onCancel={() => setAdjustingStockProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}