import { useState, useEffect } from 'react'
import { format, subDays, isWithinInterval } from 'date-fns'
import { 
  Calendar, 
  Receipt, 
  DollarSign, 
  ShoppingCart,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserRole } from './RoleBasedPOSAccess'
import { useAuthStore } from '@/stores/authStore'

interface SaleItem {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Sale {
  id: number
  billNumber: string
  customerName?: string
  customerCode?: string
  saleDate: Date
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethods: string[]
  itemCount: number
}

interface PersonalSalesHistoryProps {
  cashierId?: number
  maxRecords?: number
  className?: string
}

interface DateFilter {
  start: Date
  end: Date
  label: string
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

export function PersonalSalesHistory({ 
  cashierId, 
  maxRecords = 50, 
  className 
}: PersonalSalesHistoryProps) {
  const { user } = useAuthStore()
  const { isStaff, roleDisplayName } = useUserRole()
  
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>({
    start: subDays(new Date(), 7),
    end: new Date(),
    label: 'Last 7 days'
  })
  const [searchTerm, setSearchTerm] = useState('')

  const effectiveCashierId = cashierId || user?.id

  // Predefined date filters
  const dateFilters: DateFilter[] = [
    {
      start: new Date(),
      end: new Date(),
      label: 'Today'
    },
    {
      start: subDays(new Date(), 1),
      end: new Date(),
      label: 'Yesterday'
    },
    {
      start: subDays(new Date(), 7),
      end: new Date(),
      label: 'Last 7 days'
    },
    {
      start: subDays(new Date(), 30),
      end: new Date(),
      label: 'Last 30 days'
    },
    {
      start: subDays(new Date(), 90),
      end: new Date(),
      label: 'Last 3 months'
    }
  ]

  // Mock sales data fetch function (replace with actual API call)
  const fetchPersonalSales = async (cashierId: number): Promise<Sale[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock sales data - in real app this would filter by cashierId
    const mockSales: Sale[] = [
      {
        id: 1,
        billNumber: 'SALE-001',
        customerName: 'John Doe',
        customerCode: 'CUST001',
        saleDate: new Date(),
        items: [
          {
            id: 1,
            productName: 'Hammer',
            quantity: 2,
            unitPrice: 15.99,
            totalPrice: 31.98
          },
          {
            id: 2,
            productName: 'Screwdriver Set',
            quantity: 1,
            unitPrice: 24.99,
            totalPrice: 24.99
          }
        ],
        subtotal: 56.97,
        tax: 5.70,
        discount: 0,
        total: 62.67,
        paymentMethods: ['Cash'],
        itemCount: 3
      },
      {
        id: 2,
        billNumber: 'SALE-002',
        customerName: 'Jane Smith',
        saleDate: subDays(new Date(), 1),
        items: [
          {
            id: 3,
            productName: 'Drill Bits Set',
            quantity: 1,
            unitPrice: 19.99,
            totalPrice: 19.99
          }
        ],
        subtotal: 19.99,
        tax: 2.00,
        discount: 2.00,
        total: 19.99,
        paymentMethods: ['Card'],
        itemCount: 1
      },
      {
        id: 3,
        billNumber: 'SALE-003',
        saleDate: subDays(new Date(), 3),
        items: [
          {
            id: 4,
            productName: 'Paint Brush',
            quantity: 5,
            unitPrice: 3.99,
            totalPrice: 19.95
          },
          {
            id: 5,
            productName: 'Paint Roller',
            quantity: 2,
            unitPrice: 7.99,
            totalPrice: 15.98
          }
        ],
        subtotal: 35.93,
        tax: 3.59,
        discount: 0,
        total: 39.52,
        paymentMethods: ['Cash', 'Card'],
        itemCount: 7
      }
    ]

    return mockSales
  }

  // Load sales data
  const loadSalesHistory = async () => {
    if (!effectiveCashierId) {
      setError('No cashier ID available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const salesData = await fetchPersonalSales(effectiveCashierId)
      setSales(salesData)
    } catch (err) {
      setError('Failed to load sales history. Please try again.')
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter sales based on date range and search term
  useEffect(() => {
    let filtered = sales.filter(sale => 
      isWithinInterval(sale.saleDate, {
        start: selectedDateFilter.start,
        end: selectedDateFilter.end
      })
    )

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(sale =>
        sale.billNumber.toLowerCase().includes(term) ||
        sale.customerName?.toLowerCase().includes(term) ||
        sale.customerCode?.toLowerCase().includes(term) ||
        sale.items.some(item => item.productName.toLowerCase().includes(term))
      )
    }

    // Limit results for staff users
    if (isStaff && maxRecords) {
      filtered = filtered.slice(0, maxRecords)
    }

    setFilteredSales(filtered)
  }, [sales, selectedDateFilter, searchTerm, isStaff, maxRecords])

  // Load data on component mount
  useEffect(() => {
    loadSalesHistory()
  }, [effectiveCashierId])

  // Calculate summary statistics
  const summaryStats = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
    totalItems: filteredSales.reduce((sum, sale) => sum + sale.itemCount, 0),
    averageSale: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length 
      : 0
  }

  // Export personal sales data
  const exportSalesData = () => {
    if (filteredSales.length === 0) return

    const csvData = [
      'Date,Bill Number,Customer,Items,Total,Payment Methods',
      ...filteredSales.map(sale =>
        `${format(sale.saleDate, 'yyyy-MM-dd')},${sale.billNumber},${sale.customerName || 'Walk-in'},${sale.itemCount},${sale.total.toFixed(2)},"${sale.paymentMethods.join(', ')}"`
      )
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `personal-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Personal Sales History
            {isStaff && (
              <Badge variant="outline" className="text-xs">
                Staff View
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSalesHistory}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {filteredSales.length > 0 && (
              <Button variant="outline" size="sm" onClick={exportSalesData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User and Restrictions Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800">
              Showing sales for: <strong>{user?.username}</strong> ({roleDisplayName})
            </span>
            {isStaff && (
              <Badge variant="secondary" className="text-xs">
                Limited to {maxRecords} records
              </Badge>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Date Filter */}
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((filter, index) => (
              <Button
                key={index}
                variant={selectedDateFilter.label === filter.label ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateFilter(filter)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by bill number, customer, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Summary Statistics */}
        {filteredSales.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-md">
              <div className="text-sm text-green-600">Total Sales</div>
              <div className="text-xl font-semibold text-green-800">
                {summaryStats.totalSales}
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm text-blue-600">Revenue</div>
              <div className="text-xl font-semibold text-blue-800">
                {formatCurrency(summaryStats.totalRevenue)}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-md">
              <div className="text-sm text-purple-600">Items Sold</div>
              <div className="text-xl font-semibold text-purple-800">
                {summaryStats.totalItems}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-md">
              <div className="text-sm text-orange-600">Avg. Sale</div>
              <div className="text-xl font-semibold text-orange-800">
                {formatCurrency(summaryStats.averageSale)}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-gray-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading your sales history...
          </div>
        )}

        {/* Sales List */}
        {!isLoading && (
          <>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <div>No sales found for the selected criteria</div>
                <div className="text-sm">Try adjusting your filters or date range</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale) => (
                  <div key={sale.id} className="border border-gray-200 rounded-md p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{sale.billNumber}</div>
                        <div className="text-sm text-gray-600">
                          {format(sale.saleDate, 'MMM dd, yyyy HH:mm')}
                        </div>
                        {sale.customerName && (
                          <div className="text-sm text-gray-600">
                            Customer: {sale.customerName}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {formatCurrency(sale.total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.itemCount} item{sale.itemCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-2">
                      {sale.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span>{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment Methods */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-1">
                        {sale.paymentMethods.map((method, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-gray-500">
                        Tax: {formatCurrency(sale.tax)}
                        {sale.discount > 0 && (
                          <span className="ml-2 text-red-600">
                            Discount: -{formatCurrency(sale.discount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Staff-specific limitations notice */}
        {isStaff && filteredSales.length === maxRecords && (
          <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
            <strong>Note:</strong> Showing the most recent {maxRecords} transactions only. 
            Contact a manager for complete sales history.
          </div>
        )}
      </CardContent>
    </Card>
  )
}