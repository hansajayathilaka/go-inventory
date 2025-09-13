import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarcodeInput } from '@/components/ui/barcode-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, AlertCircle } from 'lucide-react'
import { HierarchicalSelect } from '@/components/ui/hierarchical-select'
import { transformCategoryHierarchy } from '@/utils/categoryUtils'
import { useBrands, useCategories, useCategoryHierarchy, useSuppliers, useCreateProduct, useUpdateProduct, useCreateInventory, useUpdateInventoryLevels } from '@/hooks/useInventoryQueries'
import type { Product, ProductFormData } from '@/types/inventory'

// Validation schema - matches backend API requirements
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long'),
  category_id: z.string().min(1, 'Category is required').refine(val => val !== 'none', 'Please select a category'), // Required UUID
  supplier_id: z.string().optional(),
  brand_id: z.string().optional(),
  cost_price: z.number().min(0, 'Cost price must be non-negative'),
  retail_price: z.number().min(0, 'Retail price must be non-negative'), // Changed from price
  wholesale_price: z.number().min(0, 'Wholesale price must be non-negative'),
  barcode: z.string().max(100, 'Barcode too long'),
  weight: z.number().min(0, 'Weight must be non-negative'),
  dimensions: z.string().max(100, 'Dimensions too long'),
  is_active: z.boolean(),
  // Inventory fields for UI (will be handled separately in backend)
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative').optional(),
  min_stock_level: z.number().int().min(0, 'Minimum stock level must be non-negative').optional().or(z.undefined()),
  max_stock_level: z.number().int().min(0, 'Maximum stock level must be non-negative').optional().or(z.undefined()),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!product

  // Fetch reference data
  const { isLoading: categoriesLoading } = useCategories()
  const { data: categoryHierarchy, isLoading: hierarchyLoading } = useCategoryHierarchy()
  const { data: brands = [], isLoading: brandsLoading } = useBrands()
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers()

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const createInventory = useCreateInventory()
  const updateInventoryLevels = useUpdateInventoryLevels()

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: product?.sku || '',
      name: product?.name || '',
      description: product?.description || '',
      category_id: product?.category_id || 'none', // Will be required, 'none' handled in form
      supplier_id: product?.supplier_id || 'none',
      brand_id: product?.brand_id || 'none',
      cost_price: product?.cost_price ?? 0,
      retail_price: product?.retail_price ?? 0, // Changed from price
      wholesale_price: product?.wholesale_price ?? 0,
      barcode: product?.barcode || '',
      weight: product?.weight ?? 0,
      dimensions: product?.dimensions || '',
      is_active: product?.is_active ?? true,
      // Inventory fields (will be extracted for separate API call)
      stock_quantity: product?.inventory?.[0]?.quantity ?? 0,
      min_stock_level: product?.inventory?.[0]?.reorder_level ?? 0,
      max_stock_level: product?.inventory?.[0]?.max_level ?? 0,
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const watchedValues = watch()

  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log('Form submission data:', data) // Debug log
      
      // Separate product data from inventory data
      const productData: ProductFormData = {
        sku: data.sku,
        name: data.name,
        description: data.description || '',
        category_id: data.category_id, // Validation ensures this is not 'none'
        supplier_id: (data.supplier_id && data.supplier_id !== 'none') ? data.supplier_id : undefined,
        brand_id: (data.brand_id && data.brand_id !== 'none') ? data.brand_id : undefined,
        cost_price: data.cost_price,
        retail_price: data.retail_price,
        wholesale_price: data.wholesale_price,
        barcode: data.barcode || '',
        weight: data.weight,
        dimensions: data.dimensions || '',
        is_active: data.is_active,
      }
      
      console.log('Product data to send:', productData) // Debug log

      if (isEditing) {
        // Update existing product
        await updateProduct.mutateAsync({ id: product.id, data: productData })
        
        // Update inventory reorder and max levels only (not quantity)
        if (data.min_stock_level !== undefined) {
          await updateInventoryLevels.mutateAsync({
            product_id: product.id,
            reorder_level: data.min_stock_level ?? 0,
            max_level: data.max_stock_level ?? 0,
          })
        }
      } else {
        // Create new product
        const createdProduct = await createProduct.mutateAsync(productData)
        
        // Create inventory record for the new product
        const inventoryData = {
          product_id: createdProduct.id,
          quantity: data.stock_quantity ?? 0,
          reorder_level: data.min_stock_level ?? 0,
          max_level: data.max_stock_level ?? 0,
        }
        
        console.log('Creating inventory with data:', inventoryData) // Debug log
        await createInventory.mutateAsync(inventoryData)
      }

      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error)
    }
  }

  const isLoading = categoriesLoading || hierarchyLoading || brandsLoading || suppliersLoading
  const hierarchicalCategories = categoryHierarchy ? transformCategoryHierarchy(categoryHierarchy.children) : []
  const error = createProduct.error || updateProduct.error || createInventory.error || updateInventoryLevels.error

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.response?.data?.message || error?.message || 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku')}
                placeholder="Enter product SKU"
                className={errors.sku ? 'border-destructive' : ''}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter product name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Optional product description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <BarcodeInput
                value={watchedValues.barcode || ''}
                onChange={(value) => setValue('barcode', value)}
                placeholder="Product barcode"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price * ($)</Label>
              <Input
                id="retail_price"
                type="number"
                step="0.01"
                min="0"
                {...register('retail_price', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.retail_price ? 'border-destructive' : ''}
              />
              {errors.retail_price && (
                <p className="text-sm text-destructive">{errors.retail_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wholesale_price">Wholesale Price * ($)</Label>
              <Input
                id="wholesale_price"
                type="number"
                step="0.01"
                min="0"
                {...register('wholesale_price', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.wholesale_price ? 'border-destructive' : ''}
              />
              {errors.wholesale_price && (
                <p className="text-sm text-destructive">{errors.wholesale_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price * ($)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                {...register('cost_price', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Physical Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                {...register('weight', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.weight ? 'border-destructive' : ''}
              />
              {errors.weight && (
                <p className="text-sm text-destructive">{errors.weight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input
                id="dimensions"
                {...register('dimensions')}
                placeholder="e.g., 10x5x2 cm"
                className={errors.dimensions ? 'border-destructive' : ''}
              />
              {errors.dimensions && (
                <p className="text-sm text-destructive">{errors.dimensions.message}</p>
              )}
            </div>
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Initial Stock</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  {...register('stock_quantity', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.stock_quantity ? 'border-destructive' : ''}
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
                )}
              </div>
            )}
            {isEditing && (
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {product?.inventory?.[0]?.quantity ?? 0} units
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Stock Adjustment to modify stock levels
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Min Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                {...register('min_stock_level', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level">Max Stock Level</Label>
              <Input
                id="max_stock_level"
                type="number"
                min="0"
                {...register('max_stock_level', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' ? undefined : Number(value)
                })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Relationships */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <HierarchicalSelect
                value={watchedValues.category_id}
                onValueChange={(value) => setValue('category_id', value ? String(value) : 'none')}
                placeholder="Select category"
                items={hierarchicalCategories}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Select
                value={watchedValues.brand_id?.toString() || ''}
                onValueChange={(value) => setValue('brand_id', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id.toString()}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={watchedValues.supplier_id?.toString() || ''}
                onValueChange={(value) => setValue('supplier_id', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={watchedValues.is_active?.toString() || 'true'}
              onValueChange={(value) => setValue('is_active', value === 'true')}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || createInventory.isPending || updateInventoryLevels.isPending}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Product' : 'Create Product'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}