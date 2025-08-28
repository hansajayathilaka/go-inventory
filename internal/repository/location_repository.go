package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

// Minimal LocationRepository implementation for single hardware store
type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) interfaces.LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) Create(ctx context.Context, location *models.Location) error {
	return r.db.WithContext(ctx).Create(location).Error
}

func (r *locationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	var location models.Location
	err := r.db.WithContext(ctx).First(&location, id).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) GetByName(ctx context.Context, name string) (*models.Location, error) {
	var location models.Location
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}