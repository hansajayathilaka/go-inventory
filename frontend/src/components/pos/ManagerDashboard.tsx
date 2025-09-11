import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Activity,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus
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
import { RoleBasedPOSAccess } from './RoleBasedPOSAccess'
import { posManagerService } from '@/services/posManagerService'
import type {
  DashboardMetrics,
  DashboardAlerts,
  DashboardSummary
} from '@/types/posManager'

interface ManagerDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ManagerDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 // 30 seconds 
}: ManagerDashboardProps) {
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [metricsData, alertsData, summaryData] = await Promise.all([
        posManagerService.getDashboardMetrics(),
        posManagerService.getDashboardAlerts(),
        posManagerService.getDashboardSummary()
      ])

      setMetrics(metricsData)
      setAlerts(alertsData)
      setSummary(summaryData)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Dashboard loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Force refresh from backend
  const refreshDashboard = async () => {
    try {
      await posManagerService.refreshDashboard()
      await loadDashboardData()
    } catch (err) {
      setError('Failed to refresh dashboard data.')
      console.error('Dashboard refresh error:', err)
    }
  }

  // Dismiss alert
  const dismissAlert = async (alertId: string) => {
    try {
      await posManagerService.dismissAlert(alertId)
      // Reload alerts to reflect changes
      const alertsData = await posManagerService.getDashboardAlerts()
      setAlerts(alertsData)
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return

    const interval = setInterval(loadDashboardData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Calculate growth indicators
  const getGrowthInfo = (current: number, previous: number) => {
    const growth = posManagerService.calculateGrowth(current, previous)
    const isPositive = growth > 0
    const isNeutral = growth === 0

    return {
      percentage: Math.abs(growth).toFixed(1),
      isPositive,
      isNeutral,
      icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      color: isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
    }
  }

  // Render metrics cards
  const renderMetricsCards = () => {
    if (!metrics) return null

    const cards = [
      {
        title: 'Today\'s Sales',
        value: metrics.today_sales,
        previousValue: metrics.yesterday_sales,
        icon: ShoppingCart,
        formatter: (val: number) => val.toString()
      },
      {
        title: 'Today\'s Revenue',
        value: metrics.today_revenue,
        previousValue: metrics.yesterday_revenue,
        icon: DollarSign,
        formatter: (val: number) => posManagerService.formatCurrency(val)
      },
      {
        title: 'Transactions',
        value: metrics.today_transactions,
        previousValue: metrics.yesterday_transactions,
        icon: Activity,
        formatter: (val: number) => val.toString()
      },
      {
        title: 'Active Staff',
        value: metrics.active_staff,
        previousValue: metrics.active_staff, // No comparison for this metric
        icon: Users,
        formatter: (val: number) => val.toString(),
        noComparison: true
      }
    ]

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const growth = card.noComparison ? null : getGrowthInfo(card.value, card.previousValue)
          const Icon = card.icon

          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold">{card.formatter(card.value)}</p>
                    {growth && (
                      <div className={`flex items-center text-sm ${growth.color}`}>
                        <growth.icon className="h-3 w-3 mr-1" />
                        <span>{growth.percentage}% vs yesterday</span>
                      </div>
                    )}
                  </div>
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Render alerts section
  const renderAlerts = () => {
    if (!alerts) return null

    const allAlerts = [
      ...alerts.low_stock_items.map(alert => ({ ...alert, type: 'low_stock' as const })),
      ...alerts.system_alerts.filter(alert => !alert.resolved),
      ...alerts.performance_alerts.map(alert => ({ ...alert, type: 'performance' as const }))
    ]

    if (allAlerts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
          <div>No active alerts</div>
          <div className="text-sm">All systems running smoothly</div>
        </div>
      )
    }

    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {allAlerts.map((alert, index) => (
          <Alert key={index} className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 flex items-start justify-between">
              <div>
                {'title' in alert ? (
                  <>
                    <strong>{alert.title}</strong>
                    <br />
                    {alert.message}
                  </>
                ) : 'product_name' in alert ? (
                  <>
                    <strong>Low Stock:</strong> {alert.product_name} (SKU: {alert.sku})
                    <br />
                    Current: {alert.current_stock}, Minimum: {alert.minimum_stock}
                  </>
                ) : (
                  <>
                    <strong>Performance Alert:</strong> {alert.message}
                    {alert.cashier_name && (
                      <><br />Staff: {alert.cashier_name}</>
                    )}
                  </>
                )}
              </div>
              {'id' in alert && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    )
  }

  // Render staff activity
  const renderStaffActivity = () => {
    if (!summary?.staff_activity) return null

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.staff_activity.map((staff) => (
            <TableRow key={staff.cashier_id}>
              <TableCell className="font-medium">{staff.cashier_name}</TableCell>
              <TableCell>
                <Badge 
                  variant={staff.status === 'active' ? 'default' : staff.status === 'break' ? 'secondary' : 'outline'}
                  className={
                    staff.status === 'active' ? 'bg-green-100 text-green-800' :
                    staff.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {staff.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{staff.current_sales}</TableCell>
              <TableCell className="text-right">{staff.current_transactions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Render recent transactions
  const renderRecentTransactions = () => {
    if (!metrics?.recent_transactions || metrics.recent_transactions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <div>No recent transactions</div>
        </div>
      )
    }

    return (
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {metrics.recent_transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <div className="flex-1">
              <div className="font-medium">{transaction.bill_number}</div>
              <div className="text-sm text-gray-600">
                {transaction.cashier_name}
                {transaction.customer_name && ` • ${transaction.customer_name}`}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(transaction.created_at), 'MMM dd, HH:mm')} • 
                {transaction.items_count} item{transaction.items_count !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {posManagerService.formatCurrency(transaction.total_amount)}
              </div>
              <div className="text-xs text-gray-500">
                {transaction.payment_methods.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <RoleBasedPOSAccess requiredRole="manager">
      <div className={className}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Manager Dashboard</h2>
              <p className="text-gray-600">
                Real-time overview and system monitoring
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshDashboard}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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

          {/* Loading State */}
          {isLoading && !metrics && (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Loading dashboard data...
            </div>
          )}

          {/* Dashboard Content */}
          {!isLoading && metrics && (
            <>
              {/* Metrics Cards */}
              {renderMetricsCards()}

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      System Alerts
                      {alerts && (
                        alerts.low_stock_items.length + 
                        alerts.system_alerts.filter(a => !a.resolved).length + 
                        alerts.performance_alerts.length
                      ) > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {alerts.low_stock_items.length + 
                           alerts.system_alerts.filter(a => !a.resolved).length + 
                           alerts.performance_alerts.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderAlerts()}
                  </CardContent>
                </Card>

                {/* Staff Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Staff Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderStaffActivity()}
                  </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderRecentTransactions()}
                  </CardContent>
                </Card>
              </div>

              {/* Current Shift Summary */}
              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Current Shift Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Shift Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Started:</span>
                              <span>{format(new Date(summary.current_shift.shift_start), 'HH:mm')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Sessions:</span>
                              <span>{summary.current_shift.active_sessions}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Shift Performance</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Sales:</span>
                              <span>{summary.current_shift.total_sales}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Revenue:</span>
                              <span>{posManagerService.formatCurrency(summary.current_shift.total_revenue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Transactions:</span>
                              <span>{summary.current_shift.total_transactions}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Daily Progress</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Sales Progress:</span>
                              <span>{summary.daily_summary.progress_percentage.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Target Status:</span>
                              <Badge variant={summary.daily_summary.on_target ? 'default' : 'secondary'}>
                                {summary.daily_summary.on_target ? 'On Track' : 'Behind'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </RoleBasedPOSAccess>
  )
}