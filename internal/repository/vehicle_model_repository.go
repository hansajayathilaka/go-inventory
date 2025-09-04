package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type vehicleModelRepository struct {
	db *gorm.DB
}

func NewVehicleModelRepository(db *gorm.DB) interfaces.VehicleModelRepository {
	return &vehicleModelRepository{db: db}
}

func (r *vehicleModelRepository) Create(ctx context.Context, vehicleModel *models.VehicleModel) error {
	return r.db.WithContext(ctx).Create(vehicleModel).Error
}

func (r *vehicleModelRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	var vehicleModel models.VehicleModel
	err := r.db.WithContext(ctx).First(&vehicleModel, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicleModel, nil
}

func (r *vehicleModelRepository) GetByCode(ctx context.Context, code string) (*models.VehicleModel, error) {
	var vehicleModel models.VehicleModel
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&vehicleModel).Error
	if err != nil {
		return nil, err
	}
	return &vehicleModel, nil
}

func (r *vehicleModelRepository) GetByName(ctx context.Context, name string) (*models.VehicleModel, error) {
	var vehicleModel models.VehicleModel
	err := r.db.WithContext(ctx).Where("name LIKE ? COLLATE NOCASE", "%"+name+"%").First(&vehicleModel).Error
	if err != nil {
		return nil, err
	}
	return &vehicleModel, nil
}

func (r *vehicleModelRepository) Update(ctx context.Context, vehicleModel *models.VehicleModel) error {
	return r.db.WithContext(ctx).Save(vehicleModel).Error
}

func (r *vehicleModelRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.VehicleModel{}, id).Error
}

func (r *vehicleModelRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) GetActive(ctx context.Context) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) GetByBrandID(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).
		Where("vehicle_brand_id = ?", brandID).
		Limit(limit).Offset(offset).
		Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) GetByYear(ctx context.Context, year int, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).
		Where("year_from <= ? AND (year_to IS NULL OR year_to >= ?)", year, year).
		Limit(limit).Offset(offset).
		Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) GetByFuelType(ctx context.Context, fuelType string, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).
		Where("fuel_type = ?", fuelType).
		Limit(limit).Offset(offset).
		Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VehicleModel{}).Count(&count).Error
	return count, err
}

func (r *vehicleModelRepository) CountByBrand(ctx context.Context, brandID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.VehicleModel{}).
		Where("vehicle_brand_id = ?", brandID).
		Count(&count).Error
	return count, err
}

func (r *vehicleModelRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("name LIKE ? COLLATE NOCASE OR code LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR engine_size LIKE ? COLLATE NOCASE", 
			searchPattern, searchPattern, searchPattern, searchPattern).
		Limit(limit).Offset(offset).
		Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) SearchByBrand(ctx context.Context, brandID uuid.UUID, query string, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("vehicle_brand_id = ? AND (name LIKE ? COLLATE NOCASE OR code LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE OR engine_size LIKE ? COLLATE NOCASE)", 
			brandID, searchPattern, searchPattern, searchPattern, searchPattern).
		Limit(limit).Offset(offset).
		Find(&vehicleModels).Error
	return vehicleModels, err
}

func (r *vehicleModelRepository) GetWithBrand(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	var vehicleModel models.VehicleModel
	err := r.db.WithContext(ctx).Preload("VehicleBrand").First(&vehicleModel, id).Error
	if err != nil {
		return nil, err
	}
	return &vehicleModel, nil
}

func (r *vehicleModelRepository) ListWithBrand(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	var vehicleModels []*models.VehicleModel
	err := r.db.WithContext(ctx).Preload("VehicleBrand").Limit(limit).Offset(offset).Find(&vehicleModels).Error
	return vehicleModels, err
}