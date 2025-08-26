package app

import (
	"fmt"

	"inventory-api/internal/business/audit"
	"inventory-api/internal/business/hierarchy"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/business/product"
	"inventory-api/internal/business/user"
	"inventory-api/internal/config"
	"inventory-api/internal/repository"
	"inventory-api/internal/repository/interfaces"
)

type Context struct {
	Config   *config.Config
	Database *config.Database

	// Repositories
	UserRepo         interfaces.UserRepository
	CategoryRepo     interfaces.CategoryRepository
	SupplierRepo     interfaces.SupplierRepository
	LocationRepo     interfaces.LocationRepository
	ProductRepo      interfaces.ProductRepository
	InventoryRepo    interfaces.InventoryRepository
	StockMovementRepo interfaces.StockMovementRepository
	AuditLogRepo     interfaces.AuditLogRepository

	// Services
	UserService      user.Service
	ProductService   product.Service
	HierarchyService hierarchy.Service
	InventoryService inventory.Service
	AuditService     audit.Service
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
	ctx.LocationRepo = repository.NewLocationRepository(ctx.Database.DB)
	ctx.ProductRepo = repository.NewProductRepository(ctx.Database.DB)
	ctx.InventoryRepo = repository.NewInventoryRepository(ctx.Database.DB)
	ctx.StockMovementRepo = repository.NewStockMovementRepository(ctx.Database.DB)
	ctx.AuditLogRepo = repository.NewAuditLogRepository(ctx.Database.DB)
}

func (ctx *Context) initServices() {
	ctx.UserService = user.NewService(ctx.UserRepo)
	ctx.ProductService = product.NewService(
		ctx.ProductRepo,
		ctx.CategoryRepo,
		ctx.SupplierRepo,
	)
	ctx.HierarchyService = hierarchy.NewService(ctx.CategoryRepo, ctx.ProductRepo)
	ctx.InventoryService = inventory.NewService(
		ctx.InventoryRepo,
		ctx.StockMovementRepo,
		ctx.ProductRepo,
		ctx.LocationRepo,
	)
	ctx.AuditService = audit.NewService(ctx.AuditLogRepo, ctx.UserRepo)
}

func (ctx *Context) Close() error {
	if ctx.Database != nil {
		return ctx.Database.Close()
	}
	return nil
}