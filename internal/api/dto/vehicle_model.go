package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// VehicleModelDetailResponse represents a vehicle model with brand details in API responses
type VehicleModelDetailResponse struct {
	ID             uuid.UUID            `json:"id" example:"550e8400-e29b-41d4-a716-446655440001"`
	Name           string               `json:"name" example:"Camry"`
	Code           string               `json:"code" example:"TOYT-CAMR01"`
	Description    string               `json:"description,omitempty" example:"Mid-size sedan"`
	VehicleBrandID uuid.UUID            `json:"vehicle_brand_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	VehicleBrand   VehicleBrandResponse `json:"vehicle_brand"`
	YearFrom       int                  `json:"year_from" example:"2020"`
	YearTo         int                  `json:"year_to,omitempty" example:"2024"`
	FuelType       string               `json:"fuel_type,omitempty" example:"PETROL"`
	Transmission   string               `json:"transmission,omitempty" example:"AUTOMATIC"`
	EngineSize     string               `json:"engine_size,omitempty" example:"2.5L"`
	IsActive       bool                 `json:"is_active" example:"true"`
	CreatedAt      time.Time            `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time            `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreateVehicleModelRequest represents a request to create a new vehicle model
type CreateVehicleModelRequest struct {
	Name           string    `json:"name" binding:"required,min=1,max=100" example:"Camry"`
	Code           string    `json:"code,omitempty" binding:"omitempty,max=50" example:"TOYT-CAMR01"`
	Description    string    `json:"description,omitempty" binding:"omitempty,max=500" example:"Mid-size sedan"`
	VehicleBrandID uuid.UUID `json:"vehicle_brand_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	YearFrom       int       `json:"year_from" binding:"required,min=1900,max=2099" example:"2020"`
	YearTo         int       `json:"year_to,omitempty" binding:"omitempty,min=1900,max=2099" example:"2024"`
	FuelType       string    `json:"fuel_type,omitempty" binding:"omitempty,max=20" example:"PETROL"`
	Transmission   string    `json:"transmission,omitempty" binding:"omitempty,max=20" example:"AUTOMATIC"`
	EngineSize     string    `json:"engine_size,omitempty" binding:"omitempty,max=20" example:"2.5L"`
}

// UpdateVehicleModelRequest represents a request to update an existing vehicle model
type UpdateVehicleModelRequest struct {
	Name           string    `json:"name,omitempty" binding:"omitempty,min=1,max=100" example:"Camry Updated"`
	Code           string    `json:"code,omitempty" binding:"omitempty,max=50" example:"TOYT-CAMR02"`
	Description    string    `json:"description,omitempty" binding:"omitempty,max=500" example:"Updated description"`
	VehicleBrandID uuid.UUID `json:"vehicle_brand_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	YearFrom       int       `json:"year_from,omitempty" binding:"omitempty,min=1900,max=2099" example:"2021"`
	YearTo         int       `json:"year_to,omitempty" binding:"omitempty,min=1900,max=2099" example:"2025"`
	FuelType       string    `json:"fuel_type,omitempty" binding:"omitempty,max=20" example:"HYBRID"`
	Transmission   string    `json:"transmission,omitempty" binding:"omitempty,max=20" example:"CVT"`
	EngineSize     string    `json:"engine_size,omitempty" binding:"omitempty,max=20" example:"2.0L"`
	IsActive       *bool     `json:"is_active,omitempty" example:"true"`
}

// VehicleModelListRequest represents parameters for listing vehicle models
type VehicleModelListRequest struct {
	Page           int       `form:"page" example:"1"`
	Limit          int       `form:"limit" example:"10"`
	Search         string    `form:"search,omitempty" example:"camry"`
	VehicleBrandID uuid.UUID `form:"vehicle_brand_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	IsActive       *bool     `form:"is_active,omitempty" example:"true"`
	YearFrom       int       `form:"year_from,omitempty" example:"2020"`
	YearTo         int       `form:"year_to,omitempty" example:"2024"`
	FuelType       string    `form:"fuel_type,omitempty" example:"PETROL"`
	Transmission   string    `form:"transmission,omitempty" example:"AUTOMATIC"`
}

// VehicleModelActivationRequest represents a request to activate/deactivate a vehicle model
type VehicleModelActivationRequest struct {
	IsActive bool `json:"is_active" binding:"required" example:"true"`
}

// ToVehicleModelDetailResponse converts a vehicle model with brand to detailed response DTO
func ToVehicleModelDetailResponse(vehicleModel *models.VehicleModel) VehicleModelDetailResponse {
	response := VehicleModelDetailResponse{
		ID:             vehicleModel.ID,
		Name:           vehicleModel.Name,
		Code:           vehicleModel.Code,
		Description:    vehicleModel.Description,
		VehicleBrandID: vehicleModel.VehicleBrandID,
		YearFrom:       vehicleModel.YearFrom,
		YearTo:         vehicleModel.YearTo,
		FuelType:       vehicleModel.FuelType,
		Transmission:   vehicleModel.Transmission,
		EngineSize:     vehicleModel.EngineSize,
		IsActive:       vehicleModel.IsActive,
		CreatedAt:      vehicleModel.CreatedAt,
		UpdatedAt:      vehicleModel.UpdatedAt,
	}

	// Include vehicle brand if loaded (check if ID is not zero)
	if vehicleModel.VehicleBrand.ID != uuid.Nil {
		response.VehicleBrand = ToVehicleBrandResponse(&vehicleModel.VehicleBrand)
	}

	return response
}

// ToVehicleModelDetailResponseList converts a list of vehicle models to detailed response DTOs
func ToVehicleModelDetailResponseList(vehicleModels []*models.VehicleModel) []VehicleModelDetailResponse {
	responses := make([]VehicleModelDetailResponse, len(vehicleModels))
	for i, vehicleModel := range vehicleModels {
		responses[i] = ToVehicleModelDetailResponse(vehicleModel)
	}
	return responses
}

// ToVehicleModelResponseList converts a list of vehicle models to basic response DTOs
func ToVehicleModelResponseList(vehicleModels []*models.VehicleModel) []VehicleModelResponse {
	responses := make([]VehicleModelResponse, len(vehicleModels))
	for i, vehicleModel := range vehicleModels {
		responses[i] = ToVehicleModelResponse(vehicleModel)
	}
	return responses
}

// ToVehicleModelModel converts CreateVehicleModelRequest to vehicle model
func (req *CreateVehicleModelRequest) ToVehicleModelModel() *models.VehicleModel {
	return &models.VehicleModel{
		Name:           req.Name,
		Code:           req.Code,
		Description:    req.Description,
		VehicleBrandID: req.VehicleBrandID,
		YearFrom:       req.YearFrom,
		YearTo:         req.YearTo,
		FuelType:       req.FuelType,
		Transmission:   req.Transmission,
		EngineSize:     req.EngineSize,
		IsActive:       true, // Default to active
	}
}

// ApplyToVehicleModelModel applies UpdateVehicleModelRequest to existing vehicle model
func (req *UpdateVehicleModelRequest) ApplyToVehicleModelModel(vehicleModel *models.VehicleModel) {
	if req.Name != "" {
		vehicleModel.Name = req.Name
	}
	if req.Code != "" {
		vehicleModel.Code = req.Code
	}
	if req.Description != "" {
		vehicleModel.Description = req.Description
	}
	if req.VehicleBrandID != uuid.Nil {
		vehicleModel.VehicleBrandID = req.VehicleBrandID
	}
	if req.YearFrom != 0 {
		vehicleModel.YearFrom = req.YearFrom
	}
	if req.YearTo != 0 {
		vehicleModel.YearTo = req.YearTo
	}
	if req.FuelType != "" {
		vehicleModel.FuelType = req.FuelType
	}
	if req.Transmission != "" {
		vehicleModel.Transmission = req.Transmission
	}
	if req.EngineSize != "" {
		vehicleModel.EngineSize = req.EngineSize
	}
	if req.IsActive != nil {
		vehicleModel.IsActive = *req.IsActive
	}
}