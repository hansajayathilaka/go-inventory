import { useState, useEffect } from 'react'
import { Search, UserPlus, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserRole } from './RoleBasedPOSAccess'

// Customer type definition (should match backend)
interface Customer {
  id: number
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
  createdAt: string
  totalPurchases?: number
}

interface StaffCustomerManagerProps {
  onCustomerSelect: (customer: Customer | null) => void
  selectedCustomer?: Customer | null
  allowCreate?: boolean
  allowEdit?: boolean
  className?: string
}

interface NewCustomerData {
  name: string
  phone?: string
  email?: string
  address?: string
}

export function StaffCustomerManager({
  onCustomerSelect,
  selectedCustomer,
  allowCreate = true,
  allowEdit = false,
  className
}: StaffCustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { hasRole, isStaff } = useUserRole()

  // Simulated customer search (replace with actual API call)
  const searchCustomers = async (term: string): Promise<Customer[]> => {
    // This would be replaced with actual API call
    // For now, return mock data
    if (!term.trim()) return []
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock customer data
    const mockCustomers: Customer[] = [
      {
        id: 1,
        code: 'CUST001',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        address: '123 Main St, City, State 12345',
        isActive: true,
        createdAt: '2024-01-01',
        totalPurchases: 5
      },
      {
        id: 2,
        code: 'CUST002', 
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '(555) 987-6543',
        isActive: true,
        createdAt: '2024-01-15',
        totalPurchases: 12
      },
      {
        id: 3,
        code: 'CUST003',
        name: 'Bob Wilson',
        phone: '(555) 456-7890',
        isActive: true,
        createdAt: '2024-02-01',
        totalPurchases: 3
      }
    ]

    // Filter by search term
    return mockCustomers.filter(customer =>
      customer.name.toLowerCase().includes(term.toLowerCase()) ||
      customer.code.toLowerCase().includes(term.toLowerCase()) ||
      (customer.phone && customer.phone.includes(term)) ||
      (customer.email && customer.email.toLowerCase().includes(term.toLowerCase()))
    )
  }

  // Handle search with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true)
      setError(null)
      
      try {
        const results = await searchCustomers(searchTerm)
        setSearchResults(results)
      } catch (err) {
        setError('Failed to search customers. Please try again.')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [searchTerm])

  // Handle customer creation
  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      setError('Customer name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // This would be replaced with actual API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock new customer creation
      const newCustomer: Customer = {
        id: Date.now(), // Mock ID
        code: `CUST${String(Date.now()).slice(-3).padStart(3, '0')}`,
        name: newCustomerData.name.trim(),
        email: newCustomerData.email?.trim() || undefined,
        phone: newCustomerData.phone?.trim() || undefined,
        address: newCustomerData.address?.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        totalPurchases: 0
      }

      // Select the new customer and close form
      onCustomerSelect(newCustomer)
      setShowCreateForm(false)
      setNewCustomerData({ name: '', phone: '', email: '', address: '' })
      
    } catch (err) {
      setError('Failed to create customer. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer)
    setSearchTerm('')
    setSearchResults([])
  }

  // Clear customer selection
  const handleClearCustomer = () => {
    onCustomerSelect(null)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Selection
            {isStaff && (
              <Badge variant="outline" className="text-xs">
                Staff Access
              </Badge>
            )}
          </div>
          {selectedCustomer && (
            <Button variant="outline" size="sm" onClick={handleClearCustomer}>
              Clear Selection
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Customer Display */}
        {selectedCustomer && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-green-800">
                  {selectedCustomer.name}
                </div>
                <div className="text-sm text-green-600">
                  Code: {selectedCustomer.code}
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                Selected
              </Badge>
            </div>
          </div>
        )}

        {/* Search Section */}
        {!selectedCustomer && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, code, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4 text-gray-500">
                Searching customers...
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-600">
                          Code: {customer.code}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                      {!isStaff && customer.totalPurchases !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {customer.totalPurchases} purchases
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm.trim() && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No customers found matching "{searchTerm}"
              </div>
            )}

            {/* Walk-in Customer Option */}
            <div className="border-t pt-4">
              <Button
                variant="outline" 
                className="w-full"
                onClick={() => onCustomerSelect(null)}
              >
                Continue as Walk-in Customer
              </Button>
            </div>

            {/* Create New Customer Section */}
            {allowCreate && (
              <div className="border-t pt-4 space-y-4">
                {!showCreateForm ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create New Customer
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-medium">Create New Customer</h4>
                    
                    <Input
                      placeholder="Customer Name *"
                      value={newCustomerData.name}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    
                    <Input
                      placeholder="Phone Number"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    
                    <Input
                      placeholder="Email Address"
                      type="email"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    
                    {/* Address field - staff limited to basic info */}
                    {!isStaff && (
                      <Input
                        placeholder="Address"
                        value={newCustomerData.address}
                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateCustomer}
                        disabled={isCreating || !newCustomerData.name.trim()}
                        className="flex-1"
                      >
                        {isCreating ? 'Creating...' : 'Create Customer'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false)
                          setNewCustomerData({ name: '', phone: '', email: '', address: '' })
                          setError(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Staff-specific restrictions notice */}
        {isStaff && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <strong>Staff Access:</strong> You can search, select, and create customers. 
            Contact a manager for customer editing or detailed history.
          </div>
        )}
      </CardContent>
    </Card>
  )
}