import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package, AlertCircle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import { useStockAdjustment } from '@/hooks/useInventoryQueries'
import type { Product, StockAdjustmentFormData } from '@/types/inventory'
import { getStockQuantity, getReorderLevel, getUnit } from '@/utils/productUtils'
import { Textarea } from '@/components/ui/textarea'

// Validation schema
const stockAdjustmentSchema = z.object({
  adjustment_type: z.enum(['increase', 'decrease', 'set']).refine(val => val !== undefined, {
    message: 'Please select an adjustment type'
  }),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  reason: z.enum(['damaged', 'expired', 'lost', 'found', 'recount', 'correction', 'other']).refine(val => val !== undefined, {
    message: 'Please select a reason'
  }),
  notes: z.string().optional(),
})

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>

interface StockAdjustmentFormProps {
  product: Product
  onSuccess?: () => void
  onCancel?: () => void
}

export function StockAdjustmentForm({ product, onSuccess, onCancel }: StockAdjustmentFormProps) {
  // Mutation
  const adjustStock = useStockAdjustment()

  // Form setup
  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustment_type: 'increase',
      quantity: 0,
      reason: 'correction',
      notes: '',
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

  // Calculate new stock level
  const calculateNewStock = () => {
    const { adjustment_type, quantity } = watchedValues
    if (!quantity) return getStockQuantity(product)

    switch (adjustment_type) {
      case 'increase':
        return getStockQuantity(product) + quantity
      case 'decrease':
        return Math.max(0, getStockQuantity(product) - quantity)
      case 'set':
        return quantity
      default:
        return getStockQuantity(product)
    }
  }

  const newStockLevel = calculateNewStock()
  const stockChange = newStockLevel - getStockQuantity(product)

  // Get adjustment type config
  const getAdjustmentConfig = (type: string) => {
    const configs = {
      increase: { 
        icon: TrendingUp, 
        color: 'text-green-600', 
        bgColor: 'bg-green-50', 
        borderColor: 'border-green-200',
        label: 'Increase Stock'
      },
      decrease: { 
        icon: TrendingDown, 
        color: 'text-red-600', 
        bgColor: 'bg-red-50', 
        borderColor: 'border-red-200',
        label: 'Decrease Stock'
      },
      set: { 
        icon: RotateCcw, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50', 
        borderColor: 'border-blue-200',
        label: 'Set Stock Level'
      },
    }
    return configs[type as keyof typeof configs] || configs.increase
  }

  const config = getAdjustmentConfig(watchedValues.adjustment_type)

  const onSubmit = async (data: StockAdjustmentFormValues) => {
    try {
      const formData: StockAdjustmentFormData = {
        product_id: product.id,
        ...data,
        notes: data.notes || undefined,
      }

      await adjustStock.mutateAsync(formData)
      onSuccess?.()
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Form submission error:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Adjustment - {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {adjustStock.error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {adjustStock.error?.response?.data?.message || adjustStock.error?.message || 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Current Stock Info */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Current Stock</div>
              <div className="text-2xl font-bold">
                {getStockQuantity(product).toLocaleString()} {getUnit(product)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Min Stock Level</div>
              <div className="text-lg font-medium">
                {getReorderLevel(product) > 0 ? `${getReorderLevel(product)} ${getUnit(product)}` : 'Not set'}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type *</Label>
            <Select
              value={watchedValues.adjustment_type}
              onValueChange={(value) => setValue('adjustment_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Increase Stock
                  </div>
                </SelectItem>
                <SelectItem value="decrease">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Decrease Stock
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-blue-600" />
                    Set Stock Level
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.adjustment_type && (
              <p className="text-sm text-destructive">{errors.adjustment_type.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              {watchedValues.adjustment_type === 'set' ? 'New Stock Level' : 'Quantity'} * ({getUnit(product)})
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              {...register('quantity', { valueAsNumber: true })}
              placeholder={watchedValues.adjustment_type === 'set' ? 'Enter new stock level' : 'Enter quantity'}
              className={errors.quantity ? 'border-destructive' : ''}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          {/* Stock Preview */}
          {watchedValues.quantity > 0 && (
            <div className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <config.icon className={`h-5 w-5 ${config.color}`} />
                <span className={`font-medium ${config.color}`}>Stock Change Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Current</div>
                  <div className="font-medium">{getStockQuantity(product)} {getUnit(product)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Change</div>
                  <div className={`font-medium ${stockChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockChange >= 0 ? '+' : ''}{stockChange} {getUnit(product)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">New Stock</div>
                  <div className="font-bold">{newStockLevel} {getUnit(product)}</div>
                </div>
              </div>
              
              {/* Warning for low stock */}
              {getReorderLevel(product) > 0 && newStockLevel <= getReorderLevel(product) && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <div className="flex items-center gap-1 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    Warning: New stock level will be at or below minimum stock level ({getReorderLevel(product)} {getUnit(product)})
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select
              value={watchedValues.reason}
              onValueChange={(value) => setValue('reason', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recount">Stock Recount</SelectItem>
                <SelectItem value="correction">Inventory Correction</SelectItem>
                <SelectItem value="damaged">Damaged Goods</SelectItem>
                <SelectItem value="expired">Expired Items</SelectItem>
                <SelectItem value="lost">Lost/Missing Items</SelectItem>
                <SelectItem value="found">Found Items</SelectItem>
                <SelectItem value="other">Other Reason</SelectItem>
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this adjustment..."
              className="min-h-[80px]"
            />
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
              disabled={isSubmitting || watchedValues.quantity <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting Stock...
                </>
              ) : (
                <>
                  {config.label}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}