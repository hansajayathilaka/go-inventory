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
		supplierHandler := handlers.NewSupplierHandler(appCtx.SupplierService)
		categoryHandler := handlers.NewCategoryHandler(appCtx.HierarchyService)
		productHandler := handlers.NewProductHandler(appCtx.ProductService, appCtx.InventoryService)
		inventoryHandler := handlers.NewInventoryHandler(appCtx.InventoryService, appCtx.UserService, appCtx.InventoryRepo, appCtx.StockMovementRepo)

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

		// Supplier management routes
		suppliers := v1.Group("/suppliers")
		{
			suppliers.GET("", supplierHandler.GetSuppliers)                              // GET /api/v1/suppliers
			suppliers.POST("", supplierHandler.CreateSupplier)                          // POST /api/v1/suppliers
			suppliers.GET("/:id", supplierHandler.GetSupplier)                          // GET /api/v1/suppliers/:id
			suppliers.PUT("/:id", supplierHandler.UpdateSupplier)                       // PUT /api/v1/suppliers/:id
			suppliers.DELETE("/:id", supplierHandler.DeleteSupplier)                    // DELETE /api/v1/suppliers/:id
		}

		// Category management routes
		categories := v1.Group("/categories")
		{
			categories.GET("", categoryHandler.ListCategories)                        // GET /api/v1/categories
			categories.POST("", categoryHandler.CreateCategory)                      // POST /api/v1/categories
			categories.GET("/roots", categoryHandler.GetRootCategories)              // GET /api/v1/categories/roots
			categories.GET("/hierarchy", categoryHandler.GetCategoryHierarchy)       // GET /api/v1/categories/hierarchy
			categories.GET("/:id", categoryHandler.GetCategory)                      // GET /api/v1/categories/:id
			categories.PUT("/:id", categoryHandler.UpdateCategory)                   // PUT /api/v1/categories/:id
			categories.DELETE("/:id", categoryHandler.DeleteCategory)                // DELETE /api/v1/categories/:id
			categories.GET("/:id/children", categoryHandler.GetCategoryChildren)     // GET /api/v1/categories/:id/children
			categories.GET("/:id/hierarchy", categoryHandler.GetCategoryHierarchy)   // GET /api/v1/categories/:id/hierarchy
			categories.GET("/:id/path", categoryHandler.GetCategoryPath)             // GET /api/v1/categories/:id/path
			categories.PUT("/:id/move", categoryHandler.MoveCategory)                // PUT /api/v1/categories/:id/move
		}

		// Product management routes
		products := v1.Group("/products")
		{
			products.GET("", productHandler.GetProducts)                             // GET /api/v1/products
			products.POST("", productHandler.CreateProduct)                          // POST /api/v1/products
			products.GET("/search", productHandler.SearchProducts)                   // GET /api/v1/products/search
			products.GET("/:id", productHandler.GetProduct)                          // GET /api/v1/products/:id
			products.PUT("/:id", productHandler.UpdateProduct)                       // PUT /api/v1/products/:id
			products.DELETE("/:id", productHandler.DeleteProduct)                    // DELETE /api/v1/products/:id
			products.GET("/:id/inventory", productHandler.GetProductInventory)       // GET /api/v1/products/:id/inventory
		}

		// Inventory management routes
		inventory := v1.Group("/inventory")
		{
			inventory.GET("", inventoryHandler.GetInventoryRecords)                  // GET /api/v1/inventory
			inventory.POST("", inventoryHandler.CreateInventoryRecord)               // POST /api/v1/inventory
			inventory.POST("/adjust", inventoryHandler.AdjustStock)                  // POST /api/v1/inventory/adjust
			inventory.POST("/transfer", inventoryHandler.TransferStock)              // POST /api/v1/inventory/transfer
			inventory.GET("/low-stock", inventoryHandler.GetLowStockItems)           // GET /api/v1/inventory/low-stock
			inventory.GET("/zero-stock", inventoryHandler.GetZeroStockItems)         // GET /api/v1/inventory/zero-stock
			inventory.PUT("/reorder-levels", inventoryHandler.UpdateReorderLevels)   // PUT /api/v1/inventory/reorder-levels
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