package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type SupplierRepository interface {
	Create(ctx context.Context, supplier *models.Supplier) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error)
	GetByCode(ctx context.Context, code string) (*models.Supplier, error)
	GetByName(ctx context.Context, name string) (*models.Supplier, error)
	Update(ctx context.Context, supplier *models.Supplier) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Supplier, error)
	GetActive(ctx context.Context) ([]*models.Supplier, error)
	Count(ctx context.Context) (int64, error)
}