package app

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

func (ctx *Context) SeedDatabase() error {
	log.Println("Seeding database with initial data...")
	
	context := context.Background()
	
	if err := ctx.seedUsers(context); err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}
	
	if err := ctx.seedLocations(context); err != nil {
		return fmt.Errorf("failed to seed locations: %w", err)
	}
	
	if err := ctx.seedSuppliers(context); err != nil {
		return fmt.Errorf("failed to seed suppliers: %w", err)
	}
	
	if err := ctx.seedCategories(context); err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}
	
	if err := ctx.seedProducts(context); err != nil {
		return fmt.Errorf("failed to seed products: %w", err)
	}
	
	if err := ctx.seedInventory(context); err != nil {
		return fmt.Errorf("failed to seed inventory: %w", err)
	}
	
	log.Println("Database seeding completed successfully")
	return nil
}

func (ctx *Context) seedUsers(ctxBg context.Context) error {
	// Check if admin user already exists
	if _, err := ctx.UserRepo.GetByUsername(ctxBg, "admin"); err == nil {
		log.Println("Users already exist, skipping user seeding")
		return nil
	}
	
	users := []struct {
		username string
		email    string
		password string
		role     models.UserRole
	}{
		{"admin", "admin@inventory.local", "admin123", models.RoleAdmin},
		{"manager", "manager@inventory.local", "manager123", models.RoleManager},
		{"staff", "staff@inventory.local", "staff123", models.RoleStaff},
		{"viewer", "viewer@inventory.local", "viewer123", models.RoleViewer},
	}
	
	for _, userData := range users {
		_, err := ctx.UserService.CreateUser(ctxBg, userData.username, userData.email, userData.password, userData.role)
		if err != nil {
			return fmt.Errorf("failed to create user %s: %w", userData.username, err)
		}
		log.Printf("Created user: %s (%s)", userData.username, userData.role)
	}
	
	return nil
}

func (ctx *Context) seedLocations(ctxBg context.Context) error {
	// Check if default hardware store location already exists
	if _, err := ctx.LocationRepo.GetByID(ctxBg, models.GetDefaultLocationID()); err == nil {
		log.Println("Default hardware store location already exists, skipping location seeding")
		return nil
	}
	
	// Create single default hardware store location
	location := models.GetDefaultLocation()
	if err := ctx.LocationRepo.Create(ctxBg, location); err != nil {
		return fmt.Errorf("failed to seed default hardware store location: %w", err)
	}
	
	log.Printf("Seeded default hardware store location: %s", location.Name)
	return nil
}

func (ctx *Context) seedSuppliers(ctxBg context.Context) error {
	// Check if suppliers already exist
	if count, _ := ctx.SupplierRepo.Count(ctxBg); count > 0 {
		log.Println("Suppliers already exist, skipping supplier seeding")
		return nil
	}
	
	suppliers := []models.Supplier{
		{Name: "Tech Components Inc", Code: "TECH001", Email: "orders@techcomponents.com", Phone: "555-0101", ContactName: "John Smith"},
		{Name: "Office Supplies Co", Code: "OFFC001", Email: "sales@officesupplies.com", Phone: "555-0102", ContactName: "Jane Doe"},
		{Name: "Manufacturing Parts Ltd", Code: "MANU001", Email: "procurement@manuparts.com", Phone: "555-0103", ContactName: "Bob Wilson"},
	}
	
	for _, supplier := range suppliers {
		if err := ctx.SupplierRepo.Create(ctxBg, &supplier); err != nil {
			return fmt.Errorf("failed to create supplier %s: %w", supplier.Name, err)
		}
		log.Printf("Created supplier: %s (%s)", supplier.Name, supplier.Code)
	}
	
	return nil
}

func (ctx *Context) seedCategories(ctxBg context.Context) error {
	// Check if categories already exist
	if count, _ := ctx.CategoryRepo.Count(ctxBg); count > 0 {
		log.Println("Categories already exist, skipping category seeding")
		return nil
	}
	
	// Create root categories first
	electronics, err := ctx.HierarchyService.CreateCategory(ctxBg, "Electronics", "Electronic devices and components", nil)
	if err != nil {
		return fmt.Errorf("failed to create Electronics category: %w", err)
	}
	
	office, err := ctx.HierarchyService.CreateCategory(ctxBg, "Office Supplies", "Office and administrative supplies", nil)
	if err != nil {
		return fmt.Errorf("failed to create Office Supplies category: %w", err)
	}
	
	// Create subcategories
	subcategories := []struct {
		name     string
		desc     string
		parentID uuid.UUID
	}{
		{"Computers", "Desktop and laptop computers", electronics.ID},
		{"Peripherals", "Keyboards, mice, monitors", electronics.ID},
		{"Networking", "Routers, switches, cables", electronics.ID},
		{"Stationery", "Pens, paper, notebooks", office.ID},
		{"Furniture", "Desks, chairs, storage", office.ID},
	}
	
	for _, cat := range subcategories {
		_, err := ctx.HierarchyService.CreateCategory(ctxBg, cat.name, cat.desc, &cat.parentID)
		if err != nil {
			return fmt.Errorf("failed to create category %s: %w", cat.name, err)
		}
		log.Printf("Created category: %s", cat.name)
	}
	
	return nil
}

func (ctx *Context) seedProducts(ctxBg context.Context) error {
	// Check if products already exist
	if count, _ := ctx.ProductRepo.Count(ctxBg); count > 0 {
		log.Println("Products already exist, skipping product seeding")
		return nil
	}
	
	// Get categories for products
	computers, err := ctx.CategoryRepo.GetByName(ctxBg, "Computers")
	if err != nil {
		return fmt.Errorf("failed to get Computers category: %w", err)
	}
	
	peripherals, err := ctx.CategoryRepo.GetByName(ctxBg, "Peripherals")
	if err != nil {
		return fmt.Errorf("failed to get Peripherals category: %w", err)
	}
	
	// Get suppliers
	suppliers, err := ctx.SupplierRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get suppliers: %w", err)
	}
	if len(suppliers) == 0 {
		return fmt.Errorf("no suppliers found for product seeding")
	}
	
	products := []models.Product{
		{SKU: "COMP001", Name: "Dell OptiPlex 7090", Description: "Business desktop computer", CategoryID: computers.ID, SupplierID: &suppliers[0].ID, CostPrice: 800.00, RetailPrice: 1200.00, WholesalePrice: 1000.00, Barcode: "1234567890123"},
		{SKU: "COMP002", Name: "HP EliteBook 850", Description: "Business laptop", CategoryID: computers.ID, SupplierID: &suppliers[0].ID, CostPrice: 1200.00, RetailPrice: 1800.00, WholesalePrice: 1500.00, Barcode: "1234567890124"},
		{SKU: "PERI001", Name: "Logitech MX Master 3", Description: "Wireless mouse", CategoryID: peripherals.ID, SupplierID: &suppliers[1].ID, CostPrice: 60.00, RetailPrice: 100.00, WholesalePrice: 80.00, Barcode: "1234567890125"},
		{SKU: "PERI002", Name: "Dell UltraSharp U2722DE", Description: "27-inch monitor", CategoryID: peripherals.ID, SupplierID: &suppliers[0].ID, CostPrice: 400.00, RetailPrice: 600.00, WholesalePrice: 500.00, Barcode: "1234567890126"},
	}
	
	for _, product := range products {
		if err := ctx.ProductRepo.Create(ctxBg, &product); err != nil {
			return fmt.Errorf("failed to create product %s: %w", product.Name, err)
		}
		log.Printf("Created product: %s (%s)", product.Name, product.SKU)
	}
	
	return nil
}

func (ctx *Context) seedInventory(ctxBg context.Context) error {
	// Check if inventory already exists
	if count, _ := ctx.InventoryRepo.Count(ctxBg); count > 0 {
		log.Println("Inventory already exists, skipping inventory seeding")
		return nil
	}
	
	// Get products and locations
	products, err := ctx.ProductRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}
	
	// For single hardware store, use default location only
	defaultLocation := models.GetDefaultLocation()
	locations := []*models.Location{defaultLocation}
	
	if len(products) == 0 || len(locations) == 0 {
		return fmt.Errorf("need products and locations for inventory seeding")
	}
	
	// Create inventory records for each product in the main warehouse
	warehouse := locations[0]
	for _, product := range products {
		_, err := ctx.InventoryService.CreateInventory(ctxBg, product.ID, warehouse.ID, 50, 10, 100)
		if err != nil {
			return fmt.Errorf("failed to create inventory for product %s: %w", product.Name, err)
		}
		log.Printf("Created inventory: %s at %s (50 units)", product.Name, warehouse.Name)
	}
	
	return nil
}