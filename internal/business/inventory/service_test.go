package inventory

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// Minimal mock implementations for testing core service logic
type minimalInventoryRepo struct{}

func (r *minimalInventoryRepo) Create(ctx context.Context, inventory *models.Inventory) error                                                                                            { return nil }
func (r *minimalInventoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Inventory, error)                                                                                   { return nil, ErrInventoryNotFound }
func (r *minimalInventoryRepo) Update(ctx context.Context, inventory *models.Inventory) error                                                                                          { return nil }
func (r *minimalInventoryRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                         { return nil }
func (r *minimalInventoryRepo) List(ctx context.Context, limit, offset int) ([]*models.Inventory, error)                                                                              { return nil, nil }
func (r *minimalInventoryRepo) GetByProduct(ctx context.Context, productID uuid.UUID) (*models.Inventory, error)                                                                     { return nil, ErrInventoryNotFound }
func (r *minimalInventoryRepo) GetLowStock(ctx context.Context) ([]*models.Inventory, error)                                                                                          { return nil, nil }
func (r *minimalInventoryRepo) GetZeroStock(ctx context.Context) ([]*models.Inventory, error)                                                                                         { return nil, nil }
func (r *minimalInventoryRepo) UpdateQuantity(ctx context.Context, productID uuid.UUID, quantity int) error                                                                                { return nil }
func (r *minimalInventoryRepo) ReserveStock(ctx context.Context, productID uuid.UUID, quantity int) error                                                                                  { return ErrInventoryNotFound }
func (r *minimalInventoryRepo) ReleaseReservedStock(ctx context.Context, productID uuid.UUID, quantity int) error                                                                         { return ErrInventoryNotFound }
func (r *minimalInventoryRepo) GetTotalQuantityByProduct(ctx context.Context, productID uuid.UUID) (int, error)                                                                      { return 0, nil }
func (r *minimalInventoryRepo) Count(ctx context.Context) (int64, error)                                                                                                              { return 0, nil }

type minimalStockMovementRepo struct{}

func (r *minimalStockMovementRepo) Create(ctx context.Context, movement *models.StockMovement) error                                                                                                                            { return nil }
func (r *minimalStockMovementRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.StockMovement, error)                                                                                                                   { return nil, nil }
func (r *minimalStockMovementRepo) Update(ctx context.Context, movement *models.StockMovement) error                                                                                                                           { return nil }
func (r *minimalStockMovementRepo) Delete(ctx context.Context, id uuid.UUID) error                                                                                                                                             { return nil }
func (r *minimalStockMovementRepo) List(ctx context.Context, limit, offset int) ([]*models.StockMovement, error)                                                                                                              { return nil, nil }
func (r *minimalStockMovementRepo) GetByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                               { return nil, nil }
func (r *minimalStockMovementRepo) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                                     { return nil, nil }
func (r *minimalStockMovementRepo) GetByMovementType(ctx context.Context, movementType models.MovementType, limit, offset int) ([]*models.StockMovement, error)                                                           { return nil, nil }
func (r *minimalStockMovementRepo) GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.StockMovement, error)                                                                         { return nil, nil }
func (r *minimalStockMovementRepo) GetByReference(ctx context.Context, referenceID string) ([]*models.StockMovement, error)                                                                                                 { return nil, nil }
func (r *minimalStockMovementRepo) Count(ctx context.Context) (int64, error)                                                                                                                                                 { return 0, nil }
func (r *minimalStockMovementRepo) GetMovementsByProductAndDateRange(ctx context.Context, productID uuid.UUID, start, end time.Time) ([]*models.StockMovement, error)                                                   { return nil, nil }
func (r *minimalStockMovementRepo) GetByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                                               { return nil, nil }
func (r *minimalStockMovementRepo) GetByProductAndBatch(ctx context.Context, productID, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)                                                         { return nil, nil }

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
func (r *minimalProductRepo) GetByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error)                                                                             { return nil, nil }
func (r *minimalProductRepo) CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error)                                                                     { return 0, nil }
func (r *minimalProductRepo) CountByCategoriesBulk(ctx context.Context, categoryIDs []uuid.UUID) (map[uuid.UUID]int64, error)                                             { return nil, nil }

// Mock for StockBatchRepository
type minimalStockBatchRepo struct{}

func (r *minimalStockBatchRepo) Create(ctx context.Context, batch *models.StockBatch) error { return nil }
func (r *minimalStockBatchRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) Update(ctx context.Context, batch *models.StockBatch) error { return nil }
func (r *minimalStockBatchRepo) Delete(ctx context.Context, id uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) List(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetBySupplier(ctx context.Context, supplierID uuid.UUID, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) GetByBatchNumber(ctx context.Context, batchNumber string) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetByLotNumber(ctx context.Context, lotNumber string) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetActiveBatches(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) GetActiveByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetAvailableBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetByReceivedDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) GetByExpiryDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) GetExpiringBatches(ctx context.Context, days int) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetExpiredBatches(ctx context.Context) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetBatchesForSale(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) AllocateStock(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error) { return nil, ErrInsufficientStock }
func (r *minimalStockBatchRepo) ReserveStock(ctx context.Context, batchID uuid.UUID, quantity int) error { return nil }
func (r *minimalStockBatchRepo) ReleaseStock(ctx context.Context, batchID uuid.UUID, quantity int) error { return nil }
func (r *minimalStockBatchRepo) ConsumeStock(ctx context.Context, batchID uuid.UUID, quantity int) error { return nil }
func (r *minimalStockBatchRepo) Search(ctx context.Context, batchNumber, lotNumber string, productID, supplierID *uuid.UUID, isActive *bool, offset, limit int) ([]*models.StockBatch, int64, error) { return nil, 0, nil }
func (r *minimalStockBatchRepo) UpdateQuantity(ctx context.Context, batchID uuid.UUID, quantity, availableQuantity int) error { return nil }
func (r *minimalStockBatchRepo) AdjustQuantity(ctx context.Context, batchID uuid.UUID, adjustment int) error { return nil }
func (r *minimalStockBatchRepo) RecalculateAvailableQuantity(ctx context.Context, batchID uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) GetWeightedAverageCost(ctx context.Context, productID uuid.UUID) (float64, error) { return 0.0, nil }
func (r *minimalStockBatchRepo) GetBatchTotalCost(ctx context.Context, batchID uuid.UUID) (float64, error) { return 0.0, nil }
func (r *minimalStockBatchRepo) GetProductTotalValue(ctx context.Context, productID uuid.UUID) (float64, error) { return 0.0, nil }
func (r *minimalStockBatchRepo) ActivateBatch(ctx context.Context, batchID uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) DeactivateBatch(ctx context.Context, batchID uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) MarkBatchAsEmpty(ctx context.Context, batchID uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) GetLowStockBatches(ctx context.Context, threshold int) ([]*models.StockBatch, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetBatchUtilization(ctx context.Context, batchID uuid.UUID) (map[string]interface{}, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetProductBatchSummary(ctx context.Context, productID uuid.UUID) (map[string]interface{}, error) { return nil, nil }
func (r *minimalStockBatchRepo) GetInventoryValuation(ctx context.Context) ([]map[string]interface{}, error) { return nil, nil }
func (r *minimalStockBatchRepo) CreateBulk(ctx context.Context, batches []*models.StockBatch) error { return nil }
func (r *minimalStockBatchRepo) UpdateBulk(ctx context.Context, batches []*models.StockBatch) error { return nil }
func (r *minimalStockBatchRepo) DeactivateBulk(ctx context.Context, batchIDs []uuid.UUID) error { return nil }
func (r *minimalStockBatchRepo) ValidateBatchForSale(ctx context.Context, batchID uuid.UUID, quantity int) error { return nil }
func (r *minimalStockBatchRepo) CheckBatchAvailability(ctx context.Context, productID uuid.UUID, requiredQuantity int) (bool, error) { return false, nil }
func (r *minimalStockBatchRepo) GetBatchAllocationSuggestion(ctx context.Context, productID uuid.UUID, requiredQuantity int, method string) ([]*models.StockBatch, error) { return nil, nil }


func setupInventoryService() Service {
	return NewService(
		&minimalInventoryRepo{},
		&minimalStockMovementRepo{},
		&minimalStockBatchRepo{},
		&minimalProductRepo{},
	)
}

// Test core business logic validation
func TestInventoryValidation(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	userID := uuid.New()

	// Test invalid quantity validation
	_, err := service.CreateInventory(ctx, productID, -10, 10, 500)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative quantity, got %v", err)
	}

	// Test invalid reorder level validation
	_, err = service.CreateInventory(ctx, productID, 100, -5, 500)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative reorder level, got %v", err)
	}

	// Test invalid max level validation
	_, err = service.CreateInventory(ctx, productID, 100, 10, -100)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative max level, got %v", err)
	}

	// Test invalid stock adjustment
	err = service.UpdateStock(ctx, productID, -50, userID, "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative stock update, got %v", err)
	}

	// Test invalid reservation quantity
	err = service.ReserveStock(ctx, productID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero reservation, got %v", err)
	}

	// Test invalid reservation quantity (negative)
	err = service.ReserveStock(ctx, productID, -10)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative reservation, got %v", err)
	}

	// Test invalid release quantity
	err = service.ReleaseReservedStock(ctx, productID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero release, got %v", err)
	}
}

// Test non-existent resource handling
func TestInventoryNotFoundHandling(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	userID := uuid.New()

	// Test creating inventory with non-existent product should fail
	_, err := service.CreateInventory(ctx, productID, 100, 10, 500)
	if err != ErrProductNotFound {
		t.Errorf("Expected ErrProductNotFound, got %v", err)
	}

	// Test getting non-existent inventory
	_, err = service.GetInventory(ctx, productID)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test adjusting non-existent stock
	err = service.AdjustStock(ctx, productID, 50, userID, "Test")
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test updating non-existent stock
	err = service.UpdateStock(ctx, productID, 150, userID, "Test")
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test reserving non-existent stock
	err = service.ReserveStock(ctx, productID, 30)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test releasing from non-existent stock
	err = service.ReleaseReservedStock(ctx, productID, 10)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}

	// Test updating reorder levels for non-existent inventory
	err = service.UpdateReorderLevels(ctx, productID, 5, 200)
	if err != ErrInventoryNotFound {
		t.Errorf("Expected ErrInventoryNotFound, got %v", err)
	}
}

// Test batch tracking functionality
func TestBatchTracking(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	userID := uuid.New()

	// Test invalid quantities for batch operations
	_, err := service.AllocateStock(ctx, productID, 0, "FIFO")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero allocation, got %v", err)
	}

	_, err = service.AllocateStock(ctx, productID, -10, "FIFO")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative allocation, got %v", err)
	}

	err = service.ConsumeStock(ctx, productID, 0, "FIFO", userID, "REF001", "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero consumption, got %v", err)
	}

	err = service.ConsumeStock(ctx, productID, -5, "FIFO", userID, "REF001", "Test")
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative consumption, got %v", err)
	}
}

// Test FIFO/LIFO cost calculations
func TestCostCalculations(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()

	// Test invalid quantities for cost calculations
	_, err := service.CalculateFIFOCost(ctx, productID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero FIFO calculation, got %v", err)
	}

	_, err = service.CalculateFIFOCost(ctx, productID, -10)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative FIFO calculation, got %v", err)
	}

	_, err = service.CalculateLIFOCost(ctx, productID, 0)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for zero LIFO calculation, got %v", err)
	}

	_, err = service.CalculateLIFOCost(ctx, productID, -5)
	if err != ErrInvalidQuantity {
		t.Errorf("Expected ErrInvalidQuantity for negative LIFO calculation, got %v", err)
	}

	// Test method defaulting (invalid methods should default to FIFO)
	_, err = service.AllocateStock(ctx, productID, 10, "INVALID_METHOD")
	// Should not error on invalid method, should default to FIFO
	if err != ErrInsufficientStock { // Expected because mock returns insufficient stock
		t.Errorf("Expected method to default to FIFO and return ErrInsufficientStock, got %v", err)
	}
}

// Test batch availability and stock allocation
func TestStockAllocationAndConsumption(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()
	userID := uuid.New()

	// Test allocation when no batches available
	_, err := service.AllocateStock(ctx, productID, 10, "FIFO")
	if err != ErrInsufficientStock {
		t.Errorf("Expected ErrInsufficientStock when no batches available, got %v", err)
	}

	// Test consumption when no batches available  
	err = service.ConsumeStock(ctx, productID, 5, "LIFO", userID, "SALE001", "Test sale")
	if err != ErrInsufficientStock {
		t.Errorf("Expected ErrInsufficientStock when consuming with no batches, got %v", err)
	}

	// Test getting available batches (should return empty from mock)
	batches, err := service.GetAvailableBatches(ctx, productID)
	if err != nil {
		t.Errorf("GetAvailableBatches should not error, got %v", err)
	}
	if batches != nil {
		t.Errorf("Expected nil batches from mock, got %v", batches)
	}
}

// Test stock value and cost calculations
func TestStockValueCalculations(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()

	// Test stock value calculation
	value, err := service.CalculateStockValue(ctx, productID)
	if err != nil {
		t.Errorf("CalculateStockValue should not error, got %v", err)
	}
	if value != 0.0 {
		t.Errorf("Expected 0.0 from mock, got %v", value)
	}

	// Test average cost calculation
	avgCost, err := service.CalculateAverageCost(ctx, productID)
	if err != nil {
		t.Errorf("CalculateAverageCost should not error, got %v", err)
	}
	if avgCost != 0.0 {
		t.Errorf("Expected 0.0 from mock, got %v", avgCost)
	}
}

// Test stock movements with batch information
func TestStockMovementsWithBatches(t *testing.T) {
	service := setupInventoryService()
	ctx := context.Background()
	
	productID := uuid.New()

	// Test getting stock movements with batch info
	movements, err := service.GetStockMovementsWithBatches(ctx, productID)
	if err != nil {
		t.Errorf("GetStockMovementsWithBatches should not error, got %v", err)
	}
	if movements != nil {
		t.Errorf("Expected nil movements from mock, got %v", movements)
	}
}