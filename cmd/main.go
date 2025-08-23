package main

import (
	"fmt"
	"log"
	"os"

	"tui-inventory/internal/app"
	"tui-inventory/internal/ui/models"

	tea "github.com/charmbracelet/bubbletea/v2"
)

func main() {
	// Initialize application context
	appCtx, err := app.NewContext()
	if err != nil {
		log.Fatal("Failed to initialize application:", err)
	}
	defer appCtx.Close()

	// Initialize session manager
	sessionMgr := app.NewSessionManager(appCtx)

	if len(os.Getenv("DEBUG")) > 0 {
		f, err := tea.LogToFile("debug.log", "debug")
		if err != nil {
			fmt.Println("fatal:", err)
			os.Exit(1)
		}
		defer f.Close()
	}

	fmt.Println("TUI Inventory Management System")
	fmt.Println("===============================")
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

	fmt.Println("Starting application...")
	fmt.Println()

	// Create main menu with application context
	mainMenu := models.NewMainMenuWithContext(appCtx, sessionMgr)
	p := tea.NewProgram(mainMenu)

	if _, err := p.Run(); err != nil {
		log.Fatal("Error running program:", err)
	}
}
