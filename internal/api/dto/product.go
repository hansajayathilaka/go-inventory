package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// ProductCreateRequest represents the request to create a product
type ProductCreateRequest struct {
	SKU            string     `json:"sku" binding:"required" example:"PROD-001"`
	Name           string     `json:"name" binding:"required" example:"Sample Product"`
	Description    string     `json:"description" example:"A sample product for demonstration"`
	CategoryID     uuid.UUID  `json:"category_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
	SupplierID     *uuid.UUID `json:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	BrandID        *uuid.UUID `json:"brand_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	CostPrice      float64    `json:"cost_price" example:"10.50"`
	RetailPrice    float64    `json:"retail_price" example:"15.99"`
	WholesalePrice float64    `json:"wholesale_price" example:"12.50"`
	Barcode        string     `json:"barcode" example:"1234567890123"`
	Weight         float64    `json:"weight" example:"0.5"`
	Dimensions     string     `json:"dimensions" example:"10x5x2 cm"`
	IsActive       *bool      `json:"is_active" example:"true"`
}

// ProductUpdateRequest represents the request to update a product
type ProductUpdateRequest struct {
	Name           *string    `json:"name" example:"Updated Product Name"`
	Description    *string    `json:"description" example:"Updated description"`
	CategoryID     *uuid.UUID `json:"category_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	SupplierID     *uuid.UUID `json:"supplier_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	BrandID        *uuid.UUID `json:"brand_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	CostPrice      *float64   `json:"cost_price" example:"11.00"`
	RetailPrice    *float64   `json:"retail_price" example:"16.99"`
	WholesalePrice *float64   `json:"wholesale_price" example:"13.50"`
	Barcode        *string    `json:"barcode" example:"1234567890124"`
	Weight         *float64   `json:"weight" example:"0.6"`
	Dimensions     *string    `json:"dimensions" example:"11x5x2 cm"`
	IsActive       *bool      `json:"is_active" example:"true"`
}

// ProductResponse represents a product in API responses
type ProductResponse struct {
	ID             uuid.UUID               `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	SKU            string                  `json:"sku" example:"PROD-001"`
	Name           string                  `json:"name" example:"Sample Product"`
	Description    string                  `json:"description" example:"A sample product for demonstration"`
	CategoryID     uuid.UUID               `json:"category_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Category       *CategoryResponse       `json:"category,omitempty"`
	SupplierID     *uuid.UUID              `json:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	Supplier       *SupplierResponse       `json:"supplier,omitempty"`
	BrandID        *uuid.UUID              `json:"brand_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	Brand          *BrandResponse          `json:"brand,omitempty"`
	CostPrice      float64                 `json:"cost_price" example:"10.50"`
	RetailPrice    float64                 `json:"retail_price" example:"15.99"`
	WholesalePrice float64                 `json:"wholesale_price" example:"12.50"`
	Barcode        string                  `json:"barcode" example:"1234567890123"`
	Weight         float64                 `json:"weight" example:"0.5"`
	Dimensions     string                  `json:"dimensions" example:"10x5x2 cm"`
	IsActive       bool                    `json:"is_active" example:"true"`
	CreatedAt      time.Time               `json:"created_at" example:"2024-01-01T00:00:00Z"`
	UpdatedAt      time.Time               `json:"updated_at" example:"2024-01-01T00:00:00Z"`
	TotalStock     *int                    `json:"total_stock,omitempty" example:"100"`
	Inventory      []ProductInventoryResponse     `json:"inventory,omitempty"`
}

// ProductListResponse represents paginated product list
type ProductListResponse struct {
	Products   []ProductResponse `json:"products"`
	Total      int64             `json:"total" example:"150"`
	Page       int               `json:"page" example:"1"`
	PerPage    int               `json:"per_page" example:"20"`
	TotalPages int               `json:"total_pages" example:"8"`
}

// ProductSearchRequest represents product search parameters
type ProductSearchRequest struct {
	Query      string     `form:"q" example:"sample"`
	CategoryID *uuid.UUID `form:"category_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	SupplierID *uuid.UUID `form:"supplier_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	BrandID    *uuid.UUID `form:"brand_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	IsActive   *bool      `form:"is_active" example:"true"`
	MinPrice   *float64   `form:"min_price" example:"10.00"`
	MaxPrice   *float64   `form:"max_price" example:"50.00"`
	Page       int        `form:"page" example:"1"`
	PerPage    int        `form:"per_page" example:"20"`
}

// SupplierResponse represents a supplier in API responses (basic info)
type SupplierResponse struct {
	ID      uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name    string    `json:"name" example:"Supplier Name"`
	Code    string    `json:"code" example:"SUP-001"`
	Email   string    `json:"email" example:"supplier@example.com"`
	Phone   string    `json:"phone" example:"+1-555-0123"`
	IsActive bool     `json:"is_active" example:"true"`
}

// ProductInventoryResponse represents inventory info for products
type ProductInventoryResponse struct {
	LocationID       uuid.UUID `json:"location_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	LocationName     string    `json:"location_name" example:"Main Warehouse"`
	Quantity         int       `json:"quantity" example:"50"`
	ReservedQuantity int       `json:"reserved_quantity" example:"5"`
	AvailableQuantity int      `json:"available_quantity" example:"45"`
	ReorderLevel     int       `json:"reorder_level" example:"10"`
	MaxLevel         int       `json:"max_level" example:"100"`
}

// ToProductResponse converts a product model to response DTO
func ToProductResponse(product *models.Product) ProductResponse {
	response := ProductResponse{
		ID:             product.ID,
		SKU:            product.SKU,
		Name:           product.Name,
		Description:    product.Description,
		CategoryID:     product.CategoryID,
		SupplierID:     product.SupplierID,
		BrandID:        product.BrandID,
		CostPrice:      product.CostPrice,
		RetailPrice:    product.RetailPrice,
		WholesalePrice: product.WholesalePrice,
		Barcode:        product.Barcode,
		Weight:         product.Weight,
		Dimensions:     product.Dimensions,
		IsActive:       product.IsActive,
		CreatedAt:      product.CreatedAt,
		UpdatedAt:      product.UpdatedAt,
	}

	// Note: Category, Supplier, and Brand relationships are not included here
	// to avoid circular dependencies and complexity. They should be loaded
	// separately when needed through dedicated endpoints.

	return response
}