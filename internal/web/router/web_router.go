package router

import (
	"github.com/gin-gonic/gin"

	"inventory-api/internal/app"
	"inventory-api/internal/web/handlers"
	"inventory-api/internal/web/middleware"
)

func SetupWebRoutes(router *gin.Engine, appCtx *app.Context) {
	// Serve static files
	router.Static("/static", "./web/static")
	
	// Initialize handlers
	authHandler := handlers.NewWebAuthHandler()
	dashboardHandler := handlers.NewWebDashboardHandler()
	categoryHandler := handlers.NewCategoryWebHandler(appCtx.HierarchyService)
	
	// Public routes (no auth required)
	router.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/login")
	})
	router.GET("/login", authHandler.LoginPage)
	router.POST("/auth/login", authHandler.Login)
	router.GET("/logout", authHandler.Logout)
	
	// Protected routes (require web session authentication)
	protected := router.Group("/")
	protected.Use(middleware.WebAuthMiddleware())
	{
		// Dashboard
		protected.GET("/dashboard", dashboardHandler.Dashboard)
		
		// Placeholder routes for main sections
		protected.GET("/products", func(c *gin.Context) {
			c.String(200, "Products page - Coming soon")
		})
		
		protected.GET("/categories", categoryHandler.CategoriesPage)
		
		protected.GET("/inventory", func(c *gin.Context) {
			c.String(200, "Inventory page - Coming soon")
		})
		
		protected.GET("/suppliers", func(c *gin.Context) {
			c.String(200, "Suppliers page - Coming soon")
		})
		
		protected.GET("/locations", func(c *gin.Context) {
			c.String(200, "Locations page - Coming soon")
		})
		
		protected.GET("/users", func(c *gin.Context) {
			c.String(200, "Users page - Coming soon")
		})
		
		protected.GET("/audit", func(c *gin.Context) {
			c.String(200, "Audit page - Coming soon")
		})
		
		// Web API routes for HTMX requests
		webAPI := protected.Group("/web")
		{
			// Category management HTMX routes
			categories := webAPI.Group("/categories")
			{
				categories.GET("/tree", categoryHandler.CategoryTree)
				categories.GET("/create", categoryHandler.CreateCategoryForm)
				categories.GET("/selector", categoryHandler.CategorySelector)
				categories.POST("", categoryHandler.CreateCategory)
				categories.GET("/:id/children", categoryHandler.LoadCategoryChildren)
				categories.GET("/:id/edit", categoryHandler.EditCategoryForm)
				categories.PUT("/:id", categoryHandler.UpdateCategory)
				categories.DELETE("/:id", categoryHandler.DeleteCategory)
			}
		}
	}
}