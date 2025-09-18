import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, CheckCircle, XCircle, Clock } from 'lucide-react'
import { usePurchaseReceipts, useUpdatePurchaseReceipt, useDeletePurchaseReceipt, useReceivePurchaseReceipt, useCompletePurchaseReceipt, useCancelPurchaseReceipt } from '@/hooks/useInventoryQueries'
import { useAuthStore } from '@/stores/authStore'
import type { PurchaseReceiptStatus, PurchaseReceipt } from '@/types/inventory'
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

export function PurchaseReceipts() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseReceiptStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [editingReceipt, setEditingReceipt] = useState<PurchaseReceipt | null>(null)
  const [deletingReceipt, setDeletingReceipt] = useState<PurchaseReceipt | null>(null)
  const limit = 20

  // Auth state
  const { user } = useAuthStore()
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff'
  const canDelete = user?.role === 'admin'

  const { data, isLoading, error } = usePurchaseReceipts({
    page,
    limit,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const updatePurchaseReceipt = useUpdatePurchaseReceipt()
  const deletePurchaseReceipt = useDeletePurchaseReceipt()
  const receivePurchaseReceipt = useReceivePurchaseReceipt()
  const completePurchaseReceipt = useCompletePurchaseReceipt()
  const cancelPurchaseReceipt = useCancelPurchaseReceipt()

  const handleCreateOrder = () => {
    navigate('/purchase-receipts/create')
  }

  const handleView = (receipt: PurchaseReceipt) => {
    navigate(`/purchase-receipts/${receipt.id}/view`)
  }

  const handleEdit = (receipt: PurchaseReceipt) => {
    if (!canEdit) return
    navigate(`/purchase-receipts/${receipt.id}/edit`)
  }

  const handleUpdate = async (data: any) => {
    if (!editingReceipt || !canEdit) return
    try {
      await updatePurchaseReceipt.mutateAsync({ id: editingReceipt.id, data })
      setEditingReceipt(null)
    } catch (error) {
      console.error('Failed to update purchase receipt:', error)
    }
  }

  const handleDelete = (receipt: PurchaseReceipt) => {
    if (!canDelete) return
    setDeletingReceipt(receipt)
  }

  const confirmDelete = async () => {
    if (!deletingReceipt) return
    try {
      await deletePurchaseReceipt.mutateAsync(deletingReceipt.id)
      // Close the dialog after successful deletion
      setDeletingReceipt(null)
      // The page will automatically refresh due to query invalidation in the mutation
    } catch (error) {
      console.error('Failed to delete purchase receipt:', error)
      // Keep the dialog open on error so user can try again
    }
  }

  const handleReceive = async (receipt: PurchaseReceipt) => {
    if (!canEdit) return
    if (confirm(`Mark goods as received for ${receipt.receipt_number}?`)) {
      try {
        await receivePurchaseReceipt.mutateAsync(receipt.id)
      } catch (error) {
        console.error('Failed to receive goods:', error)
      }
    }
  }

  const handleComplete = async (receipt: PurchaseReceipt) => {
    if (!canEdit) return
    if (confirm(`Complete purchase receipt ${receipt.receipt_number}? This will update inventory levels and cannot be undone.`)) {
      try {
        await completePurchaseReceipt.mutateAsync(receipt.id)
      } catch (error) {
        console.error('Failed to complete purchase receipt:', error)
      }
    }
  }

  const handleCancel = async (receipt: PurchaseReceipt) => {
    if (!canEdit) return
    if (confirm(`Cancel purchase receipt ${receipt.receipt_number}? This action cannot be undone.`)) {
      try {
        await cancelPurchaseReceipt.mutateAsync(receipt.id)
      } catch (error) {
        console.error('Failed to cancel purchase receipt:', error)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Manage purchase orders and goods receipts
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreateOrder} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number, supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as PurchaseReceiptStatus | 'all')}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Receipts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Orders & Receipts
            </div>
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.pagination.total} total, showing {data.data?.length || 0}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading purchase receipts...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-600">Error loading purchase receipts</div>
            </div>
          ) : !data?.data?.length ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No purchase receipts match your filters' 
                  : 'No purchase receipts yet'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell>
                        {receipt.supplier?.name || 'No Supplier'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusStyles[receipt.status]}
                        >
                          {statusLabels[receipt.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {receipt.order_date ? formatDate(receipt.order_date) : formatDate(receipt.purchase_date || '')}
                      </TableCell>
                      <TableCell>
                        {receipt.expected_date 
                          ? formatDate(receipt.expected_date) 
                          : 'Not set'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(receipt.total_amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {receipt.items?.length || 0} items
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(receipt)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>

                          {/* Status Action Buttons */}
                          {canEdit && receipt.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceive(receipt)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="Mark as Received"
                            >
                              <Clock className="h-4 w-4" />
                              <span className="sr-only">Receive</span>
                            </Button>
                          )}

                          {canEdit && receipt.status === 'received' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleComplete(receipt)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Complete Order"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Complete</span>
                            </Button>
                          )}

                          {canEdit && (receipt.status === 'pending' || receipt.status === 'received') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(receipt)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                              title="Cancel Order"
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          )}

                          {/* Edit/Delete Buttons */}
                          {canEdit && (receipt.status === 'pending' || receipt.status === 'received') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(receipt)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          )}

                          {canDelete && (receipt.status === 'pending' || receipt.status === 'received') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(receipt)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && data.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.total_pages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= (data?.pagination?.total_pages || 1)}
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

      {/* Edit Purchase Receipt Dialog */}
      <Dialog open={!!editingReceipt} onOpenChange={() => setEditingReceipt(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase Receipt</DialogTitle>
          </DialogHeader>
          {editingReceipt && (
            <div className="p-4 text-center text-muted-foreground">
              Purchase receipt form component to be implemented
              <div className="mt-4 space-x-2">
                <Button variant="outline" onClick={() => setEditingReceipt(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdate({ notes: 'Updated via demo' })}>
                  Update (Demo)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingReceipt} onOpenChange={() => setDeletingReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Purchase Receipt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete purchase receipt <strong>{deletingReceipt?.receipt_number}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone. This will permanently delete the purchase receipt and remove all associated data.
            </p>
            {deletingReceipt?.items && deletingReceipt.items.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                This receipt contains <strong>{deletingReceipt.items.length}</strong> item{deletingReceipt.items.length !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingReceipt(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="destructive"
              disabled={deletePurchaseReceipt.isPending}
            >
              {deletePurchaseReceipt.isPending ? 'Deleting...' : 'Delete Receipt'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}