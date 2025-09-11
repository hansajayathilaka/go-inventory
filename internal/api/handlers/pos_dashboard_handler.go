package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/business/sale"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type POSDashboardHandler struct {
	saleService      sale.Service
	inventoryService inventory.Service
	inventoryRepo    interfaces.InventoryRepository
	saleRepo        interfaces.SaleRepository
}

func NewPOSDashboardHandler(
	saleService sale.Service,
	inventoryService inventory.Service,
	inventoryRepo interfaces.InventoryRepository,
	saleRepo interfaces.SaleRepository,
) *POSDashboardHandler {
	return &POSDashboardHandler{
		saleService:      saleService,
		inventoryService: inventoryService,
		inventoryRepo:    inventoryRepo,
		saleRepo:        saleRepo,
	}
}

// GetDashboardMetrics godoc
// @Summary Get real-time POS dashboard metrics
// @Description Get real-time POS dashboard metrics including today's sales, active sessions, and key performance indicators
// @Tags POS Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} dto.POSDashboardMetricsResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/dashboard/metrics [get]
func (h *POSDashboardHandler) GetDashboardMetrics(c *gin.Context) {
	ctx := c.Request.Context()
	now := time.Now()
	
	// Calculate time ranges
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	yesterday := today.AddDate(0, 0, -1)
	weekStart := getWeekStart(now)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Get today's sales statistics
	todayStats, err := h.saleService.GetSalesStatistics(ctx, today, now)
	if err != nil {
		todayStats = map[string]interface{}{
			"total_sales":  0,
			"total_amount": 0.0,
		}
	}

	// Get yesterday's sales for comparison
	yesterdayStats, err := h.saleService.GetSalesStatistics(ctx, yesterday, today)
	if err != nil {
		yesterdayStats = map[string]interface{}{
			"total_sales":  0,
			"total_amount": 0.0,
		}
	}

	// Get this week's stats
	weekStats, err := h.saleService.GetSalesStatistics(ctx, weekStart, now)
	if err != nil {
		weekStats = map[string]interface{}{
			"total_sales":  0,
			"total_amount": 0.0,
		}
	}

	// Get this month's stats
	monthStats, err := h.saleService.GetSalesStatistics(ctx, monthStart, now)
	if err != nil {
		monthStats = map[string]interface{}{
			"total_sales":  0,
			"total_amount": 0.0,
		}
	}

	// Get recent transactions (last 10)
	recentSales, _, err := h.saleService.ListSales(ctx, 10, 0)
	if err != nil {
		recentSales = []*models.Sale{}
	}

	// Convert recent sales to response format
	recentTransactions := make([]dto.RecentTransaction, len(recentSales))
	for i, sale := range recentSales {
		recentTransactions[i] = dto.RecentTransaction{
			ID:         sale.ID,
			BillNumber: sale.BillNumber,
			Amount:     sale.TotalAmount,
			CreatedAt:  sale.CreatedAt,
		}
	}

	// Calculate percentage changes
	todayRevenue := getFloatValue(todayStats, "total_amount")
	yesterdayRevenue := getFloatValue(yesterdayStats, "total_amount")
	revenueChange := calculatePercentageChange(todayRevenue, yesterdayRevenue)

	todaySales := getIntValue(todayStats, "total_sales")
	yesterdaySales := getIntValue(yesterdayStats, "total_sales")
	salesChange := calculatePercentageChange(float64(todaySales), float64(yesterdaySales))

	// Build response
	response := dto.POSDashboardMetricsResponse{
		TodayRevenue:        todayRevenue,
		TodaySalesCount:     todaySales,
		WeekRevenue:         getFloatValue(weekStats, "total_amount"),
		WeekSalesCount:      getIntValue(weekStats, "total_sales"),
		MonthRevenue:        getFloatValue(monthStats, "total_amount"),
		MonthSalesCount:     getIntValue(monthStats, "total_sales"),
		RevenueChangePercent: revenueChange,
		SalesChangePercent:  salesChange,
		RecentTransactions:  recentTransactions,
		LastUpdated:         now,
	}

	c.JSON(http.StatusOK, response)
}

// GetDashboardAlerts godoc
// @Summary Get dashboard alerts
// @Description Get system alerts including low stock warnings and other important notifications
// @Tags POS Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} dto.POSDashboardAlertsResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/dashboard/alerts [get]
func (h *POSDashboardHandler) GetDashboardAlerts(c *gin.Context) {
	ctx := c.Request.Context()
	
	var alerts []dto.DashboardAlert

	// Check for low stock items
	lowStockItems, err := h.inventoryRepo.GetLowStock(ctx)
	if err == nil && len(lowStockItems) > 0 {
		alerts = append(alerts, dto.DashboardAlert{
			Type:        "low_stock",
			Severity:    "warning",
			Title:       "Low Stock Alert",
			Message:     "Items running low in stock",
			Count:       len(lowStockItems),
			CreatedAt:   time.Now(),
		})
	}

	// Check for zero stock items
	zeroStockItems, err := h.inventoryRepo.GetZeroStock(ctx)
	if err == nil && len(zeroStockItems) > 0 {
		alerts = append(alerts, dto.DashboardAlert{
			Type:        "zero_stock",
			Severity:    "critical",
			Title:       "Out of Stock Alert",
			Message:     "Items completely out of stock",
			Count:       len(zeroStockItems),
			CreatedAt:   time.Now(),
		})
	}

	// Check for high sales volume today (potential stock depletion)
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayStats, err := h.saleService.GetSalesStatistics(ctx, today, now)
	if err == nil {
		todaySales := getIntValue(todayStats, "total_sales")
		if todaySales > 50 { // Threshold for high volume - could be configurable
			alerts = append(alerts, dto.DashboardAlert{
				Type:        "high_volume",
				Severity:    "info",
				Title:       "High Sales Volume",
				Message:     "Unusually high sales volume today - monitor stock levels",
				Count:       todaySales,
				CreatedAt:   time.Now(),
			})
		}
	}

	response := dto.POSDashboardAlertsResponse{
		Alerts:      alerts,
		TotalCount:  len(alerts),
		LastChecked: time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetDashboardSummary godoc
// @Summary Get dashboard summary
// @Description Get comprehensive dashboard summary for managers including daily and weekly overview
// @Tags POS Dashboard
// @Accept json
// @Produce json
// @Success 200 {object} dto.POSDashboardSummaryResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/dashboard/summary [get]
func (h *POSDashboardHandler) GetDashboardSummary(c *gin.Context) {
	ctx := c.Request.Context()
	now := time.Now()
	
	// Calculate time ranges
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekStart := getWeekStart(now)
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	// Get today's comprehensive summary
	todayStats, err := h.saleService.GetSalesStatistics(ctx, today, now)
	if err != nil {
		todayStats = map[string]interface{}{}
	}

	// Get weekly summary
	weekStats, err := h.saleService.GetSalesStatistics(ctx, weekStart, now)
	if err != nil {
		weekStats = map[string]interface{}{}
	}

	// Get monthly summary
	monthStats, err := h.saleService.GetSalesStatistics(ctx, monthStart, now)
	if err != nil {
		monthStats = map[string]interface{}{}
	}

	// Get profit analysis for today
	todayProfit, err := h.saleService.GetProfitAnalysis(ctx, today, now)
	if err != nil {
		todayProfit = map[string]interface{}{
			"total_profit": 0.0,
			"profit_margin": 0.0,
		}
	}

	// Get top selling products (last 7 days)
	last7Days := now.AddDate(0, 0, -7)
	topProducts, err := h.saleService.GetTopSellingProducts(ctx, 5, &last7Days, &now)
	if err != nil {
		topProducts = []map[string]interface{}{}
	}

	// Get stock status overview
	lowStockCount := 0
	zeroStockCount := 0
	
	if lowStockItems, err := h.inventoryRepo.GetLowStock(ctx); err == nil {
		lowStockCount = len(lowStockItems)
	}
	
	if zeroStockItems, err := h.inventoryRepo.GetZeroStock(ctx); err == nil {
		zeroStockCount = len(zeroStockItems)
	}

	// Build comprehensive summary
	response := dto.POSDashboardSummaryResponse{
		Overview: dto.SummaryOverview{
			TodayRevenue:    getFloatValue(todayStats, "total_amount"),
			TodaySales:      getIntValue(todayStats, "total_sales"),
			TodayProfit:     getFloatValue(todayProfit, "total_profit"),
			WeekRevenue:     getFloatValue(weekStats, "total_amount"),
			WeekSales:       getIntValue(weekStats, "total_sales"),
			MonthRevenue:    getFloatValue(monthStats, "total_amount"),
			MonthSales:      getIntValue(monthStats, "total_sales"),
		},
		StockStatus: dto.StockStatus{
			LowStockCount:  lowStockCount,
			ZeroStockCount: zeroStockCount,
			StockHealth:    calculateStockHealth(lowStockCount, zeroStockCount),
		},
		TopProducts:    convertTopProducts(topProducts),
		GeneratedAt:    now,
	}

	c.JSON(http.StatusOK, response)
}

// Helper functions
func getWeekStart(t time.Time) time.Time {
	// Get the Monday of the current week
	weekday := t.Weekday()
	if weekday == time.Sunday {
		weekday = 7 // Treat Sunday as day 7 for Monday start
	}
	daysFromMonday := int(weekday) - 1
	weekStart := t.AddDate(0, 0, -daysFromMonday)
	return time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())
}

func calculatePercentageChange(current, previous float64) float64 {
	if previous == 0 {
		if current > 0 {
			return 100.0 // 100% increase from 0
		}
		return 0.0
	}
	return ((current - previous) / previous) * 100.0
}

func calculateStockHealth(lowStockCount, zeroStockCount int) string {
	if zeroStockCount > 10 {
		return "critical"
	}
	if lowStockCount > 20 || zeroStockCount > 0 {
		return "warning"
	}
	if lowStockCount > 5 {
		return "attention"
	}
	return "good"
}