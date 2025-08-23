package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

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

func (r *locationRepository) GetByCode(ctx context.Context, code string) (*models.Location, error) {
	var location models.Location
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) GetByName(ctx context.Context, name string) (*models.Location, error) {
	var location models.Location
	err := r.db.WithContext(ctx).Where("name ILIKE ?", "%"+name+"%").First(&location).Error
	if err != nil {
		return nil, err
	}
	return &location, nil
}

func (r *locationRepository) Update(ctx context.Context, location *models.Location) error {
	return r.db.WithContext(ctx).Save(location).Error
}

func (r *locationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Location{}, id).Error
}

func (r *locationRepository) List(ctx context.Context, limit, offset int) ([]*models.Location, error) {
	var locations []*models.Location
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&locations).Error
	return locations, err
}

func (r *locationRepository) GetByType(ctx context.Context, locationType models.LocationType) ([]*models.Location, error) {
	var locations []*models.Location
	err := r.db.WithContext(ctx).Where("type = ?", locationType).Find(&locations).Error
	return locations, err
}

func (r *locationRepository) GetActive(ctx context.Context) ([]*models.Location, error) {
	var locations []*models.Location
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&locations).Error
	return locations, err
}

func (r *locationRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Location{}).Count(&count).Error
	return count, err
}