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
	
	if err := ctx.seedCustomers(context); err != nil {
		return fmt.Errorf("failed to seed customers: %w", err)
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
	orderDate2, _ := time.Parse("2006-01-02", "2024-01-20")
	orderDate3, _ := time.Parse("2006-01-02", "2024-01-25")
	
	// Create sample purchase receipts showing the unified workflow
	purchaseReceipts := []models.PurchaseReceipt{
		{
			ReceiptNumber:          "PR-2024-001",
			SupplierID:             suppliers[0].ID,
			Status:                 models.PurchaseReceiptStatusCompleted,
			PurchaseDate:           orderDate1,
			SupplierBillNumber:     "SUP-001-2024",
			BillDiscountAmount:     100.00,
			BillDiscountPercentage: 0.00,
			TotalAmount:            2500.00,
			Notes:                  "First purchase receipt - office equipment",
			CreatedByID:            adminUser.ID,
		},
		{
			ReceiptNumber:          "PR-2024-002",
			SupplierID:             suppliers[1].ID,
			Status:                 models.PurchaseReceiptStatusPending,
			PurchaseDate:           orderDate2,
			SupplierBillNumber:     "SUP-002-2024",
			BillDiscountAmount:     0.00,
			BillDiscountPercentage: 5.00,
			TotalAmount:            1800.00,
			Notes:                  "Computer peripherals order",
			CreatedByID:            adminUser.ID,
		},
		{
			ReceiptNumber:          "PR-2024-003",
			SupplierID:             suppliers[0].ID,
			Status:                 models.PurchaseReceiptStatusReceived,
			PurchaseDate:           orderDate3,
			SupplierBillNumber:     "SUP-003-2024",
			BillDiscountAmount:     0.00,
			BillDiscountPercentage: 0.00,
			TotalAmount:            3200.00,
			Notes:                  "Draft purchase for networking equipment",
			CreatedByID:            adminUser.ID,
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
				PurchaseReceiptID:      purchaseReceipt.ID,
				ProductID:              products[i%len(products)].ID,
				Quantity:               10,
				UnitCost:               100.00,
				ItemDiscountAmount:     0.00,
				ItemDiscountPercentage: 0.00,
				LineTotal:              1000.00,
			},
		}
		
		// Add a second item for variety
		if i+1 < len(products) {
			items = append(items, models.PurchaseReceiptItem{
				PurchaseReceiptID:      purchaseReceipt.ID,
				ProductID:              products[(i+1)%len(products)].ID,
				Quantity:               5,
				UnitCost:               200.00,
				ItemDiscountAmount:     50.00,
				ItemDiscountPercentage: 0.00,
				LineTotal:              950.00,
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