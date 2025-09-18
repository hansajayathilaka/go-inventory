import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Plus, Save, Send, X, Package, Truck, AlertCircle, Search } from 'lucide-react'
import { useSuppliers, useProducts, useCreatePurchaseReceipt, useUpdatePurchaseReceipt, usePurchaseReceipt } from '@/hooks/useInventoryQueries'
import { formatCurrency } from '@/lib/utils'
import type { Supplier, Product } from '@/types/inventory'

interface PurchaseReceiptItem {
  id?: string
  product_id: string
  product?: Product
  quantity: number
  unit_cost: number
  total_cost: number
  notes?: string
}

interface PurchaseReceiptFormData {
  supplier_id: string
  purchase_date: string
  supplier_bill_number?: string
  bill_discount_amount?: number
  bill_discount_percentage?: number
  notes?: string
  items: PurchaseReceiptItem[]
}

export function CreatePurchaseReceipt() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const editingId = id
  const [formData, setFormData] = useState<PurchaseReceiptFormData>({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_bill_number: '',
    bill_discount_amount: 0,
    bill_discount_percentage: 0,
    notes: '',
    items: []
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemUnitCost, setItemUnitCost] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API hooks
  const { data: suppliers = [] } = useSuppliers()
  const { data: productsData = [] } = useProducts({
    search: searchTerm || undefined,
    limit: 50
  })
  const createPurchaseReceipt = useCreatePurchaseReceipt()
  const updatePurchaseReceipt = useUpdatePurchaseReceipt()
  const { data: existingReceipt, isLoading: isLoadingReceipt } = usePurchaseReceipt(editingId || '')

  // Extract products from API response
  const products = Array.isArray(productsData) ? productsData : (productsData as any)?.data || []

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.total_cost, 0)
  const discountAmount = formData.bill_discount_amount || 0
  const discountPercentage = formData.bill_discount_percentage || 0
  const percentageDiscount = subtotal * (discountPercentage / 100)
  const totalDiscount = discountAmount + percentageDiscount
  const totalAmount = Math.max(0, subtotal - totalDiscount)

  // Load existing receipt data when editing
  useEffect(() => {
    if (existingReceipt && editingId && !isLoadingReceipt) {
      // Use purchase_date from the backend, with fallback to order_date for compatibility
      const purchaseDate = existingReceipt.purchase_date || existingReceipt.order_date
      const formattedDate = purchaseDate ? new Date(purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]

      setFormData({
        supplier_id: existingReceipt.supplier_id || '',
        purchase_date: formattedDate,
        supplier_bill_number: existingReceipt.supplier_bill_number || '',
        bill_discount_amount: existingReceipt.bill_discount_amount || 0,
        bill_discount_percentage: existingReceipt.bill_discount_percentage || 0,
        notes: existingReceipt.notes || '',
        items: existingReceipt.items?.map(item => ({
          product_id: item.product_id,
          product: item.product,
          quantity: item.quantity || item.quantity_ordered || 0, // Use actual quantity from backend
          unit_cost: item.unit_cost,
          total_cost: item.line_total || item.total_cost || 0 // Use line_total from backend
        })) || []
      })
    }
  }, [existingReceipt, editingId, isLoadingReceipt])

  const handleAddItem = () => {
    if (!selectedProduct) {
      setErrors({ ...errors, product: 'Please select a product' })
      return
    }

    if (itemQuantity <= 0) {
      setErrors({ ...errors, quantity: 'Quantity must be greater than 0' })
      return
    }

    if (itemUnitCost < 0) {
      setErrors({ ...errors, unit_cost: 'Unit cost cannot be negative' })
      return
    }

    // Check if product already exists in items
    const existingItemIndex = formData.items.findIndex(item => item.product_id === selectedProduct.id)

    const newItem: PurchaseReceiptItem = {
      product_id: selectedProduct.id,
      product: selectedProduct,
      quantity: itemQuantity,
      unit_cost: itemUnitCost,
      total_cost: itemQuantity * itemUnitCost
    }

    let updatedItems
    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = [...formData.items]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + itemQuantity,
        total_cost: (updatedItems[existingItemIndex].quantity + itemQuantity) * itemUnitCost
      }
    } else {
      // Add new item
      updatedItems = [...formData.items, newItem]
    }

    setFormData({ ...formData, items: updatedItems })
    setSelectedProduct(null)
    setItemQuantity(1)
    setItemUnitCost(0)
    setSearchTerm('')
    setErrors({})
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: updatedItems })
  }

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      quantity,
      total_cost: quantity * updatedItems[index].unit_cost
    }
    setFormData({ ...formData, items: updatedItems })
  }

  const handleUpdateItemCost = (index: number, unitCost: number) => {
    if (unitCost < 0) return

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      unit_cost: unitCost,
      total_cost: updatedItems[index].quantity * unitCost
    }
    setFormData({ ...formData, items: updatedItems })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required'
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        // Convert date to ISO datetime format
        purchase_date: new Date(formData.purchase_date + 'T00:00:00Z').toISOString(),
        total_amount: totalAmount,
        status: 'pending' // Save as pending (draft state)
      }

      if (editingId) {
        await updatePurchaseReceipt.mutateAsync({ id: editingId, data: submitData })
      } else {
        await createPurchaseReceipt.mutateAsync(submitData)
      }

      navigate('/purchase-receipts')
    } catch (error) {
      console.error('Failed to save purchase receipt:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const submitData = {
        ...formData,
        // Convert date to ISO datetime format
        purchase_date: new Date(formData.purchase_date + 'T00:00:00Z').toISOString(),
        total_amount: totalAmount,
        status: 'pending' // Create as pending first, then workflow manages progression
      }

      if (editingId) {
        await updatePurchaseReceipt.mutateAsync({ id: editingId, data: submitData })
      } else {
        await createPurchaseReceipt.mutateAsync(submitData)
      }

      navigate('/purchase-receipts')
    } catch (error) {
      console.error('Failed to complete purchase receipt:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state when loading existing receipt
  if (isLoadingReceipt && editingId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading purchase receipt...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/purchase-receipts')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Purchase Receipts
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingId ? 'Edit Purchase Receipt' : 'Create Purchase Receipt'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {editingId ? 'Edit existing purchase receipt' : 'Create a new purchase order with multiple items'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: Supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier_id && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.supplier_id}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date *</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className={errors.purchase_date ? 'border-red-500' : ''}
                  />
                  {errors.purchase_date && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.purchase_date}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier_bill_number">Supplier Bill Number</Label>
                <Input
                  id="supplier_bill_number"
                  value={formData.supplier_bill_number}
                  onChange={(e) => setFormData({ ...formData, supplier_bill_number: e.target.value })}
                  placeholder="Enter supplier bill number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_discount_amount">Discount Amount</Label>
                  <Input
                    id="bill_discount_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.bill_discount_amount || ''}
                    onChange={(e) => setFormData({ ...formData, bill_discount_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bill_discount_percentage">Discount Percentage</Label>
                  <Input
                    id="bill_discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.bill_discount_percentage || ''}
                    onChange={(e) => setFormData({ ...formData, bill_discount_percentage: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product_search">Search Product</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="product_search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Product Selection */}
              {searchTerm && products.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {products.slice(0, 10).map((product: Product) => (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-muted ${
                        selectedProduct?.id === product.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        setSelectedProduct(product)
                        setSearchTerm(product.name)
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku} • {formatCurrency(product.retail_price || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_cost">Unit Cost</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemUnitCost}
                      onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="p-2 bg-muted rounded text-lg font-medium">
                      {formatCurrency(itemQuantity * itemUnitCost)}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <Button onClick={handleAddItem} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              )}

              {errors.items && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.items}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          {formData.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Items ({formData.items.length})
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-muted-foreground">{item.product?.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => handleUpdateItemCost(index, parseFloat(e.target.value) || 0)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.total_cost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{formData.items.length}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount (Amount):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {discountPercentage > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discountPercentage}%):</span>
                  <span>-{formatCurrency(percentageDiscount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || formData.items.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Draft' : 'Save as Draft')}
                </Button>

                <Button
                  onClick={handleCompleteOrder}
                  disabled={isSubmitting || formData.items.length === 0}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Processing...' : (editingId ? 'Update Order' : 'Complete Order')}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {editingId ? 'Edit Mode' : 'Create Mode'}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed">
                  {editingId
                    ? 'Update draft to save changes, or update order to finalize modifications.'
                    : 'Save as draft to continue editing later, or complete order to create the purchase receipt.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}