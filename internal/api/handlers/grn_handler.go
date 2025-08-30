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

// GRNHandler handles GRN-related HTTP requests
type GRNHandler struct {
	purchaseService purchase.Service
}

// NewGRNHandler creates a new GRN handler
func NewGRNHandler(purchaseService purchase.Service) *GRNHandler {
	return &GRNHandler{
		purchaseService: purchaseService,
	}
}

// GetGRNs godoc
func (h *GRNHandler) GetGRNs(c *gin.Context) {
	var req dto.GRNListRequest
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
	var grns []*models.GRN
	var err error

	if req.Search != "" {
		grns, err = h.purchaseService.SearchGRNs(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		grns, err = h.purchaseService.ListGRNs(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRNs", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by status if specified
	if req.Status != "" {
		filtered := make([]*models.GRN, 0)
		for _, grn := range grns {
			if grn.Status == req.Status {
				filtered = append(filtered, grn)
			}
		}
		grns = filtered
	}

	// Filter by purchase order ID if specified
	if req.PurchaseOrderID != nil {
		filtered := make([]*models.GRN, 0)
		for _, grn := range grns {
			if grn.PurchaseOrderID == *req.PurchaseOrderID {
				filtered = append(filtered, grn)
			}
		}
		grns = filtered
	}

	// Filter by supplier ID if specified
	if req.SupplierID != nil {
		filtered := make([]*models.GRN, 0)
		for _, grn := range grns {
			if grn.SupplierID == *req.SupplierID {
				filtered = append(filtered, grn)
			}
		}
		grns = filtered
	}


	grnResponses := dto.ToGRNResponseList(grns)

	// Get total count for pagination
	totalCount, err := h.purchaseService.CountGRNs(c.Request.Context())
	if err != nil {
		totalCount = int64(len(grnResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(grnResponses, pagination, "GRNs retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetGRN godoc
func (h *GRNHandler) GetGRN(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	grnModel, err := h.purchaseService.GetGRNByID(c.Request.Context(), grnID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	grnResponse := dto.ToGRNResponse(grnModel)
	response := dto.CreateSuccessResponse(grnResponse, "GRN retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetGRNByNumber godoc
func (h *GRNHandler) GetGRNByNumber(c *gin.Context) {
	grnNumber := c.Param("grn_number")
	if grnNumber == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "GRN number is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	grnModel, err := h.purchaseService.GetGRNByNumber(c.Request.Context(), grnNumber)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	grnResponse := dto.ToGRNResponse(grnModel)
	response := dto.CreateSuccessResponse(grnResponse, "GRN retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateGRN godoc
func (h *GRNHandler) CreateGRN(c *gin.Context) {
	var req dto.CreateGRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get supplier ID from purchase order
	purchaseOrder, err := h.purchaseService.GetPurchaseOrderByID(c.Request.Context(), req.PurchaseOrderID)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Purchase order not found", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	grnModel := req.ToGRNModel()
	grnModel.SupplierID = purchaseOrder.SupplierID

	createdGRN, err := h.purchaseService.CreateGRN(c.Request.Context(), grnModel)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNExists) {
			response := dto.CreateErrorResponse("ALREADY_EXISTS", "GRN with this number already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to create GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	grnResponse := dto.ToGRNResponse(createdGRN)
	response := dto.CreateSuccessResponse(grnResponse, "GRN created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateGRN godoc
func (h *GRNHandler) UpdateGRN(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateGRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing GRN
	existingGRN, err := h.purchaseService.GetGRNByID(c.Request.Context(), grnID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to the existing model
	req.ApplyToGRNModel(existingGRN)

	err = h.purchaseService.UpdateGRN(c.Request.Context(), existingGRN)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNExists) {
			response := dto.CreateErrorResponse("ALREADY_EXISTS", "GRN with this number already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to update GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	grnResponse := dto.ToGRNResponse(existingGRN)
	response := dto.CreateSuccessResponse(grnResponse, "GRN updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteGRN godoc
func (h *GRNHandler) DeleteGRN(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.purchaseService.DeleteGRN(c.Request.Context(), grnID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to delete GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "GRN deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ProcessGRNReceipt godoc
func (h *GRNHandler) ProcessGRNReceipt(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.ProcessGRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.purchaseService.ProcessGRNReceipt(c.Request.Context(), grnID, req.ReceivedByID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("INVALID_STATE", "Invalid GRN status for receipt processing", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to process GRN receipt", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated GRN
	updatedGRN, err := h.purchaseService.GetGRNByID(c.Request.Context(), grnID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated GRN", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	grnResponse := dto.ToGRNResponse(updatedGRN)
	response := dto.CreateSuccessResponse(grnResponse, "GRN receipt processed successfully")
	c.JSON(http.StatusOK, response)
}

// VerifyGRN godoc
func (h *GRNHandler) VerifyGRN(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.VerifyGRNRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.purchaseService.VerifyGRN(c.Request.Context(), grnID, req.VerifierID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("INVALID_STATE", "Invalid GRN status for verification", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to verify GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated GRN
	updatedGRN, err := h.purchaseService.GetGRNByID(c.Request.Context(), grnID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated GRN", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	grnResponse := dto.ToGRNResponse(updatedGRN)
	response := dto.CreateSuccessResponse(grnResponse, "GRN verified successfully")
	c.JSON(http.StatusOK, response)
}

// CompleteGRN godoc
func (h *GRNHandler) CompleteGRN(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.purchaseService.CompleteGRN(c.Request.Context(), grnID)
	if err != nil {
		if errors.Is(err, purchase.ErrGRNNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else if errors.Is(err, purchase.ErrInvalidStatus) {
			response := dto.CreateErrorResponse("INVALID_STATE", "Invalid GRN status for completion", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to complete GRN", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated GRN
	updatedGRN, err := h.purchaseService.GetGRNByID(c.Request.Context(), grnID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated GRN", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	grnResponse := dto.ToGRNResponse(updatedGRN)
	response := dto.CreateSuccessResponse(grnResponse, "GRN completed successfully")
	c.JSON(http.StatusOK, response)
}

// GetGRNItems godoc
func (h *GRNHandler) GetGRNItems(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	items, err := h.purchaseService.GetGRNItems(c.Request.Context(), grnID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRN items", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	itemResponses := dto.ToGRNItemResponseList(items)
	response := dto.CreateSuccessResponse(itemResponses, "GRN items retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// AddGRNItem godoc
func (h *GRNHandler) AddGRNItem(c *gin.Context) {
	idStr := c.Param("id")
	grnID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.CreateGRNItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	itemModel := req.ToGRNItemModel(grnID)

	err = h.purchaseService.AddGRNItem(c.Request.Context(), itemModel)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to add GRN item", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	itemResponse := dto.ToGRNItemResponse(itemModel)
	response := dto.CreateSuccessResponse(itemResponse, "GRN item added successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateGRNItem godoc
func (h *GRNHandler) UpdateGRNItem(c *gin.Context) {
	grnIDStr := c.Param("id")
	grnID, err := uuid.Parse(grnIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	itemIDStr := c.Param("item_id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN item ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateGRNItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request body", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing items to find the one to update
	items, err := h.purchaseService.GetGRNItems(c.Request.Context(), grnID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRN items", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	var existingItem *models.GRNItem
	for _, item := range items {
		if item.ID == itemID {
			existingItem = item
			break
		}
	}

	if existingItem == nil {
		response := dto.CreateErrorResponse("NOT_FOUND", "GRN item not found", "")
		c.JSON(http.StatusNotFound, response)
		return
	}

	// Apply updates
	req.ApplyToGRNItemModel(existingItem)

	err = h.purchaseService.UpdateGRNItem(c.Request.Context(), existingItem)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to update GRN item", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	itemResponse := dto.ToGRNItemResponse(existingItem)
	response := dto.CreateSuccessResponse(itemResponse, "GRN item updated successfully")
	c.JSON(http.StatusOK, response)
}

// RemoveGRNItem godoc
func (h *GRNHandler) RemoveGRNItem(c *gin.Context) {
	itemIDStr := c.Param("item_id")
	itemID, err := uuid.Parse(itemIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid GRN item ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.purchaseService.RemoveGRNItem(c.Request.Context(), itemID)
	if err != nil {
		if errors.Is(err, purchase.ErrItemNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "GRN item not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to remove GRN item", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "GRN item removed successfully")
	c.JSON(http.StatusOK, response)
}

// GetGRNsByPurchaseOrder godoc
func (h *GRNHandler) GetGRNsByPurchaseOrder(c *gin.Context) {
	idStr := c.Param("id")
	purchaseOrderID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid purchase order ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	grns, err := h.purchaseService.GetGRNsByPurchaseOrder(c.Request.Context(), purchaseOrderID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRNs", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	grnResponses := dto.ToGRNResponseList(grns)
	response := dto.CreateSuccessResponse(grnResponses, "GRNs retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetGRNsBySupplier godoc
func (h *GRNHandler) GetGRNsBySupplier(c *gin.Context) {
	idStr := c.Param("supplier_id")
	supplierID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid supplier ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	grns, err := h.purchaseService.GetGRNsBySupplier(c.Request.Context(), supplierID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve GRNs", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	grnResponses := dto.ToGRNResponseList(grns)
	response := dto.CreateSuccessResponse(grnResponses, "GRNs retrieved successfully")
	c.JSON(http.StatusOK, response)
}