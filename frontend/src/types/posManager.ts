// POS Manager interface types - aligned with backend DTOs

export interface POSDailyReport {
  date: string
  total_sales: number
  total_revenue: number
  total_items_sold: number
  total_transactions: number
  average_transaction: number
  cash_payments: number
  card_payments: number
  other_payments: number
  top_products: TopProductSummary[]
  hourly_breakdown: HourlyBreakdown[]
}

export interface POSWeeklyReport {
  week_start: string
  week_end: string
  total_sales: number
  total_revenue: number
  total_items_sold: number
  total_transactions: number
  average_transaction: number
  daily_breakdown: DailyBreakdown[]
  top_products: TopProductSummary[]
  payment_methods: PaymentMethodSummary[]
}

export interface POSMonthlyReport {
  month: number
  year: number
  total_sales: number
  total_revenue: number
  total_items_sold: number
  total_transactions: number
  average_transaction: number
  daily_breakdown: DailyBreakdown[]
  weekly_breakdown: WeeklyBreakdown[]
  top_products: TopProductSummary[]
  payment_methods: PaymentMethodSummary[]
  staff_performance: StaffPerformanceSummary[]
}

export interface StaffPerformance {
  cashier_id: number
  cashier_name: string
  period_start: string
  period_end: string
  total_sales: number
  total_revenue: number
  total_transactions: number
  average_transaction: number
  performance_rating: number
  efficiency_score: number
}

export interface DashboardMetrics {
  today_sales: number
  today_revenue: number
  today_transactions: number
  yesterday_sales: number
  yesterday_revenue: number
  yesterday_transactions: number
  week_sales: number
  week_revenue: number
  week_transactions: number
  month_sales: number
  month_revenue: number
  month_transactions: number
  active_staff: number
  recent_transactions: RecentTransaction[]
}

export interface DashboardAlerts {
  low_stock_items: LowStockAlert[]
  system_alerts: SystemAlert[]
  performance_alerts: PerformanceAlert[]
}

export interface DashboardSummary {
  current_shift: ShiftSummary
  daily_summary: DailySummary
  staff_activity: StaffActivity[]
  recent_activity: RecentActivity[]
}

// Supporting interfaces
export interface TopProductSummary {
  product_id: string
  product_name: string
  sku: string
  quantity_sold: number
  revenue: number
  profit: number
  average_price: number
}

export interface PaymentMethodSummary {
  method: string
  count: number
  amount: number
  percentage: number
}

export interface HourlyBreakdown {
  hour: number
  sales_count: number
  revenue: number
  transactions: number
}

export interface DailyBreakdown {
  date: string
  sales_count: number
  revenue: number
  transactions: number
  average_transaction: number
}

export interface WeeklyBreakdown {
  week_start: string
  week_end: string
  sales_count: number
  revenue: number
  transactions: number
  average_transaction: number
}

export interface StaffPerformanceSummary {
  cashier_id: number
  cashier_name: string
  sales_count: number
  revenue: number
  transactions: number
  average_transaction: number
  efficiency_score: number
}

export interface RecentTransaction {
  id: string
  bill_number: string
  cashier_name: string
  customer_name?: string
  total_amount: number
  payment_methods: string[]
  created_at: string
  items_count: number
}

export interface LowStockAlert {
  product_id: string
  product_name: string
  sku: string
  current_stock: number
  minimum_stock: number
  supplier?: string
  last_updated: string
}

export interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  created_at: string
  resolved: boolean
}

export interface PerformanceAlert {
  type: 'low_sales' | 'slow_transactions' | 'high_discounts'
  cashier_id?: number
  cashier_name?: string
  message: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
}

export interface ShiftSummary {
  shift_start: string
  current_time: string
  active_sessions: number
  total_sales: number
  total_revenue: number
  total_transactions: number
}

export interface DailySummary {
  date: string
  sales_target?: number
  current_sales: number
  current_revenue: number
  progress_percentage: number
  on_target: boolean
}

export interface StaffActivity {
  cashier_id: number
  cashier_name: string
  status: 'active' | 'break' | 'offline'
  session_start?: string
  last_transaction?: string
  current_sales: number
  current_transactions: number
}

export interface RecentActivity {
  id: string
  type: 'sale' | 'void' | 'return' | 'staff_login' | 'staff_logout'
  description: string
  cashier_name?: string
  amount?: number
  created_at: string
}

// Request/Response wrappers
export interface POSReportRequest {
  date?: string
  week?: string
  month?: number
  year?: number
  staff_id?: number
  include_details?: boolean
}

export interface StaffPerformanceRequest {
  start_date: string
  end_date: string
  staff_id?: number
  include_metrics?: boolean
}

// Utility types
export type ReportType = 'daily' | 'weekly' | 'monthly'
export type ReportPeriod = {
  start: string
  end: string
  label: string
}

export interface ExportOptions {
  format: 'csv' | 'pdf'
  include_details: boolean
  date_range: {
    start: string
    end: string
  }
}

// Chart data interfaces
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  timestamp: string
  value: number
  label?: string
}