package interfaces

import (
	"context"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/models"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]*models.User, error)
	GetByRole(ctx context.Context, role models.UserRole) ([]*models.User, error)
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
}