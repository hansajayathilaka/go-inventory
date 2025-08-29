package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// BrandResponse represents a brand in API responses
type BrandResponse struct {
	ID          uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"Bosch"`
	Code        string    `json:"code" example:"BOSCH"`
	Description string    `json:"description,omitempty" example:"German automotive parts manufacturer"`
	Website     string    `json:"website,omitempty" example:"https://www.bosch.com"`
	CountryCode string    `json:"country_code,omitempty" example:"DE"`
	LogoURL     string    `json:"logo_url,omitempty" example:"https://example.com/logos/bosch.png"`
	IsActive    bool      `json:"is_active" example:"true"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreateBrandRequest represents a request to create a new brand
type CreateBrandRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"Bosch"`
	Code        string `json:"code,omitempty" binding:"omitempty,max=20" example:"BOSCH"`
	Description string `json:"description,omitempty" binding:"omitempty,max=500" example:"German automotive parts manufacturer"`
	Website     string `json:"website,omitempty" binding:"omitempty,url,max=200" example:"https://www.bosch.com"`
	CountryCode string `json:"country_code,omitempty" binding:"omitempty,max=10" example:"DE"`
	LogoURL     string `json:"logo_url,omitempty" binding:"omitempty,url,max=500" example:"https://example.com/logos/bosch.png"`
}

// UpdateBrandRequest represents a request to update an existing brand
type UpdateBrandRequest struct {
	Name        string `json:"name,omitempty" binding:"omitempty,min=1,max=100" example:"Bosch Updated"`
	Code        string `json:"code,omitempty" binding:"omitempty,max=20" example:"BOSCH2"`
	Description string `json:"description,omitempty" binding:"omitempty,max=500" example:"Updated description"`
	Website     string `json:"website,omitempty" binding:"omitempty,url,max=200" example:"https://www.bosch-updated.com"`
	CountryCode string `json:"country_code,omitempty" binding:"omitempty,max=10" example:"DE"`
	LogoURL     string `json:"logo_url,omitempty" binding:"omitempty,url,max=500" example:"https://example.com/logos/bosch-new.png"`
	IsActive    *bool  `json:"is_active,omitempty" example:"true"`
}

// BrandListRequest represents parameters for listing brands
type BrandListRequest struct {
	Page        int    `form:"page" example:"1"`
	Limit       int    `form:"limit" example:"10"`
	Search      string `form:"search,omitempty" example:"bosch"`
	IsActive    *bool  `form:"is_active,omitempty" example:"true"`
	CountryCode string `form:"country_code,omitempty" example:"DE"`
}

// BrandActivationRequest represents a request to activate/deactivate a brand
type BrandActivationRequest struct {
	IsActive bool `json:"is_active" binding:"required" example:"true"`
}

// ToBrandResponse converts a brand model to a brand response DTO
func ToBrandResponse(brand *models.Brand) BrandResponse {
	return BrandResponse{
		ID:          brand.ID,
		Name:        brand.Name,
		Code:        brand.Code,
		Description: brand.Description,
		Website:     brand.Website,
		CountryCode: brand.CountryCode,
		LogoURL:     brand.LogoURL,
		IsActive:    brand.IsActive,
		CreatedAt:   brand.CreatedAt,
		UpdatedAt:   brand.UpdatedAt,
	}
}

// ToBrandResponseList converts a list of brand models to brand response DTOs
func ToBrandResponseList(brands []*models.Brand) []BrandResponse {
	responses := make([]BrandResponse, len(brands))
	for i, brand := range brands {
		responses[i] = ToBrandResponse(brand)
	}
	return responses
}

// ToBrandModel converts CreateBrandRequest to brand model
func (req *CreateBrandRequest) ToBrandModel() *models.Brand {
	return &models.Brand{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Website:     req.Website,
		CountryCode: req.CountryCode,
		LogoURL:     req.LogoURL,
		IsActive:    true, // Default to active
	}
}

// ApplyToBrandModel applies UpdateBrandRequest to existing brand model
func (req *UpdateBrandRequest) ApplyToBrandModel(brand *models.Brand) {
	if req.Name != "" {
		brand.Name = req.Name
	}
	if req.Code != "" {
		brand.Code = req.Code
	}
	if req.Description != "" {
		brand.Description = req.Description
	}
	if req.Website != "" {
		brand.Website = req.Website
	}
	if req.CountryCode != "" {
		brand.CountryCode = req.CountryCode
	}
	if req.LogoURL != "" {
		brand.LogoURL = req.LogoURL
	}
	if req.IsActive != nil {
		brand.IsActive = *req.IsActive
	}
}