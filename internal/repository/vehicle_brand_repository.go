package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type vehicleBrandRepository struct {
	db *gorm.DB
}

func NewVehicleBrandRepository(db *gorm.DB) interfaces.VehicleBrandRepository {
	return &vehicleBrandRepository{db: db}
}

func (r *vehicleBrandRepository) Create(ctx context.Context, vehicleBrand *models.VehicleBrand) error {
	return r.db.WithContext(ctx).Create(vehicleBrand).Error
}

func (r *vehicleBrandRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	var vehicleBrand models.VehicleBrand
	err := r.db.WithContext(ctx).First(&vehicleBrand, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicleBrand, nil
}

func (r *vehicleBrandRepository) GetByCode(ctx context.Context, code string) (*models.VehicleBrand, error) {
	var vehicleBrand models.VehicleBrand
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&vehicleBrand).Error
	if err != nil {
		return nil, err
	}
	return &vehicleBrand, nil
}

func (r *vehicleBrandRepository) GetByName(ctx context.Context, name string) (*models.VehicleBrand, error) {
	var vehicleBrand models.VehicleBrand
	err := r.db.WithContext(ctx).Where("name ILIKE ?", "%"+name+"%").First(&vehicleBrand).Error
	if err != nil {
		return nil, err
	}
	return &vehicleBrand, nil
}

func (r *vehicleBrandRepository) Update(ctx context.Context, vehicleBrand *models.VehicleBrand) error {
	return r.db.WithContext(ctx).Save(vehicleBrand).Error
}

func (r *vehicleBrandRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.VehicleBrand{}, id).Error
}

func (r *vehicleBrandRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	var vehicleBrands []*models.VehicleBrand
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&vehicleBrands).Error
	return vehicleBrands, err
}

func (r *vehicleBrandRepository) GetActive(ctx context.Context) ([]*models.VehicleBrand, error) {
	var vehicleBrands []*models.VehicleBrand
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&vehicleBrands).Error
	return vehicleBrands, err
}

func (r *vehicleBrandRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VehicleBrand{}).Count(&count).Error
	return count, err
}

func (r *vehicleBrandRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleBrand, error) {
	var vehicleBrands []*models.VehicleBrand
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("name ILIKE ? OR code ILIKE ? OR description ILIKE ?", 
			searchPattern, searchPattern, searchPattern).
		Limit(limit).Offset(offset).
		Find(&vehicleBrands).Error
	return vehicleBrands, err
}

func (r *vehicleBrandRepository) GetWithModels(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	var vehicleBrand models.VehicleBrand
	// TODO: Uncomment when VehicleModel is implemented
	// err := r.db.WithContext(ctx).Preload("VehicleModels").First(&vehicleBrand, id).Error
	err := r.db.WithContext(ctx).First(&vehicleBrand, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicleBrand, nil
}

func (r *vehicleBrandRepository) ListWithModels(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	var vehicleBrands []*models.VehicleBrand
	// TODO: Uncomment when VehicleModel is implemented
	// err := r.db.WithContext(ctx).Preload("VehicleModels").Limit(limit).Offset(offset).Find(&vehicleBrands).Error
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&vehicleBrands).Error
	return vehicleBrands, err
}