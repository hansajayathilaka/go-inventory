import { useState, useEffect } from 'react'
import { format, subDays, isWithinInterval } from 'date-fns'
import { 
  Receipt, 
  Download,
  RefreshCw,
  AlertCircle,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUserRole } from './RoleBasedPOSAccess'
import { useAuthStore } from '@/stores/authStore'
import { salesService } from '@/services/salesService'
import type { Sale } from '@/services/salesService'

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

  // Real sales data fetch using the API
  const fetchPersonalSales = async (cashierId: number): Promise<Sale[]> => {
    try {
      const response = await salesService.getCashierSales(cashierId, {
        limit: maxRecords
      })
      
      return response.sales
    } catch (error) {
      console.error('Failed to fetch personal sales:', error)
      throw new Error('Failed to load sales data')
    }
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
      isWithinInterval(new Date(sale.created_at || ''), {
        start: selectedDateFilter.start,
        end: selectedDateFilter.end
      })
    )

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(sale =>
        sale.bill_number.toLowerCase().includes(term) ||
        sale.customer_name?.toLowerCase().includes(term) ||
        sale.customer_code?.toLowerCase().includes(term) ||
        sale.items?.some(item => item.product_name?.toLowerCase().includes(term))
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
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0),
    totalItems: filteredSales.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0),
    averageSale: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length 
      : 0
  }

  // Export personal sales data
  const exportSalesData = () => {
    if (filteredSales.length === 0) return

    const csvData = [
      'Date,Bill Number,Customer,Items,Total,Payment Methods',
      ...filteredSales.map(sale => {
        const itemCount = (sale.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0)
        const paymentMethods = (sale.payments || []).map(p => p.method).join(', ')
        return `${format(new Date(sale.created_at || ''), 'yyyy-MM-dd')},${sale.bill_number},${sale.customer_name || 'Walk-in'},${itemCount},${sale.total_amount.toFixed(2)},"${paymentMethods}"`
      })
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
                        <div className="font-medium">{sale.bill_number}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(sale.created_at || ''), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {sale.customer_name && (
                          <div className="text-sm text-gray-600">
                            Customer: {sale.customer_name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {formatCurrency(sale.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(sale.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0)} item{(sale.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-2">
                      {sale.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.quantity}x {item.product_name}
                          </span>
                          <span>{formatCurrency(item.sub_total)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment Methods */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-1">
                        {sale.payments?.map((payment, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {payment.method}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-gray-500">
                        {sale.discount_amount > 0 && (
                          <span className="text-red-600">
                            Discount: -{formatCurrency(sale.discount_amount)}
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