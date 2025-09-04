package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type supplierRepository struct {
	db *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) interfaces.SupplierRepository {
	return &supplierRepository{db: db}
}

func (r *supplierRepository) Create(ctx context.Context, supplier *models.Supplier) error {
	return r.db.WithContext(ctx).Create(supplier).Error
}

func (r *supplierRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	var supplier models.Supplier
	err := r.db.WithContext(ctx).First(&supplier, id).Error
	if err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *supplierRepository) GetByCode(ctx context.Context, code string) (*models.Supplier, error) {
	var supplier models.Supplier
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&supplier).Error
	if err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *supplierRepository) GetByName(ctx context.Context, name string) (*models.Supplier, error) {
	var supplier models.Supplier
	err := r.db.WithContext(ctx).Where("name LIKE ? COLLATE NOCASE", "%"+name+"%").First(&supplier).Error
	if err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *supplierRepository) Update(ctx context.Context, supplier *models.Supplier) error {
	return r.db.WithContext(ctx).Save(supplier).Error
}

func (r *supplierRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Supplier{}, id).Error
}

func (r *supplierRepository) List(ctx context.Context, limit, offset int) ([]*models.Supplier, error) {
	var suppliers []*models.Supplier
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&suppliers).Error
	return suppliers, err
}

func (r *supplierRepository) GetActive(ctx context.Context) ([]*models.Supplier, error) {
	var suppliers []*models.Supplier
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&suppliers).Error
	return suppliers, err
}

func (r *supplierRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Supplier{}).Count(&count).Error
	return count, err
}