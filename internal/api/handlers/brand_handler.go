package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/brand"
	"inventory-api/internal/repository/models"
)

// BrandHandler handles brand-related HTTP requests
type BrandHandler struct {
	brandService brand.Service
}

// NewBrandHandler creates a new brand handler
func NewBrandHandler(brandService brand.Service) *BrandHandler {
	return &BrandHandler{
		brandService: brandService,
	}
}

// GetBrands godoc
// @Summary List brands
// @Description Get a paginated list of brands with optional filtering
// @Tags Brands
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by name or code"
// @Param is_active query bool false "Filter by active status"
// @Param country_code query string false "Filter by country code"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands [get]
func (h *BrandHandler) GetBrands(c *gin.Context) {
	var req dto.BrandListRequest
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
	var brands []*models.Brand
	var err error

	if req.Search != "" {
		brands, err = h.brandService.SearchBrands(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		brands, err = h.brandService.ListBrands(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve brands", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by active status and country code if specified
	if req.IsActive != nil || req.CountryCode != "" {
		filteredBrands := make([]*models.Brand, 0)
		for _, b := range brands {
			includeByStatus := req.IsActive == nil || b.IsActive == *req.IsActive
			includeByCountry := req.CountryCode == "" || b.CountryCode == req.CountryCode
			
			if includeByStatus && includeByCountry {
				filteredBrands = append(filteredBrands, b)
			}
		}
		brands = filteredBrands
	}

	// Convert to response DTOs
	brandResponses := dto.ToBrandResponseList(brands)

	// Get total count for pagination
	totalCount, err := h.brandService.CountBrands(c.Request.Context())
	if err != nil {
		totalCount = int64(len(brandResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(brandResponses, pagination, "Brands retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetBrand godoc
// @Summary Get brand by ID
// @Description Get a specific brand by their ID
// @Tags Brands
// @Accept json
// @Produce json
// @Param id path string true "Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/{id} [get]
func (h *BrandHandler) GetBrand(c *gin.Context) {
	idStr := c.Param("id")
	brandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	brandModel, err := h.brandService.GetBrandByID(c.Request.Context(), brandID)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	brandResponse := dto.ToBrandResponse(brandModel)
	response := dto.CreateSuccessResponse(brandResponse, "Brand retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetBrandByCode godoc
// @Summary Get brand by code
// @Description Get a specific brand by their code
// @Tags Brands
// @Accept json
// @Produce json
// @Param code path string true "Brand code" example("BOSCH")
// @Success 200 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/code/{code} [get]
func (h *BrandHandler) GetBrandByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Brand code is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	brandModel, err := h.brandService.GetBrandByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	brandResponse := dto.ToBrandResponse(brandModel)
	response := dto.CreateSuccessResponse(brandResponse, "Brand retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateBrand godoc
// @Summary Create a new brand
// @Description Create a new brand with the provided information
// @Tags Brands
// @Accept json
// @Produce json
// @Param brand body dto.CreateBrandRequest true "Brand creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands [post]
func (h *BrandHandler) CreateBrand(c *gin.Context) {
	var req dto.CreateBrandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTO to model
	brandModel := req.ToBrandModel()

	// Create brand via service
	createdBrand, err := h.brandService.CreateBrand(c.Request.Context(), brandModel)
	if err != nil {
		if errors.Is(err, brand.ErrBrandExists) || errors.Is(err, brand.ErrBrandCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Brand already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, brand.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to create brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	brandResponse := dto.ToBrandResponse(createdBrand)
	response := dto.CreateSuccessResponse(brandResponse, "Brand created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateBrand godoc
// @Summary Update a brand
// @Description Update an existing brand's information
// @Tags Brands
// @Accept json
// @Produce json
// @Param id path string true "Brand ID" format(uuid)
// @Param brand body dto.UpdateBrandRequest true "Brand update request"
// @Success 200 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/{id} [put]
func (h *BrandHandler) UpdateBrand(c *gin.Context) {
	idStr := c.Param("id")
	brandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateBrandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing brand
	existingBrand, err := h.brandService.GetBrandByID(c.Request.Context(), brandID)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to existing brand
	req.ApplyToBrandModel(existingBrand)

	// Update brand via service
	err = h.brandService.UpdateBrand(c.Request.Context(), existingBrand)
	if err != nil {
		if errors.Is(err, brand.ErrBrandExists) || errors.Is(err, brand.ErrBrandCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Brand already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, brand.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to update brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	brandResponse := dto.ToBrandResponse(existingBrand)
	response := dto.CreateSuccessResponse(brandResponse, "Brand updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteBrand godoc
// @Summary Delete a brand
// @Description Delete a brand by their ID (soft delete)
// @Tags Brands
// @Accept json
// @Produce json
// @Param id path string true "Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/{id} [delete]
func (h *BrandHandler) DeleteBrand(c *gin.Context) {
	idStr := c.Param("id")
	brandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.brandService.DeleteBrand(c.Request.Context(), brandID)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to delete brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Brand deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ActivateBrand godoc
// @Summary Activate a brand
// @Description Activate a deactivated brand
// @Tags Brands
// @Accept json
// @Produce json
// @Param id path string true "Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/{id}/activate [post]
func (h *BrandHandler) ActivateBrand(c *gin.Context) {
	idStr := c.Param("id")
	brandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.brandService.ActivateBrand(c.Request.Context(), brandID)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to activate brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated brand to return in response
	updatedBrand, err := h.brandService.GetBrandByID(c.Request.Context(), brandID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated brand", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	brandResponse := dto.ToBrandResponse(updatedBrand)
	response := dto.CreateSuccessResponse(brandResponse, "Brand activated successfully")
	c.JSON(http.StatusOK, response)
}

// DeactivateBrand godoc
// @Summary Deactivate a brand
// @Description Deactivate an active brand
// @Tags Brands
// @Accept json
// @Produce json
// @Param id path string true "Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.BrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/{id}/deactivate [post]
func (h *BrandHandler) DeactivateBrand(c *gin.Context) {
	idStr := c.Param("id")
	brandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.brandService.DeactivateBrand(c.Request.Context(), brandID)
	if err != nil {
		if errors.Is(err, brand.ErrBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to deactivate brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated brand to return in response
	updatedBrand, err := h.brandService.GetBrandByID(c.Request.Context(), brandID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated brand", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	brandResponse := dto.ToBrandResponse(updatedBrand)
	response := dto.CreateSuccessResponse(brandResponse, "Brand deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetActiveBrands godoc
// @Summary List active brands
// @Description Get all active brands
// @Tags Brands
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=[]dto.BrandResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/active [get]
func (h *BrandHandler) GetActiveBrands(c *gin.Context) {
	brands, err := h.brandService.GetActiveBrands(c.Request.Context())
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve active brands", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	brandResponses := dto.ToBrandResponseList(brands)
	response := dto.CreateSuccessResponse(brandResponses, "Active brands retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GenerateBrandCode godoc
// @Summary Generate brand code
// @Description Generate a unique brand code based on brand name
// @Tags Brands
// @Accept json
// @Produce json
// @Param name query string true "Brand name" example("Bosch")
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /brands/generate-code [get]
func (h *BrandHandler) GenerateBrandCode(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Brand name is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	code, err := h.brandService.GenerateBrandCode(c.Request.Context(), name)
	if err != nil {
		response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to generate brand code", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	response := dto.CreateSuccessResponse(code, "Brand code generated successfully")
	c.JSON(http.StatusOK, response)
}