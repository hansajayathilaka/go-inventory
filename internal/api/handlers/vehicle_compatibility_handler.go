package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/compatibility"
	"inventory-api/internal/repository/models"
)

// VehicleCompatibilityHandler handles vehicle compatibility-related HTTP requests
type VehicleCompatibilityHandler struct {
	compatibilityService compatibility.Service
}

// NewVehicleCompatibilityHandler creates a new vehicle compatibility handler
func NewVehicleCompatibilityHandler(compatibilityService compatibility.Service) *VehicleCompatibilityHandler {
	return &VehicleCompatibilityHandler{
		compatibilityService: compatibilityService,
	}
}

// GetCompatibilities godoc
// @Summary List vehicle compatibilities
// @Description Get a paginated list of vehicle compatibilities with optional filtering
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param product_id query string false "Filter by product ID" format(uuid)
// @Param vehicle_model_id query string false "Filter by vehicle model ID" format(uuid)
// @Param year query int false "Filter by year"
// @Param is_verified query bool false "Filter by verification status"
// @Param is_active query bool false "Filter by active status"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities [get]
func (h *VehicleCompatibilityHandler) GetCompatibilities(c *gin.Context) {
	var req dto.VehicleCompatibilityListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
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

	// Use filtered search based on parameters
	var compatibilities []*models.VehicleCompatibility
	var err error

	if req.ProductID != uuid.Nil {
		compatibilities, err = h.compatibilityService.GetCompatibilitiesByProduct(c.Request.Context(), req.ProductID, req.Limit, offset)
	} else if req.VehicleModelID != uuid.Nil {
		if req.Year > 0 {
			compatibilities, err = h.compatibilityService.GetCompatibleProducts(c.Request.Context(), req.VehicleModelID, req.Year, req.Limit, offset)
		} else {
			compatibilities, err = h.compatibilityService.GetCompatibilitiesByVehicleModel(c.Request.Context(), req.VehicleModelID, req.Limit, offset)
		}
	} else {
		// Get all with relations for detailed view
		compatibilities, err = h.compatibilityService.ListCompatibilitiesWithRelations(c.Request.Context(), req.Limit, offset)
	}

	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Apply additional filters
	if req.IsVerified != nil || req.IsActive != nil {
		filteredCompatibilities := make([]*models.VehicleCompatibility, 0)
		for _, comp := range compatibilities {
			includeByVerification := req.IsVerified == nil || comp.IsVerified == *req.IsVerified
			includeByStatus := req.IsActive == nil || comp.IsActive == *req.IsActive
			
			if includeByVerification && includeByStatus {
				filteredCompatibilities = append(filteredCompatibilities, comp)
			}
		}
		compatibilities = filteredCompatibilities
	}

	// Convert to response DTOs
	compatibilityResponses := dto.ToVehicleCompatibilityDetailResponseList(compatibilities)

	// Get total count for pagination
	totalCount, err := h.compatibilityService.CountCompatibilities(c.Request.Context())
	if err != nil {
		totalCount = int64(len(compatibilityResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(compatibilityResponses, pagination, "Vehicle compatibilities retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetCompatibility godoc
// @Summary Get vehicle compatibility by ID
// @Description Get a specific vehicle compatibility by their ID
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id} [get]
func (h *VehicleCompatibilityHandler) GetCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	compatibilityModel, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(compatibilityModel)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateCompatibility godoc
// @Summary Create a new vehicle compatibility
// @Description Create a new vehicle compatibility with the provided information
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param compatibility body dto.CreateVehicleCompatibilityRequest true "Vehicle compatibility creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities [post]
func (h *VehicleCompatibilityHandler) CreateCompatibility(c *gin.Context) {
	var req dto.CreateVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTO to model
	compatibilityModel := req.ToVehicleCompatibilityModel()

	// Create compatibility via service
	createdCompatibility, err := h.compatibilityService.CreateCompatibility(c.Request.Context(), compatibilityModel)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityExists) || errors.Is(err, compatibility.ErrDuplicateCompatibility) {
			response := dto.CreateBaseResponse("CONFLICT", "Vehicle compatibility already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, compatibility.ErrInvalidInput) || 
				  errors.Is(err, compatibility.ErrProductNotFound) || 
				  errors.Is(err, compatibility.ErrVehicleModelNotFound) || 
				  errors.Is(err, compatibility.ErrInvalidYearRange) ||
				  errors.Is(err, compatibility.ErrProductInactive) ||
				  errors.Is(err, compatibility.ErrVehicleModelInactive) {
			response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to create compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get created compatibility with relations for response
	compatibilityWithRelations, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), createdCompatibility.ID)
	if err != nil {
		// Return basic response if we can't get relations
		compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(createdCompatibility)
		response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility created successfully")
		c.JSON(http.StatusCreated, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(compatibilityWithRelations)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateCompatibility godoc
// @Summary Update a vehicle compatibility
// @Description Update an existing vehicle compatibility's information
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Param compatibility body dto.UpdateVehicleCompatibilityRequest true "Vehicle compatibility update request"
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id} [put]
func (h *VehicleCompatibilityHandler) UpdateCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing compatibility
	existingCompatibility, err := h.compatibilityService.GetCompatibilityByID(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Apply updates to existing compatibility
	req.ApplyToVehicleCompatibilityModel(existingCompatibility)

	// Update compatibility via service
	err = h.compatibilityService.UpdateCompatibility(c.Request.Context(), existingCompatibility)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityExists) || errors.Is(err, compatibility.ErrDuplicateCompatibility) {
			response := dto.CreateBaseResponse("CONFLICT", "Vehicle compatibility already exists", err.Error())
			c.JSON(http.StatusConflict, response)
		} else if errors.Is(err, compatibility.ErrInvalidInput) || 
				  errors.Is(err, compatibility.ErrProductNotFound) || 
				  errors.Is(err, compatibility.ErrVehicleModelNotFound) || 
				  errors.Is(err, compatibility.ErrInvalidYearRange) ||
				  errors.Is(err, compatibility.ErrProductInactive) ||
				  errors.Is(err, compatibility.ErrVehicleModelInactive) {
			response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to update compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated compatibility with relations for response
	compatibilityWithRelations, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), existingCompatibility.ID)
	if err != nil {
		// Return basic response if we can't get relations
		compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(existingCompatibility)
		response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility updated successfully")
		c.JSON(http.StatusOK, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(compatibilityWithRelations)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteCompatibility godoc
// @Summary Delete a vehicle compatibility
// @Description Delete a vehicle compatibility by their ID (soft delete)
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id} [delete]
func (h *VehicleCompatibilityHandler) DeleteCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.compatibilityService.DeleteCompatibility(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to delete compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	response := dto.CreateSimpleSuccessResponse(nil, "Vehicle compatibility deleted successfully")
	c.JSON(http.StatusOK, response)
}

// VerifyCompatibility godoc
// @Summary Verify a vehicle compatibility
// @Description Mark a vehicle compatibility as verified
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id}/verify [post]
func (h *VehicleCompatibilityHandler) VerifyCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.compatibilityService.VerifyCompatibility(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to verify compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated compatibility with relations for response
	updatedCompatibility, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), compatibilityID)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve updated compatibility", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(updatedCompatibility)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility verified successfully")
	c.JSON(http.StatusOK, response)
}

// UnverifyCompatibility godoc
// @Summary Unverify a vehicle compatibility
// @Description Mark a vehicle compatibility as unverified
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id}/unverify [post]
func (h *VehicleCompatibilityHandler) UnverifyCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.compatibilityService.UnverifyCompatibility(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to unverify compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated compatibility with relations for response
	updatedCompatibility, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), compatibilityID)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve updated compatibility", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(updatedCompatibility)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility unverified successfully")
	c.JSON(http.StatusOK, response)
}

// ActivateCompatibility godoc
// @Summary Activate a vehicle compatibility
// @Description Activate a deactivated vehicle compatibility
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id}/activate [post]
func (h *VehicleCompatibilityHandler) ActivateCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.compatibilityService.ActivateCompatibility(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to activate compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated compatibility with relations for response
	updatedCompatibility, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), compatibilityID)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve updated compatibility", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(updatedCompatibility)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility activated successfully")
	c.JSON(http.StatusOK, response)
}

// DeactivateCompatibility godoc
// @Summary Deactivate a vehicle compatibility
// @Description Deactivate an active vehicle compatibility
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param id path string true "Vehicle Compatibility ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/{id}/deactivate [post]
func (h *VehicleCompatibilityHandler) DeactivateCompatibility(c *gin.Context) {
	idStr := c.Param("id")
	compatibilityID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid compatibility ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.compatibilityService.DeactivateCompatibility(c.Request.Context(), compatibilityID)
	if err != nil {
		if errors.Is(err, compatibility.ErrCompatibilityNotFound) {
			response := dto.CreateBaseResponse("NOT_FOUND", "Vehicle compatibility not found", err.Error())
			c.JSON(http.StatusNotFound, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to deactivate compatibility", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	// Get updated compatibility with relations for response
	updatedCompatibility, err := h.compatibilityService.GetCompatibilityWithRelations(c.Request.Context(), compatibilityID)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve updated compatibility", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponse := dto.ToVehicleCompatibilityDetailResponse(updatedCompatibility)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponse, "Vehicle compatibility deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetActiveCompatibilities godoc
// @Summary List active vehicle compatibilities
// @Description Get all active vehicle compatibilities
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=[]dto.VehicleCompatibilityResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/active [get]
func (h *VehicleCompatibilityHandler) GetActiveCompatibilities(c *gin.Context) {
	compatibilities, err := h.compatibilityService.GetActiveCompatibilities(c.Request.Context())
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve active compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponses := dto.ToVehicleCompatibilityResponseList(compatibilities)
	response := dto.CreateSimpleSuccessResponse(compatibilityResponses, "Active vehicle compatibilities retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetVerifiedCompatibilities godoc
// @Summary List verified vehicle compatibilities
// @Description Get a paginated list of verified vehicle compatibilities
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleCompatibilityResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/verified [get]
func (h *VehicleCompatibilityHandler) GetVerifiedCompatibilities(c *gin.Context) {
	var req dto.VehicleCompatibilityListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
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

	compatibilities, err := h.compatibilityService.GetVerifiedCompatibilities(c.Request.Context(), req.Limit, offset)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve verified compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponses := dto.ToVehicleCompatibilityResponseList(compatibilities)

	// Get total count for pagination
	totalCount, err := h.compatibilityService.CountVerifiedCompatibilities(c.Request.Context())
	if err != nil {
		totalCount = int64(len(compatibilityResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(compatibilityResponses, pagination, "Verified vehicle compatibilities retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetUnverifiedCompatibilities godoc
// @Summary List unverified vehicle compatibilities
// @Description Get a paginated list of unverified vehicle compatibilities
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleCompatibilityResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/unverified [get]
func (h *VehicleCompatibilityHandler) GetUnverifiedCompatibilities(c *gin.Context) {
	var req dto.VehicleCompatibilityListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
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

	compatibilities, err := h.compatibilityService.GetUnverifiedCompatibilities(c.Request.Context(), req.Limit, offset)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve unverified compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponses := dto.ToVehicleCompatibilityResponseList(compatibilities)

	// Get total count for pagination
	totalCount, err := h.compatibilityService.CountUnverifiedCompatibilities(c.Request.Context())
	if err != nil {
		totalCount = int64(len(compatibilityResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(compatibilityResponses, pagination, "Unverified vehicle compatibilities retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetCompatibleProducts godoc
// @Summary Get products compatible with a vehicle model
// @Description Get products that are compatible with a specific vehicle model and year
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param vehicle_model_id query string true "Vehicle Model ID" format(uuid)
// @Param year query int false "Vehicle year" example="2020"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/compatible-products [get]
func (h *VehicleCompatibilityHandler) GetCompatibleProducts(c *gin.Context) {
	var req dto.VehicleCompatibilitySearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if req.VehicleModelID == uuid.Nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Vehicle model ID is required", "")
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

	compatibilities, err := h.compatibilityService.GetCompatibleProducts(c.Request.Context(), req.VehicleModelID, req.Year, req.Limit, offset)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatible products", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponses := dto.ToVehicleCompatibilityDetailResponseList(compatibilities)

	// Get total count for pagination
	totalCount, err := h.compatibilityService.CountCompatibilitiesByVehicleModel(c.Request.Context(), req.VehicleModelID)
	if err != nil {
		totalCount = int64(len(compatibilityResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(compatibilityResponses, pagination, "Compatible products retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetCompatibleVehicles godoc
// @Summary Get vehicles compatible with a product
// @Description Get vehicles that are compatible with a specific product and year
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param product_id query string true "Product ID" format(uuid)
// @Param year query int false "Vehicle year" example="2020"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.VehicleCompatibilityDetailResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/compatible-vehicles [get]
func (h *VehicleCompatibilityHandler) GetCompatibleVehicles(c *gin.Context) {
	var req dto.VehicleCompatibilitySearchRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	if req.ProductID == uuid.Nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Product ID is required", "")
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

	compatibilities, err := h.compatibilityService.GetCompatibleVehicles(c.Request.Context(), req.ProductID, req.Year, req.Limit, offset)
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatible vehicles", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	compatibilityResponses := dto.ToVehicleCompatibilityDetailResponseList(compatibilities)

	// Get total count for pagination
	totalCount, err := h.compatibilityService.CountCompatibilitiesByProduct(c.Request.Context(), req.ProductID)
	if err != nil {
		totalCount = int64(len(compatibilityResponses))
	}

	// Create pagination info
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      totalCount,
		TotalPages: int((totalCount + int64(req.Limit) - 1) / int64(req.Limit)),
	}

	response := dto.CreatePaginatedResponse(compatibilityResponses, pagination, "Compatible vehicles retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// BulkCreateCompatibilities godoc
// @Summary Create multiple vehicle compatibilities
// @Description Create multiple vehicle compatibilities in a single request
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param compatibilities body dto.BulkCreateVehicleCompatibilityRequest true "Bulk compatibility creation request"
// @Success 201 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/bulk [post]
func (h *VehicleCompatibilityHandler) BulkCreateCompatibilities(c *gin.Context) {
	var req dto.BulkCreateVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Convert DTOs to models
	compatibilities := make([]*models.VehicleCompatibility, len(req.Compatibilities))
	for i, compatibilityReq := range req.Compatibilities {
		compatibilities[i] = compatibilityReq.ToVehicleCompatibilityModel()
	}

	// Create compatibilities via service
	err := h.compatibilityService.BulkCreateCompatibilities(c.Request.Context(), compatibilities)
	if err != nil {
		if errors.Is(err, compatibility.ErrInvalidInput) {
			response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid input data", err.Error())
			c.JSON(http.StatusBadRequest, response)
		} else {
			response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to create compatibilities", err.Error())
			c.JSON(http.StatusInternalServerError, response)
		}
		return
	}

	message := fmt.Sprintf("Successfully created %d vehicle compatibilities", len(compatibilities))
	response := dto.CreateSimpleSuccessResponse(message, "Vehicle compatibilities created successfully")
	c.JSON(http.StatusCreated, response)
}

// BulkVerifyCompatibilities godoc
// @Summary Verify multiple vehicle compatibilities
// @Description Verify multiple vehicle compatibilities in a single request
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param ids body dto.BulkVehicleCompatibilityRequest true "Bulk verification request"
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/bulk/verify [post]
func (h *VehicleCompatibilityHandler) BulkVerifyCompatibilities(c *gin.Context) {
	var req dto.BulkVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err := h.compatibilityService.BulkVerifyCompatibilities(c.Request.Context(), req.IDs)
	if err != nil {
		response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to verify compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	message := fmt.Sprintf("Successfully verified %d vehicle compatibilities", len(req.IDs))
	response := dto.CreateSimpleSuccessResponse(message, "Vehicle compatibilities verified successfully")
	c.JSON(http.StatusOK, response)
}

// BulkUnverifyCompatibilities godoc
// @Summary Unverify multiple vehicle compatibilities
// @Description Unverify multiple vehicle compatibilities in a single request
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param ids body dto.BulkVehicleCompatibilityRequest true "Bulk unverification request"
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/bulk/unverify [post]
func (h *VehicleCompatibilityHandler) BulkUnverifyCompatibilities(c *gin.Context) {
	var req dto.BulkVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err := h.compatibilityService.BulkUnverifyCompatibilities(c.Request.Context(), req.IDs)
	if err != nil {
		response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to unverify compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	message := fmt.Sprintf("Successfully unverified %d vehicle compatibilities", len(req.IDs))
	response := dto.CreateSimpleSuccessResponse(message, "Vehicle compatibilities unverified successfully")
	c.JSON(http.StatusOK, response)
}

// BulkActivateCompatibilities godoc
// @Summary Activate multiple vehicle compatibilities
// @Description Activate multiple vehicle compatibilities in a single request
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param ids body dto.BulkVehicleCompatibilityRequest true "Bulk activation request"
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/bulk/activate [post]
func (h *VehicleCompatibilityHandler) BulkActivateCompatibilities(c *gin.Context) {
	var req dto.BulkVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err := h.compatibilityService.BulkActivateCompatibilities(c.Request.Context(), req.IDs)
	if err != nil {
		response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to activate compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	message := fmt.Sprintf("Successfully activated %d vehicle compatibilities", len(req.IDs))
	response := dto.CreateSimpleSuccessResponse(message, "Vehicle compatibilities activated successfully")
	c.JSON(http.StatusOK, response)
}

// BulkDeactivateCompatibilities godoc
// @Summary Deactivate multiple vehicle compatibilities
// @Description Deactivate multiple vehicle compatibilities in a single request
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Param ids body dto.BulkVehicleCompatibilityRequest true "Bulk deactivation request"
// @Success 200 {object} dto.BaseResponse{data=string}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/bulk/deactivate [post]
func (h *VehicleCompatibilityHandler) BulkDeactivateCompatibilities(c *gin.Context) {
	var req dto.BulkVehicleCompatibilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateBaseResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err := h.compatibilityService.BulkDeactivateCompatibilities(c.Request.Context(), req.IDs)
	if err != nil {
		response := dto.CreateBaseResponse("INTERNAL_ERROR", "Failed to deactivate compatibilities", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	message := fmt.Sprintf("Successfully deactivated %d vehicle compatibilities", len(req.IDs))
	response := dto.CreateSimpleSuccessResponse(message, "Vehicle compatibilities deactivated successfully")
	c.JSON(http.StatusOK, response)
}

// GetCompatibilityStats godoc
// @Summary Get vehicle compatibility statistics
// @Description Get comprehensive statistics about vehicle compatibilities
// @Tags Vehicle Compatibility
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse{data=dto.VehicleCompatibilityStatsResponse}
// @Failure 500 {object} dto.BaseResponse
// @Router /vehicle-compatibilities/stats [get]
func (h *VehicleCompatibilityHandler) GetCompatibilityStats(c *gin.Context) {
	total, err := h.compatibilityService.CountCompatibilities(c.Request.Context())
	if err != nil {
		response := dto.CreateBaseResponse("DATABASE_ERROR", "Failed to retrieve compatibility statistics", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	active, err := h.compatibilityService.CountActiveCompatibilities(c.Request.Context())
	if err != nil {
		active = 0
	}

	verified, err := h.compatibilityService.CountVerifiedCompatibilities(c.Request.Context())
	if err != nil {
		verified = 0
	}

	unverified, err := h.compatibilityService.CountUnverifiedCompatibilities(c.Request.Context())
	if err != nil {
		unverified = 0
	}

	stats := dto.VehicleCompatibilityStatsResponse{
		Total:      total,
		Active:     active,
		Verified:   verified,
		Unverified: unverified,
	}

	response := dto.CreateSimpleSuccessResponse(stats, "Compatibility statistics retrieved successfully")
	c.JSON(http.StatusOK, response)
}