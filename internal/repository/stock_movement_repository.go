package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type stockMovementRepository struct {
	db *gorm.DB
}

func NewStockMovementRepository(db *gorm.DB) interfaces.StockMovementRepository {
	return &stockMovementRepository{db: db}
}

func (r *stockMovementRepository) Create(ctx context.Context, movement *models.StockMovement) error {
	return r.db.WithContext(ctx).Create(movement).Error
}

func (r *stockMovementRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.StockMovement, error) {
	var movement models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		First(&movement, id).Error
	if err != nil {
		return nil, err
	}
	return &movement, nil
}

func (r *stockMovementRepository) Update(ctx context.Context, movement *models.StockMovement) error {
	return r.db.WithContext(ctx).Save(movement).Error
}

func (r *stockMovementRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.StockMovement{}, id).Error
}

func (r *stockMovementRepository) List(ctx context.Context, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}


func (r *stockMovementRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByMovementType(ctx context.Context, movementType models.MovementType, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("movement_type = ?", movementType).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("created_at BETWEEN ? AND ?", start, end).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByReference(ctx context.Context, referenceID string) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("reference_id = ?", referenceID).
		Order("created_at DESC").
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.StockMovement{}).Count(&count).Error
	return count, err
}

func (r *stockMovementRepository) GetMovementsByProductAndDateRange(ctx context.Context, productID uuid.UUID, start, end time.Time) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("product_id = ? AND created_at BETWEEN ? AND ?", productID, start, end).
		Order("created_at ASC").
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByBatch(ctx context.Context, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("batch_id = ?", batchID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}

func (r *stockMovementRepository) GetByProductAndBatch(ctx context.Context, productID, batchID uuid.UUID, limit, offset int) ([]*models.StockMovement, error) {
	var movements []*models.StockMovement
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("User").
		Preload("Batch").
		Where("product_id = ? AND batch_id = ?", productID, batchID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&movements).Error
	return movements, err
}