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
	log.Println("Seeding database with hardware store data...")

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

	if err := ctx.seedBrands(context); err != nil {
		return fmt.Errorf("failed to seed brands: %w", err)
	}

	if err := ctx.seedProducts(context); err != nil {
		return fmt.Errorf("failed to seed products: %w", err)
	}

	if err := ctx.seedInventory(context); err != nil {
		return fmt.Errorf("failed to seed inventory: %w", err)
	}

	if err := ctx.seedCustomers(context); err != nil {
		return fmt.Errorf("failed to seed customers: %w", err)
	}

	if err := ctx.seedPurchaseReceipts(context); err != nil {
		return fmt.Errorf("failed to seed purchase receipts: %w", err)
	}

	log.Println("Hardware store database seeding completed successfully")
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
		{"admin", "admin@hardwarestore.com", "admin123", models.RoleAdmin},
		{"manager", "manager@hardwarestore.com", "manager123", models.RoleManager},
		{"cashier1", "cashier1@hardwarestore.com", "staff123", models.RoleStaff},
		{"stockman", "stock@hardwarestore.com", "staff123", models.RoleStaff},
		{"viewer", "viewer@hardwarestore.com", "viewer123", models.RoleViewer},
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
		{Name: "Power Tools Direct", Code: "PTD001", Email: "orders@powertoolsdirect.com", Phone: "555-0101", ContactName: "Mike Sullivan", Address: "1234 Industrial Way"},
		{Name: "Hardware Wholesale Co", Code: "HWC002", Email: "sales@hardwarewholesale.com", Phone: "555-0102", ContactName: "Sarah Martinez", Address: "567 Supply Blvd"},
		{Name: "Fasteners & Fixings Ltd", Code: "FFL003", Email: "info@fastenersltd.com", Phone: "555-0103", ContactName: "David Chen", Address: "890 Commerce St"},
		{Name: "Paint & Coatings Supply", Code: "PCS004", Email: "orders@paintcoatings.com", Phone: "555-0104", ContactName: "Lisa Johnson", Address: "345 Chemical Ave"},
		{Name: "Electrical Components Corp", Code: "ECC005", Email: "procurement@electricalcorp.com", Phone: "555-0105", ContactName: "Robert Williams", Address: "678 Circuit Dr"},
		{Name: "Plumbing Supply House", Code: "PSH006", Email: "sales@plumbingsupply.com", Phone: "555-0106", ContactName: "Jennifer Brown", Address: "234 Pipeline Rd"},
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

	// Create root categories for hardware store
	powerTools, err := ctx.HierarchyService.CreateCategory(ctxBg, "Power Tools", "Electric and battery-powered tools", nil)
	if err != nil {
		return fmt.Errorf("failed to create Power Tools category: %w", err)
	}

	handTools, err := ctx.HierarchyService.CreateCategory(ctxBg, "Hand Tools", "Manual tools and instruments", nil)
	if err != nil {
		return fmt.Errorf("failed to create Hand Tools category: %w", err)
	}

	fasteners, err := ctx.HierarchyService.CreateCategory(ctxBg, "Fasteners", "Screws, bolts, nails and hardware", nil)
	if err != nil {
		return fmt.Errorf("failed to create Fasteners category: %w", err)
	}

	electrical, err := ctx.HierarchyService.CreateCategory(ctxBg, "Electrical", "Electrical supplies and components", nil)
	if err != nil {
		return fmt.Errorf("failed to create Electrical category: %w", err)
	}

	plumbing, err := ctx.HierarchyService.CreateCategory(ctxBg, "Plumbing", "Plumbing supplies and fixtures", nil)
	if err != nil {
		return fmt.Errorf("failed to create Plumbing category: %w", err)
	}

	paint, err := ctx.HierarchyService.CreateCategory(ctxBg, "Paint & Coatings", "Paints, stains, and protective coatings", nil)
	if err != nil {
		return fmt.Errorf("failed to create Paint & Coatings category: %w", err)
	}

	lumber, err := ctx.HierarchyService.CreateCategory(ctxBg, "Lumber & Building Materials", "Wood, steel, and construction materials", nil)
	if err != nil {
		return fmt.Errorf("failed to create Lumber category: %w", err)
	}

	// Create subcategories
	subcategories := []struct {
		name     string
		desc     string
		parentID uuid.UUID
	}{
		// Power Tools subcategories
		{"Drills", "Electric and cordless drills", powerTools.ID},
		{"Saws", "Circular saws, jigsaws, reciprocating saws", powerTools.ID},
		{"Sanders", "Orbital sanders, belt sanders", powerTools.ID},
		{"Grinders", "Angle grinders and bench grinders", powerTools.ID},

		// Hand Tools subcategories
		{"Wrenches", "Adjustable, combination, and socket wrenches", handTools.ID},
		{"Screwdrivers", "Phillips, flathead, and specialty screwdrivers", handTools.ID},
		{"Hammers", "Claw hammers, sledgehammers, mallets", handTools.ID},
		{"Measuring Tools", "Tape measures, levels, squares", handTools.ID},

		// Fasteners subcategories
		{"Screws", "Wood screws, machine screws, self-drilling", fasteners.ID},
		{"Bolts & Nuts", "Hex bolts, carriage bolts, nuts and washers", fasteners.ID},
		{"Nails", "Common nails, finishing nails, specialty nails", fasteners.ID},
		{"Anchors", "Wall anchors, concrete anchors, toggle bolts", fasteners.ID},

		// Electrical subcategories
		{"Wire & Cable", "Electrical wire, extension cords, cable", electrical.ID},
		{"Outlets & Switches", "Electrical outlets, switches, covers", electrical.ID},
		{"Circuit Protection", "Breakers, fuses, surge protectors", electrical.ID},
		{"Lighting", "Light fixtures, bulbs, ballasts", electrical.ID},

		// Plumbing subcategories
		{"Pipes & Fittings", "PVC, copper, and steel pipes and fittings", plumbing.ID},
		{"Valves", "Ball valves, gate valves, shut-off valves", plumbing.ID},
		{"Fixtures", "Faucets, toilets, sinks", plumbing.ID},
		{"Water Heaters", "Tank and tankless water heaters", plumbing.ID},

		// Paint subcategories
		{"Interior Paint", "Wall paint, primer, ceiling paint", paint.ID},
		{"Exterior Paint", "House paint, deck stain, trim paint", paint.ID},
		{"Spray Paint", "Aerosol paints and specialty coatings", paint.ID},
		{"Paint Supplies", "Brushes, rollers, drop cloths", paint.ID},

		// Lumber subcategories
		{"Dimensional Lumber", "2x4, 2x6, 2x8 construction lumber", lumber.ID},
		{"Sheet Goods", "Plywood, OSB, drywall", lumber.ID},
		{"Trim & Molding", "Baseboards, crown molding, window trim", lumber.ID},
		{"Hardware", "Hinges, handles, cabinet hardware", lumber.ID},
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

func (ctx *Context) seedBrands(ctxBg context.Context) error {
	// Check if brands already exist
	if count, _ := ctx.BrandRepo.Count(ctxBg); count > 0 {
		log.Println("Brands already exist, skipping brand seeding")
		return nil
	}

	brands := []models.Brand{
		{Name: "DeWalt", Code: "DWT", Description: "Professional power tools and accessories", CountryCode: "US", Website: "https://www.dewalt.com"},
		{Name: "Milwaukee", Code: "MIL", Description: "Heavy-duty power tools and equipment", CountryCode: "US", Website: "https://www.milwaukeetool.com"},
		{Name: "Makita", Code: "MAK", Description: "Innovative power tools and outdoor equipment", CountryCode: "JP", Website: "https://www.makita.com"},
		{Name: "Bosch", Code: "BSH", Description: "Power tools and measuring equipment", CountryCode: "DE", Website: "https://www.bosch.com"},
		{Name: "Craftsman", Code: "CRA", Description: "Hand tools and power tools", CountryCode: "US", Website: "https://www.craftsman.com"},
		{Name: "Stanley", Code: "STA", Description: "Hand tools and storage solutions", CountryCode: "US", Website: "https://www.stanley.com"},
		{Name: "Klein Tools", Code: "KLN", Description: "Professional electrical tools", CountryCode: "US", Website: "https://www.kleintools.com"},
		{Name: "Ridgid", Code: "RDG", Description: "Plumbing and HVAC tools", CountryCode: "US", Website: "https://www.ridgid.com"},
		{Name: "Irwin", Code: "IRW", Description: "Hand tools and accessories", CountryCode: "US", Website: "https://www.irwin.com"},
		{Name: "Channellock", Code: "CHL", Description: "Professional pliers and tools", CountryCode: "US", Website: "https://www.channellock.com"},
		{Name: "Sherwin-Williams", Code: "SHW", Description: "Paints and coatings", CountryCode: "US", Website: "https://www.sherwin-williams.com"},
		{Name: "Benjamin Moore", Code: "BMO", Description: "Premium paints and finishes", CountryCode: "US", Website: "https://www.benjaminmoore.com"},
		{Name: "Home Depot", Code: "HDX", Description: "Hardware store brand products", CountryCode: "US", Website: "https://www.homedepot.com"},
		{Name: "Lowe's", Code: "LOW", Description: "Hardware store brand products", CountryCode: "US", Website: "https://www.lowes.com"},
		{Name: "3M", Code: "3M", Description: "Adhesives, abrasives, and tapes", CountryCode: "US", Website: "https://www.3m.com"},
	}

	for _, brand := range brands {
		if err := ctx.BrandRepo.Create(ctxBg, &brand); err != nil {
			return fmt.Errorf("failed to create brand %s: %w", brand.Name, err)
		}
		log.Printf("Created brand: %s (%s)", brand.Name, brand.CountryCode)
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
	drills, _ := ctx.CategoryRepo.GetByName(ctxBg, "Drills")
	saws, _ := ctx.CategoryRepo.GetByName(ctxBg, "Saws")
	wrenches, _ := ctx.CategoryRepo.GetByName(ctxBg, "Wrenches")
	hammers, _ := ctx.CategoryRepo.GetByName(ctxBg, "Hammers")
	screws, _ := ctx.CategoryRepo.GetByName(ctxBg, "Screws")
	bolts, _ := ctx.CategoryRepo.GetByName(ctxBg, "Bolts & Nuts")
	wire, _ := ctx.CategoryRepo.GetByName(ctxBg, "Wire & Cable")
	outlets, _ := ctx.CategoryRepo.GetByName(ctxBg, "Outlets & Switches")
	pipes, _ := ctx.CategoryRepo.GetByName(ctxBg, "Pipes & Fittings")
	valves, _ := ctx.CategoryRepo.GetByName(ctxBg, "Valves")
	interiorPaint, _ := ctx.CategoryRepo.GetByName(ctxBg, "Interior Paint")
	exteriorPaint, _ := ctx.CategoryRepo.GetByName(ctxBg, "Exterior Paint")
	lumber, _ := ctx.CategoryRepo.GetByName(ctxBg, "Dimensional Lumber")

	// Get suppliers and brands
	suppliers, _ := ctx.SupplierRepo.List(ctxBg, 10, 0)
	brands, _ := ctx.BrandRepo.List(ctxBg, 20, 0)

	// Helper function to find brand by name
	findBrand := func(name string) *uuid.UUID {
		for _, brand := range brands {
			if brand.Name == name {
				return &brand.ID
			}
		}
		return nil
	}

	products := []models.Product{
		// Power Tools - Drills
		{SKU: "DWT-DCD771C2", Name: "DeWalt 20V MAX Cordless Drill", Description: "Compact 20V MAX cordless drill with 2 batteries", CategoryID: drills.ID, SupplierID: &suppliers[0].ID, BrandID: findBrand("DeWalt"), CostPrice: 79.99, RetailPrice: 129.99, WholesalePrice: 109.99, Barcode: "885911387187"},
		{SKU: "MIL-2804-22", Name: "Milwaukee M18 Hammer Drill", Description: "M18 FUEL 1/2\" Hammer Drill/Driver", CategoryID: drills.ID, SupplierID: &suppliers[0].ID, BrandID: findBrand("Milwaukee"), CostPrice: 149.99, RetailPrice: 229.99, WholesalePrice: 189.99, Barcode: "045242316489"},
		{SKU: "MAK-XPH12Z", Name: "Makita 18V Hammer Drill", Description: "18V LXT Lithium-Ion 1/2\" Hammer Driver-Drill", CategoryID: drills.ID, SupplierID: &suppliers[0].ID, BrandID: findBrand("Makita"), CostPrice: 89.99, RetailPrice: 139.99, WholesalePrice: 119.99, Barcode: "088381-106511"},

		// Power Tools - Saws
		{SKU: "DWT-DCS570B", Name: "DeWalt 20V MAX Circular Saw", Description: "7-1/4\" 20V MAX Circular Saw (Tool Only)", CategoryID: saws.ID, SupplierID: &suppliers[0].ID, BrandID: findBrand("DeWalt"), CostPrice: 129.99, RetailPrice: 199.99, WholesalePrice: 169.99, Barcode: "885911478649"},
		{SKU: "MIL-2631-20", Name: "Milwaukee M18 Circular Saw", Description: "M18 7-1/4\" Circular Saw (Tool Only)", CategoryID: saws.ID, SupplierID: &suppliers[0].ID, BrandID: findBrand("Milwaukee"), CostPrice: 149.99, RetailPrice: 229.99, WholesalePrice: 189.99, Barcode: "045242364480"},

		// Hand Tools - Wrenches
		{SKU: "CRA-CMMT12024", Name: "Craftsman 24-pc Socket Set", Description: "1/4\" and 3/8\" Drive Socket Set", CategoryID: wrenches.ID, SupplierID: &suppliers[1].ID, BrandID: findBrand("Craftsman"), CostPrice: 39.99, RetailPrice: 69.99, WholesalePrice: 54.99, Barcode: "885911613019"},
		{SKU: "STA-STMT71652", Name: "Stanley Wrench Set", Description: "10-Piece Combination Wrench Set", CategoryID: wrenches.ID, SupplierID: &suppliers[1].ID, BrandID: findBrand("Stanley"), CostPrice: 24.99, RetailPrice: 39.99, WholesalePrice: 32.99, Barcode: "076174715521"},

		// Hand Tools - Hammers
		{SKU: "STA-51-616", Name: "Stanley Claw Hammer", Description: "16 oz Curved Claw Hammer", CategoryID: hammers.ID, SupplierID: &suppliers[1].ID, BrandID: findBrand("Stanley"), CostPrice: 12.99, RetailPrice: 19.99, WholesalePrice: 16.99, Barcode: "076174510430"},
		{SKU: "IRW-1954889", Name: "Irwin Fiberglass Hammer", Description: "16 oz Fiberglass Claw Hammer", CategoryID: hammers.ID, SupplierID: &suppliers[1].ID, BrandID: findBrand("Irwin"), CostPrice: 18.99, RetailPrice: 29.99, WholesalePrice: 24.99, Barcode: "024721511102"},

		// Fasteners - Screws
		{SKU: "SCR-WS-1-5/8", Name: "Wood Screws 1-5/8\"", Description: "#8 x 1-5/8\" Phillips Wood Screws (100 pack)", CategoryID: screws.ID, SupplierID: &suppliers[2].ID, CostPrice: 4.99, RetailPrice: 8.99, WholesalePrice: 6.99, Barcode: "123456789001"},
		{SKU: "SCR-WS-2-1/2", Name: "Wood Screws 2-1/2\"", Description: "#10 x 2-1/2\" Phillips Wood Screws (50 pack)", CategoryID: screws.ID, SupplierID: &suppliers[2].ID, CostPrice: 6.99, RetailPrice: 11.99, WholesalePrice: 9.99, Barcode: "123456789002"},
		{SKU: "SCR-DW-1-1/4", Name: "Drywall Screws 1-1/4\"", Description: "#6 x 1-1/4\" Drywall Screws (100 pack)", CategoryID: screws.ID, SupplierID: &suppliers[2].ID, CostPrice: 3.99, RetailPrice: 6.99, WholesalePrice: 5.49, Barcode: "123456789003"},

		// Fasteners - Bolts
		{SKU: "BOL-HX-1/4-2", Name: "Hex Bolts 1/4\" x 2\"", Description: "1/4\"-20 x 2\" Hex Head Bolts (25 pack)", CategoryID: bolts.ID, SupplierID: &suppliers[2].ID, CostPrice: 7.99, RetailPrice: 12.99, WholesalePrice: 10.49, Barcode: "123456789004"},
		{SKU: "BOL-CAR-3/8-3", Name: "Carriage Bolts 3/8\" x 3\"", Description: "3/8\"-16 x 3\" Carriage Bolts with Nuts (10 pack)", CategoryID: bolts.ID, SupplierID: &suppliers[2].ID, CostPrice: 9.99, RetailPrice: 15.99, WholesalePrice: 12.99, Barcode: "123456789005"},

		// Electrical - Wire
		{SKU: "WIR-12AWG-250", Name: "12 AWG Copper Wire", Description: "12 AWG THHN Copper Wire - 250 ft", CategoryID: wire.ID, SupplierID: &suppliers[4].ID, CostPrice: 89.99, RetailPrice: 139.99, WholesalePrice: 114.99, Barcode: "123456789006"},
		{SKU: "WIR-14AWG-500", Name: "14 AWG Copper Wire", Description: "14 AWG THHN Copper Wire - 500 ft", CategoryID: wire.ID, SupplierID: &suppliers[4].ID, CostPrice: 129.99, RetailPrice: 199.99, WholesalePrice: 164.99, Barcode: "123456789007"},

		// Electrical - Outlets
		{SKU: "OUT-15A-WHT", Name: "15A Duplex Outlet White", Description: "15 Amp Duplex Receptacle - White", CategoryID: outlets.ID, SupplierID: &suppliers[4].ID, CostPrice: 1.99, RetailPrice: 3.49, WholesalePrice: 2.74, Barcode: "123456789008"},
		{SKU: "SWT-15A-WHT", Name: "15A Toggle Switch White", Description: "15 Amp Single Pole Toggle Switch - White", CategoryID: outlets.ID, SupplierID: &suppliers[4].ID, CostPrice: 2.49, RetailPrice: 4.49, WholesalePrice: 3.49, Barcode: "123456789009"},

		// Plumbing - Pipes
		{SKU: "PVC-4IN-10FT", Name: "4\" PVC Pipe", Description: "4\" PVC Schedule 40 Pipe - 10 ft", CategoryID: pipes.ID, SupplierID: &suppliers[5].ID, CostPrice: 19.99, RetailPrice: 32.99, WholesalePrice: 26.49, Barcode: "123456789010"},
		{SKU: "PVC-3IN-10FT", Name: "3\" PVC Pipe", Description: "3\" PVC Schedule 40 Pipe - 10 ft", CategoryID: pipes.ID, SupplierID: &suppliers[5].ID, CostPrice: 14.99, RetailPrice: 24.99, WholesalePrice: 19.99, Barcode: "123456789011"},

		// Plumbing - Valves
		{SKU: "VAL-BALL-1/2", Name: "1/2\" Ball Valve", Description: "1/2\" Full Port Ball Valve - Brass", CategoryID: valves.ID, SupplierID: &suppliers[5].ID, CostPrice: 8.99, RetailPrice: 14.99, WholesalePrice: 11.99, Barcode: "123456789012"},
		{SKU: "VAL-SHUT-3/4", Name: "3/4\" Shut-off Valve", Description: "3/4\" Quarter Turn Shut-off Valve", CategoryID: valves.ID, SupplierID: &suppliers[5].ID, CostPrice: 12.99, RetailPrice: 19.99, WholesalePrice: 16.49, Barcode: "123456789013"},

		// Paint - Interior
		{SKU: "SHW-INT-WHT-GAL", Name: "Sherwin-Williams Interior White", Description: "ProClassic Interior Paint - White (1 Gallon)", CategoryID: interiorPaint.ID, SupplierID: &suppliers[3].ID, BrandID: findBrand("Sherwin-Williams"), CostPrice: 39.99, RetailPrice: 64.99, WholesalePrice: 52.49, Barcode: "123456789014"},
		{SKU: "BMO-INT-EGG-GAL", Name: "Benjamin Moore Eggshell", Description: "Advance Interior Paint - Eggshell (1 Gallon)", CategoryID: interiorPaint.ID, SupplierID: &suppliers[3].ID, BrandID: findBrand("Benjamin Moore"), CostPrice: 44.99, RetailPrice: 69.99, WholesalePrice: 57.49, Barcode: "123456789015"},

		// Paint - Exterior
		{SKU: "SHW-EXT-WHT-GAL", Name: "Sherwin-Williams Exterior White", Description: "Duration Exterior Paint - White (1 Gallon)", CategoryID: exteriorPaint.ID, SupplierID: &suppliers[3].ID, BrandID: findBrand("Sherwin-Williams"), CostPrice: 49.99, RetailPrice: 79.99, WholesalePrice: 64.99, Barcode: "123456789016"},

		// Lumber
		{SKU: "LMB-2X4-8", Name: "2x4x8 Pressure Treated", Description: "2\" x 4\" x 8' Pressure Treated Lumber", CategoryID: lumber.ID, SupplierID: &suppliers[1].ID, CostPrice: 4.99, RetailPrice: 7.99, WholesalePrice: 6.49, Barcode: "123456789017"},
		{SKU: "LMB-2X6-10", Name: "2x6x10 Pressure Treated", Description: "2\" x 6\" x 10' Pressure Treated Lumber", CategoryID: lumber.ID, SupplierID: &suppliers[1].ID, CostPrice: 12.99, RetailPrice: 19.99, WholesalePrice: 16.49, Barcode: "123456789018"},
		{SKU: "LMB-2X8-12", Name: "2x8x12 Construction Grade", Description: "2\" x 8\" x 12' Construction Grade Lumber", CategoryID: lumber.ID, SupplierID: &suppliers[1].ID, CostPrice: 18.99, RetailPrice: 28.99, WholesalePrice: 23.99, Barcode: "123456789019"},
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
	products, err := ctx.ProductRepo.List(ctxBg, 100, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}

	if len(products) == 0 {
		return fmt.Errorf("need products for inventory seeding")
	}

	// Create inventory records with realistic stock levels for a hardware store
	inventoryData := map[string]struct {
		quantity  int
		minLevel  int
		maxLevel  int
	}{
		// Power tools - lower quantities, higher value items
		"DWT-DCD771C2": {15, 3, 25},
		"MIL-2804-22":  {8, 2, 15},
		"MAK-XPH12Z":   {12, 3, 20},
		"DWT-DCS570B":  {6, 2, 12},
		"MIL-2631-20":  {4, 1, 10},

		// Hand tools - moderate quantities
		"CRA-CMMT12024": {25, 5, 40},
		"STA-STMT71652": {30, 8, 50},
		"STA-51-616":    {40, 10, 60},
		"IRW-1954889":   {20, 5, 35},

		// Fasteners - high quantities, consumable items
		"SCR-WS-1-5/8":  {150, 25, 200},
		"SCR-WS-2-1/2":  {100, 20, 150},
		"SCR-DW-1-1/4":  {200, 30, 250},
		"BOL-HX-1/4-2":  {75, 15, 100},
		"BOL-CAR-3/8-3": {50, 10, 75},

		// Electrical - moderate to high quantities
		"WIR-12AWG-250": {25, 5, 40},
		"WIR-14AWG-500": {20, 4, 35},
		"OUT-15A-WHT":   {100, 20, 150},
		"SWT-15A-WHT":   {80, 15, 120},

		// Plumbing - moderate quantities
		"PVC-4IN-10FT":  {30, 8, 50},
		"PVC-3IN-10FT":  {40, 10, 60},
		"VAL-BALL-1/2":  {25, 5, 40},
		"VAL-SHUT-3/4":  {20, 5, 35},

		// Paint - moderate quantities
		"SHW-INT-WHT-GAL": {50, 10, 80},
		"BMO-INT-EGG-GAL": {30, 8, 50},
		"SHW-EXT-WHT-GAL": {40, 10, 70},

		// Lumber - high quantities, bulk items
		"LMB-2X4-8":  {200, 50, 300},
		"LMB-2X6-10": {150, 30, 200},
		"LMB-2X8-12": {100, 25, 150},
	}

	for _, product := range products {
		inventory, exists := inventoryData[product.SKU]
		if !exists {
			// Default values for any products not specifically configured
			inventory = struct {
				quantity  int
				minLevel  int
				maxLevel  int
			}{25, 5, 50}
		}

		_, err := ctx.InventoryService.CreateInventory(ctxBg, product.ID, inventory.quantity, inventory.minLevel, inventory.maxLevel)
		if err != nil {
			return fmt.Errorf("failed to create inventory for product %s: %w", product.Name, err)
		}
		log.Printf("Created inventory: %s (%d units)", product.Name, inventory.quantity)
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
			Name:        "DIY Home Projects (John Smith)",
			Code:        "CUST001",
			Email:       "john.smith@email.com",
			Phone:       "555-0201",
			Address:     "123 Residential Lane",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62701",
			Country:     "USA",
			CreditLimit: 500.00,
			Notes:       "Regular customer - home improvement projects",
		},
		{
			Name:        "Martinez Construction Co",
			Code:        "CUST002",
			Email:       "office@martinezconstruction.com",
			Phone:       "555-0202",
			Address:     "456 Builder's Blvd",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62702",
			Country:     "USA",
			CreditLimit: 15000.00,
			Notes:       "Commercial contractor - bulk orders",
		},
		{
			Name:        "ABC Plumbing Services",
			Code:        "CUST003",
			Email:       "dispatch@abcplumbing.com",
			Phone:       "555-0203",
			Address:     "789 Trade Circle",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62703",
			Country:     "USA",
			CreditLimit: 8000.00,
			Notes:       "Plumbing contractor - weekly orders",
		},
		{
			Name:        "Electric Solutions LLC",
			Code:        "CUST004",
			Email:       "orders@electricsolutions.com",
			Phone:       "555-0204",
			Address:     "321 Circuit Dr",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62704",
			Country:     "USA",
			CreditLimit: 10000.00,
			Notes:       "Electrical contractor",
		},
		{
			Name:        "Sarah Johnson",
			Code:        "CUST005",
			Email:       "sarah.johnson@email.com",
			Phone:       "555-0205",
			Address:     "654 Maple Ave",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62705",
			Country:     "USA",
			CreditLimit: 750.00,
			Notes:       "Weekend warrior - DIY enthusiast",
		},
		{
			Name:        "Thompson's Handyman Service",
			Code:        "CUST006",
			Email:       "mike@thompsonshandyman.com",
			Phone:       "555-0206",
			Address:     "987 Service Road",
			City:        "Springfield",
			State:       "IL",
			PostalCode:  "62706",
			Country:     "USA",
			CreditLimit: 5000.00,
			Notes:       "Handyman service - regular customer",
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
	// Check if purchase receipts already exist
	existing, _, err := ctx.PurchaseReceiptRepo.List(ctxBg, 0, 1)
	if err == nil && len(existing) > 0 {
		log.Println("Purchase receipts already exist, skipping purchase receipt seeding")
		return nil
	}

	// Get suppliers and products
	suppliers, err := ctx.SupplierRepo.List(ctxBg, 10, 0)
	if err != nil {
		return fmt.Errorf("failed to get suppliers: %w", err)
	}

	products, err := ctx.ProductRepo.List(ctxBg, 30, 0)
	if err != nil {
		return fmt.Errorf("failed to get products: %w", err)
	}

	if len(suppliers) == 0 || len(products) == 0 {
		log.Println("No suppliers or products found, skipping purchase receipt seeding")
		return nil
	}

	// Get admin user
	adminUser, err := ctx.UserRepo.GetByUsername(ctxBg, "admin")
	if err != nil {
		return fmt.Errorf("failed to get admin user: %w", err)
	}

	// Parse dates
	orderDate1, _ := time.Parse("2006-01-02", "2024-01-15")
	orderDate2, _ := time.Parse("2006-01-02", "2024-01-20")
	orderDate3, _ := time.Parse("2006-01-02", "2024-01-25")

	// Create hardware store purchase receipts
	purchaseReceipts := []models.PurchaseReceipt{
		{
			ReceiptNumber:          "PR-2024-001",
			SupplierID:             suppliers[0].ID, // Power Tools Direct
			Status:                 models.PurchaseReceiptStatusCompleted,
			PurchaseDate:           orderDate1,
			SupplierBillNumber:     "PTD-INV-2024-001",
			BillDiscountAmount:     250.00,
			BillDiscountPercentage: 0.00,
			TotalAmount:            4750.00,
			Notes:                  "Power tools restock - DeWalt and Milwaukee",
			CreatedByID:            adminUser.ID,
		},
		{
			ReceiptNumber:          "PR-2024-002",
			SupplierID:             suppliers[2].ID, // Fasteners & Fixings Ltd
			Status:                 models.PurchaseReceiptStatusReceived,
			PurchaseDate:           orderDate2,
			SupplierBillNumber:     "FFL-2024-045",
			BillDiscountAmount:     0.00,
			BillDiscountPercentage: 10.00,
			TotalAmount:            1800.00,
			Notes:                  "Bulk fasteners order - screws and bolts",
			CreatedByID:            adminUser.ID,
		},
		{
			ReceiptNumber:          "PR-2024-003",
			SupplierID:             suppliers[4].ID, // Electrical Components Corp
			Status:                 models.PurchaseReceiptStatusPending,
			PurchaseDate:           orderDate3,
			SupplierBillNumber:     "ECC-2024-089",
			BillDiscountAmount:     150.00,
			BillDiscountPercentage: 0.00,
			TotalAmount:            2350.00,
			Notes:                  "Electrical supplies - wire and outlets",
			CreatedByID:            adminUser.ID,
		},
	}

	for i, purchaseReceipt := range purchaseReceipts {
		if err := ctx.PurchaseReceiptRepo.Create(ctxBg, &purchaseReceipt); err != nil {
			return fmt.Errorf("failed to create purchase receipt %s: %w", purchaseReceipt.ReceiptNumber, err)
		}
		log.Printf("Created purchase receipt: %s (%s)", purchaseReceipt.ReceiptNumber, purchaseReceipt.Status)

		// Add relevant items based on supplier
		var items []models.PurchaseReceiptItem

		switch i {
		case 0: // Power Tools Direct
			items = []models.PurchaseReceiptItem{
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "DWT-DCD771C2").ID,
					Quantity:               15,
					UnitCost:               79.99,
					ItemDiscountAmount:     0.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              1199.85,
				},
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "MIL-2804-22").ID,
					Quantity:               8,
					UnitCost:               149.99,
					ItemDiscountAmount:     100.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              1099.92,
				},
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "DWT-DCS570B").ID,
					Quantity:               6,
					UnitCost:               129.99,
					ItemDiscountAmount:     50.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              729.94,
				},
			}
		case 1: // Fasteners & Fixings Ltd
			items = []models.PurchaseReceiptItem{
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "SCR-WS-1-5/8").ID,
					Quantity:               100,
					UnitCost:               4.99,
					ItemDiscountAmount:     0.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              499.00,
				},
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "BOL-HX-1/4-2").ID,
					Quantity:               50,
					UnitCost:               7.99,
					ItemDiscountAmount:     0.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              399.50,
				},
			}
		case 2: // Electrical Components Corp
			items = []models.PurchaseReceiptItem{
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "WIR-12AWG-250").ID,
					Quantity:               20,
					UnitCost:               89.99,
					ItemDiscountAmount:     0.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              1799.80,
				},
				{
					PurchaseReceiptID:      purchaseReceipt.ID,
					ProductID:              findProductBySKU(products, "OUT-15A-WHT").ID,
					Quantity:               100,
					UnitCost:               1.99,
					ItemDiscountAmount:     0.00,
					ItemDiscountPercentage: 0.00,
					LineTotal:              199.00,
				},
			}
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

// Helper function to find product by SKU
func findProductBySKU(products []*models.Product, sku string) *models.Product {
	for _, product := range products {
		if product.SKU == sku {
			return product
		}
	}
	return products[0] // fallback to first product if not found
}