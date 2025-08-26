package middleware

import (
	"fmt"
	"net/http"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ValidationMiddleware provides request validation functionality
type ValidationMiddleware struct {
	validator *validator.Validate
}

// NewValidationMiddleware creates a new validation middleware instance
func NewValidationMiddleware() *ValidationMiddleware {
	validate := validator.New()

	// Register custom tag name function to use JSON tags
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	return &ValidationMiddleware{
		validator: validate,
	}
}

// ValidateJSON validates JSON request body against a struct
func (vm *ValidationMiddleware) ValidateJSON(structType interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create new instance of the struct type
		obj := reflect.New(reflect.TypeOf(structType)).Interface()

		// Bind JSON to struct
		if err := c.ShouldBindJSON(obj); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_json",
				"message": "Failed to parse JSON request body",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Validate struct
		if err := vm.validator.Struct(obj); err != nil {
			validationErrors := make([]gin.H, 0)
			
			for _, err := range err.(validator.ValidationErrors) {
				validationErrors = append(validationErrors, gin.H{
					"field":   err.Field(),
					"tag":     err.Tag(),
					"value":   err.Value(),
					"message": vm.getValidationMessage(err),
				})
			}

			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "validation_failed",
				"message": "Request validation failed",
				"errors":  validationErrors,
			})
			c.Abort()
			return
		}

		// Set validated object in context
		c.Set("validated_body", obj)
		c.Next()
	}
}

// ValidateQuery validates query parameters against a struct
func (vm *ValidationMiddleware) ValidateQuery(structType interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create new instance of the struct type
		obj := reflect.New(reflect.TypeOf(structType)).Interface()

		// Bind query parameters to struct
		if err := c.ShouldBindQuery(obj); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "invalid_query_params",
				"message": "Failed to parse query parameters",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Validate struct
		if err := vm.validator.Struct(obj); err != nil {
			validationErrors := make([]gin.H, 0)
			
			for _, err := range err.(validator.ValidationErrors) {
				validationErrors = append(validationErrors, gin.H{
					"field":   err.Field(),
					"tag":     err.Tag(),
					"value":   err.Value(),
					"message": vm.getValidationMessage(err),
				})
			}

			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "validation_failed",
				"message": "Query parameter validation failed",
				"errors":  validationErrors,
			})
			c.Abort()
			return
		}

		// Set validated object in context
		c.Set("validated_query", obj)
		c.Next()
	}
}

// ValidatePathParams validates path parameters
func (vm *ValidationMiddleware) ValidatePathParams(paramValidations map[string]string) gin.HandlerFunc {
	return func(c *gin.Context) {
		errors := make([]gin.H, 0)

		for param, rule := range paramValidations {
			value := c.Param(param)
			
			if err := vm.validator.Var(value, rule); err != nil {
				for _, validationErr := range err.(validator.ValidationErrors) {
					errors = append(errors, gin.H{
						"field":   param,
						"tag":     validationErr.Tag(),
						"value":   value,
						"message": fmt.Sprintf("Parameter '%s' %s", param, vm.getValidationMessage(validationErr)),
					})
				}
			}
		}

		if len(errors) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "validation_failed",
				"message": "Path parameter validation failed",
				"errors":  errors,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getValidationMessage returns user-friendly validation error messages
func (vm *ValidationMiddleware) getValidationMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "is required"
	case "email":
		return "must be a valid email address"
	case "min":
		return fmt.Sprintf("must be at least %s characters", fe.Param())
	case "max":
		return fmt.Sprintf("must be at most %s characters", fe.Param())
	case "len":
		return fmt.Sprintf("must be exactly %s characters", fe.Param())
	case "gte":
		return fmt.Sprintf("must be greater than or equal to %s", fe.Param())
	case "lte":
		return fmt.Sprintf("must be less than or equal to %s", fe.Param())
	case "gt":
		return fmt.Sprintf("must be greater than %s", fe.Param())
	case "lt":
		return fmt.Sprintf("must be less than %s", fe.Param())
	case "oneof":
		return fmt.Sprintf("must be one of: %s", fe.Param())
	case "uuid":
		return "must be a valid UUID"
	case "url":
		return "must be a valid URL"
	case "numeric":
		return "must be a number"
	case "alpha":
		return "must contain only letters"
	case "alphanum":
		return "must contain only letters and numbers"
	default:
		return fmt.Sprintf("validation failed for tag '%s'", fe.Tag())
	}
}

// Common validation middleware instances
var (
	Validator = NewValidationMiddleware()
)

// Helper functions for common validations

// ValidateID validates that an ID parameter is a positive integer
func ValidateID() gin.HandlerFunc {
	return Validator.ValidatePathParams(map[string]string{
		"id": "required,numeric,gt=0",
	})
}

// ValidatePagination validates pagination query parameters
func ValidatePagination() gin.HandlerFunc {
	type PaginationQuery struct {
		Page  int `form:"page" validate:"omitempty,gte=1"`
		Limit int `form:"limit" validate:"omitempty,gte=1,lte=100"`
	}
	return Validator.ValidateQuery(PaginationQuery{})
}