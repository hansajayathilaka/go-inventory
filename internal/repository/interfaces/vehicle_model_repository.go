package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type VehicleModelRepository interface {
	Create(ctx context.Context, vehicleModel *models.VehicleModel) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error)
	GetByCode(ctx context.Context, code string) (*models.VehicleModel, error)
	GetByName(ctx context.Context, name string) (*models.VehicleModel, error)
	Update(ctx context.Context, vehicleModel *models.VehicleModel) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error)
	GetActive(ctx context.Context) ([]*models.VehicleModel, error)
	GetByBrandID(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*models.VehicleModel, error)
	GetByYear(ctx context.Context, year int, limit, offset int) ([]*models.VehicleModel, error)
	GetByFuelType(ctx context.Context, fuelType string, limit, offset int) ([]*models.VehicleModel, error)
	Count(ctx context.Context) (int64, error)
	CountByBrand(ctx context.Context, brandID uuid.UUID) (int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleModel, error)
	SearchByBrand(ctx context.Context, brandID uuid.UUID, query string, limit, offset int) ([]*models.VehicleModel, error)
	GetWithBrand(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error)
	ListWithBrand(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error)
}