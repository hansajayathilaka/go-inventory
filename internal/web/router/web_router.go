package router

import (
	"github.com/gin-gonic/gin"

	"inventory-api/internal/web/handlers"
	"inventory-api/internal/web/middleware"
)

func SetupWebRoutes(router *gin.Engine) {
	// Serve static files
	router.Static("/static", "./web/static")
	
	// Initialize handlers
	authHandler := handlers.NewWebAuthHandler()
	dashboardHandler := handlers.NewWebDashboardHandler()
	
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
		
		protected.GET("/categories", func(c *gin.Context) {
			c.String(200, "Categories page - Coming soon")
		})
		
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
	}
}