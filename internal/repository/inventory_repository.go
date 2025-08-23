package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

type inventoryRepository struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) interfaces.InventoryRepository {
	return &inventoryRepository{db: db}
}

func (r *inventoryRepository) Create(ctx context.Context, inventory *models.Inventory) error {
	return r.db.WithContext(ctx).Create(inventory).Error
}

func (r *inventoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Inventory, error) {
	var inventory models.Inventory
	err := r.db.WithContext(ctx).Preload("Product").Preload("Location").First(&inventory, id).Error
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

func (r *inventoryRepository) GetByProductAndLocation(ctx context.Context, productID, locationID uuid.UUID) (*models.Inventory, error) {
	var inventory models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Location").
		Where("product_id = ? AND location_id = ?", productID, locationID).
		First(&inventory).Error
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

func (r *inventoryRepository) Update(ctx context.Context, inventory *models.Inventory) error {
	return r.db.WithContext(ctx).Save(inventory).Error
}

func (r *inventoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Inventory{}, id).Error
}

func (r *inventoryRepository) List(ctx context.Context, limit, offset int) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).Preload("Product").Preload("Location").Limit(limit).Offset(offset).Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).Preload("Product").Preload("Location").Where("product_id = ?", productID).Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).Preload("Product").Preload("Location").Where("location_id = ?", locationID).Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Location").
		Where("quantity <= reorder_level AND reorder_level > 0").
		Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) GetZeroStock(ctx context.Context) ([]*models.Inventory, error) {
	var inventories []*models.Inventory
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Location").
		Where("quantity = 0").
		Find(&inventories).Error
	return inventories, err
}

func (r *inventoryRepository) UpdateQuantity(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).
		Model(&models.Inventory{}).
		Where("product_id = ? AND location_id = ?", productID, locationID).
		Update("quantity", quantity).Error
}

func (r *inventoryRepository) ReserveStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).
		Model(&models.Inventory{}).
		Where("product_id = ? AND location_id = ? AND (quantity - reserved_quantity) >= ?", productID, locationID, quantity).
		Update("reserved_quantity", gorm.Expr("reserved_quantity + ?", quantity)).Error
}

func (r *inventoryRepository) ReleaseReservedStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	return r.db.WithContext(ctx).
		Model(&models.Inventory{}).
		Where("product_id = ? AND location_id = ? AND reserved_quantity >= ?", productID, locationID, quantity).
		Update("reserved_quantity", gorm.Expr("reserved_quantity - ?", quantity)).Error
}

func (r *inventoryRepository) GetTotalQuantityByProduct(ctx context.Context, productID uuid.UUID) (int, error) {
	var total int
	err := r.db.WithContext(ctx).
		Model(&models.Inventory{}).
		Where("product_id = ?", productID).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&total).Error
	return total, err
}

func (r *inventoryRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Inventory{}).Count(&count).Error
	return count, err
}