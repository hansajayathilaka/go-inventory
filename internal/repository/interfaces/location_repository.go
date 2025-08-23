package interfaces

import (
	"context"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/models"
)

type LocationRepository interface {
	Create(ctx context.Context, location *models.Location) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error)
	GetByCode(ctx context.Context, code string) (*models.Location, error)
	GetByName(ctx context.Context, name string) (*models.Location, error)
	Update(ctx context.Context, location *models.Location) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Location, error)
	GetByType(ctx context.Context, locationType models.LocationType) ([]*models.Location, error)
	GetActive(ctx context.Context) ([]*models.Location, error)
	Count(ctx context.Context) (int64, error)
}