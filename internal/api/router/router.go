package router

import (
	"os"
	"time"

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

	// JWT Secret
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key" // Default for development
	}

	// Add middleware
	router.Use(middleware.RequestLogger())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.RateLimitMiddleware(100, time.Minute)) // 100 requests per minute

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
		authHandler := handlers.NewAuthHandler(appCtx.UserService)
		userHandler := handlers.NewUserHandler(appCtx.UserService)
		supplierHandler := handlers.NewSupplierHandler(appCtx.SupplierService)
		locationHandler := handlers.NewLocationHandler(appCtx.LocationService)
		categoryHandler := handlers.NewCategoryHandler(appCtx.HierarchyService)
		productHandler := handlers.NewProductHandler(appCtx.ProductService, appCtx.InventoryService)
		inventoryHandler := handlers.NewInventoryHandler(appCtx.InventoryService, appCtx.UserService, appCtx.InventoryRepo, appCtx.StockMovementRepo)
		auditHandler := handlers.NewAuditHandler(
			appCtx.AuditService,
			appCtx.InventoryService,
			appCtx.UserRepo,
			appCtx.ProductRepo,
			appCtx.LocationRepo,
			appCtx.StockMovementRepo,
			appCtx.CategoryRepo,
		)

		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", middleware.AuthMiddleware(jwtSecret), authHandler.Logout)
			auth.POST("/refresh", middleware.AuthMiddleware(jwtSecret), authHandler.RefreshToken)
			auth.GET("/me", middleware.AuthMiddleware(jwtSecret), authHandler.Me)
		}

		// User management routes (protected)
		users := v1.Group("/users")
		users.Use(middleware.AuthMiddleware(jwtSecret))
		{
			users.GET("", middleware.RequireMinimumRole("staff"), userHandler.GetUsers)
			users.POST("", middleware.RequireMinimumRole("admin"), userHandler.CreateUser)
			users.GET("/:id", middleware.RequireMinimumRole("staff"), userHandler.GetUser)
			users.PUT("/:id", middleware.RequireMinimumRole("manager"), userHandler.UpdateUser)
			users.DELETE("/:id", middleware.RequireRole("admin"), userHandler.DeleteUser)
		}

		// Supplier management routes (protected)
		suppliers := v1.Group("/suppliers")
		suppliers.Use(middleware.AuthMiddleware(jwtSecret))
		{
			suppliers.GET("", middleware.RequireMinimumRole("viewer"), supplierHandler.GetSuppliers)
			suppliers.POST("", middleware.RequireMinimumRole("manager"), supplierHandler.CreateSupplier)
			suppliers.GET("/:id", middleware.RequireMinimumRole("viewer"), supplierHandler.GetSupplier)
			suppliers.PUT("/:id", middleware.RequireMinimumRole("manager"), supplierHandler.UpdateSupplier)
			suppliers.DELETE("/:id", middleware.RequireRole("admin"), supplierHandler.DeleteSupplier)
		}

		// Location management routes (protected)
		locations := v1.Group("/locations")
		locations.Use(middleware.AuthMiddleware(jwtSecret))
		{
			locations.GET("", middleware.RequireMinimumRole("viewer"), locationHandler.ListLocations)
			locations.POST("", middleware.RequireMinimumRole("manager"), locationHandler.CreateLocation)
			locations.GET("/:id", middleware.RequireMinimumRole("viewer"), locationHandler.GetLocation)
			locations.PUT("/:id", middleware.RequireMinimumRole("manager"), locationHandler.UpdateLocation)
			locations.DELETE("/:id", middleware.RequireRole("admin"), locationHandler.DeleteLocation)
			locations.GET("/:id/inventory", middleware.RequireMinimumRole("viewer"), locationHandler.GetLocationInventory)
		}

		// Category management routes (protected)
		categories := v1.Group("/categories")
		categories.Use(middleware.AuthMiddleware(jwtSecret))
		{
			categories.GET("", middleware.RequireMinimumRole("viewer"), categoryHandler.ListCategories)
			categories.POST("", middleware.RequireMinimumRole("manager"), categoryHandler.CreateCategory)
			categories.GET("/roots", middleware.RequireMinimumRole("viewer"), categoryHandler.GetRootCategories)
			categories.GET("/hierarchy", middleware.RequireMinimumRole("viewer"), categoryHandler.GetCategoryHierarchy)
			categories.GET("/:id", middleware.RequireMinimumRole("viewer"), categoryHandler.GetCategory)
			categories.PUT("/:id", middleware.RequireMinimumRole("manager"), categoryHandler.UpdateCategory)
			categories.DELETE("/:id", middleware.RequireRole("admin"), categoryHandler.DeleteCategory)
			categories.GET("/:id/children", middleware.RequireMinimumRole("viewer"), categoryHandler.GetCategoryChildren)
			categories.GET("/:id/hierarchy", middleware.RequireMinimumRole("viewer"), categoryHandler.GetCategoryHierarchy)
			categories.GET("/:id/path", middleware.RequireMinimumRole("viewer"), categoryHandler.GetCategoryPath)
			categories.PUT("/:id/move", middleware.RequireMinimumRole("manager"), categoryHandler.MoveCategory)
		}

		// Product management routes (protected)
		products := v1.Group("/products")
		products.Use(middleware.AuthMiddleware(jwtSecret))
		{
			products.GET("", middleware.RequireMinimumRole("viewer"), productHandler.GetProducts)
			products.POST("", middleware.RequireMinimumRole("staff"), productHandler.CreateProduct)
			products.GET("/search", middleware.RequireMinimumRole("viewer"), productHandler.SearchProducts)
			products.GET("/:id", middleware.RequireMinimumRole("viewer"), productHandler.GetProduct)
			products.PUT("/:id", middleware.RequireMinimumRole("staff"), productHandler.UpdateProduct)
			products.DELETE("/:id", middleware.RequireMinimumRole("manager"), productHandler.DeleteProduct)
			products.GET("/:id/inventory", middleware.RequireMinimumRole("viewer"), productHandler.GetProductInventory)
		}

		// Inventory management routes (protected)
		inventory := v1.Group("/inventory")
		inventory.Use(middleware.AuthMiddleware(jwtSecret))
		{
			inventory.GET("", middleware.RequireMinimumRole("viewer"), inventoryHandler.GetInventoryRecords)
			inventory.POST("", middleware.RequireMinimumRole("staff"), inventoryHandler.CreateInventoryRecord)
			inventory.POST("/adjust", middleware.RequireMinimumRole("staff"), inventoryHandler.AdjustStock)
			inventory.POST("/transfer", middleware.RequireMinimumRole("staff"), inventoryHandler.TransferStock)
			inventory.GET("/low-stock", middleware.RequireMinimumRole("viewer"), inventoryHandler.GetLowStockItems)
			inventory.GET("/zero-stock", middleware.RequireMinimumRole("viewer"), inventoryHandler.GetZeroStockItems)
			inventory.PUT("/reorder-levels", middleware.RequireMinimumRole("manager"), inventoryHandler.UpdateReorderLevels)
		}

		// Audit and reporting routes (protected)
		auditLogs := v1.Group("/audit-logs")
		auditLogs.Use(middleware.AuthMiddleware(jwtSecret))
		{
			auditLogs.GET("", middleware.RequireMinimumRole("manager"), auditHandler.GetAuditLogs)
			auditLogs.GET("/statistics", middleware.RequireMinimumRole("manager"), auditHandler.GetAuditStatistics)
		}

		reports := v1.Group("/reports")
		reports.Use(middleware.AuthMiddleware(jwtSecret))
		{
			reports.GET("/stock-movements", middleware.RequireMinimumRole("staff"), auditHandler.GetStockMovementReport)
			reports.GET("/inventory-summary", middleware.RequireMinimumRole("staff"), auditHandler.GetInventorySummary)
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