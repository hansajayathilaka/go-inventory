package dto

import (
	"time"

	"github.com/google/uuid"
)

// SupplierDetailResponse represents detailed supplier information in API responses
// @Description Detailed supplier information returned by the API
type SupplierDetailResponse struct {
	ID          uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"ACME Corporation"`
	Code        string    `json:"code" example:"ACME001"`
	Email       string    `json:"email" example:"contact@acme.com"`
	Phone       string    `json:"phone" example:"+1-555-123-4567"`
	Address     string    `json:"address" example:"123 Business St, City, State 12345"`
	ContactName string    `json:"contact_name" example:"John Smith"`
	Notes       string    `json:"notes" example:"Primary supplier for widgets"`
	IsActive    bool      `json:"is_active" example:"true"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-02T12:00:00Z"`
} // @name SupplierDetailResponse

// SupplierCreateRequest represents the request body for creating a supplier
// @Description Request body for creating a new supplier
type SupplierCreateRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"ACME Corporation"`
	Code        string `json:"code" binding:"required,min=1,max=20" example:"ACME001"`
	Email       string `json:"email" binding:"omitempty,email,max=100" example:"contact@acme.com"`
	Phone       string `json:"phone" binding:"omitempty,max=20" example:"+1-555-123-4567"`
	Address     string `json:"address" binding:"omitempty,max=500" example:"123 Business St, City, State 12345"`
	ContactName string `json:"contact_name" binding:"omitempty,max=100" example:"John Smith"`
	Notes       string `json:"notes" binding:"omitempty,max=1000" example:"Primary supplier for widgets"`
	IsActive    bool   `json:"is_active" example:"true"`
} // @name SupplierCreateRequest

// SupplierUpdateRequest represents the request body for updating a supplier
// @Description Request body for updating an existing supplier
type SupplierUpdateRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100" example:"ACME Corporation"`
	Code        string `json:"code" binding:"required,min=1,max=20" example:"ACME001"`
	Email       string `json:"email" binding:"omitempty,email,max=100" example:"contact@acme.com"`
	Phone       string `json:"phone" binding:"omitempty,max=20" example:"+1-555-123-4567"`
	Address     string `json:"address" binding:"omitempty,max=500" example:"123 Business St, City, State 12345"`
	ContactName string `json:"contact_name" binding:"omitempty,max=100" example:"John Smith"`
	Notes       string `json:"notes" binding:"omitempty,max=1000" example:"Primary supplier for widgets"`
	IsActive    bool   `json:"is_active" example:"true"`
} // @name SupplierUpdateRequest

// SupplierListResponse represents a paginated list of suppliers
// @Description Paginated list of suppliers with metadata
type SupplierListResponse struct {
	Suppliers  []SupplierDetailResponse `json:"suppliers"`
	Pagination PaginationResponse       `json:"pagination"`
} // @name SupplierListResponse