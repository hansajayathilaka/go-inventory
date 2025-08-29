package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// VehicleBrandResponse represents a vehicle brand in API responses
type VehicleBrandResponse struct {
	ID          uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"Toyota"`
	Code        string    `json:"code" example:"TOYT"`
	Description string    `json:"description,omitempty" example:"Japanese automotive manufacturer"`
	CountryCode string    `json:"country_code,omitempty" example:"JP"`
	LogoURL     string    `json:"logo_url,omitempty" example:"https://example.com/logos/toyota.png"`
	IsActive    bool      `json:"is_active" example:"true"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// VehicleBrandWithModelsResponse represents a vehicle brand with its models in API responses
type VehicleBrandWithModelsResponse struct {
	ID            uuid.UUID            `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name          string               `json:"name" example:"Toyota"`
	Code          string               `json:"code" example:"TOYT"`
	Description   string               `json:"description,omitempty" example:"Japanese automotive manufacturer"`
	CountryCode   string               `json:"country_code,omitempty" example:"JP"`
	LogoURL       string               `json:"logo_url,omitempty" example:"https://example.com/logos/toyota.png"`
	IsActive      bool                 `json:"is_active" example:"true"`
	CreatedAt     time.Time            `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt     time.Time            `json:"updated_at" example:"2023-01-01T12:00:00Z"`
	VehicleModels []VehicleModelResponse `json:"vehicle_models,omitempty"`
}

// CreateVehicleBrandRequest represents a request to create a new vehicle brand
type CreateVehicleBrandRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"Toyota"`
	Code        string `json:"code,omitempty" binding:"omitempty,max=20" example:"TOYT"`
	Description string `json:"description,omitempty" binding:"omitempty,max=500" example:"Japanese automotive manufacturer"`
	CountryCode string `json:"country_code,omitempty" binding:"omitempty,max=10" example:"JP"`
	LogoURL     string `json:"logo_url,omitempty" binding:"omitempty,url,max=500" example:"https://example.com/logos/toyota.png"`
}

// UpdateVehicleBrandRequest represents a request to update an existing vehicle brand
type UpdateVehicleBrandRequest struct {
	Name        string `json:"name,omitempty" binding:"omitempty,min=1,max=100" example:"Toyota Updated"`
	Code        string `json:"code,omitempty" binding:"omitempty,max=20" example:"TOYT2"`
	Description string `json:"description,omitempty" binding:"omitempty,max=500" example:"Updated description"`
	CountryCode string `json:"country_code,omitempty" binding:"omitempty,max=10" example:"JP"`
	LogoURL     string `json:"logo_url,omitempty" binding:"omitempty,url,max=500" example:"https://example.com/logos/toyota-new.png"`
	IsActive    *bool  `json:"is_active,omitempty" example:"true"`
}

// VehicleBrandListRequest represents parameters for listing vehicle brands
type VehicleBrandListRequest struct {
	Page        int    `form:"page" example:"1"`
	Limit       int    `form:"limit" example:"10"`
	Search      string `form:"search,omitempty" example:"toyota"`
	IsActive    *bool  `form:"is_active,omitempty" example:"true"`
	CountryCode string `form:"country_code,omitempty" example:"JP"`
}

// VehicleBrandActivationRequest represents a request to activate/deactivate a vehicle brand
type VehicleBrandActivationRequest struct {
	IsActive bool `json:"is_active" binding:"required" example:"true"`
}

// VehicleModelResponse represents a vehicle model in API responses (for nested display)
type VehicleModelResponse struct {
	ID             uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440001"`
	Name           string    `json:"name" example:"Camry"`
	Code           string    `json:"code" example:"TOYT-CAMR01"`
	Description    string    `json:"description,omitempty" example:"Mid-size sedan"`
	VehicleBrandID uuid.UUID `json:"vehicle_brand_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	YearFrom       int       `json:"year_from" example:"2020"`
	YearTo         int       `json:"year_to,omitempty" example:"2024"`
	FuelType       string    `json:"fuel_type,omitempty" example:"PETROL"`
	Transmission   string    `json:"transmission,omitempty" example:"AUTOMATIC"`
	EngineSize     string    `json:"engine_size,omitempty" example:"2.5L"`
	IsActive       bool      `json:"is_active" example:"true"`
	CreatedAt      time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// ToVehicleBrandResponse converts a vehicle brand model to a vehicle brand response DTO
func ToVehicleBrandResponse(vehicleBrand *models.VehicleBrand) VehicleBrandResponse {
	return VehicleBrandResponse{
		ID:          vehicleBrand.ID,
		Name:        vehicleBrand.Name,
		Code:        vehicleBrand.Code,
		Description: vehicleBrand.Description,
		CountryCode: vehicleBrand.CountryCode,
		LogoURL:     vehicleBrand.LogoURL,
		IsActive:    vehicleBrand.IsActive,
		CreatedAt:   vehicleBrand.CreatedAt,
		UpdatedAt:   vehicleBrand.UpdatedAt,
	}
}

// ToVehicleBrandWithModelsResponse converts a vehicle brand model with models to response DTO
func ToVehicleBrandWithModelsResponse(vehicleBrand *models.VehicleBrand) VehicleBrandWithModelsResponse {
	response := VehicleBrandWithModelsResponse{
		ID:          vehicleBrand.ID,
		Name:        vehicleBrand.Name,
		Code:        vehicleBrand.Code,
		Description: vehicleBrand.Description,
		CountryCode: vehicleBrand.CountryCode,
		LogoURL:     vehicleBrand.LogoURL,
		IsActive:    vehicleBrand.IsActive,
		CreatedAt:   vehicleBrand.CreatedAt,
		UpdatedAt:   vehicleBrand.UpdatedAt,
	}

	// Convert vehicle models if present
	if vehicleBrand.VehicleModels != nil {
		response.VehicleModels = make([]VehicleModelResponse, len(vehicleBrand.VehicleModels))
		for i, model := range vehicleBrand.VehicleModels {
			response.VehicleModels[i] = ToVehicleModelResponse(&model)
		}
	}

	return response
}

// ToVehicleModelResponse converts a vehicle model to response DTO
func ToVehicleModelResponse(vehicleModel *models.VehicleModel) VehicleModelResponse {
	return VehicleModelResponse{
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
}

// ToVehicleBrandResponseList converts a list of vehicle brand models to vehicle brand response DTOs
func ToVehicleBrandResponseList(vehicleBrands []*models.VehicleBrand) []VehicleBrandResponse {
	responses := make([]VehicleBrandResponse, len(vehicleBrands))
	for i, vehicleBrand := range vehicleBrands {
		responses[i] = ToVehicleBrandResponse(vehicleBrand)
	}
	return responses
}

// ToVehicleBrandWithModelsResponseList converts a list of vehicle brand models with models to response DTOs
func ToVehicleBrandWithModelsResponseList(vehicleBrands []*models.VehicleBrand) []VehicleBrandWithModelsResponse {
	responses := make([]VehicleBrandWithModelsResponse, len(vehicleBrands))
	for i, vehicleBrand := range vehicleBrands {
		responses[i] = ToVehicleBrandWithModelsResponse(vehicleBrand)
	}
	return responses
}

// ToVehicleBrandModel converts CreateVehicleBrandRequest to vehicle brand model
func (req *CreateVehicleBrandRequest) ToVehicleBrandModel() *models.VehicleBrand {
	return &models.VehicleBrand{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		CountryCode: req.CountryCode,
		LogoURL:     req.LogoURL,
		IsActive:    true, // Default to active
	}
}

// ApplyToVehicleBrandModel applies UpdateVehicleBrandRequest to existing vehicle brand model
func (req *UpdateVehicleBrandRequest) ApplyToVehicleBrandModel(vehicleBrand *models.VehicleBrand) {
	if req.Name != "" {
		vehicleBrand.Name = req.Name
	}
	if req.Code != "" {
		vehicleBrand.Code = req.Code
	}
	if req.Description != "" {
		vehicleBrand.Description = req.Description
	}
	if req.CountryCode != "" {
		vehicleBrand.CountryCode = req.CountryCode
	}
	if req.LogoURL != "" {
		vehicleBrand.LogoURL = req.LogoURL
	}
	if req.IsActive != nil {
		vehicleBrand.IsActive = *req.IsActive
	}
}