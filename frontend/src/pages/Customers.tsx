import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Filter, Edit, Trash2, Users, Phone, Mail, MapPin, CreditCard } from 'lucide-react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useInventoryQueries'
import { CustomerForm } from '@/components/forms/CustomerForm'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  credit_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function Customers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Fetch customers
  const { data: customersData = [], isLoading, error } = useCustomers({
    search: searchTerm || undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  })

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  // Extract customers from API response
  const customers = Array.isArray(customersData) ? customersData : ((customersData as any)?.data || []) as any[]

  const handleCreateCustomer = async (data: any) => {
    try {
      await createCustomer.mutateAsync(data)
      setShowCreateDialog(false)
    } catch (error) {
      console.error('Failed to create customer:', error)
    }
  }

  const handleUpdateCustomer = async (data: any) => {
    if (!editingCustomer) return
    try {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, data })
      setEditingCustomer(null)
    } catch (error) {
      console.error('Failed to update customer:', error)
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete customer:', error)
      }
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              onSubmit={handleCreateCustomer}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={createCustomer.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Directory
            </div>
            {customers.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {customers.length} customer{customers.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading customers...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-600">Error loading customers</div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'No customers match your filters'
                  : 'No customers yet'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Credit Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: any) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Code: {customer.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.address && (
                            <div className="flex items-start gap-1 text-sm">
                              <MapPin className="h-3 w-3 mt-0.5" />
                              <div>
                                <div>{customer.address}</div>
                                <div className="text-muted-foreground">
                                  {[customer.city, customer.state, customer.postal_code]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                                {customer.country && (
                                  <div className="text-muted-foreground">{customer.country}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.credit_limit && (
                          <div className="flex items-center gap-1 text-sm">
                            <CreditCard className="h-3 w-3" />
                            {formatCurrency(customer.credit_limit)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.is_active ? "default" : "secondary"}
                          className={customer.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {customer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(customer.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCustomer(customer)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              customer={editingCustomer}
              onSubmit={handleUpdateCustomer}
              onCancel={() => setEditingCustomer(null)}
              isLoading={updateCustomer.isPending}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}