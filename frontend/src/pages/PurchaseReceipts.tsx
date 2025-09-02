import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { usePurchaseReceipts } from '@/hooks/useInventoryQueries'
import type { PurchaseReceiptStatus } from '@/types/inventory'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  ordered: 'bg-blue-100 text-blue-800 border-blue-200',
  partially_received: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  received: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
}

const statusLabels = {
  draft: 'Draft',
  ordered: 'Ordered',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
}

export function PurchaseReceipts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseReceiptStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading, error } = usePurchaseReceipts({
    page,
    limit,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const handleCreateOrder = () => {
    // TODO: Navigate to create order page
    console.log('Create new purchase order')
  }

  const handleView = (id: number) => {
    // TODO: Navigate to view page
    console.log('View purchase receipt:', id)
  }

  const handleEdit = (id: number) => {
    // TODO: Navigate to edit page
    console.log('Edit purchase receipt:', id)
  }

  const handleDelete = (id: number) => {
    // TODO: Implement delete confirmation
    console.log('Delete purchase receipt:', id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Receipts</h1>
        <Button onClick={handleCreateOrder} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </Button>
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
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
            Purchase Orders & Receipts
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
                        {formatDate(receipt.order_date)}
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
                            onClick={() => handleView(receipt.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(receipt.id)}
                            className="h-8 w-8 p-0"
                            disabled={receipt.status === 'received' || receipt.status === 'cancelled'}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(receipt.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={receipt.status === 'received'}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
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
    </div>
  )
}