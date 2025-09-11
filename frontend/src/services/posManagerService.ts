import { apiClient } from './api'
import type {
  POSDailyReport,
  POSWeeklyReport,
  POSMonthlyReport,
  StaffPerformance,
  DashboardMetrics,
  DashboardAlerts,
  DashboardSummary,
  POSReportRequest,
  StaffPerformanceRequest
} from '@/types/posManager'

export const posManagerService = {
  /**
   * Get daily sales report
   */
  async getDailyReport(date: string): Promise<POSDailyReport> {
    const response = await apiClient.get<POSDailyReport>(`/pos/reports/daily?date=${date}`)
    return response.data
  },

  /**
   * Get weekly sales report
   */
  async getWeeklyReport(week: string): Promise<POSWeeklyReport> {
    const response = await apiClient.get<POSWeeklyReport>(`/pos/reports/weekly?week=${week}`)
    return response.data
  },

  /**
   * Get monthly sales report
   */
  async getMonthlyReport(month: number, year: number): Promise<POSMonthlyReport> {
    const response = await apiClient.get<POSMonthlyReport>(`/pos/reports/monthly?month=${month}&year=${year}`)
    return response.data
  },

  /**
   * Get custom report with flexible parameters
   */
  async getCustomReport(params: POSReportRequest): Promise<POSDailyReport | POSWeeklyReport | POSMonthlyReport> {
    const queryParams = new URLSearchParams()
    
    if (params.date) queryParams.append('date', params.date)
    if (params.week) queryParams.append('week', params.week)
    if (params.month) queryParams.append('month', params.month.toString())
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.staff_id) queryParams.append('staff_id', params.staff_id.toString())
    if (params.include_details !== undefined) queryParams.append('include_details', params.include_details.toString())

    const response = await apiClient.get<POSDailyReport | POSWeeklyReport | POSMonthlyReport>(`/pos/reports?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get staff performance data
   */
  async getStaffPerformance(params: StaffPerformanceRequest): Promise<StaffPerformance[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('start_date', params.start_date)
    queryParams.append('end_date', params.end_date)
    
    if (params.staff_id) queryParams.append('staff_id', params.staff_id.toString())
    if (params.include_metrics !== undefined) queryParams.append('include_metrics', params.include_metrics.toString())

    const response = await apiClient.get<StaffPerformance[]>(`/pos/staff-performance?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get individual staff member performance
   */
  async getIndividualStaffPerformance(staffId: number, startDate: string, endDate: string): Promise<StaffPerformance> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    })

    const response = await apiClient.get<StaffPerformance>(`/pos/staff-performance/${staffId}?${params.toString()}`)
    return response.data
  },

  /**
   * Get dashboard metrics (real-time overview)
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>('/pos/dashboard/metrics')
    return response.data
  },

  /**
   * Get dashboard alerts (system notifications)
   */
  async getDashboardAlerts(): Promise<DashboardAlerts> {
    const response = await apiClient.get<DashboardAlerts>('/pos/dashboard/alerts')
    return response.data
  },

  /**
   * Get dashboard summary (current shift and daily progress)
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/pos/dashboard/summary')
    return response.data
  },

  /**
   * Export report data
   */
  async exportReport(params: {
    type: 'daily' | 'weekly' | 'monthly'
    date?: string
    week?: string
    month?: number
    year?: number
    format: 'csv' | 'pdf'
    include_details?: boolean
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    queryParams.append('type', params.type)
    queryParams.append('format', params.format)
    
    if (params.date) queryParams.append('date', params.date)
    if (params.week) queryParams.append('week', params.week)
    if (params.month) queryParams.append('month', params.month.toString())
    if (params.year) queryParams.append('year', params.year.toString())
    if (params.include_details !== undefined) queryParams.append('include_details', params.include_details.toString())

    const response = await fetch(`/api/v1/pos/reports/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return await response.blob()
  },

  /**
   * Export staff performance report
   */
  async exportStaffPerformance(params: {
    start_date: string
    end_date: string
    staff_id?: number
    format: 'csv' | 'pdf'
  }): Promise<Blob> {
    const queryParams = new URLSearchParams()
    queryParams.append('start_date', params.start_date)
    queryParams.append('end_date', params.end_date)
    queryParams.append('format', params.format)
    
    if (params.staff_id) queryParams.append('staff_id', params.staff_id.toString())

    const response = await fetch(`/api/v1/pos/staff-performance/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    return await response.blob()
  },

  /**
   * Refresh dashboard data (forces cache refresh on backend)
   */
  async refreshDashboard(): Promise<void> {
    await apiClient.post('/pos/dashboard/refresh')
  },

  /**
   * Acknowledge/dismiss alerts
   */
  async dismissAlert(alertId: string): Promise<void> {
    await apiClient.post(`/pos/dashboard/alerts/${alertId}/dismiss`)
  },

  /**
   * Get available report periods (helper for UI)
   */
  getReportPeriods() {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    return {
      daily: [
        { value: today.toISOString().split('T')[0], label: 'Today' },
        { value: yesterday.toISOString().split('T')[0], label: 'Yesterday' },
      ],
      weekly: [
        { value: this.getWeekString(today), label: 'This Week' },
        { value: this.getWeekString(lastWeek), label: 'Last Week' },
      ],
      monthly: [
        { value: `${today.getMonth() + 1}-${today.getFullYear()}`, label: 'This Month' },
        { value: `${lastMonth.getMonth() + 1}-${lastMonth.getFullYear()}`, label: 'Last Month' },
      ]
    }
  },

  /**
   * Helper to get week string in YYYY-WW format
   */
  getWeekString(date: Date): string {
    const year = date.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
    
    return `${year}-${week.toString().padStart(2, '0')}`
  },

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  },

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(1)}%`
  },

  /**
   * Calculate growth percentage
   */
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  },

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}