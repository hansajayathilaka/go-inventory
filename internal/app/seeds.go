package app

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

func (ctx *Context) SeedDatabase() error {
	log.Println("Seeding database with initial data...")
	
	context := context.Background()
	
	if err := ctx.seedUsers(context); err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
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
	
	if err := ctx.seedBrands(context); err != nil {
		return fmt.Errorf("failed to seed brands: %w", err)
	}
	
	if err := ctx.seedVehicleBrands(context); err != nil {
		return fmt.Errorf("failed to seed vehicle brands: %w", err)
	}
	
	if err := ctx.seedVehicleModels(context); err != nil {
		return fmt.Errorf("failed to seed vehicle models: %w", err)
	}
	
	if err := ctx.seedCustomers(context); err != nil {
		return fmt.Errorf("failed to seed customers: %w", err)
	}
	
	if err := ctx.seedVehicleCompatibility(context); err != nil {
		return fmt.Errorf("failed to seed vehicle compatibility: %w", err)
	}
	
	if err := ctx.seedPurchaseReceipts(context); err != nil {
		return fmt.Errorf("failed to seed purchase receipts: %w", err)
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
	
	// Get products
	products, err := ctx.ProductRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}
	
	if len(products) == 0 {
		return fmt.Errorf("need products for inventory seeding")
	}
	
	// Create inventory records for each product (single location system)
	for _, product := range products {
		_, err := ctx.InventoryService.CreateInventory(ctxBg, product.ID, 50, 10, 100)
		if err != nil {
			return fmt.Errorf("failed to create inventory for product %s: %w", product.Name, err)
		}
		log.Printf("Created inventory: %s (50 units)", product.Name)
	}
	
	return nil
}

func (ctx *Context) seedBrands(ctxBg context.Context) error {
	// Check if brands already exist
	if count, _ := ctx.BrandRepo.Count(ctxBg); count > 0 {
		log.Println("Brands already exist, skipping brand seeding")
		return nil
	}
	
	brands := []models.Brand{
		{Name: "Bosch", Code: "BSH", Description: "German automotive parts manufacturer", CountryCode: "DE", Website: "https://www.bosch.com"},
		{Name: "NGK", Code: "NGK", Description: "Japanese spark plug and oxygen sensor manufacturer", CountryCode: "JP", Website: "https://www.ngk.com"},
		{Name: "Denso", Code: "DNS", Description: "Japanese automotive components supplier", CountryCode: "JP", Website: "https://www.denso.com"},
		{Name: "ACDelco", Code: "ACD", Description: "General Motors parts division", CountryCode: "US", Website: "https://www.acdelco.com"},
		{Name: "Fram", Code: "FRM", Description: "American automotive filter manufacturer", CountryCode: "US", Website: "https://www.fram.com"},
		{Name: "Mobil 1", Code: "MB1", Description: "Premium motor oil brand", CountryCode: "US", Website: "https://www.mobil1.com"},
		{Name: "Castrol", Code: "CTL", Description: "British oil and lubricants company", CountryCode: "GB", Website: "https://www.castrol.com"},
		{Name: "Valvoline", Code: "VLV", Description: "American petroleum company", CountryCode: "US", Website: "https://www.valvoline.com"},
		{Name: "Mann-Filter", Code: "MNF", Description: "German automotive filter manufacturer", CountryCode: "DE", Website: "https://www.mann-filter.com"},
		{Name: "Mahle", Code: "MHL", Description: "German automotive parts manufacturer", CountryCode: "DE", Website: "https://www.mahle.com"},
	}
	
	for _, brand := range brands {
		if err := ctx.BrandRepo.Create(ctxBg, &brand); err != nil {
			return fmt.Errorf("failed to create brand %s: %w", brand.Name, err)
		}
		log.Printf("Created brand: %s (%s)", brand.Name, brand.CountryCode)
	}
	
	return nil
}

func (ctx *Context) seedVehicleBrands(ctxBg context.Context) error {
	// Check if vehicle brands already exist
	if count, _ := ctx.VehicleBrandRepo.Count(ctxBg); count > 0 {
		log.Println("Vehicle brands already exist, skipping vehicle brand seeding")
		return nil
	}
	
	vehicleBrands := []models.VehicleBrand{
		{Name: "Toyota", Code: "TOY", CountryCode: "JP", Description: "Japanese automotive manufacturer founded 1937"},
		{Name: "Honda", Code: "HON", CountryCode: "JP", Description: "Japanese automotive manufacturer founded 1948"},
		{Name: "Nissan", Code: "NIS", CountryCode: "JP", Description: "Japanese automotive manufacturer founded 1933"},
		{Name: "Mazda", Code: "MAZ", CountryCode: "JP", Description: "Japanese automotive manufacturer founded 1920"},
		{Name: "Subaru", Code: "SUB", CountryCode: "JP", Description: "Japanese automotive manufacturer founded 1953"},
		{Name: "Ford", Code: "FOR", CountryCode: "US", Description: "American automotive manufacturer founded 1903"},
		{Name: "Chevrolet", Code: "CHV", CountryCode: "US", Description: "American automotive manufacturer founded 1911"},
		{Name: "BMW", Code: "BMW", CountryCode: "DE", Description: "German automotive manufacturer founded 1916"},
		{Name: "Mercedes-Benz", Code: "MBZ", CountryCode: "DE", Description: "German automotive manufacturer founded 1926"},
		{Name: "Audi", Code: "AUD", CountryCode: "DE", Description: "German automotive manufacturer founded 1909"},
		{Name: "Volkswagen", Code: "VWG", CountryCode: "DE", Description: "German automotive manufacturer founded 1937"},
		{Name: "Hyundai", Code: "HYU", CountryCode: "KR", Description: "South Korean automotive manufacturer founded 1967"},
		{Name: "Kia", Code: "KIA", CountryCode: "KR", Description: "South Korean automotive manufacturer founded 1944"},
	}
	
	for _, vehicleBrand := range vehicleBrands {
		if err := ctx.VehicleBrandRepo.Create(ctxBg, &vehicleBrand); err != nil {
			return fmt.Errorf("failed to create vehicle brand %s: %w", vehicleBrand.Name, err)
		}
		log.Printf("Created vehicle brand: %s (%s)", vehicleBrand.Name, vehicleBrand.CountryCode)
	}
	
	return nil
}

func (ctx *Context) seedVehicleModels(ctxBg context.Context) error {
	// Check if vehicle models already exist
	if count, _ := ctx.VehicleModelRepo.Count(ctxBg); count > 0 {
		log.Println("Vehicle models already exist, skipping vehicle model seeding")
		return nil
	}
	
	// Get vehicle brands for models
	toyota, err := ctx.VehicleBrandRepo.GetByName(ctxBg, "Toyota")
	if err != nil {
		return fmt.Errorf("failed to get Toyota brand: %w", err)
	}
	
	honda, err := ctx.VehicleBrandRepo.GetByName(ctxBg, "Honda")
	if err != nil {
		return fmt.Errorf("failed to get Honda brand: %w", err)
	}
	
	nissan, err := ctx.VehicleBrandRepo.GetByName(ctxBg, "Nissan")
	if err != nil {
		return fmt.Errorf("failed to get Nissan brand: %w", err)
	}
	
	ford, err := ctx.VehicleBrandRepo.GetByName(ctxBg, "Ford")
	if err != nil {
		return fmt.Errorf("failed to get Ford brand: %w", err)
	}
	
	vehicleModels := []models.VehicleModel{
		// Toyota models
		{Name: "Camry", Code: "TOY-CAM", VehicleBrandID: toyota.ID, Description: "Mid-size sedan", YearFrom: 1982, YearTo: 0, EngineSize: "2.5L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Corolla", Code: "TOY-COR", VehicleBrandID: toyota.ID, Description: "Compact car", YearFrom: 1966, YearTo: 0, EngineSize: "1.8L", FuelType: "Gasoline", Transmission: "Manual/Auto"},
		{Name: "RAV4", Code: "TOY-RAV", VehicleBrandID: toyota.ID, Description: "Compact SUV", YearFrom: 1994, YearTo: 0, EngineSize: "2.5L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Prius", Code: "TOY-PRI", VehicleBrandID: toyota.ID, Description: "Hybrid sedan", YearFrom: 1997, YearTo: 0, EngineSize: "1.8L", FuelType: "Hybrid", Transmission: "CVT"},
		{Name: "Highlander", Code: "TOY-HIG", VehicleBrandID: toyota.ID, Description: "Mid-size SUV", YearFrom: 2001, YearTo: 0, EngineSize: "3.5L", FuelType: "Gasoline", Transmission: "Automatic"},
		
		// Honda models
		{Name: "Civic", Code: "HON-CIV", VehicleBrandID: honda.ID, Description: "Compact car", YearFrom: 1972, YearTo: 0, EngineSize: "1.5L", FuelType: "Gasoline", Transmission: "Manual/Auto"},
		{Name: "Accord", Code: "HON-ACC", VehicleBrandID: honda.ID, Description: "Mid-size sedan", YearFrom: 1976, YearTo: 0, EngineSize: "2.0L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "CR-V", Code: "HON-CRV", VehicleBrandID: honda.ID, Description: "Compact SUV", YearFrom: 1995, YearTo: 0, EngineSize: "1.5L", FuelType: "Gasoline", Transmission: "CVT"},
		{Name: "Pilot", Code: "HON-PIL", VehicleBrandID: honda.ID, Description: "Mid-size SUV", YearFrom: 2002, YearTo: 0, EngineSize: "3.5L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Fit", Code: "HON-FIT", VehicleBrandID: honda.ID, Description: "Subcompact car", YearFrom: 2001, YearTo: 2020, EngineSize: "1.5L", FuelType: "Gasoline", Transmission: "Manual/CVT"},
		
		// Nissan models
		{Name: "Altima", Code: "NIS-ALT", VehicleBrandID: nissan.ID, Description: "Mid-size sedan", YearFrom: 1992, YearTo: 0, EngineSize: "2.5L", FuelType: "Gasoline", Transmission: "CVT"},
		{Name: "Sentra", Code: "NIS-SEN", VehicleBrandID: nissan.ID, Description: "Compact sedan", YearFrom: 1982, YearTo: 0, EngineSize: "1.6L", FuelType: "Gasoline", Transmission: "Manual/CVT"},
		{Name: "Rogue", Code: "NIS-ROG", VehicleBrandID: nissan.ID, Description: "Compact SUV", YearFrom: 2007, YearTo: 0, EngineSize: "2.5L", FuelType: "Gasoline", Transmission: "CVT"},
		{Name: "Pathfinder", Code: "NIS-PAT", VehicleBrandID: nissan.ID, Description: "Mid-size SUV", YearFrom: 1985, YearTo: 0, EngineSize: "3.5L", FuelType: "Gasoline", Transmission: "CVT"},
		{Name: "370Z", Code: "NIS-370", VehicleBrandID: nissan.ID, Description: "Sports car", YearFrom: 2009, YearTo: 2020, EngineSize: "3.7L", FuelType: "Gasoline", Transmission: "Manual/Auto"},
		
		// Ford models
		{Name: "F-150", Code: "FOR-F15", VehicleBrandID: ford.ID, Description: "Full-size pickup truck", YearFrom: 1948, YearTo: 0, EngineSize: "5.0L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Mustang", Code: "FOR-MUS", VehicleBrandID: ford.ID, Description: "Sports car", YearFrom: 1964, YearTo: 0, EngineSize: "5.0L", FuelType: "Gasoline", Transmission: "Manual/Auto"},
		{Name: "Explorer", Code: "FOR-EXP", VehicleBrandID: ford.ID, Description: "Mid-size SUV", YearFrom: 1990, YearTo: 0, EngineSize: "3.0L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Fusion", Code: "FOR-FUS", VehicleBrandID: ford.ID, Description: "Mid-size sedan", YearFrom: 2005, YearTo: 2020, EngineSize: "2.5L", FuelType: "Gasoline", Transmission: "Automatic"},
		{Name: "Escape", Code: "FOR-ESC", VehicleBrandID: ford.ID, Description: "Compact SUV", YearFrom: 2000, YearTo: 0, EngineSize: "2.0L", FuelType: "Gasoline", Transmission: "Automatic"},
	}
	
	for _, vehicleModel := range vehicleModels {
		if err := ctx.VehicleModelRepo.Create(ctxBg, &vehicleModel); err != nil {
			return fmt.Errorf("failed to create vehicle model %s: %w", vehicleModel.Name, err)
		}
		log.Printf("Created vehicle model: %s (%s)", vehicleModel.Name, vehicleModel.Description)
	}
	
	return nil
}

func (ctx *Context) seedCustomers(ctxBg context.Context) error {
	// Check if customers already exist
	if count, _ := ctx.CustomerRepo.Count(ctxBg); count > 0 {
		log.Println("Customers already exist, skipping customer seeding")
		return nil
	}
	
	customers := []models.Customer{
		{
			Name:        "John Smith",
			Code:        "CUST001",
			Email:       "john.smith@email.com",
			Phone:       "555-0101",
			Address:     "123 Main St",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62701",
			Country:     "USA",
			CreditLimit: 1000.00,
		},
		{
			Name:        "Sarah Johnson",
			Code:        "CUST002",
			Email:       "sarah.johnson@email.com",
			Phone:       "555-0102",
			Address:     "456 Oak Ave",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62702",
			Country:     "USA",
			CreditLimit: 750.00,
		},
		{
			Name:        "ABC Auto Repair (Mike Wilson)",
			Code:        "CUST003",
			Email:       "mike@abcautorepair.com",
			Phone:       "555-0103",
			Address:     "789 Industrial Blvd",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62703",
			Country:     "USA",
			CreditLimit: 5000.00,
			Notes:       "Wholesale automotive repair shop",
		},
		{
			Name:        "XYZ Motors (Lisa Davis)",
			Code:        "CUST004",
			Email:       "lisa@xyzmotors.com",
			Phone:       "555-0104",
			Address:     "321 Commerce Dr",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62704",
			Country:     "USA",
			CreditLimit: 7500.00,
			Notes:       "Automotive dealership",
		},
		{
			Name:        "Robert Brown",
			Code:        "CUST005",
			Email:       "robert.brown@email.com",
			Phone:       "555-0105",
			Address:     "654 Pine St",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62705",
			Country:     "USA",
			CreditLimit: 500.00,
		},
	}
	
	for _, customer := range customers {
		if err := ctx.CustomerRepo.Create(ctxBg, &customer); err != nil {
			return fmt.Errorf("failed to create customer %s: %w", customer.Code, err)
		}
		log.Printf("Created customer: %s (%s)", customer.Name, customer.Code)
	}
	
	return nil
}

func (ctx *Context) seedVehicleCompatibility(ctxBg context.Context) error {
	// Check if vehicle compatibility already exists
	if count, _ := ctx.VehicleCompatibilityRepo.Count(ctxBg); count > 0 {
		log.Println("Vehicle compatibility already exists, skipping vehicle compatibility seeding")
		return nil
	}
	
	// Get some products and vehicle models for compatibility mapping
	products, err := ctx.ProductRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}
	
	vehicleModels, err := ctx.VehicleModelRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get vehicle models: %w", err)
	}
	
	if len(products) == 0 || len(vehicleModels) == 0 {
		log.Println("No products or vehicle models found, skipping vehicle compatibility seeding")
		return nil
	}
	
	// Create some sample compatibility mappings
	// In a real system, this would be much more comprehensive
	compatibilities := []models.VehicleCompatibility{
		{
			ProductID:      products[0].ID, // First product compatible with first 3 vehicle models
			VehicleModelID: vehicleModels[0].ID,
			YearFrom:       2018,
			YearTo:         0, // Current (0 means no end year)
			Notes:          "Direct fit replacement part",
		},
		{
			ProductID:      products[0].ID,
			VehicleModelID: vehicleModels[1].ID,
			YearFrom:       2016,
			YearTo:         0,
			Notes:          "Compatible with standard trim",
		},
		{
			ProductID:      products[0].ID,
			VehicleModelID: vehicleModels[2].ID,
			YearFrom:       2015,
			YearTo:         2022,
			Notes:          "Compatible with specific engine configurations",
		},
		{
			ProductID:      products[1].ID, // Second product compatible with different models
			VehicleModelID: vehicleModels[3].ID,
			YearFrom:       2019,
			YearTo:         0,
			Notes:          "OEM specification part",
		},
		{
			ProductID:      products[1].ID,
			VehicleModelID: vehicleModels[4].ID,
			YearFrom:       2017,
			YearTo:         0,
			Notes:          "Performance upgrade option",
		},
	}
	
	for _, compatibility := range compatibilities {
		if err := ctx.VehicleCompatibilityRepo.Create(ctxBg, &compatibility); err != nil {
			return fmt.Errorf("failed to create vehicle compatibility: %w", err)
		}
		log.Printf("Created vehicle compatibility mapping for product ID %s", compatibility.ProductID.String())
	}
	
	return nil
}

func (ctx *Context) seedPurchaseReceipts(ctxBg context.Context) error {
	// Check if purchase receipts already exist by trying to list some
	existing, _, err := ctx.PurchaseReceiptRepo.List(ctxBg, 0, 1)
	if err == nil && len(existing) > 0 {
		log.Println("Purchase receipts already exist, skipping purchase receipt seeding")
		return nil
	}
	
	// Get suppliers and products for purchase receipts
	suppliers, err := ctx.SupplierRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get suppliers: %w", err)
	}
	
	products, err := ctx.ProductRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}
	
	if len(suppliers) == 0 || len(products) == 0 {
		log.Println("No suppliers or products found, skipping purchase receipt seeding")
		return nil
	}

	// Get first admin user for CreatedByID
	adminUser, err := ctx.UserRepo.GetByUsername(ctxBg, "admin")
	if err != nil {
		return fmt.Errorf("failed to get admin user: %w", err)
	}
	
	// Parse dates
	orderDate1, _ := time.Parse("2006-01-02", "2024-01-15")
	expectedDate1, _ := time.Parse("2006-01-02", "2024-01-20")
	receivedDate1, _ := time.Parse("2006-01-02", "2024-01-19")
	
	orderDate2, _ := time.Parse("2006-01-02", "2024-01-20")
	expectedDate2, _ := time.Parse("2006-01-02", "2024-01-28")
	
	orderDate3, _ := time.Parse("2006-01-02", "2024-01-25")
	expectedDate3, _ := time.Parse("2006-01-02", "2024-02-05")
	
	// Create sample purchase receipts showing the unified workflow
	purchaseReceipts := []models.PurchaseReceipt{
		{
			ReceiptNumber:  "PR-2024-001",
			SupplierID:     suppliers[0].ID,
			Status:         models.PurchaseReceiptStatusCompleted,
			OrderDate:      orderDate1,
			ExpectedDate:   &expectedDate1,
			ReceivedDate:   &receivedDate1,
			TotalAmount:    2500.00,
			TaxRate:        8.5,
			ShippingCost:   50.00,
			DiscountAmount: 100.00,
			Currency:       "USD",
			OrderNotes:     "First purchase receipt - office equipment",
			CreatedByID:    adminUser.ID,
		},
		{
			ReceiptNumber:  "PR-2024-002", 
			SupplierID:     suppliers[1].ID,
			Status:         models.PurchaseReceiptStatusOrdered,
			OrderDate:      orderDate2,
			ExpectedDate:   &expectedDate2,
			TotalAmount:    1800.00,
			TaxRate:        8.5,
			Currency:       "USD",
			OrderNotes:     "Computer peripherals order",
			CreatedByID:    adminUser.ID,
		},
		{
			ReceiptNumber:  "PR-2024-003",
			SupplierID:     suppliers[0].ID, 
			Status:         models.PurchaseReceiptStatusDraft,
			OrderDate:      orderDate3,
			ExpectedDate:   &expectedDate3,
			TotalAmount:    3200.00,
			TaxRate:        8.5,
			ShippingCost:   75.00,
			Currency:       "USD",
			OrderNotes:     "Draft purchase for networking equipment",
			CreatedByID:    adminUser.ID,
		},
	}
	
	for i, purchaseReceipt := range purchaseReceipts {
		if err := ctx.PurchaseReceiptRepo.Create(ctxBg, &purchaseReceipt); err != nil {
			return fmt.Errorf("failed to create purchase receipt %s: %w", purchaseReceipt.ReceiptNumber, err)
		}
		log.Printf("Created purchase receipt: %s (%s)", purchaseReceipt.ReceiptNumber, purchaseReceipt.Status)
		
		// Add some items to each purchase receipt
		items := []models.PurchaseReceiptItem{
			{
				PurchaseReceiptID: purchaseReceipt.ID,
				ProductID:         products[i%len(products)].ID,
				OrderedQuantity:   10,
				ReceivedQuantity:  10,
				AcceptedQuantity:  10,
				UnitPrice:        100.00,
				TotalPrice:       1000.00,
			},
		}
		
		// Add a second item for variety
		if i+1 < len(products) {
			items = append(items, models.PurchaseReceiptItem{
				PurchaseReceiptID: purchaseReceipt.ID,
				ProductID:         products[(i+1)%len(products)].ID,
				OrderedQuantity:   5,
				ReceivedQuantity:  5,
				AcceptedQuantity:  4, // Show some quality control
				RejectedQuantity:  1,
				UnitPrice:        200.00,
				TotalPrice:       1000.00,
				QualityNotes:     "1 unit damaged in shipping",
			})
		}
		
		for _, item := range items {
			if err := ctx.PurchaseReceiptRepo.CreateItem(ctxBg, &item); err != nil {
				return fmt.Errorf("failed to add item to purchase receipt %s: %w", purchaseReceipt.ReceiptNumber, err)
			}
		}
		
		log.Printf("Added %d items to purchase receipt: %s", len(items), purchaseReceipt.ReceiptNumber)
	}
	
	return nil
}