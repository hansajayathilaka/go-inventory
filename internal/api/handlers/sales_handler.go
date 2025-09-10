package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/sale"
	"inventory-api/internal/repository/models"
)

type SalesHandler struct {
	saleService sale.Service
}

func NewSalesHandler(saleService sale.Service) *SalesHandler {
	return &SalesHandler{
		saleService: saleService,
	}
}

// CreateSale godoc
// @Summary Create a new sale
// @Description Create a new sale with items and payments
// @Tags Sales
// @Accept json
// @Produce json
// @Param sale body dto.CreateSaleRequest true "Sale data"
// @Success 201 {object} dto.SaleResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 422 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales [post]
func (h *SalesHandler) CreateSale(c *gin.Context) {
	var req dto.CreateSaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request body",
			Message: err.Error(),
		})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User not found in context",
		})
		return
	}

	// Parse user ID string to UUID
	cashierID, err := uuid.Parse(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid user ID",
			Message: "Could not parse user ID",
		})
		return
	}

	// Convert request to model
	newSale := &models.Sale{
		BillNumber:              req.BillNumber,
		CustomerID:              req.CustomerID,
		CashierID:               cashierID,
		BillDiscountPercentage:  req.DiscountPercent,
		BillDiscountAmount:      req.DiscountAmount,
		Notes:                   req.Notes,
		SaleItems:               make([]models.SaleItem, len(req.Items)),
		Payments:                make([]models.Payment, len(req.Payments)),
	}

	// Convert sale items
	for i, item := range req.Items {
		newSale.SaleItems[i] = models.SaleItem{
			ProductID:                item.ProductID,
			Quantity:                 item.Quantity,
			UnitPrice:                item.UnitPrice,
			UnitCost:                 item.UnitCost,
			ItemDiscountPercentage:   item.DiscountPercent,
			ItemDiscountAmount:       item.DiscountAmount,
		}
	}

	// Convert payments
	for i, payment := range req.Payments {
		newSale.Payments[i] = models.Payment{
			Method:    models.PaymentMethod(payment.Method),
			Amount:    payment.Amount,
			Reference: payment.Reference,
		}
	}

	// Create sale through service
	createdSale, err := h.saleService.CreateSale(c.Request.Context(), newSale)
	if err != nil {
		switch err {
		case sale.ErrInvalidInput:
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid input",
				Message: err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to create sale",
				Message: err.Error(),
			})
		}
		return
	}

	// Calculate SubTotal from sale items
	var subTotal float64
	for _, item := range createdSale.SaleItems {
		subTotal += item.LineTotal
	}

	c.JSON(http.StatusCreated, dto.SaleResponse{
		ID:              createdSale.ID,
		BillNumber:      createdSale.BillNumber,
		CustomerID:      createdSale.CustomerID,
		CashierID:       createdSale.CashierID,
		SubTotal:        subTotal,
		DiscountPercent: createdSale.BillDiscountPercentage,
		DiscountAmount:  createdSale.BillDiscountAmount,
		TaxAmount:       0, // Calculate from items if needed
		TotalAmount:     createdSale.TotalAmount,
		Notes:           createdSale.Notes,
		CreatedAt:       createdSale.CreatedAt,
		UpdatedAt:       createdSale.UpdatedAt,
	})
}

// GetSales godoc
// @Summary Get sales list
// @Description Get paginated list of sales with optional filters
// @Tags Sales
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param customer_id query string false "Filter by customer ID"
// @Param cashier_id query string false "Filter by cashier ID"
// @Param start_date query string false "Start date filter (YYYY-MM-DD)"
// @Param end_date query string false "End date filter (YYYY-MM-DD)"
// @Param bill_number query string false "Filter by bill number"
// @Success 200 {object} dto.SalesListResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales [get]
func (h *SalesHandler) GetSales(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Parse filters
	var cashierID *uuid.UUID
	if cashierIDStr := c.Query("cashier_id"); cashierIDStr != "" {
		if id, err := uuid.Parse(cashierIDStr); err == nil {
			cashierID = &id
		}
	}

	var startDate, endDate *time.Time
	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = &t
		}
	}
	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = &t
		}
	}

	billNumber := c.Query("bill_number")
	customerName := c.Query("customer_name")

	// Get sales from service
	sales, total, err := h.saleService.SearchSales(
		c.Request.Context(),
		billNumber,
		customerName,
		startDate,
		endDate,
		cashierID,
		limit,
		offset,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sales",
			Message: err.Error(),
		})
		return
	}

	// Convert to response
	salesResponse := make([]dto.SaleResponse, len(sales))
	for i, saleItem := range sales {
		// Calculate SubTotal from sale items
		var subTotal float64
		for _, item := range saleItem.SaleItems {
			subTotal += item.LineTotal
		}

		salesResponse[i] = dto.SaleResponse{
			ID:              saleItem.ID,
			BillNumber:      saleItem.BillNumber,
			CustomerID:      saleItem.CustomerID,
			CashierID:       saleItem.CashierID,
			SubTotal:        subTotal,
			DiscountPercent: saleItem.BillDiscountPercentage,
			DiscountAmount:  saleItem.BillDiscountAmount,
			TaxAmount:       0, // Calculate from items if needed
			TotalAmount:     saleItem.TotalAmount,
			Notes:           saleItem.Notes,
			CreatedAt:       saleItem.CreatedAt,
			UpdatedAt:       saleItem.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, dto.SalesListResponse{
		Sales:    salesResponse,
		Total:    int(total),
		Page:     page,
		Limit:    limit,
		HasMore:  int64(offset+limit) < total,
	})
}

// GetSale godoc
// @Summary Get sale by ID
// @Description Get a single sale with items and payments
// @Tags Sales
// @Produce json
// @Param id path string true "Sale ID"
// @Success 200 {object} dto.SaleDetailResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales/{id} [get]
func (h *SalesHandler) GetSale(c *gin.Context) {
	idStr := c.Param("id")
	saleID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid sale ID",
			Message: "Sale ID must be a valid UUID",
		})
		return
	}

	saleData, err := h.saleService.GetSaleByID(c.Request.Context(), saleID)
	if err != nil {
		if err == sale.ErrSaleNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Sale not found",
				Message: "Sale with the specified ID does not exist",
			})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get sale",
				Message: err.Error(),
			})
		}
		return
	}

	// Get sale items and payments
	items, err := h.saleService.GetSaleItemsBySale(c.Request.Context(), saleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sale items",
			Message: err.Error(),
		})
		return
	}

	payments, err := h.saleService.GetPaymentsBySale(c.Request.Context(), saleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sale payments",
			Message: err.Error(),
		})
		return
	}

	// Convert to response
	itemsResponse := make([]dto.SaleItemResponse, len(items))
	for i, item := range items {
		itemsResponse[i] = dto.SaleItemResponse{
			ID:              item.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			UnitCost:        item.UnitCost,
			DiscountPercent: item.ItemDiscountPercentage,
			DiscountAmount:  item.ItemDiscountAmount,
			TaxAmount:       0, // Calculate if needed
			SubTotal:        item.LineTotal,
		}
	}

	paymentsResponse := make([]dto.PaymentResponse, len(payments))
	for i, payment := range payments {
		paymentsResponse[i] = dto.PaymentResponse{
			ID:        payment.ID,
			Method:    string(payment.Method),
			Amount:    payment.Amount,
			Reference: payment.Reference,
			CreatedAt: payment.CreatedAt,
		}
	}

	// Calculate SubTotal from sale items
	var subTotal float64
	for _, item := range items {
		subTotal += item.LineTotal
	}

	c.JSON(http.StatusOK, dto.SaleDetailResponse{
		Sale: dto.SaleResponse{
			ID:              saleData.ID,
			BillNumber:      saleData.BillNumber,
			CustomerID:      saleData.CustomerID,
			CashierID:       saleData.CashierID,
			SubTotal:        subTotal,
			DiscountPercent: saleData.BillDiscountPercentage,
			DiscountAmount:  saleData.BillDiscountAmount,
			TaxAmount:       0, // Calculate from items if needed
			TotalAmount:     saleData.TotalAmount,
			Notes:           saleData.Notes,
			CreatedAt:       saleData.CreatedAt,
			UpdatedAt:       saleData.UpdatedAt,
		},
		Items:    itemsResponse,
		Payments: paymentsResponse,
	})
}

// GetSaleByBillNumber godoc
// @Summary Get sale by bill number
// @Description Get a sale by its bill number
// @Tags Sales
// @Produce json
// @Param billNumber path string true "Bill number"
// @Success 200 {object} dto.SaleDetailResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales/bill/{billNumber} [get]
func (h *SalesHandler) GetSaleByBillNumber(c *gin.Context) {
	billNumber := c.Param("billNumber")
	if billNumber == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid bill number",
			Message: "Bill number is required",
		})
		return
	}

	saleData, err := h.saleService.GetSaleByBillNumber(c.Request.Context(), billNumber)
	if err != nil {
		if err == sale.ErrSaleNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Sale not found",
				Message: "Sale with the specified bill number does not exist",
			})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get sale",
				Message: err.Error(),
			})
		}
		return
	}

	// Get sale items and payments
	items, err := h.saleService.GetSaleItemsBySale(c.Request.Context(), saleData.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sale items",
			Message: err.Error(),
		})
		return
	}

	payments, err := h.saleService.GetPaymentsBySale(c.Request.Context(), saleData.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sale payments",
			Message: err.Error(),
		})
		return
	}

	// Convert to response (same as GetSale)
	itemsResponse := make([]dto.SaleItemResponse, len(items))
	for i, item := range items {
		itemsResponse[i] = dto.SaleItemResponse{
			ID:              item.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			UnitPrice:       item.UnitPrice,
			UnitCost:        item.UnitCost,
			DiscountPercent: item.ItemDiscountPercentage,
			DiscountAmount:  item.ItemDiscountAmount,
			TaxAmount:       0, // Calculate if needed
			SubTotal:        item.LineTotal,
		}
	}

	paymentsResponse := make([]dto.PaymentResponse, len(payments))
	for i, payment := range payments {
		paymentsResponse[i] = dto.PaymentResponse{
			ID:        payment.ID,
			Method:    string(payment.Method),
			Amount:    payment.Amount,
			Reference: payment.Reference,
			CreatedAt: payment.CreatedAt,
		}
	}

	// Calculate SubTotal from sale items
	var subTotal float64
	for _, item := range items {
		subTotal += item.LineTotal
	}

	c.JSON(http.StatusOK, dto.SaleDetailResponse{
		Sale: dto.SaleResponse{
			ID:              saleData.ID,
			BillNumber:      saleData.BillNumber,
			CustomerID:      saleData.CustomerID,
			CashierID:       saleData.CashierID,
			SubTotal:        subTotal,
			DiscountPercent: saleData.BillDiscountPercentage,
			DiscountAmount:  saleData.BillDiscountAmount,
			TaxAmount:       0, // Calculate from items if needed
			TotalAmount:     saleData.TotalAmount,
			Notes:           saleData.Notes,
			CreatedAt:       saleData.CreatedAt,
			UpdatedAt:       saleData.UpdatedAt,
		},
		Items:    itemsResponse,
		Payments: paymentsResponse,
	})
}

// GenerateBillNumber godoc
// @Summary Generate bill number
// @Description Generate a unique bill number for a new sale
// @Tags Sales
// @Produce json
// @Success 200 {object} dto.BillNumberResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales/generate-bill-number [get]
func (h *SalesHandler) GenerateBillNumber(c *gin.Context) {
	billNumber, err := h.saleService.GenerateBillNumber(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to generate bill number",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BillNumberResponse{
		BillNumber: billNumber,
	})
}

// GetSalesSummary godoc
// @Summary Get sales summary
// @Description Get sales analytics and summary information
// @Tags Sales
// @Produce json
// @Param start_date query string false "Start date (YYYY-MM-DD)"
// @Param end_date query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales/summary [get]
func (h *SalesHandler) GetSalesSummary(c *gin.Context) {
	// Parse date range
	startDate := time.Now().AddDate(0, 0, -30) // Default: last 30 days
	endDate := time.Now()

	if startDateStr := c.Query("start_date"); startDateStr != "" {
		if t, err := time.Parse("2006-01-02", startDateStr); err == nil {
			startDate = t
		}
	}
	if endDateStr := c.Query("end_date"); endDateStr != "" {
		if t, err := time.Parse("2006-01-02", endDateStr); err == nil {
			endDate = t
		}
	}

	summary, err := h.saleService.GetSalesSummary(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get sales summary",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// VoidSale godoc
// @Summary Void a sale
// @Description Void an existing sale (mark as cancelled)
// @Tags Sales
// @Produce json
// @Param id path string true "Sale ID"
// @Success 200 {object} dto.MessageResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /sales/{id}/void [post]
func (h *SalesHandler) VoidSale(c *gin.Context) {
	idStr := c.Param("id")
	saleID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid sale ID",
			Message: "Sale ID must be a valid UUID",
		})
		return
	}

	// Get the sale first
	_, err = h.saleService.GetSaleByID(c.Request.Context(), saleID)
	if err != nil {
		if err == sale.ErrSaleNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Sale not found",
				Message: "Sale with the specified ID does not exist",
			})
		} else {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get sale",
				Message: err.Error(),
			})
		}
		return
	}

	// Update sale status to voided (assuming we have a status field)
	// This is a simplified void - in practice you might want to restore stock, etc.
	err = h.saleService.DeleteSale(c.Request.Context(), saleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to void sale",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.MessageResponse{
		Message: "Sale voided successfully",
	})
}