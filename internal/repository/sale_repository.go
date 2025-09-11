package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type saleRepository struct {
	db *gorm.DB
}

// NewSaleRepository creates a new sale repository
func NewSaleRepository(db *gorm.DB) interfaces.SaleRepository {
	return &saleRepository{db: db}
}

// Create creates a new sale
func (r *saleRepository) Create(ctx context.Context, sale *models.Sale) error {
	return r.db.WithContext(ctx).Create(sale).Error
}

// GetByID retrieves a sale by ID with all relationships
func (r *saleRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Sale, error) {
	var sale models.Sale
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("SaleItems.Product").
		Preload("SaleItems.Product.Category").
		Preload("SaleItems.Product.Supplier").
		Preload("Payments").
		First(&sale, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &sale, nil
}

// GetByBillNumber retrieves a sale by bill number with all relationships
func (r *saleRepository) GetByBillNumber(ctx context.Context, billNumber string) (*models.Sale, error) {
	var sale models.Sale
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("SaleItems.Product").
		Preload("SaleItems.Product.Category").
		Preload("SaleItems.Product.Supplier").
		Preload("Payments").
		First(&sale, "bill_number = ?", billNumber).Error
	if err != nil {
		return nil, err
	}
	return &sale, nil
}

// Update updates a sale
func (r *saleRepository) Update(ctx context.Context, sale *models.Sale) error {
	return r.db.WithContext(ctx).Save(sale).Error
}

// Delete soft deletes a sale
func (r *saleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Sale{}, "id = ?", id).Error
}

// List retrieves sales with pagination
func (r *saleRepository) List(ctx context.Context, offset, limit int) ([]*models.Sale, int64, error) {
	var sales []*models.Sale
	var total int64

	// Count total records
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Order("sale_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&sales).Error

	return sales, total, err
}

// GetByCustomer retrieves sales for a specific customer
func (r *saleRepository) GetByCustomer(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]*models.Sale, int64, error) {
	var sales []*models.Sale
	var total int64

	query := r.db.WithContext(ctx).Where("customer_id = ?", customerID)
	
	if err := query.Model(&models.Sale{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Order("sale_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&sales).Error

	return sales, total, err
}

// GetByCashier retrieves sales for a specific cashier
func (r *saleRepository) GetByCashier(ctx context.Context, cashierID uuid.UUID, offset, limit int) ([]*models.Sale, int64, error) {
	var sales []*models.Sale
	var total int64

	query := r.db.WithContext(ctx).Where("cashier_id = ?", cashierID)
	
	if err := query.Model(&models.Sale{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Order("sale_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&sales).Error

	return sales, total, err
}

// GetByDateRange retrieves sales within a date range
func (r *saleRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.Sale, int64, error) {
	var sales []*models.Sale
	var total int64

	query := r.db.WithContext(ctx).Where("sale_date BETWEEN ? AND ?", startDate, endDate)
	
	if err := query.Model(&models.Sale{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Order("sale_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&sales).Error

	return sales, total, err
}

// GetBySaleDate retrieves sales for a specific date
func (r *saleRepository) GetBySaleDate(ctx context.Context, saleDate time.Time, offset, limit int) ([]*models.Sale, int64, error) {
	startOfDay := time.Date(saleDate.Year(), saleDate.Month(), saleDate.Day(), 0, 0, 0, 0, saleDate.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Nanosecond)
	
	return r.GetByDateRange(ctx, startOfDay, endOfDay, offset, limit)
}

// Search performs a comprehensive search across sales
func (r *saleRepository) Search(ctx context.Context, billNumber, customerName string, startDate, endDate *time.Time, cashierID *uuid.UUID, offset, limit int) ([]*models.Sale, int64, error) {
	var sales []*models.Sale
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Sale{})

	// Build search conditions
	if billNumber != "" {
		query = query.Where("bill_number ILIKE ?", "%"+billNumber+"%")
	}

	if customerName != "" {
		query = query.Joins("LEFT JOIN customers ON sales.customer_id = customers.id").
			Where("customers.name ILIKE ?", "%"+customerName+"%")
	}

	if startDate != nil && endDate != nil {
		query = query.Where("sale_date BETWEEN ? AND ?", *startDate, *endDate)
	}

	if cashierID != nil {
		query = query.Where("cashier_id = ?", *cashierID)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Order("sale_date DESC, created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&sales).Error

	return sales, total, err
}

// UpdateDiscounts updates bill-level discounts for a sale
func (r *saleRepository) UpdateDiscounts(ctx context.Context, id uuid.UUID, billDiscountAmount, billDiscountPercentage float64) error {
	return r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"bill_discount_amount":     billDiscountAmount,
			"bill_discount_percentage": billDiscountPercentage,
		}).Error
}

// RecalculateTotal recalculates the total amount for a sale based on its items and discounts
func (r *saleRepository) RecalculateTotal(ctx context.Context, id uuid.UUID) error {
	var sale models.Sale
	if err := r.db.WithContext(ctx).Preload("SaleItems").First(&sale, "id = ?", id).Error; err != nil {
		return err
	}

	var itemsTotal float64
	for _, item := range sale.SaleItems {
		itemsTotal += item.LineTotal
	}

	// Apply bill-level discount
	total := itemsTotal
	if sale.BillDiscountPercentage > 0 {
		total = itemsTotal * (1 - sale.BillDiscountPercentage/100)
	}
	if sale.BillDiscountAmount > 0 {
		total -= sale.BillDiscountAmount
	}

	// Ensure total is not negative
	if total < 0 {
		total = 0
	}

	return r.db.WithContext(ctx).Model(&sale).Update("total_amount", total).Error
}

// CreateItem creates a new sale item
func (r *saleRepository) CreateItem(ctx context.Context, item *models.SaleItem) error {
	return r.db.WithContext(ctx).Create(item).Error
}

// GetItem retrieves a sale item by ID
func (r *saleRepository) GetItem(ctx context.Context, itemID uuid.UUID) (*models.SaleItem, error) {
	var item models.SaleItem
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Product").
		Preload("Product.Category").
		Preload("Product.Supplier").
		First(&item, "id = ?", itemID).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// GetItemsBySale retrieves all items for a sale
func (r *saleRepository) GetItemsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error) {
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

// UpdateItem updates a sale item
func (r *saleRepository) UpdateItem(ctx context.Context, item *models.SaleItem) error {
	return r.db.WithContext(ctx).Save(item).Error
}

// DeleteItem deletes a sale item
func (r *saleRepository) DeleteItem(ctx context.Context, itemID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.SaleItem{}, "id = ?", itemID).Error
}

// CreatePayment creates a new payment
func (r *saleRepository) CreatePayment(ctx context.Context, payment *models.Payment) error {
	return r.db.WithContext(ctx).Create(payment).Error
}

// GetPaymentsBySale retrieves all payments for a sale
func (r *saleRepository) GetPaymentsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error) {
	var payments []*models.Payment
	err := r.db.WithContext(ctx).
		Where("sale_id = ?", saleID).
		Order("payment_date ASC, created_at ASC").
		Find(&payments).Error
	return payments, err
}

// UpdatePayment updates a payment
func (r *saleRepository) UpdatePayment(ctx context.Context, payment *models.Payment) error {
	return r.db.WithContext(ctx).Save(payment).Error
}

// DeletePayment deletes a payment
func (r *saleRepository) DeletePayment(ctx context.Context, paymentID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Payment{}, "id = ?", paymentID).Error
}

// GetStatsByDateRange retrieves sales statistics for a date range
func (r *saleRepository) GetStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total sales count
	var totalCount int64
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", startDate, endDate).
		Count(&totalCount).Error; err != nil {
		return nil, err
	}

	// Total sales amount
	var totalAmount float64
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalAmount).Error; err != nil {
		return nil, err
	}

	// Average sale amount
	var avgAmount float64
	if totalCount > 0 {
		avgAmount = totalAmount / float64(totalCount)
	}

	stats["total_sales"] = totalCount
	stats["total_amount"] = totalAmount
	stats["average_sale_amount"] = avgAmount
	stats["start_date"] = startDate
	stats["end_date"] = endDate

	return stats, nil
}

// GetTopCustomers retrieves top customers by sales volume
func (r *saleRepository) GetTopCustomers(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error) {
	query := r.db.WithContext(ctx).Table("sales").
		Select("customers.name as customer_name, COUNT(sales.id) as sales_count, SUM(sales.total_amount) as total_amount").
		Joins("LEFT JOIN customers ON sales.customer_id = customers.id").
		Where("customers.id IS NOT NULL").
		Group("customers.id, customers.name").
		Order("total_amount DESC").
		Limit(limit)

	if startDate != nil && endDate != nil {
		query = query.Where("sales.sale_date BETWEEN ? AND ?", *startDate, *endDate)
	}

	var results []map[string]interface{}
	err := query.Find(&results).Error
	return results, err
}

// GetDailySales retrieves all sales for a specific date
func (r *saleRepository) GetDailySales(ctx context.Context, date time.Time) ([]*models.Sale, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Nanosecond)
	
	var sales []*models.Sale
	err := r.db.WithContext(ctx).
		Preload("Customer").
		Preload("Cashier").
		Preload("SaleItems").
		Preload("Payments").
		Where("sale_date BETWEEN ? AND ?", startOfDay, endOfDay).
		Order("sale_date DESC, created_at DESC").
		Find(&sales).Error
	
	return sales, err
}

// GenerateBillNumber generates a unique bill number
func (r *saleRepository) GenerateBillNumber(ctx context.Context) (string, error) {
	var count int64
	today := time.Now()
	prefix := fmt.Sprintf("BILL-%04d%02d%02d", today.Year(), today.Month(), today.Day())
	
	// Count existing bills for today
	startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Nanosecond)
	
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", startOfDay, endOfDay).
		Count(&count).Error; err != nil {
		return "", err
	}

	// Generate bill number
	billNumber := fmt.Sprintf("%s-%04d", prefix, count+1)
	
	// Ensure uniqueness (check if it already exists)
	for {
		var existingCount int64
		if err := r.db.WithContext(ctx).Model(&models.Sale{}).
			Where("bill_number = ?", billNumber).
			Count(&existingCount).Error; err != nil {
			return "", err
		}
		
		if existingCount == 0 {
			break
		}
		
		count++
		billNumber = fmt.Sprintf("%s-%04d", prefix, count+1)
	}

	return billNumber, nil
}

// GetProfitByDateRange calculates total profit for a date range
func (r *saleRepository) GetProfitByDateRange(ctx context.Context, startDate, endDate time.Time) (float64, error) {
	var totalProfit float64
	err := r.db.WithContext(ctx).Table("sale_items").
		Joins("JOIN sales ON sales.id = sale_items.sale_id").
		Where("sales.sale_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM((sale_items.unit_price - sale_items.unit_cost) * sale_items.quantity), 0)").
		Scan(&totalProfit).Error
	
	return totalProfit, err
}

// GetSalesVolume returns count and total amount of sales for a date range
func (r *saleRepository) GetSalesVolume(ctx context.Context, startDate, endDate time.Time) (int64, float64, error) {
	var count int64
	var totalAmount float64

	// Get count
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", startDate, endDate).
		Count(&count).Error; err != nil {
		return 0, 0, err
	}

	// Get total amount
	if err := r.db.WithContext(ctx).Model(&models.Sale{}).
		Where("sale_date BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalAmount).Error; err != nil {
		return 0, 0, err
	}

	return count, totalAmount, nil
}