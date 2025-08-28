package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type BrandRepository interface {
	Create(ctx context.Context, brand *models.Brand) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Brand, error)
	GetByCode(ctx context.Context, code string) (*models.Brand, error)
	GetByName(ctx context.Context, name string) (*models.Brand, error)
	Update(ctx context.Context, brand *models.Brand) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Brand, error)
	GetActive(ctx context.Context) ([]*models.Brand, error)
	Count(ctx context.Context) (int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.Brand, error)
}