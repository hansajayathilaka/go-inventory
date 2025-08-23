package inventory

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/models"
)

// Minimal mock implementations for testing core service logic
type minimalInventoryRepo struct{}

func (r *minimalInventoryRepo) Create(ctx context.Context, inventory *models.Inventory) error                                                                                            { return nil }
func (r *minimalInventoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Inventory, error)                                                                                   { return nil, ErrInventoryNotFound }
func (r *minimalInventoryRepo) GetByProductAndLocation(ctx context.Context, productID, locationID uuid.UUID) (*models.Inventory, error)                                              { return nil, ErrInventoryNotFound }
func (r *minimalInventoryRepo) Update(ctx context.Context, inventory *models.Inventory) error                                                                                          { return nil }
func (r *minimalInventoryRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                         { return nil }
func (r *minimalInventoryRepo) List(ctx context.Context, limit, offset int) ([]*models.Inventory, error)                                                                              { return nil, nil }
func (r *minimalInventoryRepo) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.Inventory, error)                                                                    { return nil, nil }
func (r *minimalInventoryRepo) GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.Inventory, error)                                                                  { return nil, nil }
func (r *minimalInventoryRepo) GetLowStock(ctx context.Context) ([]*models.Inventory, error)                                                                                          { return nil, nil }
func (r *minimalInventoryRepo) GetZeroStock(ctx context.Context) ([]*models.Inventory, error)                                                                                         { return nil, nil }
func (r *minimalInventoryRepo) UpdateQuantity(ctx context.Context, productID, locationID uuid.UUID, quantity int) error                                                              { return nil }
func (r *minimalInventoryRepo) ReserveStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error                                                                { return ErrInventoryNotFound }
func (r *minimalInventoryRepo) ReleaseReservedStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error                                                       { return ErrInventoryNotFound }
func (r *minimalInventoryRepo) GetTotalQuantityByProduct(ctx context.Context, productID uuid.UUID) (int, error)                                                                      { return 0, nil }
func (r *minimalInventoryRepo) Count(ctx context.Context) (int64, error)                                                                                                              { return 0, nil }

type minimalStockMovementRepo struct{}

func (r *minimalStockMovementRepo) Create(ctx context.Context, movement *models.StockMovement) error                                                                                                                            { return nil }
func (r *minimalStockMovementRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.StockMovement, error)                                                                                                                   { return nil, nil }
func (r *minimalStockMovementRepo) Update(ctx context.Context, movement *models.StockMovement) error                                                                                                                           { return nil }
func (r *minimalStockMovementRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                                                             { return nil }
func (r *minimalStockMovementRepo) List(ctx context.Context, limit, offset int) ([]*models.StockMovement, error)                                                                                                              { return nil, nil }
func (r *minimalStockMovementRepo) GetByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                               { return nil, nil }
func (r *minimalStockMovementRepo) GetByLocation(ctx context.Context, locationID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                             { return nil, nil }
func (r *minimalStockMovementRepo) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                                     { return nil, nil }
func (r *minimalStockMovementRepo) GetByMovementType(ctx context.Context, movementType models.MovementType, limit, offset int) ([]*models.StockMovement, error)                                                           { return nil, nil }
func (r *minimalStockMovementRepo) GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.StockMovement, error)                                                                         { return nil, nil }
func (r *minimalStockMovementRepo) GetByReference(ctx context.Context, referenceID string) ([]*models.StockMovement, error)                                                                                                 { return nil, nil }
func (r *minimalStockMovementRepo) Count(ctx context.Context) (int64, error)                                                                                                                                                 { return 0, nil }
func (r *minimalStockMovementRepo) GetMovementsByProductAndDateRange(ctx context.Context, productID uuid.UUID, start, end time.Time) ([]*models.StockMovement, error)                                                   { return nil, nil }

type minimalProductRepo struct{}

func (r *minimalProductRepo) Create(ctx context.Context, product *models.Product) error                                                                                         { return nil }
func (r *minimalProductRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error)                                                                               { return nil, ErrProductNotFound }
func (r *minimalProductRepo) GetBySKU(ctx context.Context, sku string) (*models.Product, error)                                                                                { return nil, nil }
func (r *minimalProductRepo) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error)                                                                       { return nil, nil }
func (r *minimalProductRepo) GetByName(ctx context.Context, name string) ([]*models.Product, error)                                                                           { return nil, nil }
func (r *minimalProductRepo) Update(ctx context.Context, product *models.Product) error                                                                                       { return nil }
func (r *minimalProductRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                  { return nil }
func (r *minimalProductRepo) List(ctx context.Context, limit, offset int) ([]*models.Product, error)                                                                         { return nil, nil }
func (r *minimalProductRepo) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error)                                                             { return nil, nil }
func (r *minimalProductRepo) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error)                                                             { return nil, nil }
func (r *minimalProductRepo) GetActive(ctx context.Context) ([]*models.Product, error)                                                                                        { return nil, nil }
func (r *minimalProductRepo) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error)                                                        { return nil, nil }
func (r *minimalProductRepo) Count(ctx context.Context) (int64, error)                                                                                                        { return 0, nil }

type minimalLocationRepo struct{}

func (r *minimalLocationRepo) Create(ctx context.Context, location *models.Location) error                                                                                        { return nil }
func (r *minimalLocationRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error)                                                                              { return nil, ErrLocationNotFound }
func (r *minimalLocationRepo) GetByCode(ctx context.Context, code string) (*models.Location, error)                                                                            { return nil, nil }
func (r *minimalLocationRepo) GetByName(ctx context.Context, name string) (*models.Location, error)                                                                            { return nil, nil }
func (r *minimalLocationRepo) Update(ctx context.Context, location *models.Location) error                                                                                     { return nil }
func (r *minimalLocationRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                  { return nil }
func (r *minimalLocationRepo) List(ctx context.Context, limit, offset int) ([]*models.Location, error)                                                                        { return nil, nil }
func (r *minimalLocationRepo) GetByType(ctx context.Context, locationType models.LocationType) ([]*models.Location, error)                                                    { return nil, nil }
func (r *minimalLocationRepo) GetActive(ctx context.Context) ([]*models.Location, error)                                                                                       { return nil, nil }
func (r *minimalLocationRepo) Count(ctx context.Context) (int64, error)                                                                                                        { return 0, nil }

func setupInventoryService() Service {
	return NewService(
		&minimalInventoryRepo{},
		&minimalStockMovementRepo{},
		&minimalProductRepo{},
		&minimalLocationRepo{},
	)
}

// Test core business logic validation
func TestInventoryValidation(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	locationID := uuid.New()
	userID := uuid.New()

	// Test invalid quantity validation
	_, err := service.CreateInventory(ctx, productID, locationID, -10, 10, 500)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative quantity, got %v", err)
	}

	// Test invalid reorder level validation
	_, err = service.CreateInventory(ctx, productID, locationID, 100, -5, 500)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative reorder level, got %v", err)
	}

	// Test invalid max level validation
	_, err = service.CreateInventory(ctx, productID, locationID, 100, 10, -100)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative max level, got %v", err)
	}

	// Test invalid stock adjustment
	err = service.UpdateStock(ctx, productID, locationID, -50, userID, "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative stock update, got %v", err)
	}

	// Test invalid reservation quantity
	err = service.ReserveStock(ctx, productID, locationID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero reservation, got %v", err)
	}

	// Test invalid reservation quantity (negative)
	err = service.ReserveStock(ctx, productID, locationID, -10)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative reservation, got %v", err)
	}

	// Test invalid release quantity
	err = service.ReleaseReservedStock(ctx, productID, locationID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero release, got %v", err)
	}

	// Test invalid transfer quantity
	toLocationID := uuid.New()
	err = service.TransferStock(ctx, productID, locationID, toLocationID, 0, userID, "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero transfer, got %v", err)
	}

	// Test invalid transfer quantity (negative)
	err = service.TransferStock(ctx, productID, locationID, toLocationID, -10, userID, "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative transfer, got %v", err)
	}
}

// Test non-existent resource handling
func TestInventoryNotFoundHandling(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	locationID := uuid.New()
	userID := uuid.New()

	// Test creating inventory with non-existent product should fail
	_, err := service.CreateInventory(ctx, productID, locationID, 100, 10, 500)
	if err != ErrProductNotFound {
		t.Errorf("Expected ErrProductNotFound, got %v", err)
	}

	// Test getting non-existent inventory
	_, err = service.GetInventory(ctx, productID, locationID)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test adjusting non-existent stock
	err = service.AdjustStock(ctx, productID, locationID, 50, userID, "Test")
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test updating non-existent stock
	err = service.UpdateStock(ctx, productID, locationID, 150, userID, "Test")
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test reserving non-existent stock
	err = service.ReserveStock(ctx, productID, locationID, 30)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test releasing from non-existent stock
	err = service.ReleaseReservedStock(ctx, productID, locationID, 10)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test updating reorder levels for non-existent inventory
	err = service.UpdateReorderLevels(ctx, productID, locationID, 5, 200)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}
}