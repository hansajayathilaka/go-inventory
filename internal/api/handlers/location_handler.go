package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"inventory-api/internal/api/dto"
	locationBusiness "inventory-api/internal/business/location"
	"inventory-api/internal/repository/models"
)

type LocationHandler struct {
	locationService locationBusiness.Service
}

func NewLocationHandler(locationService locationBusiness.Service) *LocationHandler {
	return &LocationHandler{
		locationService: locationService,
	}
}

// CreateLocation godoc
// @Summary Create a new location
// @Description Create a new location in the system
// @Tags locations
// @Accept json
// @Produce json
// @Param location body dto.LocationCreateRequest true "Location creation data"
// @Success 201 {object} dto.ApiResponse{data=dto.LocationDetailResponse} "Location created successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid request"
// @Failure 409 {object} dto.ErrorResponse "Location already exists"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations [post]
func (h *LocationHandler) CreateLocation(c *gin.Context) {
	var req dto.LocationCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Convert request to model
	location := &models.Location{
		Name:        req.Name,
		Code:        req.Code,
		Type:        models.LocationType(req.Type),
		Address:     req.Address,
		Description: req.Description,
		IsActive:    req.IsActive,
	}

	if err := h.locationService.CreateLocation(c.Request.Context(), location); err != nil {
		if errors.Is(err, locationBusiness.ErrCodeExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "Location code already exists",
				Message: err.Error(),
			})
			return
		}
		if errors.Is(err, locationBusiness.ErrInvalidLocation) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid location data",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to create location",
		})
		return
	}

	response := dto.LocationDetailResponse{
		ID:          location.ID,
		Name:        location.Name,
		Code:        location.Code,
		Type:        string(location.Type),
		Address:     location.Address,
		Description: location.Description,
		IsActive:    location.IsActive,
		CreatedAt:   location.CreatedAt,
		UpdatedAt:   location.UpdatedAt,
	}

	c.JSON(http.StatusCreated, dto.ApiResponse{
		Success: true,
		Message: "Location created successfully",
		Data:    response,
	})
}

// GetLocation godoc
// @Summary Get a location by ID
// @Description Get detailed information about a specific location
// @Tags locations
// @Produce json
// @Param id path string true "Location ID (UUID)"
// @Success 200 {object} dto.ApiResponse{data=dto.LocationDetailResponse} "Location retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid location ID"
// @Failure 404 {object} dto.ErrorResponse "Location not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations/{id} [get]
func (h *LocationHandler) GetLocation(c *gin.Context) {
	idStr := c.Param("id")
	locationID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid location ID",
			Message: "Location ID must be a valid UUID",
		})
		return
	}

	location, err := h.locationService.GetLocation(c.Request.Context(), locationID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Location not found",
			Message: "Location with the specified ID does not exist",
		})
		return
	}

	response := dto.LocationDetailResponse{
		ID:          location.ID,
		Name:        location.Name,
		Code:        location.Code,
		Type:        string(location.Type),
		Address:     location.Address,
		Description: location.Description,
		IsActive:    location.IsActive,
		CreatedAt:   location.CreatedAt,
		UpdatedAt:   location.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Location retrieved successfully",
		Data:    response,
	})
}

// UpdateLocation godoc
// @Summary Update a location
// @Description Update an existing location's information
// @Tags locations
// @Accept json
// @Produce json
// @Param id path string true "Location ID (UUID)"
// @Param location body dto.LocationUpdateRequest true "Location update data"
// @Success 200 {object} dto.ApiResponse{data=dto.LocationDetailResponse} "Location updated successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid request"
// @Failure 404 {object} dto.ErrorResponse "Location not found"
// @Failure 409 {object} dto.ErrorResponse "Location code already exists"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations/{id} [put]
func (h *LocationHandler) UpdateLocation(c *gin.Context) {
	idStr := c.Param("id")
	locationID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid location ID",
			Message: "Location ID must be a valid UUID",
		})
		return
	}

	var req dto.LocationUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Get existing location
	existingLocation, err := h.locationService.GetLocation(c.Request.Context(), locationID)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Error:   "Location not found",
			Message: "Location with the specified ID does not exist",
		})
		return
	}

	// Update fields
	existingLocation.Name = req.Name
	existingLocation.Code = req.Code
	existingLocation.Type = models.LocationType(req.Type)
	existingLocation.Address = req.Address
	existingLocation.Description = req.Description
	existingLocation.IsActive = req.IsActive

	if err := h.locationService.UpdateLocation(c.Request.Context(), existingLocation); err != nil {
		if errors.Is(err, locationBusiness.ErrCodeExists) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Error:   "Location code already exists",
				Message: err.Error(),
			})
			return
		}
		if errors.Is(err, locationBusiness.ErrInvalidLocation) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Error:   "Invalid location data",
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to update location",
		})
		return
	}

	response := dto.LocationDetailResponse{
		ID:          existingLocation.ID,
		Name:        existingLocation.Name,
		Code:        existingLocation.Code,
		Type:        string(existingLocation.Type),
		Address:     existingLocation.Address,
		Description: existingLocation.Description,
		IsActive:    existingLocation.IsActive,
		CreatedAt:   existingLocation.CreatedAt,
		UpdatedAt:   existingLocation.UpdatedAt,
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Location updated successfully",
		Data:    response,
	})
}

// DeleteLocation godoc
// @Summary Delete a location
// @Description Delete an existing location from the system
// @Tags locations
// @Produce json
// @Param id path string true "Location ID (UUID)"
// @Success 200 {object} dto.ApiResponse "Location deleted successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid location ID"
// @Failure 404 {object} dto.ErrorResponse "Location not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations/{id} [delete]
func (h *LocationHandler) DeleteLocation(c *gin.Context) {
	idStr := c.Param("id")
	locationID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid location ID",
			Message: "Location ID must be a valid UUID",
		})
		return
	}

	if err := h.locationService.DeleteLocation(c.Request.Context(), locationID); err != nil {
		if errors.Is(err, locationBusiness.ErrLocationNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Location not found",
				Message: "Location with the specified ID does not exist",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to delete location",
		})
		return
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Location deleted successfully",
	})
}

// ListLocations godoc
// @Summary List all locations
// @Description Get a paginated list of all locations
// @Tags locations
// @Produce json
// @Param page query int false "Page number (default: 1)" default(1)
// @Param limit query int false "Items per page (default: 50, max: 100)" default(50)
// @Param type query string false "Filter by location type" Enums(warehouse,store,online)
// @Param active query bool false "Filter by active status"
// @Success 200 {object} dto.ApiResponse{data=dto.LocationListResponse} "Locations retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid query parameters"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations [get]
func (h *LocationHandler) ListLocations(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	locationTypeStr := c.Query("type")
	activeStr := c.Query("active")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	offset := (page - 1) * limit

	var locations []*models.Location
	var err error

	// Filter by type if specified
	if locationTypeStr != "" {
		locationType := models.LocationType(locationTypeStr)
		locations, err = h.locationService.GetLocationsByType(c.Request.Context(), locationType)
	} else if activeStr == "true" {
		locations, err = h.locationService.GetActiveLocations(c.Request.Context())
	} else {
		locations, err = h.locationService.ListLocations(c.Request.Context(), limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve locations",
		})
		return
	}

	// Convert to response DTOs
	locationResponses := make([]dto.LocationDetailResponse, len(locations))
	for i, location := range locations {
		locationResponses[i] = dto.LocationDetailResponse{
			ID:          location.ID,
			Name:        location.Name,
			Code:        location.Code,
			Type:        string(location.Type),
			Address:     location.Address,
			Description: location.Description,
			IsActive:    location.IsActive,
			CreatedAt:   location.CreatedAt,
			UpdatedAt:   location.UpdatedAt,
		}
	}

	// Get total count
	totalCount, err := h.locationService.CountLocations(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to count locations",
		})
		return
	}


	response := dto.LocationListResponse{
		Locations: locationResponses,
		Pagination: dto.PaginationResponse{
			Page:     page,
			PageSize: limit,
			Total:    int(totalCount),
		},
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Locations retrieved successfully",
		Data:    response,
	})
}

// GetLocationInventory godoc
// @Summary Get inventory for a location
// @Description Get all inventory records for a specific location
// @Tags locations
// @Produce json
// @Param id path string true "Location ID (UUID)"
// @Success 200 {object} dto.ApiResponse{data=[]dto.InventoryResponse} "Location inventory retrieved successfully"
// @Failure 400 {object} dto.ErrorResponse "Invalid location ID"
// @Failure 404 {object} dto.ErrorResponse "Location not found"
// @Failure 500 {object} dto.ErrorResponse "Internal server error"
// @Router /api/v1/locations/{id}/inventory [get]
func (h *LocationHandler) GetLocationInventory(c *gin.Context) {
	idStr := c.Param("id")
	locationID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "Invalid location ID",
			Message: "Location ID must be a valid UUID",
		})
		return
	}

	inventory, err := h.locationService.GetLocationInventory(c.Request.Context(), locationID)
	if err != nil {
		if errors.Is(err, locationBusiness.ErrLocationNotFound) {
			c.JSON(http.StatusNotFound, dto.ErrorResponse{
				Error:   "Location not found",
				Message: "Location with the specified ID does not exist",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "Internal server error",
			Message: "Failed to retrieve location inventory",
		})
		return
	}

	// Convert to response DTOs
	inventoryResponses := make([]dto.InventoryResponse, len(inventory))
	for i, inv := range inventory {
		inventoryResponses[i] = dto.InventoryResponse{
			ID:               inv.ID,
			ProductID:        inv.ProductID,
			LocationID:       inv.LocationID,
			Quantity:         inv.Quantity,
			ReservedQuantity: inv.ReservedQuantity,
			ReorderLevel:     inv.ReorderLevel,
			LastUpdated:      inv.LastUpdated,
		}
	}

	c.JSON(http.StatusOK, dto.ApiResponse{
		Success: true,
		Message: "Location inventory retrieved successfully",
		Data:    inventoryResponses,
	})
}