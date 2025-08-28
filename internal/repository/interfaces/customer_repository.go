package interfaces

import (
	"context"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type CustomerRepository interface {
	Create(ctx context.Context, customer *models.Customer) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Customer, error)
	GetByCode(ctx context.Context, code string) (*models.Customer, error)
	GetByName(ctx context.Context, name string) (*models.Customer, error)
	GetByEmail(ctx context.Context, email string) (*models.Customer, error)
	Update(ctx context.Context, customer *models.Customer) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Customer, error)
	GetActive(ctx context.Context) ([]*models.Customer, error)
	Count(ctx context.Context) (int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*models.Customer, error)
}