package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type PurchaseOrderRepository interface {
	Create(ctx context.Context, po *models.PurchaseOrder) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.PurchaseOrder, error)
	GetByPONumber(ctx context.Context, poNumber string) (*models.PurchaseOrder, error)
	Update(ctx context.Context, po *models.PurchaseOrder) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.PurchaseOrder, error)
	GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseOrder, error)
	GetByStatus(ctx context.Context, status models.PurchaseOrderStatus) ([]*models.PurchaseOrder, error)
	GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.PurchaseOrder, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseOrder, error)
	Count(ctx context.Context) (int64, error)
	UpdateStatus(ctx context.Context, id uuid.UUID, status models.PurchaseOrderStatus) error
	GetPendingOrders(ctx context.Context) ([]*models.PurchaseOrder, error)
	GetOrdersAwaitingDelivery(ctx context.Context) ([]*models.PurchaseOrder, error)

	// Purchase Order Item operations
	CreateItem(ctx context.Context, item *models.PurchaseOrderItem) error
	GetItemsByPurchaseOrderID(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.PurchaseOrderItem, error)
	UpdateItem(ctx context.Context, item *models.PurchaseOrderItem) error
	DeleteItem(ctx context.Context, id uuid.UUID) error
}