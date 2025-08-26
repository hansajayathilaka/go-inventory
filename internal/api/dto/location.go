package dto

import (
	"time"

	"github.com/google/uuid"
)

// LocationDetailResponse represents detailed location information in API responses
// @Description Detailed location information returned by the API
type LocationDetailResponse struct {
	ID          uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"Main Warehouse"`
	Code        string    `json:"code" example:"WH001"`
	Type        string    `json:"type" example:"warehouse"`
	Address     string    `json:"address" example:"123 Storage St, Industrial District, City 12345"`
	Description string    `json:"description" example:"Primary storage facility"`
	IsActive    bool      `json:"is_active" example:"true"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-02T12:00:00Z"`
} // @name LocationDetailResponse

// LocationCreateRequest represents the request body for creating a location
// @Description Request body for creating a new location
type LocationCreateRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"Main Warehouse"`
	Code        string `json:"code" binding:"required,min=1,max=20" example:"WH001"`
	Type        string `json:"type" binding:"required,oneof=warehouse store online" example:"warehouse"`
	Address     string `json:"address" binding:"omitempty,max=500" example:"123 Storage St, Industrial District, City 12345"`
	Description string `json:"description" binding:"omitempty,max=500" example:"Primary storage facility"`
	IsActive    bool   `json:"is_active" example:"true"`
} // @name LocationCreateRequest

// LocationUpdateRequest represents the request body for updating a location
// @Description Request body for updating an existing location
type LocationUpdateRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"Main Warehouse"`
	Code        string `json:"code" binding:"required,min=1,max=20" example:"WH001"`
	Type        string `json:"type" binding:"required,oneof=warehouse store online" example:"warehouse"`
	Address     string `json:"address" binding:"omitempty,max=500" example:"123 Storage St, Industrial District, City 12345"`
	Description string `json:"description" binding:"omitempty,max=500" example:"Primary storage facility"`
	IsActive    bool   `json:"is_active" example:"true"`
} // @name LocationUpdateRequest

// LocationListResponse represents a paginated list of locations
// @Description Paginated list of locations with metadata
type LocationListResponse struct {
	Locations  []LocationDetailResponse `json:"locations"`
	Pagination PaginationResponse       `json:"pagination"`
} // @name LocationListResponse