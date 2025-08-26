package router

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"inventory-api/internal/api/handlers"
	"inventory-api/internal/api/middleware"
	"inventory-api/internal/app"
)

// SetupRouter configures and returns the main application router
func SetupRouter(appCtx *app.Context) *gin.Engine {
	// Create Gin router
	router := gin.New()

	// Add middleware
	router.Use(middleware.RequestLogger())
	router.Use(middleware.ErrorHandler())

	// Add CORS middleware
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	router.Use(cors.New(config))

	// Swagger documentation endpoint
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Health check endpoint (moved from main.go)
	router.GET("/health", HealthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Initialize handlers
		userHandler := handlers.NewUserHandler(appCtx.UserService)

		// Authentication routes
		auth := v1.Group("/auth")
		{
			auth.POST("/login", userHandler.Login)
			auth.POST("/logout", userHandler.Logout)
		}

		// User management routes
		users := v1.Group("/users")
		{
			users.GET("", userHandler.GetUsers)
			users.POST("", userHandler.CreateUser)
			users.GET("/:id", userHandler.GetUser)
			users.PUT("/:id", userHandler.UpdateUser)
			users.DELETE("/:id", userHandler.DeleteUser)
		}
	}

	// Handle 404
	router.NoRoute(middleware.NotFoundHandler())

	return router
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string `json:"status" example:"ok"`
	Timestamp string `json:"timestamp" example:"2023-01-01T12:00:00Z"`
	Version   string `json:"version" example:"1.0.0"`
}

// HealthCheck godoc
// @Summary Health check
// @Description Returns the health status of the API
// @Tags System
// @Produce json
// @Success 200 {object} HealthResponse
// @Router /health [get]
func HealthCheck(c *gin.Context) {
	c.JSON(200, HealthResponse{
		Status:    "ok",
		Timestamp: "2023-01-01T12:00:00Z", // You can use time.Now().Format(time.RFC3339)
		Version:   "1.0.0",
	})
}