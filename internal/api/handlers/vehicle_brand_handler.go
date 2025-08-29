package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/vehicle"
	"inventory-api/internal/repository/models"
)

// VehicleBrandHandler handles vehicle brand-related HTTP requests
type VehicleBrandHandler struct {
	vehicleService vehicle.Service
}

// NewVehicleBrandHandler creates a new vehicle brand handler
func NewVehicleBrandHandler(vehicleService vehicle.Service) *VehicleBrandHandler {
	return &VehicleBrandHandler{
		vehicleService: vehicleService,
	}
}

// GetVehicleBrands godoc
// @Summary List vehicle brands
// @Description Get a paginated list of vehicle brands with optional filtering
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by name or code"
// @Param is_active query bool false "Filter by active status"
// @Param country_code query string false "Filter by country code"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands [get]
func (h *VehicleBrandHandler) GetVehicleBrands(c *gin.Context) {
	var req dto.VehicleBrandListRequest
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
	var vehicleBrands []*models.VehicleBrand
	var err error

	if req.Search != "" {
		vehicleBrands, err = h.vehicleService.SearchVehicleBrands(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		vehicleBrands, err = h.vehicleService.ListVehicleBrands(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brands", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by active status and country code if specified
	if req.IsActive != nil || req.CountryCode != "" {
		filteredVehicleBrands := make([]*models.VehicleBrand, 0)
		for _, vb := range vehicleBrands {
			includeByStatus := req.IsActive == nil || vb.IsActive == *req.IsActive
			includeByCountry := req.CountryCode == "" || vb.CountryCode == req.CountryCode
			
			if includeByStatus && includeByCountry {
				filteredVehicleBrands = append(filteredVehicleBrands, vb)
			}
		}
		vehicleBrands = filteredVehicleBrands
	}

	// Convert to response DTOs
	vehicleBrandResponses := dto.ToVehicleBrandResponseList(vehicleBrands)

	// Get total count for pagination
	totalCount, err := h.vehicleService.CountVehicleBrands(c.Request.Context())
	if err != nil {
		totalCount = int64(len(vehicleBrandResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(vehicleBrandResponses, pagination, "Vehicle brands retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleBrand godoc
// @Summary Get vehicle brand by ID
// @Description Get a specific vehicle brand by their ID
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id} [get]
func (h *VehicleBrandHandler) GetVehicleBrand(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleBrandModel, err := h.vehicleService.GetVehicleBrandByID(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(vehicleBrandModel)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleBrandByCode godoc
// @Summary Get vehicle brand by code
// @Description Get a specific vehicle brand by their code
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param code path string true "Vehicle Brand code" example("TOYT")
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/code/{code} [get]
func (h *VehicleBrandHandler) GetVehicleBrandByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Vehicle brand code is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleBrandModel, err := h.vehicleService.GetVehicleBrandByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(vehicleBrandModel)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleBrandWithModels godoc
// @Summary Get vehicle brand with models
// @Description Get a specific vehicle brand by their ID including all associated vehicle models
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandWithModelsResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id}/with-models [get]
func (h *VehicleBrandHandler) GetVehicleBrandWithModels(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleBrandModel, err := h.vehicleService.GetVehicleBrandWithModels(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandWithModelsResponse(vehicleBrandModel)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand with models retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateVehicleBrand godoc
// @Summary Create a new vehicle brand
// @Description Create a new vehicle brand with the provided information
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param vehicle_brand body dto.CreateVehicleBrandRequest true "Vehicle brand creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands [post]
func (h *VehicleBrandHandler) CreateVehicleBrand(c *gin.Context) {
	var req dto.CreateVehicleBrandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTO to model
	vehicleBrandModel := req.ToVehicleBrandModel()

	// Create vehicle brand via service
	createdVehicleBrand, err := h.vehicleService.CreateVehicleBrand(c.Request.Context(), vehicleBrandModel)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandExists) || errors.Is(err, vehicle.ErrVehicleBrandCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Vehicle brand already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, vehicle.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to create vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(createdVehicleBrand)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateVehicleBrand godoc
// @Summary Update a vehicle brand
// @Description Update an existing vehicle brand's information
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Param vehicle_brand body dto.UpdateVehicleBrandRequest true "Vehicle brand update request"
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id} [put]
func (h *VehicleBrandHandler) UpdateVehicleBrand(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateVehicleBrandRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing vehicle brand
	existingVehicleBrand, err := h.vehicleService.GetVehicleBrandByID(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to existing vehicle brand
	req.ApplyToVehicleBrandModel(existingVehicleBrand)

	// Update vehicle brand via service
	err = h.vehicleService.UpdateVehicleBrand(c.Request.Context(), existingVehicleBrand)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandExists) || errors.Is(err, vehicle.ErrVehicleBrandCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Vehicle brand already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, vehicle.ErrInvalidInput) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to update vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(existingVehicleBrand)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteVehicleBrand godoc
// @Summary Delete a vehicle brand
// @Description Delete a vehicle brand by their ID (soft delete)
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id} [delete]
func (h *VehicleBrandHandler) DeleteVehicleBrand(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.DeleteVehicleBrand(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to delete vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Vehicle brand deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ActivateVehicleBrand godoc
// @Summary Activate a vehicle brand
// @Description Activate a deactivated vehicle brand
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id}/activate [post]
func (h *VehicleBrandHandler) ActivateVehicleBrand(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.ActivateVehicleBrand(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to activate vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated vehicle brand to return in response
	updatedVehicleBrand, err := h.vehicleService.GetVehicleBrandByID(c.Request.Context(), vehicleBrandID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated vehicle brand", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(updatedVehicleBrand)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand activated successfully")
	c.JSON(http.StatusOK, response)
}

// DeactivateVehicleBrand godoc
// @Summary Deactivate a vehicle brand
// @Description Deactivate an active vehicle brand
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Brand ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleBrandResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/{id}/deactivate [post]
func (h *VehicleBrandHandler) DeactivateVehicleBrand(c *gin.Context) {
	idStr := c.Param("id")
	vehicleBrandID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.DeactivateVehicleBrand(c.Request.Context(), vehicleBrandID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle brand not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to deactivate vehicle brand", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated vehicle brand to return in response
	updatedVehicleBrand, err := h.vehicleService.GetVehicleBrandByID(c.Request.Context(), vehicleBrandID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated vehicle brand", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleBrandResponse := dto.ToVehicleBrandResponse(updatedVehicleBrand)
	response := dto.CreateSuccessResponse(vehicleBrandResponse, "Vehicle brand deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetActiveVehicleBrands godoc
// @Summary List active vehicle brands
// @Description Get all active vehicle brands
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=[]dto.VehicleBrandResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/active [get]
func (h *VehicleBrandHandler) GetActiveVehicleBrands(c *gin.Context) {
	vehicleBrands, err := h.vehicleService.GetActiveVehicleBrands(c.Request.Context())
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve active vehicle brands", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleBrandResponses := dto.ToVehicleBrandResponseList(vehicleBrands)
	response := dto.CreateSuccessResponse(vehicleBrandResponses, "Active vehicle brands retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// ListVehicleBrandsWithModels godoc
// @Summary List vehicle brands with models
// @Description Get a paginated list of vehicle brands including all associated vehicle models
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleBrandWithModelsResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/with-models [get]
func (h *VehicleBrandHandler) ListVehicleBrandsWithModels(c *gin.Context) {
	var req dto.VehicleBrandListRequest
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

	// Get vehicle brands with models
	vehicleBrands, err := h.vehicleService.ListVehicleBrandsWithModels(c.Request.Context(), req.Limit, offset)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle brands with models", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Convert to response DTOs
	vehicleBrandResponses := dto.ToVehicleBrandWithModelsResponseList(vehicleBrands)

	// Get total count for pagination
	totalCount, err := h.vehicleService.CountVehicleBrands(c.Request.Context())
	if err != nil {
		totalCount = int64(len(vehicleBrandResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(vehicleBrandResponses, pagination, "Vehicle brands with models retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GenerateVehicleBrandCode godoc
// @Summary Generate vehicle brand code
// @Description Generate a unique vehicle brand code based on vehicle brand name
// @Tags Vehicle Brands
// @Accept json
// @Produce json
// @Param name query string true "Vehicle Brand name" example("Toyota")
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-brands/generate-code [get]
func (h *VehicleBrandHandler) GenerateVehicleBrandCode(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Vehicle brand name is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	code, err := h.vehicleService.GenerateVehicleBrandCode(c.Request.Context(), name)
	if err != nil {
		response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to generate vehicle brand code", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	response := dto.CreateSuccessResponse(code, "Vehicle brand code generated successfully")
	c.JSON(http.StatusOK, response)
}