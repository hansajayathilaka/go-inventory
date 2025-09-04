package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type purchaseReceiptRepository struct {
	db *gorm.DB
}

// NewPurchaseReceiptRepository creates a new purchase receipt repository
func NewPurchaseReceiptRepository(db *gorm.DB) interfaces.PurchaseReceiptRepository {
	return &purchaseReceiptRepository{db: db}
}

// Create creates a new purchase receipt
func (r *purchaseReceiptRepository) Create(ctx context.Context, receipt *models.PurchaseReceipt) error {
	return r.db.WithContext(ctx).Create(receipt).Error
}

// GetByID retrieves a purchase receipt by ID
func (r *purchaseReceiptRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.PurchaseReceipt, error) {
	var receipt models.PurchaseReceipt
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("Items").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		Preload("Items.Product.Supplier").
		First(&receipt, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &receipt, nil
}

// GetByReceiptNumber retrieves a purchase receipt by receipt number
func (r *purchaseReceiptRepository) GetByReceiptNumber(ctx context.Context, receiptNumber string) (*models.PurchaseReceipt, error) {
	var receipt models.PurchaseReceipt
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Preload("Items").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		Preload("Items.Product.Supplier").
		First(&receipt, "receipt_number = ?", receiptNumber).Error
	if err != nil {
		return nil, err
	}
	return &receipt, nil
}

// Update updates a purchase receipt
func (r *purchaseReceiptRepository) Update(ctx context.Context, receipt *models.PurchaseReceipt) error {
	return r.db.WithContext(ctx).Save(receipt).Error
}

// Delete soft deletes a purchase receipt
func (r *purchaseReceiptRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PurchaseReceipt{}, "id = ?", id).Error
}

// List retrieves all purchase receipts with pagination
func (r *purchaseReceiptRepository) List(ctx context.Context, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	// Get total count
	if err := r.db.WithContext(ctx).Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetBySupplier retrieves purchase receipts by supplier ID
func (r *purchaseReceiptRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("supplier_id = ?", supplierID)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetByStatus retrieves purchase receipts by status
func (r *purchaseReceiptRepository) GetByStatus(ctx context.Context, status models.PurchaseReceiptStatus, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("status = ?", status)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetByUser retrieves purchase receipts by user ID (creator)
func (r *purchaseReceiptRepository) GetByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("created_by_id = ?", userID)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetByDateRange retrieves purchase receipts by date range (created_at)
func (r *purchaseReceiptRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("created_at BETWEEN ? AND ?", startDate, endDate)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetByOrderDateRange retrieves purchase receipts by order date range
func (r *purchaseReceiptRepository) GetByOrderDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("order_date BETWEEN ? AND ?", startDate, endDate)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("order_date DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// GetByReceivedDateRange retrieves purchase receipts by received date range
func (r *purchaseReceiptRepository) GetByReceivedDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Where("received_date BETWEEN ? AND ?", startDate, endDate)
	
	// Get total count
	if err := query.Model(&models.PurchaseReceipt{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("received_date DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// Search searches purchase receipts with multiple filters
func (r *purchaseReceiptRepository) Search(ctx context.Context, receiptNumber, supplierName, reference string, status models.PurchaseReceiptStatus, startDate, endDate *time.Time, createdByID *uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	var receipts []*models.PurchaseReceipt
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.PurchaseReceipt{})
	
	// Add joins for search
	query = query.Joins("LEFT JOIN suppliers ON purchase_receipts.supplier_id = suppliers.id")
	query = query.Joins("LEFT JOIN users ON purchase_receipts.created_by_id = users.id")
	
	// Build where conditions
	var conditions []string
	var args []interface{}
	
	if receiptNumber != "" {
		conditions = append(conditions, "purchase_receipts.receipt_number LIKE ? COLLATE NOCASE")
		args = append(args, "%"+receiptNumber+"%")
	}
	
	if supplierName != "" {
		conditions = append(conditions, "suppliers.name LIKE ? COLLATE NOCASE")
		args = append(args, "%"+supplierName+"%")
	}
	
	if reference != "" {
		conditions = append(conditions, "purchase_receipts.reference LIKE ? COLLATE NOCASE")
		args = append(args, "%"+reference+"%")
	}
	
	if status != "" {
		conditions = append(conditions, "purchase_receipts.status = ?")
		args = append(args, status)
	}
	
	if startDate != nil && endDate != nil {
		conditions = append(conditions, "purchase_receipts.created_at BETWEEN ? AND ?")
		args = append(args, *startDate, *endDate)
	}
	
	if createdByID != nil {
		conditions = append(conditions, "purchase_receipts.created_by_id = ?")
		args = append(args, *createdByID)
	}
	
	// Apply conditions
	if len(conditions) > 0 {
		query = query.Where(strings.Join(conditions, " AND "), args...)
	}
	
	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get receipts with pagination
	err := query.
		Preload("Supplier").
		Preload("CreatedBy").
		Order("purchase_receipts.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&receipts).Error
	
	return receipts, total, err
}

// UpdateStatus updates the status of a purchase receipt
func (r *purchaseReceiptRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PurchaseReceiptStatus, updatedByID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

// Approve approves a purchase receipt
func (r *purchaseReceiptRepository) Approve(ctx context.Context, id uuid.UUID, approvedByID uuid.UUID, approvedAt time.Time) error {
	// Method deprecated - approval workflow removed in simplified model
	return errors.New("approval workflow no longer supported")
}

// Send marks a purchase receipt as sent to supplier
func (r *purchaseReceiptRepository) Send(ctx context.Context, id uuid.UUID) error {
	// Method deprecated - order status removed in simplified model
	return errors.New("send order status no longer supported")
}

// StartReceiving marks a purchase receipt as starting to receive goods
func (r *purchaseReceiptRepository) StartReceiving(ctx context.Context, id uuid.UUID, receivedByID uuid.UUID, receivedAt time.Time) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":         models.PurchaseReceiptStatusReceived,
			"received_by_id": receivedByID,
			"received_date":  receivedAt,
			"updated_at":     time.Now(),
		}).Error
}

// MarkAsReceived marks a purchase receipt as fully received
func (r *purchaseReceiptRepository) MarkAsReceived(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     models.PurchaseReceiptStatusReceived,
			"updated_at": time.Now(),
		}).Error
}

// MarkAsCompleted marks a purchase receipt as completed
func (r *purchaseReceiptRepository) MarkAsCompleted(ctx context.Context, id uuid.UUID, verifiedByID *uuid.UUID) error {
	updates := map[string]interface{}{
		"status":     models.PurchaseReceiptStatusCompleted,
		"updated_at": time.Now(),
	}
	
	if verifiedByID != nil {
		updates["verified_by_id"] = *verifiedByID
		updates["verified_at"] = time.Now()
	}
	
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// Cancel cancels a purchase receipt
func (r *purchaseReceiptRepository) Cancel(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     models.PurchaseReceiptStatusCancelled,
			"updated_at": time.Now(),
		}).Error
}

// CreateItem creates a purchase receipt item
func (r *purchaseReceiptRepository) CreateItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

// GetItem retrieves a purchase receipt item by ID
func (r *purchaseReceiptRepository) GetItem(ctx context.Context, itemID uuid.UUID) (*models.PurchaseReceiptItem, error) {
	var item models.PurchaseReceiptItem
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Product.Category").
		Preload("Product.Supplier").
		First(&item, "id = ?", itemID).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// GetItemsByReceipt retrieves all items for a purchase receipt
func (r *purchaseReceiptRepository) GetItemsByReceipt(ctx context.Context, receiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error) {
	var items []*models.PurchaseReceiptItem
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Product.Category").
		Preload("Product.Supplier").
		Where("purchase_receipt_id = ?", receiptID).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

// UpdateItem updates a purchase receipt item
func (r *purchaseReceiptRepository) UpdateItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

// DeleteItem deletes a purchase receipt item
func (r *purchaseReceiptRepository) DeleteItem(ctx context.Context, itemID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.PurchaseReceiptItem{}, "id = ?", itemID).Error
}

// UpdateItemReceiptQuantities updates receipt quantities for an item
func (r *purchaseReceiptRepository) UpdateItemReceiptQuantities(ctx context.Context, itemID uuid.UUID, received, accepted, rejected, damaged int) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceiptItem{}).
		Where("id = ?", itemID).
		Updates(map[string]interface{}{
			"received_quantity": received,
			"accepted_quantity": accepted,
			"rejected_quantity": rejected,
			"damaged_quantity":  damaged,
			"updated_at":       time.Now(),
		}).Error
}

// UpdateFinancials updates the financial totals for a purchase receipt
func (r *purchaseReceiptRepository) UpdateFinancials(ctx context.Context, id uuid.UUID, subTotal, taxAmount, shippingCost, discountAmount, totalAmount float64) error {
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"sub_total":       subTotal,
			"tax_amount":      taxAmount,
			"shipping_cost":   shippingCost,
			"discount_amount": discountAmount,
			"total_amount":    totalAmount,
			"updated_at":      time.Now(),
		}).Error
}

// RecalculateTotal recalculates the total for a purchase receipt
func (r *purchaseReceiptRepository) RecalculateTotal(ctx context.Context, id uuid.UUID) error {
	// Get the purchase receipt
	receipt, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}
	
	// Calculate total from items
	var itemsTotal float64
	for _, item := range receipt.Items {
		itemsTotal += item.LineTotal
	}
	
	// Apply bill-level discount
	billDiscountAmount := receipt.BillDiscountAmount
	if receipt.BillDiscountPercentage > 0 {
		billDiscountAmount = itemsTotal * (receipt.BillDiscountPercentage / 100)
	}
	
	// Calculate final total
	totalAmount := itemsTotal - billDiscountAmount
	
	// Update the purchase receipt total
	return r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"bill_discount_amount": billDiscountAmount,
			"total_amount": totalAmount,
			"updated_at": time.Now(),
		}).Error
}

// GetStatsByDateRange retrieves statistics for purchase receipts in a date range
func (r *purchaseReceiptRepository) GetStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Count by status
	var statusCounts []struct {
		Status string  `json:"status"`
		Count  int64   `json:"count"`
		Total  float64 `json:"total"`
	}
	
	err := r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Select("status, COUNT(*) as count, SUM(total_amount) as total").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("status").
		Scan(&statusCounts).Error
	if err != nil {
		return nil, err
	}
	
	stats["status_breakdown"] = statusCounts
	
	// Total receipts
	var totalCount int64
	var totalAmount float64
	err = r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalCount).Error
	if err != nil {
		return nil, err
	}
	
	err = r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Select("SUM(total_amount)").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Scan(&totalAmount).Error
	if err != nil {
		return nil, err
	}
	
	stats["total_receipts"] = totalCount
	stats["total_amount"] = totalAmount
	
	return stats, nil
}

// GetTopSuppliers retrieves top suppliers by purchase volume
func (r *purchaseReceiptRepository) GetTopSuppliers(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error) {
	query := r.db.WithContext(ctx).
		Table("purchase_receipts").
		Select("suppliers.name, COUNT(*) as receipt_count, SUM(purchase_receipts.total_amount) as total_amount").
		Joins("JOIN suppliers ON purchase_receipts.supplier_id = suppliers.id").
		Group("suppliers.id, suppliers.name")
	
	if startDate != nil && endDate != nil {
		query = query.Where("purchase_receipts.created_at BETWEEN ? AND ?", *startDate, *endDate)
	}
	
	var results []map[string]interface{}
	err := query.
		Order("total_amount DESC").
		Limit(limit).
		Find(&results).Error
	
	return results, err
}

// GetPendingReceipts retrieves all pending purchase receipts
func (r *purchaseReceiptRepository) GetPendingReceipts(ctx context.Context) ([]*models.PurchaseReceipt, error) {
	var receipts []*models.PurchaseReceipt
	err := r.db.WithContext(ctx).
		Where("status = ?", models.PurchaseReceiptStatusPending).
		Preload("Supplier").
		Preload("CreatedBy").
		Order("created_at ASC").
		Find(&receipts).Error
	return receipts, err
}

// GetOverdueReceipts retrieves all overdue purchase receipts
func (r *purchaseReceiptRepository) GetOverdueReceipts(ctx context.Context) ([]*models.PurchaseReceipt, error) {
	var receipts []*models.PurchaseReceipt
	yesterday := time.Now().AddDate(0, 0, -1)
	
	err := r.db.WithContext(ctx).
		Where("status = ? AND purchase_date < ?", models.PurchaseReceiptStatusPending, yesterday).
		Preload("Supplier").
		Preload("CreatedBy").
		Order("expected_date ASC").
		Find(&receipts).Error
	return receipts, err
}

// GenerateReceiptNumber generates a new unique receipt number
func (r *purchaseReceiptRepository) GenerateReceiptNumber(ctx context.Context) (string, error) {
	now := time.Now()
	prefix := fmt.Sprintf("PR%04d%02d", now.Year(), now.Month())
	
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.PurchaseReceipt{}).
		Where("receipt_number LIKE ? COLLATE NOCASE", prefix+"%").
		Count(&count).Error
	if err != nil {
		return "", err
	}
	
	receiptNumber := fmt.Sprintf("%s%04d", prefix, count+1)
	return receiptNumber, nil
}