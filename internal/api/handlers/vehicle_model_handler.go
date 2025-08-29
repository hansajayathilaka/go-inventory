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

// VehicleModelHandler handles vehicle model-related HTTP requests
type VehicleModelHandler struct {
	vehicleService vehicle.Service
}

// NewVehicleModelHandler creates a new vehicle model handler
func NewVehicleModelHandler(vehicleService vehicle.Service) *VehicleModelHandler {
	return &VehicleModelHandler{
		vehicleService: vehicleService,
	}
}

// GetVehicleModels godoc
// @Summary List vehicle models
// @Description Get a paginated list of vehicle models with optional filtering
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search by name or code"
// @Param vehicle_brand_id query string false "Filter by vehicle brand ID" format(uuid)
// @Param is_active query bool false "Filter by active status"
// @Param year_from query int false "Filter by year from"
// @Param year_to query int false "Filter by year to"
// @Param fuel_type query string false "Filter by fuel type"
// @Param transmission query string false "Filter by transmission"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models [get]
func (h *VehicleModelHandler) GetVehicleModels(c *gin.Context) {
	var req dto.VehicleModelListRequest
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
	var vehicleModels []*models.VehicleModel
	var err error

	if req.Search != "" {
		vehicleModels, err = h.vehicleService.SearchVehicleModels(c.Request.Context(), req.Search, req.Limit, offset)
	} else {
		vehicleModels, err = h.vehicleService.ListVehicleModels(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle models", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Filter by various criteria if specified
	if req.VehicleBrandID != uuid.Nil || req.IsActive != nil || req.YearFrom != 0 || req.YearTo != 0 || req.FuelType != "" || req.Transmission != "" {
		filteredVehicleModels := make([]*models.VehicleModel, 0)
		for _, vm := range vehicleModels {
			includeByBrand := req.VehicleBrandID == uuid.Nil || vm.VehicleBrandID == req.VehicleBrandID
			includeByStatus := req.IsActive == nil || vm.IsActive == *req.IsActive
			includeByYearFrom := req.YearFrom == 0 || vm.YearFrom >= req.YearFrom
			includeByYearTo := req.YearTo == 0 || (vm.YearTo > 0 && vm.YearTo <= req.YearTo)
			includeByFuelType := req.FuelType == "" || vm.FuelType == req.FuelType
			includeByTransmission := req.Transmission == "" || vm.Transmission == req.Transmission
			
			if includeByBrand && includeByStatus && includeByYearFrom && includeByYearTo && includeByFuelType && includeByTransmission {
				filteredVehicleModels = append(filteredVehicleModels, vm)
			}
		}
		vehicleModels = filteredVehicleModels
	}

	// Convert to response DTOs
	vehicleModelResponses := dto.ToVehicleModelDetailResponseList(vehicleModels)

	// Get total count for pagination
	totalCount, err := h.vehicleService.CountVehicleModels(c.Request.Context())
	if err != nil {
		totalCount = int64(len(vehicleModelResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(vehicleModelResponses, pagination, "Vehicle models retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleModel godoc
// @Summary Get vehicle model by ID
// @Description Get a specific vehicle model by their ID
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Model ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/{id} [get]
func (h *VehicleModelHandler) GetVehicleModel(c *gin.Context) {
	idStr := c.Param("id")
	vehicleModelID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle model ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleModelModel, err := h.vehicleService.GetVehicleModelByID(c.Request.Context(), vehicleModelID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(vehicleModelModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleModelByCode godoc
// @Summary Get vehicle model by code
// @Description Get a specific vehicle model by their code
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param code path string true "Vehicle Model code" example("TOYT-CAMR01")
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/code/{code} [get]
func (h *VehicleModelHandler) GetVehicleModelByCode(c *gin.Context) {
	code := c.Param("code")
	if code == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Vehicle model code is required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleModelModel, err := h.vehicleService.GetVehicleModelByCode(c.Request.Context(), code)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(vehicleModelModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVehicleModelsByBrand godoc
// @Summary Get vehicle models by brand ID
// @Description Get all vehicle models for a specific vehicle brand
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param brand_id path string true "Vehicle Brand ID" format(uuid)
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleModelResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/brand/{brand_id} [get]
func (h *VehicleModelHandler) GetVehicleModelsByBrand(c *gin.Context) {
	brandIDStr := c.Param("brand_id")
	vehicleBrandID, err := uuid.Parse(brandIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.VehicleModelListRequest
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

	vehicleModels, err := h.vehicleService.GetVehicleModelsByBrand(c.Request.Context(), vehicleBrandID, req.Limit, offset)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle models", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Convert to basic response DTOs (no need for full detail in list)
	vehicleModelResponses := dto.ToVehicleModelResponseList(vehicleModels)

	// Get total count for pagination
	totalCount, err := h.vehicleService.CountVehicleModelsByBrand(c.Request.Context(), vehicleBrandID)
	if err != nil {
		totalCount = int64(len(vehicleModelResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(vehicleModelResponses, pagination, "Vehicle models retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateVehicleModel godoc
// @Summary Create a new vehicle model
// @Description Create a new vehicle model with the provided information
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param vehicle_model body dto.CreateVehicleModelRequest true "Vehicle model creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models [post]
func (h *VehicleModelHandler) CreateVehicleModel(c *gin.Context) {
	var req dto.CreateVehicleModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTO to model
	vehicleModelModel := req.ToVehicleModelModel()

	// Create vehicle model via service
	createdVehicleModel, err := h.vehicleService.CreateVehicleModel(c.Request.Context(), vehicleModelModel)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelExists) || errors.Is(err, vehicle.ErrVehicleModelCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Vehicle model already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, vehicle.ErrInvalidInput) || errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to create vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(createdVehicleModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateVehicleModel godoc
// @Summary Update a vehicle model
// @Description Update an existing vehicle model's information
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Model ID" format(uuid)
// @Param vehicle_model body dto.UpdateVehicleModelRequest true "Vehicle model update request"
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/{id} [put]
func (h *VehicleModelHandler) UpdateVehicleModel(c *gin.Context) {
	idStr := c.Param("id")
	vehicleModelID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle model ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateVehicleModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing vehicle model
	existingVehicleModel, err := h.vehicleService.GetVehicleModelByID(c.Request.Context(), vehicleModelID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to existing vehicle model
	req.ApplyToVehicleModelModel(existingVehicleModel)

	// Update vehicle model via service
	err = h.vehicleService.UpdateVehicleModel(c.Request.Context(), existingVehicleModel)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelExists) || errors.Is(err, vehicle.ErrVehicleModelCodeExists) {
			response := dto.CreateErrorResponse("CONFLICT", "Vehicle model already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, vehicle.ErrInvalidInput) || errors.Is(err, vehicle.ErrVehicleBrandNotFound) {
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to update vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(existingVehicleModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteVehicleModel godoc
// @Summary Delete a vehicle model
// @Description Delete a vehicle model by their ID (soft delete)
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Model ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/{id} [delete]
func (h *VehicleModelHandler) DeleteVehicleModel(c *gin.Context) {
	idStr := c.Param("id")
	vehicleModelID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle model ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.DeleteVehicleModel(c.Request.Context(), vehicleModelID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to delete vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSuccessResponse(nil, "Vehicle model deleted successfully")
	c.JSON(http.StatusOK, response)
}

// ActivateVehicleModel godoc
// @Summary Activate a vehicle model
// @Description Activate a deactivated vehicle model
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Model ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/{id}/activate [post]
func (h *VehicleModelHandler) ActivateVehicleModel(c *gin.Context) {
	idStr := c.Param("id")
	vehicleModelID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle model ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.ActivateVehicleModel(c.Request.Context(), vehicleModelID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to activate vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated vehicle model to return in response
	updatedVehicleModel, err := h.vehicleService.GetVehicleModelByID(c.Request.Context(), vehicleModelID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated vehicle model", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(updatedVehicleModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model activated successfully")
	c.JSON(http.StatusOK, response)
}

// DeactivateVehicleModel godoc
// @Summary Deactivate a vehicle model
// @Description Deactivate an active vehicle model
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Model ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleModelDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/{id}/deactivate [post]
func (h *VehicleModelHandler) DeactivateVehicleModel(c *gin.Context) {
	idStr := c.Param("id")
	vehicleModelID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle model ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.vehicleService.DeactivateVehicleModel(c.Request.Context(), vehicleModelID)
	if err != nil {
		if errors.Is(err, vehicle.ErrVehicleModelNotFound) {
			response := dto.CreateErrorResponse("NOT_FOUND", "Vehicle model not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to deactivate vehicle model", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated vehicle model to return in response
	updatedVehicleModel, err := h.vehicleService.GetVehicleModelByID(c.Request.Context(), vehicleModelID)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve updated vehicle model", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleModelResponse := dto.ToVehicleModelDetailResponse(updatedVehicleModel)
	response := dto.CreateSuccessResponse(vehicleModelResponse, "Vehicle model deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetActiveVehicleModels godoc
// @Summary List active vehicle models
// @Description Get all active vehicle models
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=[]dto.VehicleModelResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/active [get]
func (h *VehicleModelHandler) GetActiveVehicleModels(c *gin.Context) {
	vehicleModels, err := h.vehicleService.GetActiveVehicleModels(c.Request.Context())
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve active vehicle models", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	vehicleModelResponses := dto.ToVehicleModelResponseList(vehicleModels)
	response := dto.CreateSuccessResponse(vehicleModelResponses, "Active vehicle models retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GenerateVehicleModelCode godoc
// @Summary Generate vehicle model code
// @Description Generate a unique vehicle model code based on vehicle brand and model name
// @Tags Vehicle Models
// @Accept json
// @Produce json
// @Param vehicle_brand_id query string true "Vehicle Brand ID" format(uuid)
// @Param name query string true "Vehicle Model name" example("Camry")
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-models/generate-code [get]
func (h *VehicleModelHandler) GenerateVehicleModelCode(c *gin.Context) {
	vehicleBrandIDStr := c.Query("vehicle_brand_id")
	name := c.Query("name")

	if vehicleBrandIDStr == "" || name == "" {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Vehicle brand ID and model name are required", "")
		c.JSON(http.StatusBadRequest, response)
		return
	}

	vehicleBrandID, err := uuid.Parse(vehicleBrandIDStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid vehicle brand ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get the vehicle brand to get the brand code
	vehicleBrand, err := h.vehicleService.GetVehicleBrandByID(c.Request.Context(), vehicleBrandID)
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

	code, err := h.vehicleService.GenerateVehicleModelCode(c.Request.Context(), vehicleBrand.Code, name)
	if err != nil {
		response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to generate vehicle model code", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	response := dto.CreateSuccessResponse(code, "Vehicle model code generated successfully")
	c.JSON(http.StatusOK, response)
}