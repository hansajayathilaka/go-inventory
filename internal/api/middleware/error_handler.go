package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"inventory-api/internal/api/dto"
)

// ErrorHandler middleware handles panics and errors
func ErrorHandler() gin.HandlerFunc {
	return gin.RecoveryWithWriter(gin.DefaultWriter, func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Internal server error", err)
			c.JSON(http.StatusInternalServerError, response)
		} else {
			response := dto.CreateErrorResponse("INTERNAL_ERROR", "Internal server error", "An unexpected error occurred")
			c.JSON(http.StatusInternalServerError, response)
		}
		c.Abort()
	})
}

// ValidationErrorHandler handles validation errors
func ValidationErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		
		// Check if there were any errors during request processing
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			response := dto.CreateErrorResponse("VALIDATION_ERROR", "Validation failed", err.Error())
			c.JSON(http.StatusBadRequest, response)
			return
		}
	}
}

// NotFoundHandler handles 404 errors
func NotFoundHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		response := dto.CreateErrorResponse("NOT_FOUND", "Resource not found", "The requested resource was not found")
		c.JSON(http.StatusNotFound, response)
	}
}