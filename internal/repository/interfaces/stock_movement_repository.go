package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type StockMovementRepository interface {
	Create(ctx context.Context, movement *models.StockMovement) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.StockMovement, error)
	Update(ctx context.Context, movement *models.StockMovement) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.StockMovement, error)
	GetByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)
	GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)
	GetByMovementType(ctx context.Context, movementType models.MovementType, limit, offset int) ([]*models.StockMovement, error)
	GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.StockMovement, error)
	GetByReference(ctx context.Context, referenceID string) ([]*models.StockMovement, error)
	GetByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)
	GetByProductAndBatch(ctx context.Context, productID, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error)
	Count(ctx context.Context) (int64, error)
	GetMovementsByProductAndDateRange(ctx context.Context, productID uuid.UUID, start, end time.Time) ([]*models.StockMovement, error)
}