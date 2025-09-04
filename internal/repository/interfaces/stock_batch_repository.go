package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// StockBatchRepository defines the interface for stock batch data access operations
type StockBatchRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, batch *models.StockBatch) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.StockBatch, error)
	Update(ctx context.Context, batch *models.StockBatch) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// List operations
	List(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error)
	GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error)
	GetBySupplier(ctx context.Context, supplierID uuid.UUID, offset, limit int) ([]*models.StockBatch, int64, error)
	GetByBatchNumber(ctx context.Context, batchNumber string) ([]*models.StockBatch, error)
	GetByLotNumber(ctx context.Context, lotNumber string) ([]*models.StockBatch, error)
	
	// Active/Available batches
	GetActiveBatches(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error)
	GetActiveByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error)
	GetAvailableBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error)
	
	// Date-based operations
	GetByReceivedDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error)
	GetByExpiryDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error)
	GetExpiringBatches(ctx context.Context, days int) ([]*models.StockBatch, error)
	GetExpiredBatches(ctx context.Context) ([]*models.StockBatch, error)
	
	// FIFO/LIFO inventory management
	GetBatchesForSale(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error)
	AllocateStock(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error)
	ReserveStock(ctx context.Context, batchID uuid.UUID, quantity int) error
	ReleaseStock(ctx context.Context, batchID uuid.UUID, quantity int) error
	ConsumeStock(ctx context.Context, batchID uuid.UUID, quantity int) error
	
	// Search operations
	Search(ctx context.Context, batchNumber, lotNumber string, productID, supplierID *uuid.UUID, isActive *bool, offset, limit int) ([]*models.StockBatch, int64, error)
	
	// Stock quantity management
	UpdateQuantity(ctx context.Context, batchID uuid.UUID, quantity, availableQuantity int) error
	AdjustQuantity(ctx context.Context, batchID uuid.UUID, adjustment int) error
	RecalculateAvailableQuantity(ctx context.Context, batchID uuid.UUID) error
	
	// Cost calculations
	GetWeightedAverageCost(ctx context.Context, productID uuid.UUID) (float64, error)
	GetBatchTotalCost(ctx context.Context, batchID uuid.UUID) (float64, error)
	GetProductTotalValue(ctx context.Context, productID uuid.UUID) (float64, error)
	
	// Batch lifecycle management
	ActivateBatch(ctx context.Context, batchID uuid.UUID) error
	DeactivateBatch(ctx context.Context, batchID uuid.UUID) error
	MarkBatchAsEmpty(ctx context.Context, batchID uuid.UUID) error
	
	// Reporting operations
	GetLowStockBatches(ctx context.Context, threshold int) ([]*models.StockBatch, error)
	GetBatchUtilization(ctx context.Context, batchID uuid.UUID) (map[string]interface{}, error)
	GetProductBatchSummary(ctx context.Context, productID uuid.UUID) (map[string]interface{}, error)
	GetInventoryValuation(ctx context.Context) ([]map[string]interface{}, error)
	
	// Bulk operations
	CreateBulk(ctx context.Context, batches []*models.StockBatch) error
	UpdateBulk(ctx context.Context, batches []*models.StockBatch) error
	DeactivateBulk(ctx context.Context, batchIDs []uuid.UUID) error
	
	// Validation operations
	ValidateBatchForSale(ctx context.Context, batchID uuid.UUID, quantity int) error
	CheckBatchAvailability(ctx context.Context, productID uuid.UUID, requiredQuantity int) (bool, error)
	GetBatchAllocationSuggestion(ctx context.Context, productID uuid.UUID, requiredQuantity int, method string) ([]*models.StockBatch, error)
}