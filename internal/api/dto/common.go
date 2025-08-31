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

// StandardPagination represents the unified pagination structure
type StandardPagination struct {
	Page       int   `json:"page" example:"1"`
	Limit      int   `json:"limit" example:"20"`
	Total      int64 `json:"total" example:"100"`
	TotalPages int   `json:"total_pages" example:"5"`
}

// PaginationInfo represents pagination metadata (legacy support)
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

// ApiResponse represents a simple API response structure used by handlers
// @Description Simple API response with success status, message and data
type ApiResponse struct {
	Success bool        `json:"success" example:"true"`
	Message string      `json:"message" example:"Operation completed successfully"`
	Data    interface{} `json:"data,omitempty"`
} // @name ApiResponse

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

// ===== STANDARDIZED RESPONSE STRUCTURES =====

// StandardResponse represents the unified API response structure
// All responses use this same structure with consistent fields
// @Description Standard API response structure
type StandardResponse[T any] struct {
	Success    bool                 `json:"success" example:"true"`
	Message    string               `json:"message" example:"Operation completed successfully"`
	Data       T                    `json:"data,omitempty"`
	Pagination *StandardPagination  `json:"pagination,omitempty"`
	Error      *ErrorInfo           `json:"error,omitempty"`
	Timestamp  time.Time            `json:"timestamp" example:"2023-01-01T12:00:00Z"`
} // @name StandardResponse

// StandardListResponse represents the unified paginated list response structure
// @Description Standard paginated list response structure
type StandardListResponse[T any] struct {
	Success    bool                `json:"success" example:"true"`
	Message    string              `json:"message" example:"Data retrieved successfully"`
	Data       []T                 `json:"data"`
	Pagination *StandardPagination `json:"pagination"`
	Error      *ErrorInfo          `json:"error,omitempty"`
	Timestamp  time.Time           `json:"timestamp" example:"2023-01-01T12:00:00Z"`
} // @name StandardListResponse

// StandardErrorResponse represents error response using unified structure
type StandardErrorResponse = StandardResponse[interface{}]

// ===== HELPER FUNCTIONS FOR STANDARDIZED RESPONSES =====

// CreateStandardSuccessResponse creates a standardized success response
func CreateStandardSuccessResponse[T any](data T, message string) StandardResponse[T] {
	return StandardResponse[T]{
		Success:   true,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
	}
}

// CreateStandardListResponse creates a standardized paginated list response
func CreateStandardListResponse[T any](data []T, pagination *StandardPagination, message string) StandardListResponse[T] {
	return StandardListResponse[T]{
		Success:    true,
		Message:    message,
		Data:       data,
		Pagination: pagination,
		Timestamp:  time.Now(),
	}
}

// CreateStandardErrorResponse creates a standardized error response using the same structure
func CreateStandardErrorResponse(code, message, details string) StandardResponse[interface{}] {
	return StandardResponse[interface{}]{
		Success: false,
		Message: message,
		Data:    nil,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now(),
	}
}

// CreateStandardErrorResponseWithData creates a standardized error response with additional data
func CreateStandardErrorResponseWithData[T any](data T, code, message, details string) StandardResponse[T] {
	return StandardResponse[T]{
		Success: false,
		Message: message,
		Data:    data,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now(),
	}
}

// CreateStandardPagination creates standardized pagination metadata
func CreateStandardPagination(page, limit int, total int64) *StandardPagination {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	return &StandardPagination{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}