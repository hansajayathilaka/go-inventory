package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type stockBatchRepository struct {
	db *gorm.DB
}

// NewStockBatchRepository creates a new stock batch repository
func NewStockBatchRepository(db *gorm.DB) interfaces.StockBatchRepository {
	return &stockBatchRepository{db: db}
}

// Create creates a new stock batch
func (r *stockBatchRepository) Create(ctx context.Context, batch *models.StockBatch) error {
	// Set received date if not provided
	if batch.ReceivedDate == nil {
		now := time.Now()
		batch.ReceivedDate = &now
	}
	
	// Set available quantity equal to quantity initially
	if batch.AvailableQuantity == 0 {
		batch.AvailableQuantity = batch.Quantity
	}
	
	return r.db.WithContext(ctx).Create(batch).Error
}

// GetByID retrieves a stock batch by ID with relationships
func (r *stockBatchRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.StockBatch, error) {
	var batch models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Product.Category").
		Preload("Supplier").
		Preload("StockMovements").
		First(&batch, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

// Update updates a stock batch
func (r *stockBatchRepository) Update(ctx context.Context, batch *models.StockBatch) error {
	return r.db.WithContext(ctx).Save(batch).Error
}

// Delete soft deletes a stock batch
func (r *stockBatchRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.StockBatch{}, "id = ?", id).Error
}

// List retrieves stock batches with pagination
func (r *stockBatchRepository) List(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	// Count total records
	if err := r.db.WithContext(ctx).Model(&models.StockBatch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// GetByProduct retrieves all batches for a specific product
func (r *stockBatchRepository) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Where("product_id = ?", productID).
		Order("received_date ASC, created_at ASC"). // FIFO ordering by default
		Find(&batches).Error
	return batches, err
}

// GetBySupplier retrieves batches for a specific supplier
func (r *stockBatchRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	query := r.db.WithContext(ctx).Where("supplier_id = ?", supplierID)

	if err := query.Model(&models.StockBatch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Product").
		Order("received_date DESC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// GetByBatchNumber retrieves batches by batch number
func (r *stockBatchRepository) GetByBatchNumber(ctx context.Context, batchNumber string) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Where("batch_number = ?", batchNumber).
		Find(&batches).Error
	return batches, err
}

// GetByLotNumber retrieves batches by lot number
func (r *stockBatchRepository) GetByLotNumber(ctx context.Context, lotNumber string) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Where("lot_number = ?", lotNumber).
		Find(&batches).Error
	return batches, err
}

// GetActiveBatches retrieves only active batches
func (r *stockBatchRepository) GetActiveBatches(ctx context.Context, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	query := r.db.WithContext(ctx).Where("is_active = ?", true)

	if err := query.Model(&models.StockBatch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Product").
		Preload("Supplier").
		Order("received_date ASC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// GetActiveByProduct retrieves active batches for a specific product
func (r *stockBatchRepository) GetActiveByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Where("product_id = ? AND is_active = ?", productID, true).
		Order("received_date ASC, created_at ASC"). // FIFO ordering
		Find(&batches).Error
	return batches, err
}

// GetAvailableBatches retrieves batches with available quantity for a product
func (r *stockBatchRepository) GetAvailableBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Supplier").
		Where("product_id = ? AND is_active = ? AND available_quantity > 0", productID, true).
		Order("received_date ASC, created_at ASC"). // FIFO ordering
		Find(&batches).Error
	return batches, err
}

// GetByReceivedDateRange retrieves batches received within a date range
func (r *stockBatchRepository) GetByReceivedDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	query := r.db.WithContext(ctx).Where("received_date BETWEEN ? AND ?", startDate, endDate)

	if err := query.Model(&models.StockBatch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Product").
		Preload("Supplier").
		Order("received_date DESC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// GetByExpiryDateRange retrieves batches expiring within a date range
func (r *stockBatchRepository) GetByExpiryDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	query := r.db.WithContext(ctx).Where("expiry_date BETWEEN ? AND ? AND expiry_date IS NOT NULL", startDate, endDate)

	if err := query.Model(&models.StockBatch{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Product").
		Preload("Supplier").
		Order("expiry_date ASC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// GetExpiringBatches retrieves batches expiring within specified days
func (r *stockBatchRepository) GetExpiringBatches(ctx context.Context, days int) ([]*models.StockBatch, error) {
	futureDate := time.Now().AddDate(0, 0, days)
	
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Where("expiry_date <= ? AND expiry_date IS NOT NULL AND is_active = ? AND available_quantity > 0", futureDate, true).
		Order("expiry_date ASC").
		Find(&batches).Error
	
	return batches, err
}

// GetExpiredBatches retrieves already expired batches
func (r *stockBatchRepository) GetExpiredBatches(ctx context.Context) ([]*models.StockBatch, error) {
	now := time.Now()
	
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Where("expiry_date < ? AND expiry_date IS NOT NULL", now).
		Order("expiry_date ASC").
		Find(&batches).Error
	
	return batches, err
}

// GetBatchesForSale retrieves batches for sale using FIFO or LIFO method
func (r *stockBatchRepository) GetBatchesForSale(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	var orderBy string
	
	// Determine ordering based on method
	switch method {
	case "FIFO":
		orderBy = "received_date ASC, created_at ASC"
	case "LIFO":
		orderBy = "received_date DESC, created_at DESC"
	case "FEFO": // First Expired First Out
		orderBy = "expiry_date ASC, received_date ASC"
	default:
		orderBy = "received_date ASC, created_at ASC" // Default to FIFO
	}
	
	err := r.db.WithContext(ctx).
		Where("product_id = ? AND is_active = ? AND available_quantity > 0", productID, true).
		Order(orderBy).
		Find(&batches).Error
	
	return batches, err
}

// AllocateStock allocates stock from batches using specified method
func (r *stockBatchRepository) AllocateStock(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error) {
	batches, err := r.GetBatchesForSale(ctx, productID, quantity, method)
	if err != nil {
		return nil, err
	}
	
	var allocatedBatches []*models.StockBatch
	remainingQuantity := quantity
	
	for _, batch := range batches {
		if remainingQuantity <= 0 {
			break
		}
		
		allocateFromBatch := batch.AvailableQuantity
		if allocateFromBatch > remainingQuantity {
			allocateFromBatch = remainingQuantity
		}
		
		// Update available quantity (reserve the stock)
		batch.AvailableQuantity -= allocateFromBatch
		remainingQuantity -= allocateFromBatch
		
		if err := r.Update(ctx, batch); err != nil {
			return nil, err
		}
		
		allocatedBatches = append(allocatedBatches, batch)
	}
	
	if remainingQuantity > 0 {
		return nil, errors.New("insufficient stock available for allocation")
	}
	
	return allocatedBatches, nil
}

// ReserveStock reserves stock in a specific batch
func (r *stockBatchRepository) ReserveStock(ctx context.Context, batchID uuid.UUID, quantity int) error {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	if batch.AvailableQuantity < quantity {
		return errors.New("insufficient available quantity in batch")
	}
	
	batch.AvailableQuantity -= quantity
	return r.Update(ctx, batch)
}

// ReleaseStock releases reserved stock back to available
func (r *stockBatchRepository) ReleaseStock(ctx context.Context, batchID uuid.UUID, quantity int) error {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	// Ensure we don't exceed total quantity
	if batch.AvailableQuantity+quantity > batch.Quantity {
		return errors.New("cannot release more stock than total quantity")
	}
	
	batch.AvailableQuantity += quantity
	return r.Update(ctx, batch)
}

// ConsumeStock permanently consumes stock from a batch
func (r *stockBatchRepository) ConsumeStock(ctx context.Context, batchID uuid.UUID, quantity int) error {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	if batch.Quantity < quantity {
		return errors.New("insufficient quantity in batch")
	}
	
	batch.Quantity -= quantity
	
	// Ensure available quantity doesn't exceed total quantity
	if batch.AvailableQuantity > batch.Quantity {
		batch.AvailableQuantity = batch.Quantity
	}
	
	return r.Update(ctx, batch)
}

// Search performs comprehensive search across stock batches
func (r *stockBatchRepository) Search(ctx context.Context, batchNumber, lotNumber string, productID, supplierID *uuid.UUID, isActive *bool, offset, limit int) ([]*models.StockBatch, int64, error) {
	var batches []*models.StockBatch
	var total int64

	query := r.db.WithContext(ctx).Model(&models.StockBatch{})

	// Build search conditions
	if batchNumber != "" {
		query = query.Where("batch_number ILIKE ?", "%"+batchNumber+"%")
	}

	if lotNumber != "" {
		query = query.Where("lot_number ILIKE ?", "%"+lotNumber+"%")
	}

	if productID != nil {
		query = query.Where("product_id = ?", *productID)
	}

	if supplierID != nil {
		query = query.Where("supplier_id = ?", *supplierID)
	}

	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Product").
		Preload("Supplier").
		Order("received_date DESC").
		Offset(offset).
		Limit(limit).
		Find(&batches).Error

	return batches, total, err
}

// UpdateQuantity updates quantity and available quantity for a batch
func (r *stockBatchRepository) UpdateQuantity(ctx context.Context, batchID uuid.UUID, quantity, availableQuantity int) error {
	return r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("id = ?", batchID).
		Updates(map[string]interface{}{
			"quantity":           quantity,
			"available_quantity": availableQuantity,
		}).Error
}

// AdjustQuantity adjusts quantity by a positive or negative amount
func (r *stockBatchRepository) AdjustQuantity(ctx context.Context, batchID uuid.UUID, adjustment int) error {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	newQuantity := batch.Quantity + adjustment
	if newQuantity < 0 {
		return errors.New("adjustment would result in negative quantity")
	}
	
	// Adjust available quantity proportionally
	newAvailableQuantity := batch.AvailableQuantity + adjustment
	if newAvailableQuantity < 0 {
		newAvailableQuantity = 0
	}
	if newAvailableQuantity > newQuantity {
		newAvailableQuantity = newQuantity
	}
	
	return r.UpdateQuantity(ctx, batchID, newQuantity, newAvailableQuantity)
}

// RecalculateAvailableQuantity recalculates available quantity based on reservations
func (r *stockBatchRepository) RecalculateAvailableQuantity(ctx context.Context, batchID uuid.UUID) error {
	// This would typically involve checking stock movements and reservations
	// For now, we'll implement a simple version
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	// In a full implementation, you'd calculate based on stock movements
	// For now, ensure available doesn't exceed total
	if batch.AvailableQuantity > batch.Quantity {
		batch.AvailableQuantity = batch.Quantity
		return r.Update(ctx, batch)
	}
	
	return nil
}

// GetWeightedAverageCost calculates weighted average cost for a product across all batches
func (r *stockBatchRepository) GetWeightedAverageCost(ctx context.Context, productID uuid.UUID) (float64, error) {
	var result struct {
		WeightedCost float64
	}
	
	err := r.db.WithContext(ctx).Table("stock_batches").
		Where("product_id = ? AND is_active = ? AND available_quantity > 0", productID, true).
		Select("SUM(cost_price * available_quantity) / SUM(available_quantity) as weighted_cost").
		Scan(&result).Error
	
	return result.WeightedCost, err
}

// GetBatchTotalCost calculates total cost value for a batch
func (r *stockBatchRepository) GetBatchTotalCost(ctx context.Context, batchID uuid.UUID) (float64, error) {
	var batch models.StockBatch
	if err := r.db.WithContext(ctx).First(&batch, "id = ?", batchID).Error; err != nil {
		return 0, err
	}
	
	return batch.CostPrice * float64(batch.Quantity), nil
}

// GetProductTotalValue calculates total inventory value for a product
func (r *stockBatchRepository) GetProductTotalValue(ctx context.Context, productID uuid.UUID) (float64, error) {
	var totalValue float64
	err := r.db.WithContext(ctx).Table("stock_batches").
		Where("product_id = ? AND is_active = ?", productID, true).
		Select("SUM(cost_price * quantity)").
		Scan(&totalValue).Error
	
	return totalValue, err
}

// ActivateBatch activates a batch
func (r *stockBatchRepository) ActivateBatch(ctx context.Context, batchID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("id = ?", batchID).
		Update("is_active", true).Error
}

// DeactivateBatch deactivates a batch
func (r *stockBatchRepository) DeactivateBatch(ctx context.Context, batchID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("id = ?", batchID).
		Update("is_active", false).Error
}

// MarkBatchAsEmpty marks a batch as empty (zero quantities)
func (r *stockBatchRepository) MarkBatchAsEmpty(ctx context.Context, batchID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("id = ?", batchID).
		Updates(map[string]interface{}{
			"quantity":           0,
			"available_quantity": 0,
		}).Error
}

// GetLowStockBatches retrieves batches below threshold
func (r *stockBatchRepository) GetLowStockBatches(ctx context.Context, threshold int) ([]*models.StockBatch, error) {
	var batches []*models.StockBatch
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Supplier").
		Where("available_quantity <= ? AND is_active = ?", threshold, true).
		Order("available_quantity ASC").
		Find(&batches).Error
	
	return batches, err
}

// GetBatchUtilization returns utilization statistics for a batch
func (r *stockBatchRepository) GetBatchUtilization(ctx context.Context, batchID uuid.UUID) (map[string]interface{}, error) {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return nil, err
	}
	
	utilization := make(map[string]interface{})
	utilization["batch_id"] = batchID
	utilization["total_quantity"] = batch.Quantity
	utilization["available_quantity"] = batch.AvailableQuantity
	utilization["consumed_quantity"] = batch.Quantity - batch.AvailableQuantity
	utilization["utilization_percentage"] = 0.0
	
	if batch.Quantity > 0 {
		utilization["utilization_percentage"] = float64(batch.Quantity-batch.AvailableQuantity) / float64(batch.Quantity) * 100
	}
	
	return utilization, nil
}

// GetProductBatchSummary returns batch summary for a product
func (r *stockBatchRepository) GetProductBatchSummary(ctx context.Context, productID uuid.UUID) (map[string]interface{}, error) {
	var summary struct {
		TotalBatches     int64
		ActiveBatches    int64
		TotalQuantity    int
		AvailableQuantity int
		TotalValue       float64
	}
	
	// Get counts and quantities
	if err := r.db.WithContext(ctx).Table("stock_batches").
		Where("product_id = ?", productID).
		Select(`
			COUNT(*) as total_batches,
			SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_batches,
			SUM(quantity) as total_quantity,
			SUM(available_quantity) as available_quantity,
			SUM(cost_price * quantity) as total_value
		`).
		Scan(&summary).Error; err != nil {
		return nil, err
	}
	
	result := make(map[string]interface{})
	result["product_id"] = productID
	result["total_batches"] = summary.TotalBatches
	result["active_batches"] = summary.ActiveBatches
	result["total_quantity"] = summary.TotalQuantity
	result["available_quantity"] = summary.AvailableQuantity
	result["total_value"] = summary.TotalValue
	
	return result, nil
}

// GetInventoryValuation returns inventory valuation for all products
func (r *stockBatchRepository) GetInventoryValuation(ctx context.Context) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.WithContext(ctx).Table("stock_batches").
		Select(`
			products.name as product_name,
			products.sku as product_sku,
			SUM(stock_batches.quantity) as total_quantity,
			SUM(stock_batches.available_quantity) as available_quantity,
			SUM(stock_batches.cost_price * stock_batches.quantity) as total_value
		`).
		Joins("JOIN products ON products.id = stock_batches.product_id").
		Where("stock_batches.is_active = ?", true).
		Group("products.id, products.name, products.sku").
		Find(&results).Error
	
	return results, err
}

// CreateBulk creates multiple stock batches in a transaction
func (r *stockBatchRepository) CreateBulk(ctx context.Context, batches []*models.StockBatch) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, batch := range batches {
			if batch.ReceivedDate == nil {
				now := time.Now()
				batch.ReceivedDate = &now
			}
			if batch.AvailableQuantity == 0 {
				batch.AvailableQuantity = batch.Quantity
			}
		}
		
		return tx.Create(&batches).Error
	})
}

// UpdateBulk updates multiple stock batches in a transaction
func (r *stockBatchRepository) UpdateBulk(ctx context.Context, batches []*models.StockBatch) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, batch := range batches {
			if err := tx.Save(batch).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// DeactivateBulk deactivates multiple batches
func (r *stockBatchRepository) DeactivateBulk(ctx context.Context, batchIDs []uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("id IN (?)", batchIDs).
		Update("is_active", false).Error
}

// ValidateBatchForSale validates if a batch can fulfill a sale quantity
func (r *stockBatchRepository) ValidateBatchForSale(ctx context.Context, batchID uuid.UUID, quantity int) error {
	batch, err := r.GetByID(ctx, batchID)
	if err != nil {
		return err
	}
	
	if !batch.IsActive {
		return errors.New("batch is not active")
	}
	
	if batch.AvailableQuantity < quantity {
		return errors.New("insufficient available quantity in batch")
	}
	
	// Check if batch is expired
	if batch.ExpiryDate != nil && batch.ExpiryDate.Before(time.Now()) {
		return errors.New("batch is expired")
	}
	
	return nil
}

// CheckBatchAvailability checks if sufficient stock is available for a product
func (r *stockBatchRepository) CheckBatchAvailability(ctx context.Context, productID uuid.UUID, requiredQuantity int) (bool, error) {
	var totalAvailable int
	err := r.db.WithContext(ctx).Model(&models.StockBatch{}).
		Where("product_id = ? AND is_active = ? AND available_quantity > 0", productID, true).
		Select("SUM(available_quantity)").
		Scan(&totalAvailable).Error
	
	return totalAvailable >= requiredQuantity, err
}

// GetBatchAllocationSuggestion suggests optimal batch allocation for a sale
func (r *stockBatchRepository) GetBatchAllocationSuggestion(ctx context.Context, productID uuid.UUID, requiredQuantity int, method string) ([]*models.StockBatch, error) {
	batches, err := r.GetBatchesForSale(ctx, productID, requiredQuantity, method)
	if err != nil {
		return nil, err
	}
	
	var suggestions []*models.StockBatch
	remainingQuantity := requiredQuantity
	
	for _, batch := range batches {
		if remainingQuantity <= 0 {
			break
		}
		
		allocateFromBatch := batch.AvailableQuantity
		if allocateFromBatch > remainingQuantity {
			allocateFromBatch = remainingQuantity
		}
		
		// Create a copy with suggested allocation
		suggestion := *batch
		suggestion.AvailableQuantity = allocateFromBatch // Use this field to indicate suggested quantity
		suggestions = append(suggestions, &suggestion)
		
		remainingQuantity -= allocateFromBatch
	}
	
	if remainingQuantity > 0 {
		return nil, errors.New("insufficient stock available for required quantity")
	}
	
	return suggestions, nil
}