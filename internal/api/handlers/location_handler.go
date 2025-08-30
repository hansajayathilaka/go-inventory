package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"inventory-api/internal/repository/models"
)

// LocationHandler handles location-related HTTP requests
type LocationHandler struct{}

// NewLocationHandler creates a new LocationHandler instance
func NewLocationHandler() *LocationHandler {
	return &LocationHandler{}
}

// GetLocations returns the default location for single-store setup
// @Summary Get locations
// @Description Returns the default hardware store location
// @Tags Locations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "success response with locations data"
// @Failure 500 {object} map[string]interface{} "internal server error"
// @Router /locations [get]
func (h *LocationHandler) GetLocations(c *gin.Context) {
	// For single-store setup, return the default location
	defaultLocation := models.GetDefaultLocation()
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Locations retrieved successfully",
		"data": []models.Location{*defaultLocation},
	})
}

// GetLocationByID returns the default location by ID
// @Summary Get location by ID
// @Description Returns a location by its ID
// @Tags Locations
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Location ID"
// @Success 200 {object} map[string]interface{} "success response with location data"
// @Failure 404 {object} map[string]interface{} "location not found"
// @Router /locations/{id} [get]
func (h *LocationHandler) GetLocationByID(c *gin.Context) {
	id := c.Param("id")
	defaultLocation := models.GetDefaultLocation()
	
	// For single-store, only return location if it matches the default ID
	if id == defaultLocation.ID.String() {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Location retrieved successfully",
			"data":    defaultLocation,
		})
	} else {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "location_not_found",
			"message": "Location not found",
		})
	}
}