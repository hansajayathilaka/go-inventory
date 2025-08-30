package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/purchase"
	"inventory-api/internal/repository/models"
)

// PurchaseOrderHandler handles purchase order-related HTTP requests
type PurchaseOrderHandler struct {
	purchaseService purchase.Service
}

// NewPurchaseOrderHandler creates a new purchase order handler
func NewPurchaseOrderHandler(purchaseService purchase.Service) *PurchaseOrderHandler {
	return &PurchaseOrderHandler{
		purchaseService: purchaseService,
	}
}

// GetPurchaseOrders godoc
// @Summary List purchase orders
// @Description Get a paginated list of purchase orders with optional filtering
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by PO number or reference"
// @Param status query string false "Filter by status" Enums(draft, pending, approved, ordered, received, cancelled)
// @Param supplier_id query string false "Filter by supplier ID" format(uuid)
// @Param start_date query string false "Filter by start date" format(date)
// @Param end_date query string false "Filter by end date" format(date)
// @Security BearerAuth
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders [get]
func (h *PurchaseOrderHandler) GetPurchaseOrders(c *gin.Context) {
	var req dto.PurchaseOrderListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Default values
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}

	// Calculate offset
	offset := (req.Page - 1) * req.Limit

	// Use search or list based on search parameter
	var purchaseOrders []*models.PurchaseOrder
	var err error

	if req.Search != "" {
		purchaseOrders, err = h.purchaseService.SearchPurchaseOrders(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		purchaseOrders, err = h.purchaseService.ListPurchaseOrders(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase orders", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by status if specified
	if req.Status != "" {
		filtered := make([]*models.PurchaseOrder, 0)
		for _, po := range purchaseOrders {
			if po.Status == req.Status {
				filtered = append(filtered, po)
			}
		}
		purchaseOrders = filtered
	}

	// Filter by supplier if specified
	if req.SupplierID != nil {
		filtered := make([]*models.PurchaseOrder, 0)
		for _, po := range purchaseOrders {
			if po.SupplierID == *req.SupplierID {
				filtered = append(filtered, po)
			}
		}
		purchaseOrders = filtered
	}

	poResponses := dto.ToPurchaseOrderResponseList(purchaseOrders)

	// Get total count for pagination
	totalCount, err := h.purchaseService.CountPurchaseOrders(c.Request.Context())
	if err != nil {
		totalCount = int64(len(poResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(poResponses, pagination, "Purchase orders retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetPurchaseOrder godoc
// @Summary Get purchase order by ID
// @Description Get a specific purchase order by its ID
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id} [get]
func (h *PurchaseOrderHandler) GetPurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	poModel, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), poID)
	if err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(poModel)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetPurchaseOrderByNumber godoc
// @Summary Get purchase order by PO number
// @Description Get a specific purchase order by its PO number
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param po_number path string true "Purchase Order Number" example("PO-2024-001")
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/number/{po_number} [get]
func (h *PurchaseOrderHandler) GetPurchaseOrderByNumber(c *gin.Context) {
	poNumber := c.Param("po_number")
	if poNumber == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Purchase order number is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	poModel, err := h.purchaseService.GetPurchaseOrderByNumber(c.Request.Context(), poNumber)
	if err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(poModel)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreatePurchaseOrder godoc
// @Summary Create new purchase order
// @Description Create a new purchase order with items
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param purchase_order body dto.CreatePurchaseOrderRequest true "Purchase order data"
// @Security BearerAuth
// @Success 201 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders [post]
func (h *PurchaseOrderHandler) CreatePurchaseOrder(c *gin.Context) {
	var req dto.CreatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		response := dto.CreateErrorResponse("AUTH_ERROR", "User not authenticated", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Convert to model
	poModel := req.ToPurchaseOrderModel()
	poModel.CreatedByID = userID.(uuid.UUID)

	// Create the purchase order
	createdPO, err := h.purchaseService.CreatePurchaseOrder(c.Request.Context(), poModel)
	if err != nil {
		if errors.Is(err, purchase.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to create purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(createdPO)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdatePurchaseOrder godoc
// @Summary Update purchase order
// @Description Update an existing purchase order
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Param purchase_order body dto.UpdatePurchaseOrderRequest true "Updated purchase order data"
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id} [put]
func (h *PurchaseOrderHandler) UpdatePurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdatePurchaseOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing purchase order
	existingPO, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), poID)
	if err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates
	req.ApplyToPurchaseOrderModel(existingPO)

	// Update the purchase order
	if err := h.purchaseService.UpdatePurchaseOrder(c.Request.Context(), existingPO); err != nil {
		if errors.Is(err, purchase.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else if errors.Is(err, purchase.ErrCannotModifyReceived) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Cannot modify received purchase order", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to update purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(existingPO)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeletePurchaseOrder godoc
// @Summary Delete purchase order
// @Description Delete a purchase order (soft delete)
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id} [delete]
func (h *PurchaseOrderHandler) DeletePurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if err := h.purchaseService.DeletePurchaseOrder(c.Request.Context(), poID); err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrCannotModifyReceived) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Cannot delete received purchase order", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to delete purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Purchase order deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ApprovePurchaseOrder godoc
// @Summary Approve purchase order
// @Description Approve a purchase order (changes status to approved)
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id}/approve [post]
func (h *PurchaseOrderHandler) ApprovePurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		response := dto.CreateErrorResponse("AUTH_ERROR", "User not authenticated", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	if err := h.purchaseService.ApprovePurchaseOrder(c.Request.Context(), poID, userID.(uuid.UUID)); err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Invalid status transition", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to approve purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated purchase order
	updatedPO, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), poID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated purchase order", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(updatedPO)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order approved successfully")
	c.JSON(http.StatusOK, response)
}

// SendPurchaseOrder godoc
// @Summary Send purchase order
// @Description Send purchase order to supplier (changes status to ordered)
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id}/send [post]
func (h *PurchaseOrderHandler) SendPurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if err := h.purchaseService.SendPurchaseOrder(c.Request.Context(), poID); err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Invalid status transition", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to send purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated purchase order
	updatedPO, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), poID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated purchase order", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(updatedPO)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order sent successfully")
	c.JSON(http.StatusOK, response)
}

// CancelPurchaseOrder godoc
// @Summary Cancel purchase order
// @Description Cancel a purchase order (changes status to cancelled)
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id}/cancel [post]
func (h *PurchaseOrderHandler) CancelPurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if err := h.purchaseService.CancelPurchaseOrder(c.Request.Context(), poID); err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Invalid status transition", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to cancel purchase order", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated purchase order
	updatedPO, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), poID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated purchase order", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	poResponse := dto.ToPurchaseOrderResponse(updatedPO)
	response := dto.CreateSuccessResponse(poResponse, "Purchase order cancelled successfully")
	c.JSON(http.StatusOK, response)
}

// GetPurchaseOrderItems godoc
// @Summary Get purchase order items
// @Description Get all items for a specific purchase order
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=[]dto.PurchaseOrderItemResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id}/items [get]
func (h *PurchaseOrderHandler) GetPurchaseOrderItems(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	items, err := h.purchaseService.GetPurchaseOrderItems(c.Request.Context(), poID)
	if err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase order items", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	itemResponses := dto.ToPurchaseOrderItemResponseList(items)
	response := dto.CreateSuccessResponse(itemResponses, "Purchase order items retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// AddPurchaseOrderItem godoc
// @Summary Add item to purchase order
// @Description Add a new item to an existing purchase order
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param id path string true "Purchase Order ID" format(uuid)
// @Param item body dto.CreatePurchaseOrderItemRequest true "Purchase order item data"
// @Security BearerAuth
// @Success 201 {object} dto.BaseResponse{data=dto.PurchaseOrderItemResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{id}/items [post]
func (h *PurchaseOrderHandler) AddPurchaseOrderItem(c *gin.Context) {
	idStr := c.Param("id")
	poID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.CreatePurchaseOrderItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert to model
	itemModel := req.ToPurchaseOrderItemModel(poID)

	// Add the item
	if err := h.purchaseService.AddPurchaseOrderItem(c.Request.Context(), itemModel); err != nil {
		if errors.Is(err, purchase.ErrPurchaseOrderNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid item data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else if errors.Is(err, purchase.ErrCannotModifyReceived) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Cannot modify received purchase order", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to add purchase order item", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	itemResponse := dto.ToPurchaseOrderItemResponse(itemModel)
	response := dto.CreateSuccessResponse(itemResponse, "Purchase order item added successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdatePurchaseOrderItem godoc
// @Summary Update purchase order item
// @Description Update an existing purchase order item
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param po_id path string true "Purchase Order ID" format(uuid)
// @Param item_id path string true "Purchase Order Item ID" format(uuid)
// @Param item body dto.UpdatePurchaseOrderItemRequest true "Updated item data"
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse{data=dto.PurchaseOrderItemResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{po_id}/items/{item_id} [put]
func (h *PurchaseOrderHandler) UpdatePurchaseOrderItem(c *gin.Context) {
	itemIDStr := c.Param("item_id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid item ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdatePurchaseOrderItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing item
	poIDStr := c.Param("id")
	poID, err := uuid.Parse(poIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	items, err := h.purchaseService.GetPurchaseOrderItems(c.Request.Context(), poID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve purchase order items", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	var existingItem *models.PurchaseOrderItem
	for _, item := range items {
		if item.ID == itemID {
			existingItem = item
			break
		}
	}

	if existingItem == nil {
		response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order item not found", "")
		c.JSON(http.StatusNotFound, response)
		return
	}

	// Apply updates
	req.ApplyToPurchaseOrderItemModel(existingItem)

	// Update the item
	if err := h.purchaseService.UpdatePurchaseOrderItem(c.Request.Context(), existingItem); err != nil {
		if errors.Is(err, purchase.ErrItemNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order item not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid item data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else if errors.Is(err, purchase.ErrCannotModifyReceived) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Cannot modify received purchase order", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to update purchase order item", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	itemResponse := dto.ToPurchaseOrderItemResponse(existingItem)
	response := dto.CreateSuccessResponse(itemResponse, "Purchase order item updated successfully")
	c.JSON(http.StatusOK, response)
}

// RemovePurchaseOrderItem godoc
// @Summary Remove item from purchase order
// @Description Remove an item from a purchase order
// @Tags PurchaseOrders
// @Accept json
// @Produce json
// @Param po_id path string true "Purchase Order ID" format(uuid)
// @Param item_id path string true "Purchase Order Item ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /purchase-orders/{po_id}/items/{item_id} [delete]
func (h *PurchaseOrderHandler) RemovePurchaseOrderItem(c *gin.Context) {
	itemIDStr := c.Param("item_id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid item ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if err := h.purchaseService.RemovePurchaseOrderItem(c.Request.Context(), itemID); err != nil {
		if errors.Is(err, purchase.ErrItemNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Purchase order item not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrCannotModifyReceived) {
			response := dto.CreateErrorResponse("BUSINESS_LOGIC_ERROR", "Cannot modify received purchase order", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to remove purchase order item", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Purchase order item removed successfully")
	c.JSON(http.StatusOK, response)
}