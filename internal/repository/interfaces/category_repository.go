package interfaces

import (
	"context"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/models"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error)
	GetByName(ctx context.Context, name string) (*models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.Category, error)
	GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error)
	GetByLevel(ctx context.Context, level int) ([]*models.Category, error)
	GetRootCategories(ctx context.Context) ([]*models.Category, error)
	GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error)
	Count(ctx context.Context) (int64, error)
}