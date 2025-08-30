package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type InventoryRepository interface {
	Create(ctx context.Context, inventory *models.Inventory) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Inventory, error)
	GetByProduct(ctx context.Context, productID uuid.UUID) (*models.Inventory, error)
	Update(ctx context.Context, inventory *models.Inventory) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Inventory, error)
	GetLowStock(ctx context.Context) ([]*models.Inventory, error)
	GetZeroStock(ctx context.Context) ([]*models.Inventory, error)
	UpdateQuantity(ctx context.Context, productID uuid.UUID, quantity int) error
	ReserveStock(ctx context.Context, productID uuid.UUID, quantity int) error
	ReleaseReservedStock(ctx context.Context, productID uuid.UUID, quantity int) error
	GetTotalQuantityByProduct(ctx context.Context, productID uuid.UUID) (int, error)
	Count(ctx context.Context) (int64, error)
}