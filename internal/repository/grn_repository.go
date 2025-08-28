package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type grnRepository struct {
	db *gorm.DB
}

func NewGRNRepository(db *gorm.DB) interfaces.GRNRepository {
	return &grnRepository{db: db}
}

// GRN operations

func (r *grnRepository) Create(ctx context.Context, grn *models.GRN) error {
	return r.db.WithContext(ctx).Create(grn).Error
}

func (r *grnRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.GRN, error) {
	var grn models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("PurchaseOrder.Supplier").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Preload("Items").
		Preload("Items.PurchaseOrderItem").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		First(&grn, id).Error
	if err != nil {
		return nil, err
	}
	return &grn, nil
}

func (r *grnRepository) GetByGRNNumber(ctx context.Context, grnNumber string) (*models.GRN, error) {
	var grn models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("PurchaseOrder.Supplier").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Preload("Items").
		Preload("Items.PurchaseOrderItem").
		Preload("Items.Product").
		Preload("Items.Product.Category").
		Where("grn_number = ?", grnNumber).
		First(&grn).Error
	if err != nil {
		return nil, err
	}
	return &grn, nil
}

func (r *grnRepository) Update(ctx context.Context, grn *models.GRN) error {
	return r.db.WithContext(ctx).Save(grn).Error
}

func (r *grnRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.GRN{}, id).Error
}

func (r *grnRepository) List(ctx context.Context, limit, offset int) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetByPurchaseOrder(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("purchase_order_id = ?", purchaseOrderID).
		Order("created_at DESC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("supplier_id = ?", supplierID).
		Order("created_at DESC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("location_id = ?", locationID).
		Order("created_at DESC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetByStatus(ctx context.Context, status models.GRNStatus) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("status = ?", status).
		Order("created_at DESC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("received_date BETWEEN ? AND ?", startDate, endDate).
		Order("received_date DESC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.GRN, error) {
	var grns []*models.GRN
	searchQuery := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Joins("LEFT JOIN suppliers ON suppliers.id = grns.supplier_id").
		Joins("LEFT JOIN purchase_orders ON purchase_orders.id = grns.purchase_order_id").
		Where("grns.grn_number ILIKE ? OR grns.delivery_note ILIKE ? OR grns.invoice_number ILIKE ? OR grns.notes ILIKE ? OR suppliers.name ILIKE ? OR purchase_orders.po_number ILIKE ?",
			searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery).
		Order("grns.created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.GRN{}).Count(&count).Error
	return count, err
}

func (r *grnRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.GRNStatus) error {
	return r.db.WithContext(ctx).Model(&models.GRN{}).Where("id = ?", id).Update("status", status).Error
}

func (r *grnRepository) GetPendingVerification(ctx context.Context) ([]*models.GRN, error) {
	var grns []*models.GRN
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Where("status IN ?", []models.GRNStatus{
			models.GRNStatusDraft,
			models.GRNStatusReceived,
			models.GRNStatusPartial,
		}).
		Where("verified_by_id IS NULL").
		Order("created_at ASC").
		Find(&grns).Error
	return grns, err
}

func (r *grnRepository) GetRecentGRNs(ctx context.Context, days int) ([]*models.GRN, error) {
	var grns []*models.GRN
	startDate := time.Now().AddDate(0, 0, -days)
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrder").
		Preload("Supplier").
		Preload("Location").
		Preload("ReceivedBy").
		Preload("VerifiedBy").
		Where("received_date >= ?", startDate).
		Order("received_date DESC").
		Find(&grns).Error
	return grns, err
}

// GRN Item operations

func (r *grnRepository) CreateItem(ctx context.Context, item *models.GRNItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *grnRepository) GetItemsByGRNID(ctx context.Context, grnID uuid.UUID) ([]*models.GRNItem, error) {
	var items []*models.GRNItem
	err := r.db.WithContext(ctx).
		Preload("PurchaseOrderItem").
		Preload("Product").
		Preload("Product.Category").
		Where("grn_id = ?", grnID).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

func (r *grnRepository) UpdateItem(ctx context.Context, item *models.GRNItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

func (r *grnRepository) DeleteItem(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.GRNItem{}, id).Error
}

func (r *grnRepository) GetItemsByProduct(ctx context.Context, productID uuid.UUID) ([]*models.GRNItem, error) {
	var items []*models.GRNItem
	err := r.db.WithContext(ctx).
		Preload("GRN").
		Preload("GRN.Supplier").
		Preload("PurchaseOrderItem").
		Preload("Product").
		Where("product_id = ?", productID).
		Order("created_at DESC").
		Find(&items).Error
	return items, err
}

func (r *grnRepository) UpdateItemStockStatus(ctx context.Context, id uuid.UUID, stockUpdated bool) error {
	return r.db.WithContext(ctx).Model(&models.GRNItem{}).Where("id = ?", id).Update("stock_updated", stockUpdated).Error
}

func (r *grnRepository) GetPendingStockUpdates(ctx context.Context) ([]*models.GRNItem, error) {
	var items []*models.GRNItem
	err := r.db.WithContext(ctx).
		Preload("GRN").
		Preload("GRN.Location").
		Preload("Product").
		Where("stock_updated = ? AND accepted_quantity > 0", false).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

// Analytics and reporting

func (r *grnRepository) GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	var results []struct {
		TotalGRNs        int64   `json:"total_grns"`
		TotalReceived    int64   `json:"total_received"`
		TotalAccepted    int64   `json:"total_accepted"`
		TotalRejected    int64   `json:"total_rejected"`
		TotalDamaged     int64   `json:"total_damaged"`
		AcceptanceRate   float64 `json:"acceptance_rate"`
		AverageAmount    float64 `json:"average_amount"`
		TotalAmount      float64 `json:"total_amount"`
		OnTimeDeliveries int64   `json:"on_time_deliveries"`
	}

	// Complex query to calculate supplier performance metrics
	query := `
		SELECT 
			COUNT(DISTINCT grns.id) as total_grns,
			COALESCE(SUM(grn_items.received_quantity), 0) as total_received,
			COALESCE(SUM(grn_items.accepted_quantity), 0) as total_accepted,
			COALESCE(SUM(grn_items.rejected_quantity), 0) as total_rejected,
			COALESCE(SUM(grn_items.damaged_quantity), 0) as total_damaged,
			CASE 
				WHEN SUM(grn_items.received_quantity) > 0 
				THEN (SUM(grn_items.accepted_quantity) * 100.0 / SUM(grn_items.received_quantity))
				ELSE 0
			END as acceptance_rate,
			COALESCE(AVG(grns.total_amount), 0) as average_amount,
			COALESCE(SUM(grns.total_amount), 0) as total_amount,
			COUNT(CASE 
				WHEN purchase_orders.expected_date IS NOT NULL 
				AND grns.received_date <= purchase_orders.expected_date 
				THEN 1 
			END) as on_time_deliveries
		FROM grns
		LEFT JOIN grn_items ON grn_items.grn_id = grns.id
		LEFT JOIN purchase_orders ON purchase_orders.id = grns.purchase_order_id
		WHERE grns.supplier_id = ? 
		AND grns.received_date BETWEEN ? AND ?
		AND grns.deleted_at IS NULL
	`

	err := r.db.WithContext(ctx).Raw(query, supplierID, startDate, endDate).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return map[string]interface{}{
			"total_grns":         0,
			"total_received":     0,
			"total_accepted":     0,
			"total_rejected":     0,
			"total_damaged":      0,
			"acceptance_rate":    0.0,
			"average_amount":     0.0,
			"total_amount":       0.0,
			"on_time_deliveries": 0,
		}, nil
	}

	result := results[0]
	return map[string]interface{}{
		"total_grns":         result.TotalGRNs,
		"total_received":     result.TotalReceived,
		"total_accepted":     result.TotalAccepted,
		"total_rejected":     result.TotalRejected,
		"total_damaged":      result.TotalDamaged,
		"acceptance_rate":    result.AcceptanceRate,
		"average_amount":     result.AverageAmount,
		"total_amount":       result.TotalAmount,
		"on_time_deliveries": result.OnTimeDeliveries,
	}, nil
}

func (r *grnRepository) GetReceiptSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	var results []struct {
		TotalGRNs       int64   `json:"total_grns"`
		TotalItems      int64   `json:"total_items"`
		TotalReceived   int64   `json:"total_received"`
		TotalAccepted   int64   `json:"total_accepted"`
		TotalRejected   int64   `json:"total_rejected"`
		TotalDamaged    int64   `json:"total_damaged"`
		TotalAmount     float64 `json:"total_amount"`
		PendingGRNs     int64   `json:"pending_grns"`
		CompletedGRNs   int64   `json:"completed_grns"`
		AcceptanceRate  float64 `json:"acceptance_rate"`
	}

	query := `
		SELECT 
			COUNT(DISTINCT grns.id) as total_grns,
			COUNT(grn_items.id) as total_items,
			COALESCE(SUM(grn_items.received_quantity), 0) as total_received,
			COALESCE(SUM(grn_items.accepted_quantity), 0) as total_accepted,
			COALESCE(SUM(grn_items.rejected_quantity), 0) as total_rejected,
			COALESCE(SUM(grn_items.damaged_quantity), 0) as total_damaged,
			COALESCE(SUM(grns.total_amount), 0) as total_amount,
			COUNT(CASE WHEN grns.status IN ('draft', 'received', 'partial') THEN 1 END) as pending_grns,
			COUNT(CASE WHEN grns.status = 'completed' THEN 1 END) as completed_grns,
			CASE 
				WHEN SUM(grn_items.received_quantity) > 0 
				THEN (SUM(grn_items.accepted_quantity) * 100.0 / SUM(grn_items.received_quantity))
				ELSE 0
			END as acceptance_rate
		FROM grns
		LEFT JOIN grn_items ON grn_items.grn_id = grns.id
		WHERE grns.received_date BETWEEN ? AND ?
		AND grns.deleted_at IS NULL
	`

	err := r.db.WithContext(ctx).Raw(query, startDate, endDate).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return map[string]interface{}{
			"total_grns":      0,
			"total_items":     0,
			"total_received":  0,
			"total_accepted":  0,
			"total_rejected":  0,
			"total_damaged":   0,
			"total_amount":    0.0,
			"pending_grns":    0,
			"completed_grns":  0,
			"acceptance_rate": 0.0,
		}, nil
	}

	result := results[0]
	return map[string]interface{}{
		"total_grns":      result.TotalGRNs,
		"total_items":     result.TotalItems,
		"total_received":  result.TotalReceived,
		"total_accepted":  result.TotalAccepted,
		"total_rejected":  result.TotalRejected,
		"total_damaged":   result.TotalDamaged,
		"total_amount":    result.TotalAmount,
		"pending_grns":    result.PendingGRNs,
		"completed_grns":  result.CompletedGRNs,
		"acceptance_rate": result.AcceptanceRate,
	}, nil
}