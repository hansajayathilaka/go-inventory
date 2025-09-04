package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type saleItemRepository struct {
	db *gorm.DB
}

// NewSaleItemRepository creates a new sale item repository
func NewSaleItemRepository(db *gorm.DB) interfaces.SaleItemRepository {
	return &saleItemRepository{db: db}
}

// Create creates a new sale item
func (r *saleItemRepository) Create(ctx context.Context, item *models.SaleItem) error {
	// Calculate line total before creating
	lineTotal, err := r.RecalculateLineTotal(ctx, item)
	if err != nil {
		return err
	}
	item.LineTotal = lineTotal
	
	return r.db.WithContext(ctx).Create(item).Error
}

// GetByID retrieves a sale item by ID with relationships
func (r *saleItemRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SaleItem, error) {
	var item models.SaleItem
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Sale.Customer").
		Preload("Product").
		Preload("Product.Category").
		Preload("Product.Supplier").
		First(&item, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// Update updates a sale item and recalculates totals
func (r *saleItemRepository) Update(ctx context.Context, item *models.SaleItem) error {
	// Recalculate line total
	lineTotal, err := r.RecalculateLineTotal(ctx, item)
	if err != nil {
		return err
	}
	item.LineTotal = lineTotal
	
	return r.db.WithContext(ctx).Save(item).Error
}

// Delete deletes a sale item
func (r *saleItemRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.SaleItem{}, "id = ?", id).Error
}

// List retrieves sale items with pagination
func (r *saleItemRepository) List(ctx context.Context, offset, limit int) ([]*models.SaleItem, int64, error) {
	var items []*models.SaleItem
	var total int64

	// Count total records
	if err := r.db.WithContext(ctx).Model(&models.SaleItem{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Product").
		Preload("Product.Category").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error

	return items, total, err
}

// GetBySale retrieves all items for a specific sale
func (r *saleItemRepository) GetBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error) {
	var items []*models.SaleItem
	err := r.db.WithContext(ctx).
		Preload("Product").
		Preload("Product.Category").
		Preload("Product.Supplier").
		Where("sale_id = ?", saleID).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

// GetByProduct retrieves all items for a specific product
func (r *saleItemRepository) GetByProduct(ctx context.Context, productID uuid.UUID, offset, limit int) ([]*models.SaleItem, int64, error) {
	var items []*models.SaleItem
	var total int64

	query := r.db.WithContext(ctx).Where("product_id = ?", productID)

	if err := query.Model(&models.SaleItem{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Sale").
		Preload("Sale.Customer").
		Preload("Product").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error

	return items, total, err
}

// GetByDateRange retrieves sale items within a date range
func (r *saleItemRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.SaleItem, int64, error) {
	var items []*models.SaleItem
	var total int64

	query := r.db.WithContext(ctx).
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sales.sale_date BETWEEN ? AND ?", startDate, endDate)

	if err := query.Model(&models.SaleItem{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Sale").
		Preload("Product").
		Preload("Product.Category").
		Order("sales.sale_date DESC, sale_items.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&items).Error

	return items, total, err
}

// CalculateItemProfit calculates profit for a specific sale item
func (r *saleItemRepository) CalculateItemProfit(ctx context.Context, itemID uuid.UUID) (float64, error) {
	var item models.SaleItem
	if err := r.db.WithContext(ctx).First(&item, "id = ?", itemID).Error; err != nil {
		return 0, err
	}

	// Profit = (unit_price - unit_cost) * quantity - item_discount_amount
	unitProfit := item.UnitPrice - item.UnitCost
	totalProfit := unitProfit * float64(item.Quantity)
	
	// Apply item-level discount to reduce profit
	if item.ItemDiscountPercentage > 0 {
		totalProfit = totalProfit * (1 - item.ItemDiscountPercentage/100)
	}
	if item.ItemDiscountAmount > 0 {
		totalProfit -= item.ItemDiscountAmount
	}

	return totalProfit, nil
}

// GetProfitByProduct calculates total profit for a product over a date range
func (r *saleItemRepository) GetProfitByProduct(ctx context.Context, productID uuid.UUID, startDate, endDate *time.Time) (float64, int, error) {
	query := r.db.WithContext(ctx).Table("sale_items").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sale_items.product_id = ?", productID)

	if startDate != nil && endDate != nil {
		query = query.Where("sales.sale_date BETWEEN ? AND ?", *startDate, *endDate)
	}

	var result struct {
		TotalProfit float64
		TotalQuantity int
	}

	err := query.Select(`
		COALESCE(SUM((unit_price - unit_cost) * quantity - item_discount_amount), 0) as total_profit,
		COALESCE(SUM(quantity), 0) as total_quantity
	`).Scan(&result).Error

	return result.TotalProfit, result.TotalQuantity, err
}

// GetProfitBySale calculates total profit for all items in a sale
func (r *saleItemRepository) GetProfitBySale(ctx context.Context, saleID uuid.UUID) (float64, error) {
	var totalProfit float64
	err := r.db.WithContext(ctx).Table("sale_items").
		Where("sale_id = ?", saleID).
		Select("COALESCE(SUM((unit_price - unit_cost) * quantity - item_discount_amount), 0)").
		Scan(&totalProfit).Error

	return totalProfit, err
}

// GetTotalProfit calculates total profit for all sales in a date range
func (r *saleItemRepository) GetTotalProfit(ctx context.Context, startDate, endDate time.Time) (float64, error) {
	var totalProfit float64
	err := r.db.WithContext(ctx).Table("sale_items").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sales.sale_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM((unit_price - unit_cost) * quantity - item_discount_amount), 0)").
		Scan(&totalProfit).Error

	return totalProfit, err
}

// UpdateLineTotal updates the line total for a sale item
func (r *saleItemRepository) UpdateLineTotal(ctx context.Context, itemID uuid.UUID) error {
	var item models.SaleItem
	if err := r.db.WithContext(ctx).First(&item, "id = ?", itemID).Error; err != nil {
		return err
	}

	lineTotal, err := r.RecalculateLineTotal(ctx, &item)
	if err != nil {
		return err
	}

	return r.db.WithContext(ctx).Model(&item).Update("line_total", lineTotal).Error
}

// RecalculateLineTotal calculates the line total for a sale item
func (r *saleItemRepository) RecalculateLineTotal(ctx context.Context, item *models.SaleItem) (float64, error) {
	baseAmount := item.UnitPrice * float64(item.Quantity)
	
	// Apply item-level discount
	lineTotal := baseAmount
	if item.ItemDiscountPercentage > 0 {
		lineTotal = baseAmount * (1 - item.ItemDiscountPercentage/100)
	}
	if item.ItemDiscountAmount > 0 {
		lineTotal -= item.ItemDiscountAmount
	}

	// Ensure line total is not negative
	if lineTotal < 0 {
		lineTotal = 0
	}

	return lineTotal, nil
}

// GetTopSellingProducts returns the top-selling products by quantity or value
func (r *saleItemRepository) GetTopSellingProducts(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error) {
	query := r.db.WithContext(ctx).Table("sale_items").
		Select(`
			products.name as product_name,
			products.sku as product_sku,
			categories.name as category_name,
			SUM(sale_items.quantity) as total_quantity,
			SUM(sale_items.line_total) as total_revenue,
			COALESCE(SUM((sale_items.unit_price - sale_items.unit_cost) * sale_items.quantity - sale_items.item_discount_amount), 0) as total_profit
		`).
		Joins("JOIN products ON products.id = sale_items.product_id").
		Joins("JOIN categories ON categories.id = products.category_id").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Group("products.id, products.name, products.sku, categories.name").
		Order("total_quantity DESC").
		Limit(limit)

	if startDate != nil && endDate != nil {
		query = query.Where("sales.sale_date BETWEEN ? AND ?", *startDate, *endDate)
	}

	var results []map[string]interface{}
	err := query.Find(&results).Error
	return results, err
}

// GetProductSalesStats returns sales statistics for a specific product
func (r *saleItemRepository) GetProductSalesStats(ctx context.Context, productID uuid.UUID, startDate, endDate *time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := r.db.WithContext(ctx).Table("sale_items").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sale_items.product_id = ?", productID)

	if startDate != nil && endDate != nil {
		query = query.Where("sales.sale_date BETWEEN ? AND ?", *startDate, *endDate)
	}

	var result struct {
		TotalQuantity int64
		TotalRevenue  float64
		TotalProfit   float64
		SalesCount    int64
		AvgUnitPrice  float64
		MinUnitPrice  float64
		MaxUnitPrice  float64
	}

	err := query.Select(`
		COALESCE(SUM(quantity), 0) as total_quantity,
		COALESCE(SUM(line_total), 0) as total_revenue,
		COALESCE(SUM((unit_price - unit_cost) * quantity - item_discount_amount), 0) as total_profit,
		COUNT(*) as sales_count,
		COALESCE(AVG(unit_price), 0) as avg_unit_price,
		COALESCE(MIN(unit_price), 0) as min_unit_price,
		COALESCE(MAX(unit_price), 0) as max_unit_price
	`).Scan(&result).Error

	if err != nil {
		return nil, err
	}

	stats["total_quantity"] = result.TotalQuantity
	stats["total_revenue"] = result.TotalRevenue
	stats["total_profit"] = result.TotalProfit
	stats["sales_count"] = result.SalesCount
	stats["avg_unit_price"] = result.AvgUnitPrice
	stats["min_unit_price"] = result.MinUnitPrice
	stats["max_unit_price"] = result.MaxUnitPrice
	stats["product_id"] = productID

	if startDate != nil {
		stats["start_date"] = *startDate
	}
	if endDate != nil {
		stats["end_date"] = *endDate
	}

	return stats, nil
}

// GetSalesVolumeByProduct returns sales volume for all products in a date range
func (r *saleItemRepository) GetSalesVolumeByProduct(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.WithContext(ctx).Table("sale_items").
		Select(`
			products.name as product_name,
			products.sku as product_sku,
			categories.name as category_name,
			SUM(sale_items.quantity) as total_quantity,
			COUNT(DISTINCT sale_items.sale_id) as sales_count,
			SUM(sale_items.line_total) as total_revenue
		`).
		Joins("JOIN products ON products.id = sale_items.product_id").
		Joins("JOIN categories ON categories.id = products.category_id").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sales.sale_date BETWEEN ? AND ?", startDate, endDate).
		Group("products.id, products.name, products.sku, categories.name").
		Order("total_quantity DESC").
		Find(&results).Error

	return results, err
}

// ApplyItemDiscount applies a discount to a sale item
func (r *saleItemRepository) ApplyItemDiscount(ctx context.Context, itemID uuid.UUID, discountAmount, discountPercentage float64) error {
	updates := map[string]interface{}{
		"item_discount_amount":     discountAmount,
		"item_discount_percentage": discountPercentage,
	}

	if err := r.db.WithContext(ctx).Model(&models.SaleItem{}).
		Where("id = ?", itemID).
		Updates(updates).Error; err != nil {
		return err
	}

	// Recalculate line total after applying discount
	return r.UpdateLineTotal(ctx, itemID)
}

// RemoveItemDiscount removes discount from a sale item
func (r *saleItemRepository) RemoveItemDiscount(ctx context.Context, itemID uuid.UUID) error {
	return r.ApplyItemDiscount(ctx, itemID, 0, 0)
}

// CreateBulk creates multiple sale items in a transaction
func (r *saleItemRepository) CreateBulk(ctx context.Context, items []*models.SaleItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Calculate line totals for all items
		for _, item := range items {
			lineTotal, err := r.RecalculateLineTotal(ctx, item)
			if err != nil {
				return err
			}
			item.LineTotal = lineTotal
		}

		// Create all items
		return tx.Create(&items).Error
	})
}

// UpdateBulk updates multiple sale items in a transaction
func (r *saleItemRepository) UpdateBulk(ctx context.Context, items []*models.SaleItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, item := range items {
			// Recalculate line total
			lineTotal, err := r.RecalculateLineTotal(ctx, item)
			if err != nil {
				return err
			}
			item.LineTotal = lineTotal

			// Update item
			if err := tx.Save(item).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// DeleteBySale deletes all sale items for a specific sale
func (r *saleItemRepository) DeleteBySale(ctx context.Context, saleID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("sale_id = ?", saleID).Delete(&models.SaleItem{}).Error
}