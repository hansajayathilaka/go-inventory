package app

import (
	"fmt"

	"inventory-api/internal/business/audit"
	"inventory-api/internal/business/brand"
	"inventory-api/internal/business/customer"
	"inventory-api/internal/business/hierarchy"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/business/product"
	"inventory-api/internal/business/purchase_receipt"
	"inventory-api/internal/business/sale"
	"inventory-api/internal/business/supplier"
	"inventory-api/internal/business/user"
	"inventory-api/internal/config"
	"inventory-api/internal/repository"
	"inventory-api/internal/repository/interfaces"
)

type Context struct {
	Config   *config.Config
	Database *config.Database

	// Repositories
	UserRepo                  interfaces.UserRepository
	CategoryRepo              interfaces.CategoryRepository
	SupplierRepo              interfaces.SupplierRepository
	ProductRepo               interfaces.ProductRepository
	InventoryRepo             interfaces.InventoryRepository
	StockMovementRepo         interfaces.StockMovementRepository
	StockBatchRepo            interfaces.StockBatchRepository
	AuditLogRepo              interfaces.AuditLogRepository
	CustomerRepo              interfaces.CustomerRepository
	BrandRepo                 interfaces.BrandRepository
	PurchaseReceiptRepo       interfaces.PurchaseReceiptRepository
	SaleRepo                  interfaces.SaleRepository
	SaleItemRepo              interfaces.SaleItemRepository
	PaymentRepo               interfaces.PaymentRepository

	// Services
	UserService           user.Service
	SupplierService       supplier.Service
	CustomerService       customer.Service
	BrandService          brand.Service
	PurchaseReceiptService purchase_receipt.Service
	ProductService        product.Service
	HierarchyService      hierarchy.Service
	InventoryService      inventory.Service
	AuditService          audit.Service
	SaleService           sale.Service
}

func NewContext() (*Context, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load config: %w", err)
	}

	if err := cfg.Validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	db, err := config.NewDatabase(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	if err := db.AutoMigrate(); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	ctx := &Context{
		Config:   cfg,
		Database: db,
	}

	ctx.initRepositories()
	ctx.initServices()

	return ctx, nil
}

func (ctx *Context) initRepositories() {
	ctx.UserRepo = repository.NewUserRepository(ctx.Database.DB)
	ctx.CategoryRepo = repository.NewCategoryRepository(ctx.Database.DB)
	ctx.SupplierRepo = repository.NewSupplierRepository(ctx.Database.DB)
	ctx.ProductRepo = repository.NewProductRepository(ctx.Database.DB)
	ctx.InventoryRepo = repository.NewInventoryRepository(ctx.Database.DB)
	ctx.StockMovementRepo = repository.NewStockMovementRepository(ctx.Database.DB)
	ctx.StockBatchRepo = repository.NewStockBatchRepository(ctx.Database.DB)
	ctx.AuditLogRepo = repository.NewAuditLogRepository(ctx.Database.DB)
	ctx.CustomerRepo = repository.NewCustomerRepository(ctx.Database.DB)
	ctx.BrandRepo = repository.NewBrandRepository(ctx.Database.DB)
	ctx.PurchaseReceiptRepo = repository.NewPurchaseReceiptRepository(ctx.Database.DB)
	ctx.SaleRepo = repository.NewSaleRepository(ctx.Database.DB)
	ctx.SaleItemRepo = repository.NewSaleItemRepository(ctx.Database.DB)
	ctx.PaymentRepo = repository.NewPaymentRepository(ctx.Database.DB)
}

func (ctx *Context) initServices() {
	ctx.UserService = user.NewService(ctx.UserRepo)
	ctx.SupplierService = supplier.NewService(ctx.SupplierRepo)
	ctx.CustomerService = customer.NewService(ctx.CustomerRepo)
	ctx.BrandService = brand.NewService(ctx.BrandRepo)
	ctx.PurchaseReceiptService = purchase_receipt.NewService(
		ctx.PurchaseReceiptRepo,
		ctx.SupplierRepo,
		ctx.ProductRepo,
		ctx.InventoryRepo,
		ctx.StockBatchRepo,
		ctx.StockMovementRepo,
	)
	ctx.ProductService = product.NewService(
		ctx.ProductRepo,
		ctx.CategoryRepo,
		ctx.SupplierRepo,
		ctx.BrandRepo,
	)
	ctx.HierarchyService = hierarchy.NewService(ctx.CategoryRepo, ctx.ProductRepo)
	ctx.InventoryService = inventory.NewService(
		ctx.InventoryRepo,
		ctx.StockMovementRepo,
		ctx.StockBatchRepo,
		ctx.ProductRepo,
	)
	ctx.AuditService = audit.NewService(ctx.AuditLogRepo, ctx.UserRepo)
	ctx.SaleService = sale.NewService(
		ctx.SaleRepo,
		ctx.SaleItemRepo,
		ctx.PaymentRepo,
		ctx.ProductRepo,
		ctx.CustomerRepo,
		ctx.UserRepo,
		ctx.InventoryRepo,
		ctx.StockBatchRepo,
		ctx.StockMovementRepo,
	)
}

func (ctx *Context) Close() error {
	if ctx.Database != nil {
		return ctx.Database.Close()
	}
	return nil
}