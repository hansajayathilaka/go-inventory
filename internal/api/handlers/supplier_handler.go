package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	supplierBusiness "inventory-api/internal/business/supplier"
	"inventory-api/internal/repository/models"
)

type SupplierHandler struct {
	supplierService supplierBusiness.Service
}

func NewSupplierHandler(supplierService supplierBusiness.Service) *SupplierHandler {
	return &SupplierHandler{
		supplierService: supplierService,
	}
}

// CreateSupplier godoc
// @Summary Create a new supplier
// @Description Create a new supplier in the system
// @Tags suppliers
// @Accept json
// @Produce json
// @Param supplier body dto.SupplierCreateRequest true "Supplier creation data"
// @Success 201 {object} dto.StandardResponse[dto.SupplierDetailResponse] "Supplier created successfully"
// @Failure 400 {object} dto.StandardErrorResponse "Invalid request"
// @Failure 409 {object} dto.StandardErrorResponse "Supplier already exists"
// @Failure 500 {object} dto.StandardErrorResponse "Internal server error"
// @Router /suppliers [post]
func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var req dto.SupplierCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
			"INVALID_REQUEST",
			"Invalid request",
			err.Error(),
		))
		return
	}

	// Convert request to model
	supplier := &models.Supplier{
		Name:        req.Name,
		Code:        req.Code,
		Email:       req.Email,
		Phone:       req.Phone,
		Address:     req.Address,
		ContactName: req.ContactName,
		Notes:       req.Notes,
		IsActive:    req.IsActive,
	}

	if err := h.supplierService.CreateSupplier(c.Request.Context(), supplier); err != nil {
		if errors.Is(err, supplierBusiness.ErrCodeExists) {
			c.JSON(http.StatusConflict, dto.CreateStandardErrorResponse(
				"CODE_EXISTS",
				"Supplier code already exists",
				err.Error(),
			))
			return
		}
		if errors.Is(err, supplierBusiness.ErrInvalidSupplier) {
			c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
				"INVALID_SUPPLIER",
				"Invalid supplier data",
				err.Error(),
			))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.CreateStandardErrorResponse(
			"CREATE_FAILED",
			"Failed to create supplier",
			err.Error(),
		))
		return
	}

	response := dto.SupplierDetailResponse{
		ID:          supplier.ID,
		Name:        supplier.Name,
		Code:        supplier.Code,
		Email:       supplier.Email,
		Phone:       supplier.Phone,
		Address:     supplier.Address,
		ContactName: supplier.ContactName,
		Notes:       supplier.Notes,
		IsActive:    supplier.IsActive,
		CreatedAt:   supplier.CreatedAt,
		UpdatedAt:   supplier.UpdatedAt,
	}

	c.JSON(http.StatusCreated, dto.CreateStandardSuccessResponse(
		response,
		"Supplier created successfully",
	))
}

// GetSupplier godoc
// @Summary Get supplier by ID
// @Description Get a specific supplier by its ID
// @Tags suppliers
// @Produce json
// @Param id path string true "Supplier ID" Format(uuid)
// @Success 200 {object} dto.StandardResponse[dto.SupplierDetailResponse] "Supplier details"
// @Failure 400 {object} dto.StandardErrorResponse "Invalid supplier ID"
// @Failure 404 {object} dto.StandardErrorResponse "Supplier not found"
// @Failure 500 {object} dto.StandardErrorResponse "Internal server error"
// @Router /suppliers/{id} [get]
func (h *SupplierHandler) GetSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
			"INVALID_SUPPLIER_ID",
			"Invalid supplier ID",
			err.Error(),
		))
		return
	}

	supplier, err := h.supplierService.GetSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.CreateStandardErrorResponse(
			"SUPPLIER_NOT_FOUND",
			"Supplier not found",
			err.Error(),
		))
		return
	}

	response := dto.SupplierDetailResponse{
		ID:          supplier.ID,
		Name:        supplier.Name,
		Code:        supplier.Code,
		Email:       supplier.Email,
		Phone:       supplier.Phone,
		Address:     supplier.Address,
		ContactName: supplier.ContactName,
		Notes:       supplier.Notes,
		IsActive:    supplier.IsActive,
		CreatedAt:   supplier.CreatedAt,
		UpdatedAt:   supplier.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Supplier retrieved successfully",
	))
}

// UpdateSupplier godoc
// @Summary Update a supplier
// @Description Update an existing supplier's information
// @Tags suppliers
// @Accept json
// @Produce json
// @Param id path string true "Supplier ID" Format(uuid)
// @Param supplier body dto.SupplierUpdateRequest true "Updated supplier data"
// @Success 200 {object} dto.StandardResponse[dto.SupplierDetailResponse] "Supplier updated successfully"
// @Failure 400 {object} dto.StandardErrorResponse "Invalid request"
// @Failure 404 {object} dto.StandardErrorResponse "Supplier not found"
// @Failure 409 {object} dto.StandardErrorResponse "Supplier code already exists"
// @Failure 500 {object} dto.StandardErrorResponse "Internal server error"
// @Router /suppliers/{id} [put]
func (h *SupplierHandler) UpdateSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid supplier ID",
			Message: err.Error(),
		})
		return
	}

	var req dto.SupplierUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
			"INVALID_REQUEST",
			"Invalid request",
			err.Error(),
		))
		return
	}

	// Get existing supplier first
	existing, err := h.supplierService.GetSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.CreateStandardErrorResponse(
			"SUPPLIER_NOT_FOUND",
			"Supplier not found",
			err.Error(),
		))
		return
	}

	// Update the supplier
	existing.Name = req.Name
	existing.Code = req.Code
	existing.Email = req.Email
	existing.Phone = req.Phone
	existing.Address = req.Address
	existing.ContactName = req.ContactName
	existing.Notes = req.Notes
	existing.IsActive = req.IsActive

	if err := h.supplierService.UpdateSupplier(c.Request.Context(), existing); err != nil {
		if errors.Is(err, supplierBusiness.ErrCodeExists) {
			c.JSON(http.StatusConflict, dto.CreateStandardErrorResponse(
				"CODE_EXISTS",
				"Supplier code already exists",
				err.Error(),
			))
			return
		}
		if errors.Is(err, supplierBusiness.ErrInvalidSupplier) {
			c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
				"INVALID_SUPPLIER",
				"Invalid supplier data",
				err.Error(),
			))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.CreateStandardErrorResponse(
			"UPDATE_FAILED",
			"Failed to update supplier",
			err.Error(),
		))
		return
	}

	response := dto.SupplierDetailResponse{
		ID:          existing.ID,
		Name:        existing.Name,
		Code:        existing.Code,
		Email:       existing.Email,
		Phone:       existing.Phone,
		Address:     existing.Address,
		ContactName: existing.ContactName,
		Notes:       existing.Notes,
		IsActive:    existing.IsActive,
		CreatedAt:   existing.CreatedAt,
		UpdatedAt:   existing.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse(
		response,
		"Supplier updated successfully",
	))
}

// DeleteSupplier godoc
// @Summary Delete a supplier
// @Description Delete a supplier from the system
// @Tags suppliers
// @Produce json
// @Param id path string true "Supplier ID" Format(uuid)
// @Success 200 {object} dto.StandardResponse[interface{}] "Supplier deleted successfully"
// @Failure 400 {object} dto.StandardErrorResponse "Invalid supplier ID"
// @Failure 404 {object} dto.StandardErrorResponse "Supplier not found"
// @Failure 500 {object} dto.StandardErrorResponse "Internal server error"
// @Router /suppliers/{id} [delete]
func (h *SupplierHandler) DeleteSupplier(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.CreateStandardErrorResponse(
			"INVALID_SUPPLIER_ID",
			"Invalid supplier ID",
			err.Error(),
		))
		return
	}

	if err := h.supplierService.DeleteSupplier(c.Request.Context(), id); err != nil {
		if errors.Is(err, supplierBusiness.ErrSupplierNotFound) {
			c.JSON(http.StatusNotFound, dto.CreateStandardErrorResponse(
				"SUPPLIER_NOT_FOUND",
				"Supplier not found",
				err.Error(),
			))
			return
		}
		c.JSON(http.StatusInternalServerError, dto.CreateStandardErrorResponse(
			"DELETE_FAILED",
			"Failed to delete supplier",
			err.Error(),
		))
		return
	}

	c.JSON(http.StatusOK, dto.CreateStandardSuccessResponse[interface{}](
		nil,
		"Supplier deleted successfully",
	))
}

// GetSuppliers godoc
// @Summary List suppliers
// @Description Get a paginated list of suppliers
// @Tags suppliers
// @Produce json
// @Param page query int false "Page number" default(1) minimum(1)
// @Param page_size query int false "Page size" default(20) minimum(1) maximum(100)
// @Param active query bool false "Filter by active status"
// @Success 200 {object} dto.StandardListResponse[dto.SupplierDetailResponse] "Suppliers list"
// @Failure 400 {object} dto.StandardErrorResponse "Invalid parameters"
// @Failure 500 {object} dto.StandardErrorResponse "Internal server error"
// @Router /suppliers [get]
func (h *SupplierHandler) GetSuppliers(c *gin.Context) {
	page := 1
	pageSize := 20

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 100 {
			pageSize = parsed
		}
	}

	offset := (page - 1) * pageSize
	activeFilter := c.Query("active")

	var suppliers []*models.Supplier
	var err error

	if activeFilter == "true" {
		suppliers, err = h.supplierService.GetActiveSuppliers(c.Request.Context())
	} else {
		suppliers, err = h.supplierService.ListSuppliers(c.Request.Context(), pageSize, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.CreateStandardErrorResponse(
			"RETRIEVAL_FAILED",
			"Failed to retrieve suppliers",
			err.Error(),
		))
		return
	}

	// Convert to response format
	supplierResponses := make([]dto.SupplierDetailResponse, len(suppliers))
	for i, supplier := range suppliers {
		supplierResponses[i] = dto.SupplierDetailResponse{
			ID:          supplier.ID,
			Name:        supplier.Name,
			Code:        supplier.Code,
			Email:       supplier.Email,
			Phone:       supplier.Phone,
			Address:     supplier.Address,
			ContactName: supplier.ContactName,
			Notes:       supplier.Notes,
			IsActive:    supplier.IsActive,
			CreatedAt:   supplier.CreatedAt,
			UpdatedAt:   supplier.UpdatedAt,
		}
	}

	// Get total count for pagination
	totalCount, err := h.supplierService.CountSuppliers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.CreateStandardErrorResponse(
			"COUNT_FAILED",
			"Failed to count suppliers",
			err.Error(),
		))
		return
	}

	// Create standardized pagination
	pagination := dto.CreateStandardPagination(page, pageSize, totalCount)
	
	// Create standardized list response
	response := dto.CreateStandardListResponse(
		supplierResponses,
		pagination,
		"Suppliers retrieved successfully",
	)

	c.JSON(http.StatusOK, response)
}