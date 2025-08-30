package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// VehicleCompatibilityResponse represents a vehicle compatibility in API responses
type VehicleCompatibilityResponse struct {
	ID             uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440001"`
	ProductID      uuid.UUID `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	VehicleModelID uuid.UUID `json:"vehicle_model_id" example:"550e8400-e29b-41d4-a716-446655440003"`
	YearFrom       int       `json:"year_from" example:"2018"`
	YearTo         int       `json:"year_to" example:"2023"`
	Notes          string    `json:"notes,omitempty" example:"Compatible with all trim levels"`
	IsVerified     bool      `json:"is_verified" example:"true"`
	IsActive       bool      `json:"is_active" example:"true"`
	CreatedAt      time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// VehicleCompatibilityDetailResponse represents a vehicle compatibility with product and vehicle details
type VehicleCompatibilityDetailResponse struct {
	ID             uuid.UUID                `json:"id" example:"550e8400-e29b-41d4-a716-446655440001"`
	ProductID      uuid.UUID                `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	Product        *ProductResponse         `json:"product,omitempty"`
	VehicleModelID uuid.UUID                `json:"vehicle_model_id" example:"550e8400-e29b-41d4-a716-446655440003"`
	VehicleModel   *VehicleModelDetailResponse    `json:"vehicle_model,omitempty"`
	YearFrom       int                      `json:"year_from" example:"2018"`
	YearTo         int                      `json:"year_to" example:"2023"`
	Notes          string                   `json:"notes,omitempty" example:"Compatible with all trim levels"`
	IsVerified     bool                     `json:"is_verified" example:"true"`
	IsActive       bool                     `json:"is_active" example:"true"`
	CreatedAt      time.Time                `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time                `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreateVehicleCompatibilityRequest represents a request to create a new vehicle compatibility
type CreateVehicleCompatibilityRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440002"`
	VehicleModelID uuid.UUID `json:"vehicle_model_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440003"`
	YearFrom       int       `json:"year_from" binding:"omitempty,min=1900,max=2100" example:"2018"`
	YearTo         int       `json:"year_to" binding:"omitempty,min=1900,max=2100" example:"2023"`
	Notes          string    `json:"notes,omitempty" binding:"omitempty,max=500" example:"Compatible with all trim levels"`
}

// UpdateVehicleCompatibilityRequest represents a request to update an existing vehicle compatibility
type UpdateVehicleCompatibilityRequest struct {
	ProductID      uuid.UUID `json:"product_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	VehicleModelID uuid.UUID `json:"vehicle_model_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	YearFrom       int       `json:"year_from,omitempty" binding:"omitempty,min=1900,max=2100" example:"2019"`
	YearTo         int       `json:"year_to,omitempty" binding:"omitempty,min=1900,max=2100" example:"2024"`
	Notes          string    `json:"notes,omitempty" binding:"omitempty,max=500" example:"Updated compatibility notes"`
	IsVerified     *bool     `json:"is_verified,omitempty" example:"true"`
	IsActive       *bool     `json:"is_active,omitempty" example:"true"`
}

// VehicleCompatibilityListRequest represents parameters for listing vehicle compatibilities
type VehicleCompatibilityListRequest struct {
	Page           int       `form:"page" example:"1"`
	Limit          int       `form:"limit" example:"10"`
	ProductID      uuid.UUID `form:"product_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	VehicleModelID uuid.UUID `form:"vehicle_model_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	Year           int       `form:"year,omitempty" binding:"omitempty,min=1900,max=2100" example:"2020"`
	IsVerified     *bool     `form:"is_verified,omitempty" example:"true"`
	IsActive       *bool     `form:"is_active,omitempty" example:"true"`
}

// BulkVehicleCompatibilityRequest represents a request for bulk operations on vehicle compatibilities
type BulkVehicleCompatibilityRequest struct {
	IDs []uuid.UUID `json:"ids" binding:"required,min=1" example:"[\"550e8400-e29b-41d4-a716-446655440001\",\"550e8400-e29b-41d4-a716-446655440002\"]"`
}

// BulkCreateVehicleCompatibilityRequest represents a request to create multiple vehicle compatibilities
type BulkCreateVehicleCompatibilityRequest struct {
	Compatibilities []CreateVehicleCompatibilityRequest `json:"compatibilities" binding:"required,min=1"`
}

// VehicleCompatibilitySearchRequest represents parameters for advanced compatibility search
type VehicleCompatibilitySearchRequest struct {
	ProductID      uuid.UUID `form:"product_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	VehicleModelID uuid.UUID `form:"vehicle_model_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	Year           int       `form:"year,omitempty" binding:"omitempty,min=1900,max=2100" example:"2020"`
	Page           int       `form:"page" example:"1"`
	Limit          int       `form:"limit" example:"10"`
}

// VehicleCompatibilityStatsResponse represents compatibility statistics
type VehicleCompatibilityStatsResponse struct {
	Total       int64 `json:"total" example:"1500"`
	Active      int64 `json:"active" example:"1450"`
	Verified    int64 `json:"verified" example:"1200"`
	Unverified  int64 `json:"unverified" example:"250"`
}

// ToVehicleCompatibilityResponse converts a vehicle compatibility to basic response DTO
func ToVehicleCompatibilityResponse(compatibility *models.VehicleCompatibility) VehicleCompatibilityResponse {
	return VehicleCompatibilityResponse{
		ID:             compatibility.ID,
		ProductID:      compatibility.ProductID,
		VehicleModelID: compatibility.VehicleModelID,
		YearFrom:       compatibility.YearFrom,
		YearTo:         compatibility.YearTo,
		Notes:          compatibility.Notes,
		IsVerified:     compatibility.IsVerified,
		IsActive:       compatibility.IsActive,
		CreatedAt:      compatibility.CreatedAt,
		UpdatedAt:      compatibility.UpdatedAt,
	}
}

// ToVehicleCompatibilityDetailResponse converts a vehicle compatibility with relations to detailed response DTO
func ToVehicleCompatibilityDetailResponse(compatibility *models.VehicleCompatibility) VehicleCompatibilityDetailResponse {
	response := VehicleCompatibilityDetailResponse{
		ID:             compatibility.ID,
		ProductID:      compatibility.ProductID,
		VehicleModelID: compatibility.VehicleModelID,
		YearFrom:       compatibility.YearFrom,
		YearTo:         compatibility.YearTo,
		Notes:          compatibility.Notes,
		IsVerified:     compatibility.IsVerified,
		IsActive:       compatibility.IsActive,
		CreatedAt:      compatibility.CreatedAt,
		UpdatedAt:      compatibility.UpdatedAt,
	}

	// Include product if loaded (check if ID is not zero)
	if compatibility.Product.ID != uuid.Nil {
		productResponse := ToProductResponse(&compatibility.Product)
		response.Product = &productResponse
	}

	// Include vehicle model if loaded (check if ID is not zero)
	if compatibility.VehicleModel.ID != uuid.Nil {
		vehicleModelResponse := ToVehicleModelDetailResponse(&compatibility.VehicleModel)
		response.VehicleModel = &vehicleModelResponse
	}

	return response
}

// ToVehicleCompatibilityResponseList converts a list of vehicle compatibilities to basic response DTOs
func ToVehicleCompatibilityResponseList(compatibilities []*models.VehicleCompatibility) []VehicleCompatibilityResponse {
	responses := make([]VehicleCompatibilityResponse, len(compatibilities))
	for i, compatibility := range compatibilities {
		responses[i] = ToVehicleCompatibilityResponse(compatibility)
	}
	return responses
}

// ToVehicleCompatibilityDetailResponseList converts a list of vehicle compatibilities to detailed response DTOs
func ToVehicleCompatibilityDetailResponseList(compatibilities []*models.VehicleCompatibility) []VehicleCompatibilityDetailResponse {
	responses := make([]VehicleCompatibilityDetailResponse, len(compatibilities))
	for i, compatibility := range compatibilities {
		responses[i] = ToVehicleCompatibilityDetailResponse(compatibility)
	}
	return responses
}

// ToVehicleCompatibilityModel converts CreateVehicleCompatibilityRequest to vehicle compatibility model
func (req *CreateVehicleCompatibilityRequest) ToVehicleCompatibilityModel() *models.VehicleCompatibility {
	return &models.VehicleCompatibility{
		ProductID:      req.ProductID,
		VehicleModelID: req.VehicleModelID,
		YearFrom:       req.YearFrom,
		YearTo:         req.YearTo,
		Notes:          req.Notes,
		IsActive:       true,      // Default to active
		IsVerified:     false,     // Default to unverified
	}
}

// ApplyToVehicleCompatibilityModel applies UpdateVehicleCompatibilityRequest to existing vehicle compatibility
func (req *UpdateVehicleCompatibilityRequest) ApplyToVehicleCompatibilityModel(compatibility *models.VehicleCompatibility) {
	if req.ProductID != uuid.Nil {
		compatibility.ProductID = req.ProductID
	}
	if req.VehicleModelID != uuid.Nil {
		compatibility.VehicleModelID = req.VehicleModelID
	}
	if req.YearFrom != 0 {
		compatibility.YearFrom = req.YearFrom
	}
	if req.YearTo != 0 {
		compatibility.YearTo = req.YearTo
	}
	if req.Notes != "" {
		compatibility.Notes = req.Notes
	}
	if req.IsVerified != nil {
		compatibility.IsVerified = *req.IsVerified
	}
	if req.IsActive != nil {
		compatibility.IsActive = *req.IsActive
	}
}