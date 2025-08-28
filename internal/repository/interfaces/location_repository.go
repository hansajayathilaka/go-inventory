package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// Minimal LocationRepository interface for single hardware store
// Only keeps essential methods for database compatibility
type LocationRepository interface {
	Create(ctx context.Context, location *models.Location) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error)
	GetByName(ctx context.Context, name string) (*models.Location, error)
}