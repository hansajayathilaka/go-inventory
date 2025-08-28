package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type ProductRepository interface {
	Create(ctx context.Context, product *models.Product) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error)
	GetBySKU(ctx context.Context, sku string) (*models.Product, error)
	GetByBarcode(ctx context.Context, barcode string) (*models.Product, error)
	GetByName(ctx context.Context, name string) ([]*models.Product, error)
	Update(ctx context.Context, product *models.Product) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Product, error)
	GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error)
	GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error)
	GetByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error)
	GetActive(ctx context.Context) ([]*models.Product, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error)
	Count(ctx context.Context) (int64, error)
}