package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type vehicleCompatibilityRepository struct {
	db *gorm.DB
}

func NewVehicleCompatibilityRepository(db *gorm.DB) interfaces.VehicleCompatibilityRepository {
	return &vehicleCompatibilityRepository{db: db}
}

func (r *vehicleCompatibilityRepository) Create(ctx context.Context, compatibility *models.VehicleCompatibility) error {
	return r.db.WithContext(ctx).Create(compatibility).Error
}

func (r *vehicleCompatibilityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	var compatibility models.VehicleCompatibility
	err := r.db.WithContext(ctx).First(&compatibility, id).Error
	if err != nil {
		return nil, err
	}
	return &compatibility, nil
}

func (r *vehicleCompatibilityRepository) Update(ctx context.Context, compatibility *models.VehicleCompatibility) error {
	return r.db.WithContext(ctx).Save(compatibility).Error
}

func (r *vehicleCompatibilityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.VehicleCompatibility{}, id).Error
}

func (r *vehicleCompatibilityRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetActive(ctx context.Context) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetByProductID(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Where("product_id = ?", productID).
		Limit(limit).Offset(offset).
		Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetByVehicleModelID(ctx context.Context, vehicleModelID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Where("vehicle_model_id = ?", vehicleModelID).
		Limit(limit).Offset(offset).
		Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetByProductAndVehicle(ctx context.Context, productID, vehicleModelID uuid.UUID) (*models.VehicleCompatibility, error) {
	var compatibility models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Where("product_id = ? AND vehicle_model_id = ?", productID, vehicleModelID).
		First(&compatibility).Error
	if err != nil {
		return nil, err
	}
	return &compatibility, nil
}

func (r *vehicleCompatibilityRepository) GetCompatibleProducts(ctx context.Context, vehicleModelID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	query := r.db.WithContext(ctx).
		Where("vehicle_model_id = ? AND is_active = ?", vehicleModelID, true)
	
	if year > 0 {
		query = query.Where("(year_from IS NULL OR year_from <= ?) AND (year_to IS NULL OR year_to >= ?)", year, year)
	}
	
	err := query.Limit(limit).Offset(offset).Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetCompatibleVehicles(ctx context.Context, productID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	query := r.db.WithContext(ctx).
		Where("product_id = ? AND is_active = ?", productID, true)
	
	if year > 0 {
		query = query.Where("(year_from IS NULL OR year_from <= ?) AND (year_to IS NULL OR year_to >= ?)", year, year)
	}
	
	err := query.Limit(limit).Offset(offset).Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetVerified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Where("is_verified = ?", true).
		Limit(limit).Offset(offset).
		Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) GetUnverified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Where("is_verified = ?", false).
		Limit(limit).Offset(offset).
		Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.VehicleCompatibility{}).Count(&count).Error
	return count, err
}

func (r *vehicleCompatibilityRepository) CountByProduct(ctx context.Context, productID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.VehicleCompatibility{}).
		Where("product_id = ?", productID).
		Count(&count).Error
	return count, err
}

func (r *vehicleCompatibilityRepository) CountByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.VehicleCompatibility{}).
		Where("vehicle_model_id = ?", vehicleModelID).
		Count(&count).Error
	return count, err
}

func (r *vehicleCompatibilityRepository) GetWithRelations(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	var compatibility models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("VehicleModel").
		Preload("VehicleModel.VehicleBrand").
		First(&compatibility, id).Error
	if err != nil {
		return nil, err
	}
	return &compatibility, nil
}

func (r *vehicleCompatibilityRepository) ListWithRelations(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	var compatibilities []*models.VehicleCompatibility
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("VehicleModel").
		Preload("VehicleModel.VehicleBrand").
		Limit(limit).Offset(offset).
		Find(&compatibilities).Error
	return compatibilities, err
}

func (r *vehicleCompatibilityRepository) BulkCreate(ctx context.Context, compatibilities []*models.VehicleCompatibility) error {
	return r.db.WithContext(ctx).CreateInBatches(compatibilities, 100).Error
}

func (r *vehicleCompatibilityRepository) DeleteByProduct(ctx context.Context, productID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("product_id = ?", productID).
		Delete(&models.VehicleCompatibility{}).Error
}

func (r *vehicleCompatibilityRepository) DeleteByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("vehicle_model_id = ?", vehicleModelID).
		Delete(&models.VehicleCompatibility{}).Error
}