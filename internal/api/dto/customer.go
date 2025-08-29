package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// CustomerResponse represents a customer in API responses
type CustomerResponse struct {
	ID          uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Name        string    `json:"name" example:"John Doe"`
	Code        string    `json:"code" example:"JOH001"`
	Email       string    `json:"email,omitempty" example:"john@example.com"`
	Phone       string    `json:"phone,omitempty" example:"+60123456789"`
	Address     string    `json:"address,omitempty" example:"123 Main Street"`
	City        string    `json:"city,omitempty" example:"Kuala Lumpur"`
	State       string    `json:"state,omitempty" example:"Selangor"`
	PostalCode  string    `json:"postal_code,omitempty" example:"50000"`
	Country     string    `json:"country" example:"Malaysia"`
	TaxNumber   string    `json:"tax_number,omitempty" example:"TAX123456"`
	CreditLimit float64   `json:"credit_limit" example:"10000.00"`
	Notes       string    `json:"notes,omitempty" example:"Regular customer"`
	IsActive    bool      `json:"is_active" example:"true"`
	CreatedAt   time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreateCustomerRequest represents a request to create a new customer
type CreateCustomerRequest struct {
	Name        string  `json:"name" binding:"required,min=1,max=100" example:"John Doe"`
	Code        string  `json:"code,omitempty" binding:"omitempty,max=20" example:"JOH001"`
	Email       string  `json:"email,omitempty" binding:"omitempty,email,max=100" example:"john@example.com"`
	Phone       string  `json:"phone,omitempty" binding:"omitempty,max=20" example:"+60123456789"`
	Address     string  `json:"address,omitempty" binding:"omitempty,max=500" example:"123 Main Street"`
	City        string  `json:"city,omitempty" binding:"omitempty,max=100" example:"Kuala Lumpur"`
	State       string  `json:"state,omitempty" binding:"omitempty,max=100" example:"Selangor"`
	PostalCode  string  `json:"postal_code,omitempty" binding:"omitempty,max=20" example:"50000"`
	Country     string  `json:"country,omitempty" binding:"omitempty,max=100" example:"Malaysia"`
	TaxNumber   string  `json:"tax_number,omitempty" binding:"omitempty,max=50" example:"TAX123456"`
	CreditLimit float64 `json:"credit_limit,omitempty" binding:"omitempty,min=0" example:"10000.00"`
	Notes       string  `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Regular customer"`
}

// UpdateCustomerRequest represents a request to update an existing customer
type UpdateCustomerRequest struct {
	Name        string  `json:"name,omitempty" binding:"omitempty,min=1,max=100" example:"John Doe Updated"`
	Code        string  `json:"code,omitempty" binding:"omitempty,max=20" example:"JOH002"`
	Email       string  `json:"email,omitempty" binding:"omitempty,email,max=100" example:"john.updated@example.com"`
	Phone       string  `json:"phone,omitempty" binding:"omitempty,max=20" example:"+60123456789"`
	Address     string  `json:"address,omitempty" binding:"omitempty,max=500" example:"456 Updated Street"`
	City        string  `json:"city,omitempty" binding:"omitempty,max=100" example:"Kuala Lumpur"`
	State       string  `json:"state,omitempty" binding:"omitempty,max=100" example:"Selangor"`
	PostalCode  string  `json:"postal_code,omitempty" binding:"omitempty,max=20" example:"50000"`
	Country     string  `json:"country,omitempty" binding:"omitempty,max=100" example:"Malaysia"`
	TaxNumber   string  `json:"tax_number,omitempty" binding:"omitempty,max=50" example:"TAX123456"`
	CreditLimit *float64 `json:"credit_limit,omitempty" binding:"omitempty,min=0" example:"15000.00"`
	Notes       string  `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Updated notes"`
	IsActive    *bool   `json:"is_active,omitempty" example:"true"`
}

// CustomerListRequest represents parameters for listing customers
type CustomerListRequest struct {
	Page     int    `form:"page" example:"1"`
	Limit    int    `form:"limit" example:"10"`
	Search   string `form:"search,omitempty" example:"john"`
	IsActive *bool  `form:"is_active,omitempty" example:"true"`
	City     string `form:"city,omitempty" example:"Kuala Lumpur"`
	State    string `form:"state,omitempty" example:"Selangor"`
}

// CustomerActivationRequest represents a request to activate/deactivate a customer
type CustomerActivationRequest struct {
	IsActive bool `json:"is_active" binding:"required" example:"true"`
}

// ToCustomerResponse converts a customer model to a customer response DTO
func ToCustomerResponse(customer *models.Customer) CustomerResponse {
	return CustomerResponse{
		ID:          customer.ID,
		Name:        customer.Name,
		Code:        customer.Code,
		Email:       customer.Email,
		Phone:       customer.Phone,
		Address:     customer.Address,
		City:        customer.City,
		State:       customer.State,
		PostalCode:  customer.PostalCode,
		Country:     customer.Country,
		TaxNumber:   customer.TaxNumber,
		CreditLimit: customer.CreditLimit,
		Notes:       customer.Notes,
		IsActive:    customer.IsActive,
		CreatedAt:   customer.CreatedAt,
		UpdatedAt:   customer.UpdatedAt,
	}
}

// ToCustomerResponseList converts a list of customer models to customer response DTOs
func ToCustomerResponseList(customers []*models.Customer) []CustomerResponse {
	responses := make([]CustomerResponse, len(customers))
	for i, customer := range customers {
		responses[i] = ToCustomerResponse(customer)
	}
	return responses
}

// ToCustomerModel converts CreateCustomerRequest to customer model
func (req *CreateCustomerRequest) ToCustomerModel() *models.Customer {
	return &models.Customer{
		Name:        req.Name,
		Code:        req.Code,
		Email:       req.Email,
		Phone:       req.Phone,
		Address:     req.Address,
		City:        req.City,
		State:       req.State,
		PostalCode:  req.PostalCode,
		Country:     req.Country,
		TaxNumber:   req.TaxNumber,
		CreditLimit: req.CreditLimit,
		Notes:       req.Notes,
		IsActive:    true, // Default to active
	}
}

// ApplyToCustomerModel applies UpdateCustomerRequest to existing customer model
func (req *UpdateCustomerRequest) ApplyToCustomerModel(customer *models.Customer) {
	if req.Name != "" {
		customer.Name = req.Name
	}
	if req.Code != "" {
		customer.Code = req.Code
	}
	if req.Email != "" {
		customer.Email = req.Email
	}
	if req.Phone != "" {
		customer.Phone = req.Phone
	}
	if req.Address != "" {
		customer.Address = req.Address
	}
	if req.City != "" {
		customer.City = req.City
	}
	if req.State != "" {
		customer.State = req.State
	}
	if req.PostalCode != "" {
		customer.PostalCode = req.PostalCode
	}
	if req.Country != "" {
		customer.Country = req.Country
	}
	if req.TaxNumber != "" {
		customer.TaxNumber = req.TaxNumber
	}
	if req.CreditLimit != nil {
		customer.CreditLimit = *req.CreditLimit
	}
	if req.Notes != "" {
		customer.Notes = req.Notes
	}
	if req.IsActive != nil {
		customer.IsActive = *req.IsActive
	}
}