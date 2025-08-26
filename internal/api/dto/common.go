package dto

import (
	"time"

	"github.com/google/uuid"
)

// BaseResponse represents a standard API response structure
type BaseResponse struct {
	Success   bool        `json:"success" example:"true"`
	Message   string      `json:"message,omitempty" example:"Operation completed successfully"`
	Data      interface{} `json:"data,omitempty"`
	Error     *ErrorInfo  `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp" example:"2023-01-01T12:00:00Z"`
}

// ErrorInfo represents error information in API responses
type ErrorInfo struct {
	Code    string `json:"code" example:"VALIDATION_ERROR"`
	Message string `json:"message" example:"Invalid input parameters"`
	Details string `json:"details,omitempty" example:"Name field is required"`
}

// PaginationInfo represents pagination metadata
type PaginationInfo struct {
	Page       int   `json:"page" example:"1"`
	Limit      int   `json:"limit" example:"10"`
	Total      int64 `json:"total" example:"100"`
	TotalPages int   `json:"total_pages" example:"10"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	BaseResponse
	Pagination *PaginationInfo `json:"pagination,omitempty"`
}

// IDRequest represents a request with just an ID parameter
type IDRequest struct {
	ID uuid.UUID `uri:"id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440000"`
}

// CreateSuccessResponse creates a standardized success response
func CreateSuccessResponse(data interface{}, message string) BaseResponse {
	return BaseResponse{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// CreateErrorResponse creates a standardized error response
func CreateErrorResponse(code, message, details string) BaseResponse {
	return BaseResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now(),
	}
}

// SuccessResponse represents a successful API response
// @Description Standard successful API response structure
type SuccessResponse struct {
	Message string      `json:"message" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty"`
} // @name SuccessResponse

// ErrorResponse represents an error API response
// @Description Standard error API response structure
type ErrorResponse struct {
	Error   string `json:"error" example:"Invalid request"`
	Message string `json:"message" example:"Detailed error message"`
} // @name ErrorResponse

// PaginationResponse represents pagination metadata
// @Description Pagination information for list responses
type PaginationResponse struct {
	Page     int `json:"page" example:"1"`
	PageSize int `json:"page_size" example:"20"`
	Total    int `json:"total" example:"100"`
} // @name PaginationResponse

// CreatePaginatedResponse creates a standardized paginated response
func CreatePaginatedResponse(data interface{}, pagination *PaginationInfo, message string) PaginatedResponse {
	return PaginatedResponse{
		BaseResponse: BaseResponse{
			Success:   true,
			Message:   message,
			Data:      data,
			Timestamp: time.Now(),
		},
		Pagination: pagination,
	}
}