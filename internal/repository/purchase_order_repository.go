package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type purchaseOrderRepository struct {
	db *gorm.DB
}

func NewPurchaseOrderRepository(db *gorm.DB) interfaces.PurchaseOrderRepository {
	return &purchaseOrderRepository{db: db}
}

func (r *purchaseOrderRepository) Create(ctx context.Context, po *models.PurchaseOrder) error {
	return r.db.WithContext(ctx).Create(po).Error
}

func (r *purchaseOrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.PurchaseOrder, error) {
	var po models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Preload("Items").
		Preload("Items.Product").
		First(&po, id).Error
	if err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *purchaseOrderRepository) GetByPONumber(ctx context.Context, poNumber string) (*models.PurchaseOrder, error) {
	var po models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Preload("Items").
		Preload("Items.Product").
		Where("po_number = ?", poNumber).
		First(&po).Error
	if err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *purchaseOrderRepository) Update(ctx context.Context, po *models.PurchaseOrder) error {
	return r.db.WithContext(ctx).Save(po).Error
}

func (r *purchaseOrderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PurchaseOrder{}, id).Error
}

func (r *purchaseOrderRepository) List(ctx context.Context, limit, offset int) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Where("supplier_id = ?", supplierID).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) GetByStatus(ctx context.Context, status models.PurchaseOrderStatus) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Where("status = ?", status).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Where("order_date BETWEEN ? AND ?", startDate, endDate).
		Order("order_date DESC").
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	searchQuery := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Joins("LEFT JOIN suppliers ON suppliers.id = purchase_orders.supplier_id").
		Where("purchase_orders.po_number ILIKE ? OR purchase_orders.reference ILIKE ? OR purchase_orders.notes ILIKE ? OR suppliers.name ILIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery).
		Order("purchase_orders.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.PurchaseOrder{}).Count(&count).Error
	return count, err
}

func (r *purchaseOrderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PurchaseOrderStatus) error {
	return r.db.WithContext(ctx).Model(&models.PurchaseOrder{}).Where("id = ?", id).Update("status", status).Error
}

func (r *purchaseOrderRepository) GetPendingOrders(ctx context.Context) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Where("status IN ?", []models.PurchaseOrderStatus{
			models.PurchaseOrderStatusDraft,
			models.PurchaseOrderStatusPending,
			models.PurchaseOrderStatusApproved,
		}).
		Order("created_at DESC").
		Find(&orders).Error
	return orders, err
}

func (r *purchaseOrderRepository) GetOrdersAwaitingDelivery(ctx context.Context) ([]*models.PurchaseOrder, error) {
	var orders []*models.PurchaseOrder
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("ApprovedBy").
		Where("status = ?", models.PurchaseOrderStatusOrdered).
		Order("expected_date ASC").
		Find(&orders).Error
	return orders, err
}

// Purchase Order Item operations

func (r *purchaseOrderRepository) CreateItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *purchaseOrderRepository) GetItemsByPurchaseOrderID(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.PurchaseOrderItem, error) {
	var items []*models.PurchaseOrderItem
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Product.Category").
		Where("purchase_order_id = ?", purchaseOrderID).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

func (r *purchaseOrderRepository) UpdateItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *purchaseOrderRepository) DeleteItem(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PurchaseOrderItem{}, id).Error
}