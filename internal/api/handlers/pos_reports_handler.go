package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/sale"
	"inventory-api/internal/business/user"
	"inventory-api/internal/repository/models"
)

type POSReportsHandler struct {
	saleService sale.Service
	userService user.Service
}

func NewPOSReportsHandler(saleService sale.Service, userService user.Service) *POSReportsHandler {
	return &POSReportsHandler{
		saleService: saleService,
		userService: userService,
	}
}

// GetDailyReport godoc
// @Summary Get daily sales report
// @Description Get daily sales report with transactions and totals for a specific date
// @Tags POS Reports
// @Accept json
// @Produce json
// @Param date query string false "Date in YYYY-MM-DD format (defaults to today)"
// @Success 200 {object} dto.POSDailyReportResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/reports/daily [get]
func (h *POSReportsHandler) GetDailyReport(c *gin.Context) {
	// Parse date parameter
	dateStr := c.DefaultQuery("date", time.Now().Format("2006-01-02"))
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid date format",
			Message: "Date must be in YYYY-MM-DD format",
		})
		return
	}

	// Set date range to cover the entire day
	startDate := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endDate := startDate.AddDate(0, 0, 1)

	// Get sales summary for the day
	salesSummary, err := h.saleService.GetSalesStatistics(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get daily sales data",
			Message: err.Error(),
		})
		return
	}

	// Get top selling products for the day
	topProducts, err := h.saleService.GetTopSellingProducts(c.Request.Context(), 10, &startDate, &endDate)
	if err != nil {
		topProducts = []map[string]interface{}{} // Default to empty slice on error
	}

	// Get sales by payment method (this would need to be implemented in the service)
	// For now, we'll use placeholder data structure
	paymentMethods := []dto.PaymentMethodSummary{}

	// Build response
	response := dto.POSDailyReportResponse{
		Date:            dateStr,
		TotalSales:      getIntValue(salesSummary, "total_sales"),
		TotalAmount:     getFloatValue(salesSummary, "total_amount"),
		AverageOrder:    getFloatValue(salesSummary, "average_sale_amount"),
		TopProducts:     convertTopProducts(topProducts),
		PaymentMethods:  paymentMethods,
		GeneratedAt:     time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetWeeklyReport godoc
// @Summary Get weekly sales report
// @Description Get weekly sales report with daily breakdowns for a specific week
// @Tags POS Reports
// @Accept json
// @Produce json
// @Param week query string false "Week in YYYY-Www format (defaults to current week)"
// @Success 200 {object} dto.POSWeeklyReportResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/reports/weekly [get]
func (h *POSReportsHandler) GetWeeklyReport(c *gin.Context) {
	// Parse week parameter or default to current week
	weekStr := c.DefaultQuery("week", getCurrentWeekString())
	
	year, week, err := parseWeekString(weekStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid week format",
			Message: "Week must be in YYYY-Www format (e.g., 2024-W01)",
		})
		return
	}

	// Calculate start and end of week
	startDate := getFirstDayOfWeek(year, week)
	endDate := startDate.AddDate(0, 0, 7)

	// Get weekly sales summary
	salesSummary, err := h.saleService.GetSalesStatistics(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get weekly sales data",
			Message: err.Error(),
		})
		return
	}

	// Get daily breakdown for the week
	dailyBreakdown := []dto.DailySummary{}
	for i := 0; i < 7; i++ {
		dayStart := startDate.AddDate(0, 0, i)
		dayEnd := dayStart.AddDate(0, 0, 1)
		
		daySummary, err := h.saleService.GetSalesStatistics(c.Request.Context(), dayStart, dayEnd)
		if err != nil {
			continue // Skip days with errors
		}

		dailyBreakdown = append(dailyBreakdown, dto.DailySummary{
			Date:        dayStart.Format("2006-01-02"),
			TotalSales:  getIntValue(daySummary, "total_sales"),
			TotalAmount: getFloatValue(daySummary, "total_amount"),
		})
	}

	// Build response
	response := dto.POSWeeklyReportResponse{
		Week:            weekStr,
		StartDate:       startDate.Format("2006-01-02"),
		EndDate:         endDate.AddDate(0, 0, -1).Format("2006-01-02"),
		TotalSales:      getIntValue(salesSummary, "total_sales"),
		TotalAmount:     getFloatValue(salesSummary, "total_amount"),
		AverageDaily:    getFloatValue(salesSummary, "total_amount") / 7,
		DailyBreakdown:  dailyBreakdown,
		GeneratedAt:     time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetMonthlyReport godoc
// @Summary Get monthly sales report
// @Description Get monthly sales report with weekly breakdowns for a specific month
// @Tags POS Reports
// @Accept json
// @Produce json
// @Param month query string false "Month in YYYY-MM format (defaults to current month)"
// @Success 200 {object} dto.POSMonthlyReportResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/reports/monthly [get]
func (h *POSReportsHandler) GetMonthlyReport(c *gin.Context) {
	// Parse month parameter
	monthStr := c.DefaultQuery("month", time.Now().Format("2006-01"))
	date, err := time.Parse("2006-01", monthStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid month format",
			Message: "Month must be in YYYY-MM format",
		})
		return
	}

	// Set month range
	startDate := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
	endDate := startDate.AddDate(0, 1, 0)

	// Get monthly sales summary
	salesSummary, err := h.saleService.GetSalesStatistics(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get monthly sales data",
			Message: err.Error(),
		})
		return
	}

	// Get profit analysis for the month
	profitAnalysis, err := h.saleService.GetProfitAnalysis(c.Request.Context(), startDate, endDate)
	if err != nil {
		profitAnalysis = map[string]interface{}{
			"total_profit": 0.0,
			"profit_margin": 0.0,
		}
	}

	// Build response
	response := dto.POSMonthlyReportResponse{
		Month:         monthStr,
		StartDate:     startDate.Format("2006-01-02"),
		EndDate:       endDate.AddDate(0, 0, -1).Format("2006-01-02"),
		TotalSales:    getIntValue(salesSummary, "total_sales"),
		TotalAmount:   getFloatValue(salesSummary, "total_amount"),
		TotalProfit:   getFloatValue(profitAnalysis, "total_profit"),
		ProfitMargin:  getFloatValue(profitAnalysis, "profit_margin"),
		AverageDaily:  getFloatValue(salesSummary, "total_amount") / float64(endDate.Sub(startDate).Hours()/24),
		GeneratedAt:   time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// GetStaffPerformance godoc
// @Summary Get staff performance report
// @Description Get staff performance metrics for a specific date range
// @Tags POS Reports
// @Accept json
// @Produce json
// @Param start_date query string true "Start date in YYYY-MM-DD format"
// @Param end_date query string true "End date in YYYY-MM-DD format"
// @Param staff_id query string false "Filter by specific staff member ID"
// @Success 200 {object} dto.POSStaffPerformanceResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /pos/staff-performance [get]
func (h *POSReportsHandler) GetStaffPerformance(c *gin.Context) {
	// Parse date parameters
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Missing date parameters",
			Message: "Both start_date and end_date are required in YYYY-MM-DD format",
		})
		return
	}

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid start_date format",
			Message: "Start date must be in YYYY-MM-DD format",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid end_date format",
			Message: "End date must be in YYYY-MM-DD format",
		})
		return
	}

	// Ensure end date covers the entire day
	endDate = endDate.AddDate(0, 0, 1)

	// Parse optional staff_id filter
	var staffID *uuid.UUID
	if staffIDStr := c.Query("staff_id"); staffIDStr != "" {
		if id, err := uuid.Parse(staffIDStr); err == nil {
			staffID = &id
		} else {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid staff_id format",
				Message: "Staff ID must be a valid UUID",
			})
			return
		}
	}

	var staffPerformance []dto.StaffPerformance

	if staffID != nil {
		// Get performance for specific staff member
		performance, err := h.saleService.GetCashierPerformance(c.Request.Context(), *staffID, startDate, endDate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get staff performance",
				Message: err.Error(),
			})
			return
		}

		// Get user details
		user, err := h.userService.GetUserByID(c.Request.Context(), *staffID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get user details",
				Message: err.Error(),
			})
			return
		}

		staffPerformance = append(staffPerformance, dto.StaffPerformance{
			UserID:      *staffID,
			Name:        user.Username, // Using username as name since FirstName/LastName don't exist
			SalesCount:  getIntValue(performance, "total_sales"),
			SalesTotal:  getFloatValue(performance, "total_amount"),
			AvgOrder:    getFloatValue(performance, "average_amount"),
		})
	} else {
		// Get all staff members and their performance
		users, err := h.userService.ListUsers(c.Request.Context(), 100, 0)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get users",
				Message: err.Error(),
			})
			return
		}

		for _, user := range users {
			// Only include staff members who can make sales
			if user.Role == models.RoleViewer {
				continue
			}

			performance, err := h.saleService.GetCashierPerformance(c.Request.Context(), user.ID, startDate, endDate)
			if err != nil {
				continue // Skip users with errors
			}

			salesCount := getIntValue(performance, "total_sales")
			if salesCount > 0 { // Only include staff with sales
				staffPerformance = append(staffPerformance, dto.StaffPerformance{
					UserID:      user.ID,
					Name:        user.Username, // Using username as name
					SalesCount:  salesCount,
					SalesTotal:  getFloatValue(performance, "total_amount"),
					AvgOrder:    getFloatValue(performance, "average_amount"),
				})
			}
		}
	}

	response := dto.POSStaffPerformanceResponse{
		StartDate:   startDateStr,
		EndDate:     endDateStr,
		Staff:       staffPerformance,
		GeneratedAt: time.Now(),
	}

	c.JSON(http.StatusOK, response)
}

// Helper functions
func getIntValue(data map[string]interface{}, key string) int {
	if val, ok := data[key]; ok {
		switch v := val.(type) {
		case int:
			return v
		case int64:
			return int(v)
		case float64:
			return int(v)
		}
	}
	return 0
}

func getFloatValue(data map[string]interface{}, key string) float64 {
	if val, ok := data[key]; ok {
		switch v := val.(type) {
		case float64:
			return v
		case int:
			return float64(v)
		case int64:
			return float64(v)
		}
	}
	return 0.0
}

func convertTopProducts(products []map[string]interface{}) []dto.TopProductSummary {
	result := make([]dto.TopProductSummary, len(products))
	for i, product := range products {
		result[i] = dto.TopProductSummary{
			ProductID:   getStringValue(product, "product_id"),
			ProductName: getStringValue(product, "product_name"),
			Quantity:    getIntValue(product, "quantity"),
			Revenue:     getFloatValue(product, "revenue"),
		}
	}
	return result
}

func getStringValue(data map[string]interface{}, key string) string {
	if val, ok := data[key]; ok {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getCurrentWeekString() string {
	_, week := time.Now().ISOWeek()
	return time.Now().Format("2006") + "-W" + formatWeek(week)
}

func parseWeekString(weekStr string) (int, int, error) {
	// Parse YYYY-Www format
	var year, week int
	n, err := fmt.Sscanf(weekStr, "%d-W%d", &year, &week)
	if err != nil || n != 2 {
		return 0, 0, fmt.Errorf("invalid week format: %s", weekStr)
	}
	return year, week, err
}

func formatWeek(week int) string {
	if week < 10 {
		return "0" + strconv.Itoa(week)
	}
	return strconv.Itoa(week)
}

func getFirstDayOfWeek(year, week int) time.Time {
	// January 1st of the year
	t := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	
	// Find the first Monday of the year
	for t.Weekday() != time.Monday {
		t = t.AddDate(0, 0, 1)
	}
	
	// Add weeks to get to the desired week
	t = t.AddDate(0, 0, (week-1)*7)
	
	return t
}