// @title Inventory Management API
// @version 1.0
// @description A comprehensive inventory management system API with multi-location support, JWT authentication, and role-based access control
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:9090
// @BasePath /api/v1
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

package main

import (
	"fmt"
	"log"
	"os"

	_ "inventory-api/docs" // Import generated docs
	"inventory-api/internal/api/router"
	"inventory-api/internal/app"
)

func main() {
	// Initialize application context
	appCtx, err := app.NewContext()
	if err != nil {
		log.Fatal("Failed to initialize application:", err)
	}
	defer appCtx.Close()

	fmt.Println("Inventory Management API")
	fmt.Println("=======================")
	fmt.Printf("Database: Connected to %s:%d/%s\n",
		appCtx.Config.Database.Host,
		appCtx.Config.Database.Port,
		appCtx.Config.Database.DBName)

	// Check for seed flag
	if len(os.Args) > 1 && os.Args[1] == "--seed" {
		fmt.Println("Seeding database with initial data...")
		if err := appCtx.SeedDatabase(); err != nil {
			log.Fatal("Failed to seed database:", err)
		}
		fmt.Println("Database seeding completed. You can now run the application normally.")
		return
	}

	// Initialize router with all routes and middleware (API + React)
	r := router.SetupRouter(appCtx)

	fmt.Println("Hardware Store Inventory System")
	fmt.Println("===============================")
	fmt.Println("🚀 Single Executable Deployment")
	fmt.Println("📦 React Frontend + Go API Backend")
	fmt.Println()
	fmt.Println("Server running on :9090")
	fmt.Println("Web Interface: http://localhost:9090")
	fmt.Println("API Base: http://localhost:9090/api/v1")
	fmt.Println("Swagger UI: http://localhost:9090/docs/index.html")
	fmt.Println()
	fmt.Println("Perfect for hardware store inventory management!")
	fmt.Println()

	log.Fatal(r.Run(":9090"))
}
