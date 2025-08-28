package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/audit"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type AuditHandler struct {
	auditService     audit.Service
	inventoryService inventory.Service
	userRepo         interfaces.UserRepository
	productRepo      interfaces.ProductRepository
	locationRepo     interfaces.LocationRepository
	stockMovementRepo interfaces.StockMovementRepository
	categoryRepo     interfaces.CategoryRepository
}

func NewAuditHandler(
	auditService audit.Service,
	inventoryService inventory.Service,
	userRepo interfaces.UserRepository,
	productRepo interfaces.ProductRepository,
	locationRepo interfaces.LocationRepository,
	stockMovementRepo interfaces.StockMovementRepository,
	categoryRepo interfaces.CategoryRepository,
) *AuditHandler {
	return &AuditHandler{
		auditService:      auditService,
		inventoryService:  inventoryService,
		userRepo:          userRepo,
		productRepo:       productRepo,
		locationRepo:      locationRepo,
		stockMovementRepo: stockMovementRepo,
		categoryRepo:      categoryRepo,
	}
}

// GetAuditLogs godoc
// @Summary Get audit logs
// @Description Get audit logs with optional filtering
// @Tags audit
// @Accept json
// @Produce json
// @Param table query string false "Filter by table name"
// @Param record_id query string false "Filter by record ID"
// @Param action query string false "Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)"
// @Param user_id query string false "Filter by user ID"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param limit query int false "Limit results" default(50)
// @Param offset query int false "Offset for pagination" default(0)
// @Success 200 {object} dto.ApiResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /audit-logs [get]
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	var req dto.AuditLogListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid query parameters",
			Message: err.Error(),
		})
		return
	}

	// Set default values
	if req.Limit == 0 {
		req.Limit = 50
	}
	if req.Limit > 500 {
		req.Limit = 500
	}

	var auditLogs []*models.AuditLog
	var err error

	// Apply filters based on query parameters
	if req.Table != "" && req.RecordID != "" {
		auditLogs, err = h.auditService.GetAuditLogsByRecord(c.Request.Context(), req.Table, req.RecordID, req.Limit, req.Offset)
	} else if req.Table != "" {
		auditLogs, err = h.auditService.GetAuditLogsByTable(c.Request.Context(), req.Table, req.Limit, req.Offset)
	} else if req.UserID != "" {
		userID, parseErr := uuid.Parse(req.UserID)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid user ID format",
				Message: parseErr.Error(),
			})
			return
		}
		auditLogs, err = h.auditService.GetAuditLogsByUser(c.Request.Context(), userID, req.Limit, req.Offset)
	} else if req.Action != "" {
		auditLogs, err = h.auditService.GetAuditLogsByAction(c.Request.Context(), req.Action, req.Limit, req.Offset)
	} else if req.StartDate != "" && req.EndDate != "" {
		startDate, parseErr := time.Parse("2006-01-02", req.StartDate)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid start date format (use YYYY-MM-DD)",
				Message: parseErr.Error(),
			})
			return
		}
		endDate, parseErr := time.Parse("2006-01-02", req.EndDate)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid end date format (use YYYY-MM-DD)",
				Message: parseErr.Error(),
			})
			return
		}
		// Set end date to end of day
		endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		auditLogs, err = h.auditService.GetAuditLogsByDateRange(c.Request.Context(), startDate, endDate, req.Limit, req.Offset)
	} else {
		auditLogs, err = h.auditService.GetAuditLogs(c.Request.Context(), req.Limit, req.Offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch audit logs",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format with user information
	response := make([]*dto.AuditLogResponse, len(auditLogs))
	for i, log := range auditLogs {
		response[i] = &dto.AuditLogResponse{
			ID:         log.ID,
			AuditTable: log.AuditTable,
			RecordID:   log.RecordID,
			Action:     log.Action,
			OldValues:  getAuditValues(log.OldValues),
			NewValues:  getAuditValues(log.NewValues),
			UserID:     log.UserID,
			IPAddress:  log.IPAddress,
			UserAgent:  log.UserAgent,
			Timestamp:  log.Timestamp,
		}

		// Get username for display
		if user, err := h.userRepo.GetByID(c.Request.Context(), log.UserID); err == nil && user != nil {
			response[i].Username = user.Username
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Audit logs retrieved successfully",
		Data: map[string]interface{}{
			"audit_logs": response,
			"pagination": dto.PaginationResponse{
				Page:     (req.Offset / req.Limit) + 1,
				PageSize: req.Limit,
				Total:    len(response),
			},
		},
	})
}

// GetAuditStatistics godoc
// @Summary Get audit statistics
// @Description Get comprehensive audit statistics including activity summaries
// @Tags audit
// @Accept json
// @Produce json
// @Success 200 {object} dto.AuditStatisticsResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /audit-logs/statistics [get]
func (h *AuditHandler) GetAuditStatistics(c *gin.Context) {
	stats, err := h.auditService.GetAuditStatistics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch audit statistics",
			Message: err.Error(),
		})
		return
	}

	// Convert recent activity to response format
	recentActivity := make([]*dto.AuditLogResponse, len(stats.RecentActivity))
	for i, log := range stats.RecentActivity {
		recentActivity[i] = &dto.AuditLogResponse{
			ID:         log.ID,
			AuditTable: log.AuditTable,
			RecordID:   log.RecordID,
			Action:     log.Action,
			OldValues:  getAuditValues(log.OldValues),
			NewValues:  getAuditValues(log.NewValues),
			UserID:     log.UserID,
			IPAddress:  log.IPAddress,
			UserAgent:  log.UserAgent,
			Timestamp:  log.Timestamp,
		}

		// Get username for display
		if user, err := h.userRepo.GetByID(c.Request.Context(), log.UserID); err == nil && user != nil {
			recentActivity[i].Username = user.Username
		}
	}

	response := &dto.AuditStatisticsResponse{
		TotalLogs:       stats.TotalLogs,
		LogsByAction:    stats.LogsByAction,
		LogsByTable:     stats.LogsByTable,
		TopUsers:        stats.TopUsers,
		RecentActivity:  recentActivity,
	}

	c.JSON(http.StatusOK, response)
}

// GetStockMovementReport godoc
// @Summary Get stock movement report
// @Description Get stock movement report with filtering options
// @Tags reports
// @Accept json
// @Produce json
// @Param product_id query string false "Filter by product ID"
// @Param location_id query string false "Filter by location ID"
// @Param movement_type query string false "Filter by movement type (IN, OUT, TRANSFER, ADJUSTMENT)"
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Param limit query int false "Limit results" default(100)
// @Param offset query int false "Offset for pagination" default(0)
// @Success 200 {object} dto.ApiResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reports/stock-movements [get]
func (h *AuditHandler) GetStockMovementReport(c *gin.Context) {
	var req dto.StockMovementReportRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid query parameters",
			Message: err.Error(),
		})
		return
	}

	// Set default values
	if req.Limit == 0 {
		req.Limit = 100
	}
	if req.Limit > 1000 {
		req.Limit = 1000
	}

	var movements []*models.StockMovement
	var err error

	// Apply filters
	if req.ProductID != "" {
		productID, parseErr := uuid.Parse(req.ProductID)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid product ID format",
				Message: parseErr.Error(),
			})
			return
		}
		movements, err = h.stockMovementRepo.GetByProduct(c.Request.Context(), productID, req.Limit, req.Offset)
	} else if req.LocationID != "" {
		locationID, parseErr := uuid.Parse(req.LocationID)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid location ID format",
				Message: parseErr.Error(),
			})
			return
		}
		movements, err = h.stockMovementRepo.GetByLocation(c.Request.Context(), locationID, req.Limit, req.Offset)
	} else if req.MovementType != "" {
		var movementType models.MovementType
		switch req.MovementType {
		case "IN":
			movementType = models.MovementIN
		case "OUT":
			movementType = models.MovementOUT
		case "TRANSFER":
			movementType = models.MovementTRANSFER
		case "ADJUSTMENT":
			movementType = models.MovementADJUSTMENT
		default:
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error: "Invalid movement type. Must be one of: IN, OUT, TRANSFER, ADJUSTMENT",
			})
			return
		}
		movements, err = h.stockMovementRepo.GetByMovementType(c.Request.Context(), movementType, req.Limit, req.Offset)
	} else if req.StartDate != "" && req.EndDate != "" {
		startDate, parseErr := time.Parse("2006-01-02", req.StartDate)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid start date format (use YYYY-MM-DD)",
				Message: parseErr.Error(),
			})
			return
		}
		endDate, parseErr := time.Parse("2006-01-02", req.EndDate)
		if parseErr != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid end date format (use YYYY-MM-DD)",
				Message: parseErr.Error(),
			})
			return
		}
		// Set end date to end of day
		endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		movements, err = h.stockMovementRepo.GetByDateRange(c.Request.Context(), startDate, endDate, req.Limit, req.Offset)
	} else {
		movements, err = h.stockMovementRepo.List(c.Request.Context(), req.Limit, req.Offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch stock movements",
			Message: err.Error(),
		})
		return
	}

	// Convert to response format with additional information
	response := make([]*dto.StockMovementReportResponse, len(movements))
	for i, movement := range movements {
		response[i] = &dto.StockMovementReportResponse{
			ID:           movement.ID,
			ProductID:    movement.ProductID,
			LocationID:   movement.LocationID,
			MovementType: movement.MovementType,
			Quantity:     movement.Quantity,
			ReferenceID:  movement.ReferenceID,
			UserID:       movement.UserID,
			Notes:        movement.Notes,
			CreatedAt:    movement.CreatedAt,
		}

		// Get product info
		if product, err := h.productRepo.GetByID(c.Request.Context(), movement.ProductID); err == nil && product != nil {
			response[i].ProductName = product.Name
			response[i].ProductSKU = product.SKU
		}

		// Get location info
		if location, err := h.locationRepo.GetByID(c.Request.Context(), movement.LocationID); err == nil && location != nil {
			response[i].LocationName = location.Name
		}

		// Get user info
		if user, err := h.userRepo.GetByID(c.Request.Context(), movement.UserID); err == nil && user != nil {
			response[i].Username = user.Username
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Stock movement report retrieved successfully",
		Data: map[string]interface{}{
			"movements": response,
			"pagination": dto.PaginationResponse{
				Page:     (req.Offset / req.Limit) + 1,
				PageSize: req.Limit,
				Total:    len(response),
			},
		},
	})
}

// GetInventorySummary godoc
// @Summary Get inventory summary
// @Description Get comprehensive inventory summary with statistics
// @Tags reports
// @Accept json
// @Produce json
// @Success 200 {object} dto.InventorySummaryResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /reports/inventory-summary [get]
func (h *AuditHandler) GetInventorySummary(c *gin.Context) {
	// Get basic statistics
	products, err := h.productRepo.List(c.Request.Context(), 0, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch products",
			Message: err.Error(),
		})
		return
	}

	// For single hardware store, use default location only
	defaultLocation := models.GetDefaultLocation()
	locations := []*models.Location{defaultLocation}

	// Get low stock and zero stock items
	lowStockItems, err := h.inventoryService.GetLowStock(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch low stock items",
			Message: err.Error(),
		})
		return
	}

	zeroStockItems, err := h.inventoryService.GetZeroStock(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to fetch zero stock items",
			Message: err.Error(),
		})
		return
	}

	// Convert to summary format
	lowStockSummary := make([]dto.InventorySummaryItem, len(lowStockItems))
	for i, item := range lowStockItems {
		summaryItem := dto.InventorySummaryItem{
			ProductID:    item.ProductID,
			TotalStock:   item.Quantity,
			ReorderLevel: item.ReorderLevel,
		}

		// Get product details
		if product, err := h.productRepo.GetByID(c.Request.Context(), item.ProductID); err == nil && product != nil {
			summaryItem.ProductName = product.Name
			summaryItem.ProductSKU = product.SKU
			summaryItem.StockValue = float64(item.Quantity) * product.CostPrice

			// Get category name
			if category, err := h.categoryRepo.GetByID(c.Request.Context(), product.CategoryID); err == nil && category != nil {
				summaryItem.Category = category.Name
			}
		}

		lowStockSummary[i] = summaryItem
	}

	zeroStockSummary := make([]dto.InventorySummaryItem, len(zeroStockItems))
	for i, item := range zeroStockItems {
		summaryItem := dto.InventorySummaryItem{
			ProductID:    item.ProductID,
			TotalStock:   item.Quantity,
			ReorderLevel: item.ReorderLevel,
		}

		// Get product details
		if product, err := h.productRepo.GetByID(c.Request.Context(), item.ProductID); err == nil && product != nil {
			summaryItem.ProductName = product.Name
			summaryItem.ProductSKU = product.SKU
			summaryItem.StockValue = float64(item.Quantity) * product.CostPrice

			// Get category name
			if category, err := h.categoryRepo.GetByID(c.Request.Context(), product.CategoryID); err == nil && category != nil {
				summaryItem.Category = category.Name
			}
		}

		zeroStockSummary[i] = summaryItem
	}

	// Calculate total stock value
	var totalStockValue float64
	for _, product := range products {
		if totalStock, err := h.inventoryService.GetTotalStockByProduct(c.Request.Context(), product.ID); err == nil {
			totalStockValue += float64(totalStock) * product.CostPrice
		}
	}

	// Prepare location stock summary
	locationStockSummary := make([]dto.LocationStockSummary, len(locations))
	for i, location := range locations {
		locationInventory, err := h.inventoryService.GetInventoryByLocation(c.Request.Context(), location.ID)
		if err != nil {
			continue
		}

		var totalItems int
		var totalValue float64
		for _, inv := range locationInventory {
			totalItems += inv.Quantity
			if product, err := h.productRepo.GetByID(c.Request.Context(), inv.ProductID); err == nil && product != nil {
				totalValue += float64(inv.Quantity) * product.CostPrice
			}
		}

		locationStockSummary[i] = dto.LocationStockSummary{
			LocationID:   location.ID,
			LocationName: location.Name,
			TotalItems:   totalItems,
			TotalValue:   totalValue,
		}
	}

	response := &dto.InventorySummaryResponse{
		TotalProducts:   len(products),
		TotalLocations:  len(locations),
		TotalStockValue: totalStockValue,
		LowStockItems:   lowStockSummary,
		ZeroStockItems:  zeroStockSummary,
		TopProducts:     []dto.InventorySummaryItem{}, // TODO: Implement top products logic
		StockByLocation: locationStockSummary,
		StockByCategory: []dto.CategoryStockSummary{}, // TODO: Implement category summary
	}

	c.JSON(http.StatusOK, response)
}

// Helper function to safely extract values from JSONB fields
func getAuditValues(jsonData json.RawMessage) interface{} {
	if len(jsonData) == 0 {
		return nil
	}
	
	var values interface{}
	if err := json.Unmarshal(jsonData, &values); err != nil {
		return string(jsonData) // Return as string if can't unmarshal
	}
	return values
}