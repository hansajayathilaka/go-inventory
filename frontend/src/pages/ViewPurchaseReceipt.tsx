import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Package, Truck, Calendar, DollarSign, FileText, User, Edit, CheckCircle, XCircle, Clock } from 'lucide-react'
import { usePurchaseReceipt, useReceivePurchaseReceipt, useCompletePurchaseReceipt, useCancelPurchaseReceipt } from '@/hooks/useInventoryQueries'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusStyles = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  received: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels = {
  pending: 'Pending',
  received: 'Received',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function ViewPurchaseReceipt() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  console.log('👁️ [ViewPurchaseReceipt] Component rendered with:', {
    id,
    hasId: !!id,
    route: window.location.pathname
  });

  // Auth state
  const { user } = useAuthStore()
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff'

  console.log('🔐 [ViewPurchaseReceipt] Auth state:', {
    hasUser: !!user,
    userId: user?.id,
    userRole: user?.role,
    canEdit,
    isAuthenticated: !!user
  });

  const { data: receipt, isLoading, error } = usePurchaseReceipt(id!)
  const receivePurchaseReceipt = useReceivePurchaseReceipt()
  const completePurchaseReceipt = useCompletePurchaseReceipt()
  const cancelPurchaseReceipt = useCancelPurchaseReceipt()

  console.log('📊 [ViewPurchaseReceipt] Query state:', {
    hasReceipt: !!receipt,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    receiptId: receipt?.id,
    receiptStatus: receipt?.status,
    receiptNumber: receipt?.receipt_number,
    itemsCount: receipt?.items?.length || 0
  });

  const handleEdit = () => {
    console.log('✏️ [ViewPurchaseReceipt] Edit button clicked:', {
      canEdit,
      hasReceipt: !!receipt,
      receiptId: receipt?.id
    });

    if (!canEdit || !receipt) {
      console.warn('⚠️ [ViewPurchaseReceipt] Edit blocked:', { canEdit, hasReceipt: !!receipt });
      return;
    }

    const editUrl = `/purchase-receipts/${receipt.id}/edit`;
    console.log('🚀 [ViewPurchaseReceipt] Navigating to edit page:', editUrl);
    navigate(editUrl);
  }

  const handleMarkAsRead = async () => {
    console.log('👁️ [ViewPurchaseReceipt] Mark as Read button clicked:', {
      canEdit,
      hasReceipt: !!receipt,
      receiptNumber: receipt?.receipt_number
    });

    if (!canEdit || !receipt) {
      console.warn('⚠️ [ViewPurchaseReceipt] Mark as Read blocked:', { canEdit, hasReceipt: !!receipt });
      return;
    }

    const confirmed = confirm(`Mark receipt ${receipt.receipt_number} as read?`);
    console.log('🤔 [ViewPurchaseReceipt] Mark as Read confirmation:', confirmed);

    if (confirmed) {
      try {
        console.log('📡 [ViewPurchaseReceipt] Calling receivePurchaseReceipt.mutateAsync...');
        await receivePurchaseReceipt.mutateAsync(receipt.id);
        console.log('✅ [ViewPurchaseReceipt] Mark as Read operation successful');
      } catch (error: unknown) {
        const errorObj = error as { response?: { data?: unknown; status?: number } };
        console.error('❌ [ViewPurchaseReceipt] Failed to mark as read:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          response: errorObj?.response?.data,
          status: errorObj?.response?.status
        });
      }
    }
  }

  const handleComplete = async () => {
    console.log('✅ [ViewPurchaseReceipt] Complete button clicked:', {
      canEdit,
      hasReceipt: !!receipt,
      receiptNumber: receipt?.receipt_number
    });

    if (!canEdit || !receipt) {
      console.warn('⚠️ [ViewPurchaseReceipt] Complete blocked:', { canEdit, hasReceipt: !!receipt });
      return;
    }

    const confirmed = confirm(`Complete purchase receipt ${receipt.receipt_number}? This will update inventory levels and cannot be undone.`);
    console.log('🤔 [ViewPurchaseReceipt] Complete confirmation:', confirmed);

    if (confirmed) {
      try {
        console.log('📡 [ViewPurchaseReceipt] Calling completePurchaseReceipt.mutateAsync...');
        await completePurchaseReceipt.mutateAsync(receipt.id);
        console.log('✅ [ViewPurchaseReceipt] Complete operation successful');
      } catch (error: unknown) {
        const errorObj = error as { response?: { data?: unknown; status?: number } };
        console.error('❌ [ViewPurchaseReceipt] Failed to complete purchase receipt:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          response: errorObj?.response?.data,
          status: errorObj?.response?.status
        });
      }
    }
  }

  const handleCancel = async () => {
    console.log('❌ [ViewPurchaseReceipt] Cancel button clicked:', {
      canEdit,
      hasReceipt: !!receipt,
      receiptNumber: receipt?.receipt_number
    });

    if (!canEdit || !receipt) {
      console.warn('⚠️ [ViewPurchaseReceipt] Cancel blocked:', { canEdit, hasReceipt: !!receipt });
      return;
    }

    const confirmed = confirm(`Cancel purchase receipt ${receipt.receipt_number}? This action cannot be undone.`);
    console.log('🤔 [ViewPurchaseReceipt] Cancel confirmation:', confirmed);

    if (confirmed) {
      try {
        console.log('📡 [ViewPurchaseReceipt] Calling cancelPurchaseReceipt.mutateAsync...');
        await cancelPurchaseReceipt.mutateAsync(receipt.id);
        console.log('✅ [ViewPurchaseReceipt] Cancel operation successful');
      } catch (error: unknown) {
        const errorObj = error as { response?: { data?: unknown; status?: number } };
        console.error('❌ [ViewPurchaseReceipt] Failed to cancel purchase receipt:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          response: errorObj?.response?.data,
          status: errorObj?.response?.status
        });
      }
    }
  }

  if (isLoading) {
    console.log('⏳ [ViewPurchaseReceipt] Rendering loading state');
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading purchase receipt...</div>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    console.error('💀 [ViewPurchaseReceipt] Rendering error state:', {
      hasError: !!error,
      errorMessage: error?.message,
      hasReceipt: !!receipt,
      errorType: error?.constructor?.name
    });
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading purchase receipt</div>
        </div>
      </div>
    )
  }

  // Calculate totals
  const subtotal = receipt.items?.reduce((sum, item) => sum + (item.line_total || item.total_cost || 0), 0) || 0
  const discountAmount = receipt.bill_discount_amount || 0
  const discountPercentage = receipt.bill_discount_percentage || 0
  const percentageDiscount = subtotal * (discountPercentage / 100)
  const totalDiscount = discountAmount + percentageDiscount

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
            <h1 className="text-3xl font-bold">Purchase Receipt Details</h1>
            <p className="text-muted-foreground mt-1">
              View purchase receipt information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Primary Action Buttons */}
          {canEdit && receipt.status === 'pending' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMarkAsRead}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              >
                <Clock className="h-4 w-4" />
                Mark as Read
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            </div>
          )}

          {canEdit && receipt.status === 'received' && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleComplete}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
              >
                <CheckCircle className="h-4 w-4" />
                Complete Order
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            </div>
          )}

          {/* Edit button - always visible for editable statuses */}
          {canEdit && (receipt.status === 'pending' || receipt.status === 'received') && (
            <Button
              onClick={handleEdit}
              className="flex items-center gap-2"
              size="sm"
            >
              <Edit className="h-4 w-4" />
              Edit Receipt
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Receipt Number</label>
                  <div className="text-lg font-medium">{receipt.receipt_number}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div>
                    <Badge variant="outline" className={statusStyles[receipt.status]}>
                      {statusLabels[receipt.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {receipt.supplier_bill_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier Bill Number</label>
                  <div className="text-lg font-medium">{receipt.supplier_bill_number}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(receipt.purchase_date || receipt.order_date || '')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {receipt.expected_date ? formatDate(receipt.expected_date) : 'Not set'}
                  </div>
                </div>
              </div>

              {receipt.received_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Received Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(receipt.received_date)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Information */}
          {receipt.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Supplier Name</label>
                  <div className="text-lg font-medium">{receipt.supplier.name}</div>
                </div>

                {(receipt.supplier.contact_person || receipt.supplier.email || receipt.supplier.phone) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {receipt.supplier.contact_person && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                        <div>{receipt.supplier.contact_person}</div>
                      </div>
                    )}
                    {receipt.supplier.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <div>{receipt.supplier.email}</div>
                      </div>
                    )}
                    {receipt.supplier.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <div>{receipt.supplier.phone}</div>
                      </div>
                    )}
                  </div>
                )}

                {receipt.supplier.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div>
                      {receipt.supplier.address}
                      {receipt.supplier.city && `, ${receipt.supplier.city}`}
                      {receipt.supplier.country && `, ${receipt.supplier.country}`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Items ({receipt.items?.length || 0})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!receipt.items?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items in this purchase receipt
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity Ordered</TableHead>
                      <TableHead>Quantity Received</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-muted-foreground">{item.product?.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity || item.quantity_ordered || 0}</TableCell>
                        <TableCell>
                          <span className={(item.quantity_received || item.quantity || 0) !== (item.quantity_ordered || item.quantity || 0) ? 'text-orange-600' : ''}>
                            {item.quantity_received || item.quantity || 0}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.line_total || item.total_cost || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {receipt.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{receipt.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Items:</span>
                <span>{receipt.items?.length || 0}</span>
              </div>

              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {/* Display discounts if any */}
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
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>{formatCurrency(receipt.total_amount)}</span>
              </div>

              <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{formatDate(receipt.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{formatDate(receipt.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusStyles[receipt.status]}>
                  {statusLabels[receipt.status]}
                </Badge>
              </div>

              {receipt.status === 'pending' && (
                <p className="text-sm text-muted-foreground">
                  This purchase order is pending. Mark as received when goods arrive, then complete to update inventory.
                </p>
              )}

              {receipt.status === 'received' && (
                <p className="text-sm text-muted-foreground">
                  Goods have been received. Complete the order to update inventory levels.
                </p>
              )}

              {receipt.status === 'completed' && (
                <p className="text-sm text-muted-foreground">
                  This purchase receipt is completed and inventory has been updated.
                </p>
              )}

              {receipt.status === 'cancelled' && (
                <p className="text-sm text-muted-foreground">
                  This purchase receipt has been cancelled.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}