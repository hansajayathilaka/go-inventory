package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type brandRepository struct {
	db *gorm.DB
}

func NewBrandRepository(db *gorm.DB) interfaces.BrandRepository {
	return &brandRepository{db: db}
}

func (r *brandRepository) Create(ctx context.Context, brand *models.Brand) error {
	return r.db.WithContext(ctx).Create(brand).Error
}

func (r *brandRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Brand, error) {
	var brand models.Brand
	err := r.db.WithContext(ctx).First(&brand, id).Error
	if err != nil {
		return nil, err
	}
	return &brand, nil
}

func (r *brandRepository) GetByCode(ctx context.Context, code string) (*models.Brand, error) {
	var brand models.Brand
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&brand).Error
	if err != nil {
		return nil, err
	}
	return &brand, nil
}

func (r *brandRepository) GetByName(ctx context.Context, name string) (*models.Brand, error) {
	var brand models.Brand
	err := r.db.WithContext(ctx).Where("name ILIKE ?", "%"+name+"%").First(&brand).Error
	if err != nil {
		return nil, err
	}
	return &brand, nil
}

func (r *brandRepository) Update(ctx context.Context, brand *models.Brand) error {
	return r.db.WithContext(ctx).Save(brand).Error
}

func (r *brandRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Brand{}, id).Error
}

func (r *brandRepository) List(ctx context.Context, limit, offset int) ([]*models.Brand, error) {
	var brands []*models.Brand
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&brands).Error
	return brands, err
}

func (r *brandRepository) GetActive(ctx context.Context) ([]*models.Brand, error) {
	var brands []*models.Brand
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&brands).Error
	return brands, err
}

func (r *brandRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Brand{}).Count(&count).Error
	return count, err
}

func (r *brandRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Brand, error) {
	var brands []*models.Brand
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("name ILIKE ? OR code ILIKE ? OR description ILIKE ?", 
			searchPattern, searchPattern, searchPattern).
		Limit(limit).Offset(offset).
		Find(&brands).Error
	return brands, err
}