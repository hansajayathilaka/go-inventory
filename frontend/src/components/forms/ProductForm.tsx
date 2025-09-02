import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, AlertCircle } from 'lucide-react'
import { HierarchicalSelect } from '@/components/ui/hierarchical-select'
import { transformCategoryHierarchy } from '@/utils/categoryUtils'
import { useBrands, useCategories, useCategoryHierarchy, useSuppliers, useCreateProduct, useUpdateProduct } from '@/hooks/useInventoryQueries'
import type { Product, ProductFormData } from '@/types/inventory'

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  cost_price: z.number().min(0, 'Cost price must be non-negative').optional(),
  stock_quantity: z.number().int().min(0, 'Stock quantity must be non-negative'),
  min_stock_level: z.number().int().min(0, 'Minimum stock level must be non-negative').optional(),
  max_stock_level: z.number().int().min(0, 'Maximum stock level must be non-negative').optional(),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  category_id: z.number().int().positive().optional(),
  brand_id: z.number().int().positive().optional(),
  supplier_id: z.number().int().positive().optional(),
  is_active: z.boolean(),
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
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: categoryHierarchy, isLoading: hierarchyLoading } = useCategoryHierarchy()
  const { data: brands = [], isLoading: brandsLoading } = useBrands()
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers()

  // Mutations
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Form setup
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      price: product?.price || 0,
      cost_price: product?.cost_price || 0,
      stock_quantity: product?.stock_quantity || 0,
      min_stock_level: product?.min_stock_level || 0,
      max_stock_level: product?.max_stock_level || 0,
      unit: product?.unit || '',
      category_id: product?.category_id,
      brand_id: product?.brand_id,
      supplier_id: product?.supplier_id,
      is_active: product?.is_active ?? true,
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
      const formData: ProductFormData = {
        ...data,
        // Convert empty strings to undefined for optional fields
        description: data.description || undefined,
        sku: data.sku || undefined,
        barcode: data.barcode || undefined,
        cost_price: data.cost_price || undefined,
        min_stock_level: data.min_stock_level || undefined,
        max_stock_level: data.max_stock_level || undefined,
        category_id: data.category_id || undefined,
        brand_id: data.brand_id || undefined,
        supplier_id: data.supplier_id || undefined,
      }

      if (isEditing) {
        await updateProduct.mutateAsync({ id: product.id, data: formData })
      } else {
        await createProduct.mutateAsync(formData)
      }

      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Form submission error:', error)
    }
  }

  const isLoading = categoriesLoading || hierarchyLoading || brandsLoading || suppliersLoading
  const hierarchicalCategories = categoryHierarchy ? transformCategoryHierarchy(categoryHierarchy.children) : []
  const error = createProduct.error || updateProduct.error

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

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                {...register('unit')}
                placeholder="e.g., pcs, kg, liters"
                className={errors.unit ? 'border-destructive' : ''}
              />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Optional product description"
            />
          </div>

          {/* Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register('sku')}
                placeholder="Stock Keeping Unit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Product barcode"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price * ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.price ? 'border-destructive' : ''}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price ($)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                {...register('cost_price', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Current Stock *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Min Stock Level</Label>
              <Input
                id="min_stock_level"
                type="number"
                min="0"
                {...register('min_stock_level', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_stock_level">Max Stock Level</Label>
              <Input
                id="max_stock_level"
                type="number"
                min="0"
                {...register('max_stock_level', { valueAsNumber: true })}
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
                onValueChange={(value) => setValue('category_id', value ? Number(value) : undefined)}
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
                onValueChange={(value) => setValue('brand_id', value ? parseInt(value) : undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Brand</SelectItem>
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
                onValueChange={(value) => setValue('supplier_id', value ? parseInt(value) : undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Supplier</SelectItem>
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
              disabled={isSubmitting || isLoading}
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