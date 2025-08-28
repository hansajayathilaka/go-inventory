package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type GRNRepository interface {
	// GRN operations
	Create(ctx context.Context, grn *models.GRN) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.GRN, error)
	GetByGRNNumber(ctx context.Context, grnNumber string) (*models.GRN, error)
	Update(ctx context.Context, grn *models.GRN) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.GRN, error)
	GetByPurchaseOrder(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.GRN, error)
	GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.GRN, error)
	GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.GRN, error)
	GetByStatus(ctx context.Context, status models.GRNStatus) ([]*models.GRN, error)
	GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.GRN, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.GRN, error)
	Count(ctx context.Context) (int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.GRNStatus) error
	GetPendingVerification(ctx context.Context) ([]*models.GRN, error)
	GetRecentGRNs(ctx context.Context, days int) ([]*models.GRN, error)

	// GRN Item operations
	CreateItem(ctx context.Context, item *models.GRNItem) error
	GetItemsByGRNID(ctx context.Context, grnID uuid.UUID) ([]*models.GRNItem, error)
	UpdateItem(ctx context.Context, item *models.GRNItem) error
	DeleteItem(ctx context.Context, id uuid.UUID) error
	GetItemsByProduct(ctx context.Context, productID uuid.UUID) ([]*models.GRNItem, error)
	UpdateItemStockStatus(ctx context.Context, id uuid.UUID, stockUpdated bool) error
	GetPendingStockUpdates(ctx context.Context) ([]*models.GRNItem, error)

	// Analytics and reporting
	GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error)
	GetReceiptSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
}