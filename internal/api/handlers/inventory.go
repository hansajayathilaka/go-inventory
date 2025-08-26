package handlers

import (
	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/business/user"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InventoryHandler struct {
	inventoryService inventory.Service
	userService      user.Service
	inventoryRepo    interfaces.InventoryRepository
	stockMovementRepo interfaces.StockMovementRepository
}

func NewInventoryHandler(inventoryService inventory.Service, userService user.Service, inventoryRepo interfaces.InventoryRepository, stockMovementRepo interfaces.StockMovementRepository) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
		userService:      userService,
		inventoryRepo:    inventoryRepo,
		stockMovementRepo: stockMovementRepo,
	}
}

// Helper function to parse string to UUID pointer
func parseStringToUUID(s string) *uuid.UUID {
	if s == "" {
		return nil
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &id
}

// GetInventoryRecords godoc
// @Summary List inventory records
// @Description Get a paginated list of inventory records with optional filtering
// @Tags inventory
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param location_id query string false "Filter by location ID"
// @Param product_id query string false "Filter by product ID"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.InventoryResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory [get]
func (h *InventoryHandler) GetInventoryRecords(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	locationID := c.Query("location_id")
	productID := c.Query("product_id")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	offset := (page - 1) * limit

	var locationUUID, productUUID *uuid.UUID
	
	if locationID != "" {
		id, err := uuid.Parse(locationID)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error: "invalid location_id format",
			})
			return
		}
		locationUUID = &id
	}

	if productID != "" {
		id, err := uuid.Parse(productID)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error: "invalid product_id format",
			})
			return
		}
		productUUID = &id
	}

	ctx := c.Request.Context()
	var records []*models.Inventory
	var total int64
	var err error

	// Get filtered records based on parameters
	if locationUUID != nil && productUUID != nil {
		// Get specific record
		record, err := h.inventoryRepo.GetByProductAndLocation(ctx, *productUUID, *locationUUID)
		if err != nil {
			records = []*models.Inventory{}
			total = 0
		} else {
			records = []*models.Inventory{record}
			total = 1
		}
	} else if locationUUID != nil {
		// Get by location
		records, err = h.inventoryRepo.GetByLocation(ctx, *locationUUID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to retrieve inventory records",
			})
			return
		}
		total = int64(len(records))
	} else if productUUID != nil {
		// Get by product
		records, err = h.inventoryRepo.GetByProduct(ctx, *productUUID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to retrieve inventory records",
			})
			return
		}
		total = int64(len(records))
	} else {
		// Get all with pagination
		records, err = h.inventoryRepo.List(ctx, limit, offset)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to retrieve inventory records",
			})
			return
		}
		total, err = h.inventoryRepo.Count(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to count inventory records",
			})
			return
		}
	}

	response := make([]dto.InventoryResponse, len(records))
	for i, record := range records {
		response[i] = dto.InventoryResponse{
			ID:               record.ID,
			ProductID:        record.ProductID,
			ProductName:      record.Product.Name,
			ProductSKU:       record.Product.SKU,
			LocationID:       record.LocationID,
			LocationName:     record.Location.Name,
			Quantity:         record.Quantity,
			ReservedQuantity: record.ReservedQuantity,
			ReorderLevel:     record.ReorderLevel,
			LastUpdated:      record.LastUpdated,
		}
	}

	totalPages := (int(total) + limit - 1) / limit

	c.JSON(http.StatusOK, dto.CreatePaginatedResponse(
		response,
		&dto.PaginationInfo{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
		"Inventory records retrieved successfully",
	))
}

// CreateInventoryRecord godoc
// @Summary Create inventory record
// @Description Create a new inventory record for a product at a location
// @Tags inventory
// @Accept json
// @Produce json
// @Param inventory body dto.CreateInventoryRequest true "Inventory data"
// @Success 201 {object} dto.InventoryResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory [post]
func (h *InventoryHandler) CreateInventoryRecord(c *gin.Context) {
	var req dto.CreateInventoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	ctx := c.Request.Context()
	
	// Use the service's CreateInventory method which includes validation
	record, err := h.inventoryService.CreateInventory(ctx, req.ProductID, req.LocationID, req.Quantity, req.ReorderLevel, 1000) // Using 1000 as default max level
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to create inventory record",
		})
		return
	}

	// Set reserved quantity if provided
	if req.ReservedQuantity > 0 {
		record.ReservedQuantity = req.ReservedQuantity
		if err := h.inventoryRepo.Update(ctx, record); err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to update reserved quantity",
			})
			return
		}
	}

	// Reload with relations
	fullRecord, err := h.inventoryRepo.GetByID(ctx, record.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to retrieve created record",
		})
		return
	}

	response := dto.InventoryResponse{
		ID:               fullRecord.ID,
		ProductID:        fullRecord.ProductID,
		ProductName:      fullRecord.Product.Name,
		ProductSKU:       fullRecord.Product.SKU,
		LocationID:       fullRecord.LocationID,
		LocationName:     fullRecord.Location.Name,
		Quantity:         fullRecord.Quantity,
		ReservedQuantity: fullRecord.ReservedQuantity,
		ReorderLevel:     fullRecord.ReorderLevel,
		LastUpdated:      fullRecord.LastUpdated,
	}

	c.JSON(http.StatusCreated, response)
}

// AdjustStock godoc
// @Summary Adjust stock levels
// @Description Adjust stock levels for a product (increase or decrease)
// @Tags inventory
// @Accept json
// @Produce json
// @Param adjustment body dto.StockAdjustmentRequest true "Stock adjustment data"
// @Success 200 {object} dto.StockMovementResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory/adjust [post]
func (h *InventoryHandler) AdjustStock(c *gin.Context) {
	var req dto.StockAdjustmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// For now, use a default user ID - in production this would come from JWT
	defaultUserID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
	ctx := c.Request.Context()

	var notes string
	if req.Notes != nil {
		notes = *req.Notes
	}

	// Use the service's AdjustStock method
	err := h.inventoryService.AdjustStock(ctx, req.ProductID, req.LocationID, req.Quantity, defaultUserID, notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to adjust stock",
		})
		return
	}

	// Get the latest stock movement for this adjustment
	movements, err := h.stockMovementRepo.GetByProduct(ctx, req.ProductID, 1, 0)
	if err != nil || len(movements) == 0 {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to retrieve stock movement",
		})
		return
	}

	movement := movements[0]
	response := dto.StockMovementResponse{
		ID:           movement.ID,
		ProductID:    movement.ProductID,
		ProductName:  movement.Product.Name,
		ProductSKU:   movement.Product.SKU,
		LocationID:   &movement.LocationID,
		LocationName: &movement.Location.Name,
		MovementType: string(movement.MovementType),
		Quantity:     movement.Quantity,
		ReferenceID:  parseStringToUUID(movement.ReferenceID),
		UserID:       movement.UserID,
		Notes:        &movement.Notes,
		CreatedAt:    movement.CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// TransferStock godoc
// @Summary Transfer stock between locations
// @Description Transfer stock from one location to another
// @Tags inventory
// @Accept json
// @Produce json
// @Param transfer body dto.StockTransferRequest true "Stock transfer data"
// @Success 200 {object} dto.StockTransferResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory/transfer [post]
func (h *InventoryHandler) TransferStock(c *gin.Context) {
	var req dto.StockTransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// For now, use a default user ID - in production this would come from JWT
	defaultUserID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")
	ctx := c.Request.Context()

	var notes string
	if req.Notes != nil {
		notes = *req.Notes
	}

	// Use the service's TransferStock method
	err := h.inventoryService.TransferStock(ctx, req.ProductID, req.FromLocationID, req.ToLocationID, req.Quantity, defaultUserID, notes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to transfer stock",
		})
		return
	}

	// Get the latest transfer movements for this product
	movements, err := h.stockMovementRepo.GetByProduct(ctx, req.ProductID, 2, 0)
	if err != nil || len(movements) == 0 {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to retrieve transfer details",
		})
		return
	}

	// Generate a transfer ID (could be the reference ID from the movements)
	transferID := uuid.New()
	if len(movements) > 0 && movements[0].ReferenceID != "" {
		if parsed, parseErr := uuid.Parse(movements[0].ReferenceID); parseErr == nil {
			transferID = parsed
		}
	}

	response := dto.StockTransferResponse{
		TransferID:     transferID,
		ProductID:      req.ProductID,
		FromLocationID: req.FromLocationID,
		ToLocationID:   req.ToLocationID,
		Quantity:       req.Quantity,
		UserID:         defaultUserID,
		Notes:          req.Notes,
		CreatedAt:      movements[0].CreatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// GetLowStockItems godoc
// @Summary Get low stock items
// @Description Get items that are at or below their reorder level
// @Tags inventory
// @Accept json
// @Produce json
// @Param location_id query string false "Filter by location ID"
// @Success 200 {object} dto.ApiResponse{data=[]dto.LowStockItemResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory/low-stock [get]
func (h *InventoryHandler) GetLowStockItems(c *gin.Context) {
	ctx := c.Request.Context()
	// TODO: Implement location filtering when service supports it
	// For now, get all low stock items
	items, err := h.inventoryService.GetLowStock(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to retrieve low stock items",
		})
		return
	}

	response := make([]dto.LowStockItemResponse, len(items))
	for i, item := range items {
		response[i] = dto.LowStockItemResponse{
			ProductID:    item.ProductID,
			ProductName:  item.Product.Name,
			ProductSKU:   item.Product.SKU,
			LocationID:   item.LocationID,
			LocationName: item.Location.Name,
			Quantity:     item.Quantity,
			ReorderLevel: item.ReorderLevel,
			Deficit:      item.ReorderLevel - item.Quantity,
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Items retrieved successfully",
		Data:    response,
	})
}

// GetZeroStockItems godoc
// @Summary Get zero stock items
// @Description Get items that are completely out of stock
// @Tags inventory
// @Accept json
// @Produce json
// @Param location_id query string false "Filter by location ID"
// @Success 200 {object} dto.ApiResponse{data=[]dto.ZeroStockItemResponse}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory/zero-stock [get]
func (h *InventoryHandler) GetZeroStockItems(c *gin.Context) {
	ctx := c.Request.Context()
	// TODO: Implement location filtering when service supports it
	// For now, get all zero stock items
	items, err := h.inventoryService.GetZeroStock(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error: "failed to retrieve zero stock items",
		})
		return
	}

	response := make([]dto.ZeroStockItemResponse, len(items))
	for i, item := range items {
		response[i] = dto.ZeroStockItemResponse{
			ProductID:    item.ProductID,
			ProductName:  item.Product.Name,
			ProductSKU:   item.Product.SKU,
			LocationID:   item.LocationID,
			LocationName: item.Location.Name,
			LastUpdated:  item.LastUpdated,
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Items retrieved successfully",
		Data:    response,
	})
}

// UpdateReorderLevels godoc
// @Summary Update reorder levels
// @Description Update reorder levels for multiple inventory records
// @Tags inventory
// @Accept json
// @Produce json
// @Param levels body dto.UpdateReorderLevelsRequest true "Reorder levels data"
// @Success 200 {object} dto.ApiResponse{data=string}
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Router /inventory/reorder-levels [put]
func (h *InventoryHandler) UpdateReorderLevels(c *gin.Context) {
	var req dto.UpdateReorderLevelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	ctx := c.Request.Context()
	
	for _, level := range req.ReorderLevels {
		// Use UpdateReorderLevels method with default max level
		err := h.inventoryService.UpdateReorderLevels(ctx, level.ProductID, level.LocationID, level.ReorderLevel, 1000)
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
				Error: "failed to update reorder levels",
			})
			return
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Reorder levels updated successfully",
		Data:    nil,
	})
}