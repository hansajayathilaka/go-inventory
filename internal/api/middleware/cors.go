package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// CORSConfig returns CORS middleware configuration
func CORSConfig() gin.HandlerFunc {
	config := cors.DefaultConfig()
	
	// Allow all origins in development
	config.AllowAllOrigins = true
	
	// Allow common headers
	config.AllowHeaders = []string{
		"Origin",
		"Content-Length",
		"Content-Type",
		"Authorization",
		"X-Requested-With",
	}
	
	// Allow common methods
	config.AllowMethods = []string{
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"OPTIONS",
	}
	
	config.AllowCredentials = true
	
	return cors.New(config)
}