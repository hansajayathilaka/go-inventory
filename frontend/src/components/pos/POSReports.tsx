import { useState, useEffect } from 'react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  AlertCircle,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RoleBasedPOSAccess, useUserRole } from './RoleBasedPOSAccess'
import { posManagerService } from '@/services/posManagerService'
import {
  POSDailyReport,
  POSWeeklyReport,
  POSMonthlyReport,
  StaffPerformance,
  ReportType
} from '@/types/posManager'

interface POSReportsProps {
  className?: string
}

type ReportData = POSDailyReport | POSWeeklyReport | POSMonthlyReport

export function POSReports({ className }: POSReportsProps) {
  const { isManager, isAdmin } = useUserRole()
  
  const [activeTab, setActiveTab] = useState<ReportType>('daily')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Initialize default periods
  useEffect(() => {
    const today = new Date()
    const periods = posManagerService.getReportPeriods()
    
    switch (activeTab) {
      case 'daily':
        setSelectedPeriod(periods.daily[0].value)
        break
      case 'weekly':
        setSelectedPeriod(periods.weekly[0].value)
        break
      case 'monthly':
        setSelectedPeriod(periods.monthly[0].value)
        break
    }
  }, [activeTab])

  // Load report data
  const loadReportData = async () => {
    if (!selectedPeriod) return

    setIsLoading(true)
    setError(null)

    try {
      let data: ReportData
      
      switch (activeTab) {
        case 'daily':
          data = await posManagerService.getDailyReport(selectedPeriod)
          break
        case 'weekly':
          data = await posManagerService.getWeeklyReport(selectedPeriod)
          break
        case 'monthly':
          const [month, year] = selectedPeriod.split('-').map(Number)
          data = await posManagerService.getMonthlyReport(month, year)
          break
        default:
          throw new Error('Invalid report type')
      }

      setReportData(data)

      // Load staff performance for monthly reports
      if (activeTab === 'monthly' && (isManager || isAdmin)) {
        const monthlyData = data as POSMonthlyReport
        const staffData = await posManagerService.getStaffPerformance({
          start_date: `${monthlyData.year}-${monthlyData.month.toString().padStart(2, '0')}-01`,
          end_date: format(endOfMonth(new Date(monthlyData.year, monthlyData.month - 1)), 'yyyy-MM-dd'),
          include_metrics: true
        })
        setStaffPerformance(staffData)
      }
    } catch (err) {
      setError('Failed to load report data. Please try again.')
      console.error('Report loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Export report
  const exportReport = async (format: 'csv' | 'pdf') => {
    if (!selectedPeriod) return

    setIsExporting(true)
    try {
      let params: any = {
        type: activeTab,
        format,
        include_details: true
      }

      switch (activeTab) {
        case 'daily':
          params.date = selectedPeriod
          break
        case 'weekly':
          params.week = selectedPeriod
          break
        case 'monthly':
          const [month, year] = selectedPeriod.split('-').map(Number)
          params.month = month
          params.year = year
          break
      }

      const blob = await posManagerService.exportReport(params)
      const filename = `pos-${activeTab}-report-${selectedPeriod}.${format}`
      posManagerService.downloadFile(blob, filename)
    } catch (err) {
      setError('Failed to export report. Please try again.')
      console.error('Export error:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Load data when period changes
  useEffect(() => {
    if (selectedPeriod) {
      loadReportData()
    }
  }, [selectedPeriod, activeTab])

  // Render summary cards
  const renderSummaryCards = () => {
    if (!reportData) return null

    const stats = [
      {
        title: 'Total Sales',
        value: reportData.total_sales,
        icon: ShoppingCart,
        color: 'text-blue-600'
      },
      {
        title: 'Revenue',
        value: posManagerService.formatCurrency(reportData.total_revenue),
        icon: DollarSign,
        color: 'text-green-600'
      },
      {
        title: 'Items Sold',
        value: reportData.total_items_sold.toLocaleString(),
        icon: Package,
        color: 'text-purple-600'
      },
      {
        title: 'Avg. Transaction',
        value: posManagerService.formatCurrency(reportData.average_transaction),
        icon: TrendingUp,
        color: 'text-orange-600'
      }
    ]

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Render top products table
  const renderTopProducts = () => {
    if (!reportData || !reportData.top_products || reportData.top_products.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <div>No product data available</div>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Qty Sold</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Avg Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.top_products.map((product, index) => (
            <TableRow key={product.product_id}>
              <TableCell className="font-medium">{product.product_name}</TableCell>
              <TableCell className="text-gray-600">{product.sku}</TableCell>
              <TableCell className="text-right">{product.quantity_sold}</TableCell>
              <TableCell className="text-right">
                {posManagerService.formatCurrency(product.revenue)}
              </TableCell>
              <TableCell className="text-right">
                {posManagerService.formatCurrency(product.average_price)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Render staff performance table (for managers)
  const renderStaffPerformance = () => {
    if (!isManager && !isAdmin) return null
    if (!staffPerformance || staffPerformance.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <div>No staff performance data available</div>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Member</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
            <TableHead className="text-right">Avg Sale</TableHead>
            <TableHead className="text-right">Efficiency</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staffPerformance.map((staff) => (
            <TableRow key={staff.cashier_id}>
              <TableCell className="font-medium">{staff.cashier_name}</TableCell>
              <TableCell className="text-right">{staff.total_sales}</TableCell>
              <TableCell className="text-right">
                {posManagerService.formatCurrency(staff.total_revenue)}
              </TableCell>
              <TableCell className="text-right">{staff.total_transactions}</TableCell>
              <TableCell className="text-right">
                {posManagerService.formatCurrency(staff.average_transaction)}
              </TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={staff.efficiency_score >= 0.8 ? 'default' : staff.efficiency_score >= 0.6 ? 'secondary' : 'destructive'}
                >
                  {Math.round(staff.efficiency_score * 100)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <RoleBasedPOSAccess requiredRole="manager">
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Reports
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadReportData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('csv')}
                disabled={isExporting || !reportData}
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReport('pdf')}
                disabled={isExporting || !reportData}
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Report Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              {/* Period Selector */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === 'daily' && posManagerService.getReportPeriods().daily.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                  {activeTab === 'weekly' && posManagerService.getReportPeriods().weekly.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                  {activeTab === 'monthly' && posManagerService.getReportPeriods().monthly.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading report data...
              </div>
            )}

            {/* Report Content */}
            {!isLoading && reportData && (
              <>
                {/* Summary Cards */}
                {renderSummaryCards()}

                {/* Report Details */}
                <TabsContent value="daily" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTopProducts()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="weekly" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTopProducts()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="monthly" className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Products</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderTopProducts()}
                      </CardContent>
                    </Card>

                    {(isManager || isAdmin) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Staff Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {renderStaffPerformance()}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </RoleBasedPOSAccess>
  )
}