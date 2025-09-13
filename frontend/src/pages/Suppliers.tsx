import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { useSuppliers } from '@/hooks/useInventoryQueries'
import { formatDate } from '@/lib/utils'

export function Suppliers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Fetch suppliers
  const { data: suppliers = [], isLoading, error } = useSuppliers()

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm)
  )


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Supplier</DialogTitle>
            </DialogHeader>
            {/* TODO: Add SupplierForm component */}
            <div className="p-4 text-center text-muted-foreground">
              Supplier form component to be implemented
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
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
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Suppliers Directory
            </div>
            {filteredSuppliers.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading suppliers...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-600">Error loading suppliers</div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">
                {searchTerm ? 'No suppliers match your search' : 'No suppliers yet'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.contact_person && (
                            <div className="text-sm text-muted-foreground">
                              Contact: {supplier.contact_person}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.address && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            <div>
                              {supplier.address}
                              {supplier.city && `, ${supplier.city}`}
                              {supplier.country && `, ${supplier.country}`}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={supplier.is_active ? "default" : "secondary"}
                          className={supplier.is_active ? "bg-green-100 text-green-800" : ""}
                        >
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(supplier.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={!supplier.is_active}
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
    </div>
  )
}