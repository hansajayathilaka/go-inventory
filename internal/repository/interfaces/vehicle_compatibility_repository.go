package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type VehicleCompatibilityRepository interface {
	Create(ctx context.Context, compatibility *models.VehicleCompatibility) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error)
	Update(ctx context.Context, compatibility *models.VehicleCompatibility) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetActive(ctx context.Context) ([]*models.VehicleCompatibility, error)
	GetByProductID(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetByVehicleModelID(ctx context.Context, vehicleModelID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetByProductAndVehicle(ctx context.Context, productID, vehicleModelID uuid.UUID) (*models.VehicleCompatibility, error)
	GetCompatibleProducts(ctx context.Context, vehicleModelID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetCompatibleVehicles(ctx context.Context, productID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetVerified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetUnverified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	Count(ctx context.Context) (int64, error)
	CountByProduct(ctx context.Context, productID uuid.UUID) (int64, error)
	CountByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) (int64, error)
	GetWithRelations(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error)
	ListWithRelations(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	BulkCreate(ctx context.Context, compatibilities []*models.VehicleCompatibility) error
	DeleteByProduct(ctx context.Context, productID uuid.UUID) error
	DeleteByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) error
}