package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/purchase_receipt"
	"inventory-api/internal/repository/models"
)

type PurchaseReceiptHandler struct {
	service purchase_receipt.Service
}

func NewPurchaseReceiptHandler(service purchase_receipt.Service) *PurchaseReceiptHandler {
	return &PurchaseReceiptHandler{
		service: service,
	}
}

// CreatePurchaseReceipt godoc
// @Summary Create a new purchase receipt
// @Description Create a new purchase receipt with order details
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param purchase_receipt body dto.CreatePurchaseReceiptRequest true "Purchase receipt data"
// @Success 201 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts [post]
func (h *PurchaseReceiptHandler) CreatePurchaseReceipt(c *gin.Context) {
	var req dto.CreatePurchaseReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Get user ID from context
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "User not authenticated"})
		return
	}

	// Parse user ID string to UUID
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{Error: "Invalid user ID"})
		return
	}

	// Convert DTO to model
	pr := req.ToPurchaseReceiptModel()
	pr.CreatedByID = userID

	// Create purchase receipt
	createdPR, err := h.service.CreatePurchaseReceipt(c.Request.Context(), pr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to create purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(createdPR)
	c.JSON(http.StatusCreated, response)
}

// GetPurchaseReceipt godoc
// @Summary Get purchase receipt by ID
// @Description Get a purchase receipt by its ID
// @Tags purchase-receipts
// @Security BearerAuth
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Success 200 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id} [get]
func (h *PurchaseReceiptHandler) GetPurchaseReceipt(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	pr, err := h.service.GetPurchaseReceiptByID(c.Request.Context(), id)
	if err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(pr)
	c.JSON(http.StatusOK, response)
}

// UpdatePurchaseReceipt godoc
// @Summary Update purchase receipt
// @Description Update an existing purchase receipt
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Param purchase_receipt body dto.UpdatePurchaseReceiptRequest true "Updated purchase receipt data"
// @Success 200 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id} [put]
func (h *PurchaseReceiptHandler) UpdatePurchaseReceipt(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	var req dto.UpdatePurchaseReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Get existing purchase receipt
	pr, err := h.service.GetPurchaseReceiptByID(c.Request.Context(), id)
	if err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve purchase receipt",
			Message: err.Error(),
		})
		return
	}

	// Apply updates
	req.ApplyToPurchaseReceiptModel(pr)

	// Update purchase receipt
	if err := h.service.UpdatePurchaseReceipt(c.Request.Context(), pr); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(pr)
	c.JSON(http.StatusOK, response)
}

// DeletePurchaseReceipt godoc
// @Summary Delete purchase receipt
// @Description Delete a purchase receipt by ID
// @Tags purchase-receipts
// @Security BearerAuth
// @Param id path string true "Purchase Receipt ID"
// @Success 204 "No Content"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id} [delete]
func (h *PurchaseReceiptHandler) DeletePurchaseReceipt(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	if err := h.service.DeletePurchaseReceipt(c.Request.Context(), id); err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to delete purchase receipt",
			Message: err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// ListPurchaseReceipts godoc
// @Summary List purchase receipts
// @Description Get a paginated list of purchase receipts with optional filters
// @Tags purchase-receipts
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by receipt number"
// @Param status query string false "Filter by status"
// @Param supplier_id query string false "Filter by supplier ID"
// @Param start_date query string false "Filter by start date (RFC3339 format)"
// @Param end_date query string false "Filter by end date (RFC3339 format)"
// Phase filtering removed in simplified model
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.PurchaseReceiptResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts [get]
func (h *PurchaseReceiptHandler) ListPurchaseReceipts(c *gin.Context) {
	var req dto.PurchaseReceiptListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid query parameters",
			Message: err.Error(),
		})
		return
	}

	// Set defaults
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}

	offset := (req.Page - 1) * req.Limit

	var prs []*models.PurchaseReceipt
	var total int64
	var err error

	// Apply filters and search
	if req.Search != "" {
		prs, err = h.service.SearchPurchaseReceipts(c.Request.Context(), req.Search, req.Limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to search purchase receipts",
				Message: err.Error(),
			})
			return
		}
	} else if req.Status != "" {
		prs, err = h.service.GetPurchaseReceiptsByStatus(c.Request.Context(), req.Status)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get purchase receipts by status",
				Message: err.Error(),
			})
			return
		}
	} else if req.SupplierID != nil {
		prs, err = h.service.GetPurchaseReceiptsBySupplier(c.Request.Context(), *req.SupplierID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to get purchase receipts by supplier",
				Message: err.Error(),
			})
			return
		}
	} else {
		prs, err = h.service.ListPurchaseReceipts(c.Request.Context(), req.Limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error:   "Failed to list purchase receipts",
				Message: err.Error(),
			})
			return
		}
	}

	// Get total count
	total, err = h.service.CountPurchaseReceipts(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to count purchase receipts",
			Message: err.Error(),
		})
		return
	}

	// Phase filtering removed - use status filter instead

	responses := dto.ToPurchaseReceiptResponseList(prs)

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      total,
		TotalPages: int((total + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(responses, pagination, "Purchase receipts retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// ApprovePurchaseReceipt endpoint removed - approval workflow not supported in simplified model

// SendOrder endpoint removed - send order workflow not supported in simplified model

// ReceiveGoods godoc
// @Summary Receive goods from supplier
// @Description Mark goods as received from supplier
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Success 200 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/receive [post]
func (h *PurchaseReceiptHandler) ReceiveGoods(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	// Simplified goods receipt - no additional data required
	if err := h.service.ReceiveGoods(c.Request.Context(), id); err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		if err == purchase_receipt.ErrCannotReceive {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Cannot receive goods for purchase receipt in current status"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to receive goods",
			Message: err.Error(),
		})
		return
	}

	// Return updated purchase receipt
	pr, err := h.service.GetPurchaseReceiptByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve updated purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(pr)
	c.JSON(http.StatusOK, response)
}

// VerifyGoods endpoint removed - goods verification workflow not supported in simplified model

// CompletePurchaseReceipt godoc
// @Summary Complete purchase receipt processing
// @Description Mark purchase receipt as completed
// @Tags purchase-receipts
// @Security BearerAuth
// @Param id path string true "Purchase Receipt ID"
// @Success 200 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/complete [post]
func (h *PurchaseReceiptHandler) CompletePurchaseReceipt(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	if err := h.service.CompletePurchaseReceipt(c.Request.Context(), id); err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to complete purchase receipt",
			Message: err.Error(),
		})
		return
	}

	// Return updated purchase receipt
	pr, err := h.service.GetPurchaseReceiptByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve updated purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(pr)
	c.JSON(http.StatusOK, response)
}

// CancelPurchaseReceipt godoc
// @Summary Cancel purchase receipt
// @Description Cancel a purchase receipt
// @Tags purchase-receipts
// @Security BearerAuth
// @Param id path string true "Purchase Receipt ID"
// @Success 200 {object} dto.PurchaseReceiptResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/cancel [post]
func (h *PurchaseReceiptHandler) CancelPurchaseReceipt(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	if err := h.service.CancelPurchaseReceipt(c.Request.Context(), id); err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		if err == purchase_receipt.ErrCannotCancel {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "Cannot cancel purchase receipt in current status"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to cancel purchase receipt",
			Message: err.Error(),
		})
		return
	}

	// Return updated purchase receipt
	pr, err := h.service.GetPurchaseReceiptByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve updated purchase receipt",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptResponse(pr)
	c.JSON(http.StatusOK, response)
}

// Item management handlers

// CreatePurchaseReceiptItem godoc
// @Summary Add item to purchase receipt
// @Description Add a new item to a purchase receipt
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Param item body dto.CreatePurchaseReceiptItemRequest true "Item data"
// @Success 201 {object} dto.PurchaseReceiptItemResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/items [post]
func (h *PurchaseReceiptHandler) CreatePurchaseReceiptItem(c *gin.Context) {
	purchaseReceiptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	var req dto.CreatePurchaseReceiptItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Convert DTO to model
	item := req.ToPurchaseReceiptItemModel(purchaseReceiptID)

	// Add item
	if err := h.service.AddPurchaseReceiptItem(c.Request.Context(), item); err != nil {
		if err == purchase_receipt.ErrPurchaseReceiptNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to add purchase receipt item",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptItemResponse(item)
	c.JSON(http.StatusCreated, response)
}

// UpdatePurchaseReceiptItem godoc
// @Summary Update purchase receipt item
// @Description Update an existing purchase receipt item
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Param item_id path string true "Item ID"
// @Param item body dto.UpdatePurchaseReceiptItemRequest true "Updated item data"
// @Success 200 {object} dto.PurchaseReceiptItemResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/items/{item_id} [put]
func (h *PurchaseReceiptHandler) UpdatePurchaseReceiptItem(c *gin.Context) {
	purchaseReceiptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	itemID, err := uuid.Parse(c.Param("item_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid item ID",
			Message: "Item ID must be a valid UUID",
		})
		return
	}

	var req dto.UpdatePurchaseReceiptItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Get existing items to find the target item
	items, err := h.service.GetPurchaseReceiptItems(c.Request.Context(), purchaseReceiptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve purchase receipt items",
			Message: err.Error(),
		})
		return
	}

	var targetItem *models.PurchaseReceiptItem
	for _, item := range items {
		if item.ID == itemID {
			targetItem = item
			break
		}
	}

	if targetItem == nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt item not found"})
		return
	}

	// Apply updates
	req.ApplyToPurchaseReceiptItemModel(targetItem)

	// Update item
	if err := h.service.UpdatePurchaseReceiptItem(c.Request.Context(), targetItem); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to update purchase receipt item",
			Message: err.Error(),
		})
		return
	}

	response := dto.ToPurchaseReceiptItemResponse(targetItem)
	c.JSON(http.StatusOK, response)
}

// DeletePurchaseReceiptItem godoc
// @Summary Remove item from purchase receipt
// @Description Remove an item from a purchase receipt
// @Tags purchase-receipts
// @Security BearerAuth
// @Param id path string true "Purchase Receipt ID"
// @Param item_id path string true "Item ID"
// @Success 204 "No Content"
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/items/{item_id} [delete]
func (h *PurchaseReceiptHandler) DeletePurchaseReceiptItem(c *gin.Context) {
	itemID, err := uuid.Parse(c.Param("item_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid item ID",
			Message: "Item ID must be a valid UUID",
		})
		return
	}

	if err := h.service.RemovePurchaseReceiptItem(c.Request.Context(), itemID); err != nil {
		if err == purchase_receipt.ErrItemNotFound {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "Purchase receipt item not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to remove purchase receipt item",
			Message: err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}

// GetPurchaseReceiptItems godoc
// @Summary Get purchase receipt items
// @Description Get all items for a specific purchase receipt
// @Tags purchase-receipts
// @Security BearerAuth
// @Produce json
// @Param id path string true "Purchase Receipt ID"
// @Success 200 {array} dto.PurchaseReceiptItemResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/{id}/items [get]
func (h *PurchaseReceiptHandler) GetPurchaseReceiptItems(c *gin.Context) {
	purchaseReceiptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid purchase receipt ID",
			Message: "Purchase receipt ID must be a valid UUID",
		})
		return
	}

	items, err := h.service.GetPurchaseReceiptItems(c.Request.Context(), purchaseReceiptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to retrieve purchase receipt items",
			Message: err.Error(),
		})
		return
	}

	responses := dto.ToPurchaseReceiptItemResponseList(items)
	c.JSON(http.StatusOK, responses)
}

// Analytics endpoints

// GetPurchaseReceiptSummary godoc
// @Summary Get purchase receipt summary
// @Description Get purchase receipt analytics summary for a date range
// @Tags purchase-receipts
// @Security BearerAuth
// @Produce json
// @Param start_date query string true "Start date (RFC3339 format)"
// @Param end_date query string true "End date (RFC3339 format)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/summary [get]
func (h *PurchaseReceiptHandler) GetPurchaseReceiptSummary(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "start_date and end_date are required",
		})
		return
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid start_date format",
			Message: "Use RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
		})
		return
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid end_date format",
			Message: "Use RFC3339 format (e.g., 2023-12-31T23:59:59Z)",
		})
		return
	}

	summary, err := h.service.GetPurchaseReceiptSummary(c.Request.Context(), startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get purchase receipt summary",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetSupplierPerformance godoc
// @Summary Get supplier performance metrics
// @Description Get performance metrics for a specific supplier
// @Tags purchase-receipts
// @Security BearerAuth
// @Produce json
// @Param supplier_id path string true "Supplier ID"
// @Param start_date query string true "Start date (RFC3339 format)"
// @Param end_date query string true "End date (RFC3339 format)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/suppliers/{supplier_id}/performance [get]
func (h *PurchaseReceiptHandler) GetSupplierPerformance(c *gin.Context) {
	supplierID, err := uuid.Parse(c.Param("supplier_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: "Supplier ID must be a valid UUID",
		})
		return
	}

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "start_date and end_date are required",
		})
		return
	}

	startDate, err := time.Parse(time.RFC3339, startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid start_date format",
			Message: "Use RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
		})
		return
	}

	endDate, err := time.Parse(time.RFC3339, endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid end_date format",
			Message: "Use RFC3339 format (e.g., 2023-12-31T23:59:59Z)",
		})
		return
	}

	performance, err := h.service.GetSupplierPerformance(c.Request.Context(), supplierID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Failed to get supplier performance",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, performance)
}

// CalculateDiscount godoc
// @Summary Calculate purchase receipt discount
// @Description Calculate total discount for a purchase receipt with items
// @Tags purchase-receipts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param calculation body dto.CreatePurchaseReceiptRequest true "Purchase receipt data for discount calculation"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /purchase-receipts/calculate-discount [post]
func (h *PurchaseReceiptHandler) CalculateDiscount(c *gin.Context) {
	var req dto.CreatePurchaseReceiptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request data",
			Message: err.Error(),
		})
		return
	}

	// Convert to model for calculation
	pr := req.ToPurchaseReceiptModel()

	// Calculate item discounts
	itemDiscounts := make([]map[string]interface{}, len(pr.Items))
	var subtotal float64
	
	for i, item := range pr.Items {
		lineSubtotal := float64(item.Quantity) * item.UnitCost
		subtotal += lineSubtotal
		
		// Calculate item discount
		var itemDiscount float64
		if item.ItemDiscountPercentage > 0 {
			itemDiscount = lineSubtotal * (item.ItemDiscountPercentage / 100)
		} else {
			itemDiscount = item.ItemDiscountAmount
		}
		
		lineTotal := lineSubtotal - itemDiscount
		
		itemDiscounts[i] = map[string]interface{}{
			"line_subtotal":    lineSubtotal,
			"item_discount":    itemDiscount,
			"line_total":       lineTotal,
		}
	}
	
	// Calculate bill discount
	var billDiscount float64
	if pr.BillDiscountPercentage > 0 {
		billDiscount = subtotal * (pr.BillDiscountPercentage / 100)
	} else {
		billDiscount = pr.BillDiscountAmount
	}
	
	totalAfterDiscounts := subtotal - billDiscount
	totalDiscounts := billDiscount
	
	for _, item := range itemDiscounts {
		totalDiscounts += item["item_discount"].(float64)
	}

	result := map[string]interface{}{
		"subtotal":           subtotal,
		"item_discounts":     itemDiscounts,
		"bill_discount":      billDiscount,
		"total_discounts":    totalDiscounts,
		"total_amount":       totalAfterDiscounts,
	}

	c.JSON(http.StatusOK, result)
}