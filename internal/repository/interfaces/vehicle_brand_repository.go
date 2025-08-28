package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type VehicleBrandRepository interface {
	Create(ctx context.Context, vehicleBrand *models.VehicleBrand) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error)
	GetByCode(ctx context.Context, code string) (*models.VehicleBrand, error)
	GetByName(ctx context.Context, name string) (*models.VehicleBrand, error)
	Update(ctx context.Context, vehicleBrand *models.VehicleBrand) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error)
	GetActive(ctx context.Context) ([]*models.VehicleBrand, error)
	Count(ctx context.Context) (int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleBrand, error)
	GetWithModels(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error)
	ListWithModels(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error)
}