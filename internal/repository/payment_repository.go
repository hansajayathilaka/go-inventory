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

type paymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new payment repository
func NewPaymentRepository(db *gorm.DB) interfaces.PaymentRepository {
	return &paymentRepository{db: db}
}

// Create creates a new payment after validation
func (r *paymentRepository) Create(ctx context.Context, payment *models.Payment) error {
	if err := r.ValidatePayment(ctx, payment); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Create(payment).Error
}

// GetByID retrieves a payment by ID with relationships
func (r *paymentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error) {
	var payment models.Payment
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Sale.Customer").
		First(&payment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

// Update updates a payment after validation
func (r *paymentRepository) Update(ctx context.Context, payment *models.Payment) error {
	if err := r.ValidatePayment(ctx, payment); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Save(payment).Error
}

// Delete soft deletes a payment
func (r *paymentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Payment{}, "id = ?", id).Error
}

// List retrieves payments with pagination
func (r *paymentRepository) List(ctx context.Context, offset, limit int) ([]*models.Payment, int64, error) {
	var payments []*models.Payment
	var total int64

	// Count total records
	if err := r.db.WithContext(ctx).Model(&models.Payment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Sale.Customer").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&payments).Error

	return payments, total, err
}

// GetBySale retrieves all payments for a specific sale
func (r *paymentRepository) GetBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error) {
	var payments []*models.Payment
	err := r.db.WithContext(ctx).
		Where("sale_id = ?", saleID).
		Order("created_at ASC").
		Find(&payments).Error
	return payments, err
}

// GetByMethod retrieves payments by payment method
func (r *paymentRepository) GetByMethod(ctx context.Context, method models.PaymentMethod, offset, limit int) ([]*models.Payment, int64, error) {
	var payments []*models.Payment
	var total int64

	query := r.db.WithContext(ctx).Where("method = ?", method)

	if err := query.Model(&models.Payment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Sale").
		Preload("Sale.Customer").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&payments).Error

	return payments, total, err
}

// GetByDateRange retrieves payments within a date range
func (r *paymentRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.Payment, int64, error) {
	var payments []*models.Payment
	var total int64

	query := r.db.WithContext(ctx).Where("created_at BETWEEN ? AND ?", startDate, endDate)

	if err := query.Model(&models.Payment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Preload("Sale").
		Preload("Sale.Customer").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&payments).Error

	return payments, total, err
}

// GetByCreatedDate retrieves payments for a specific date
func (r *paymentRepository) GetByCreatedDate(ctx context.Context, date time.Time, offset, limit int) ([]*models.Payment, int64, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Nanosecond)
	
	return r.GetByDateRange(ctx, startOfDay, endOfDay, offset, limit)
}

// Search performs a comprehensive search across payments
func (r *paymentRepository) Search(ctx context.Context, reference string, method models.PaymentMethod, startDate, endDate *time.Time, saleID *uuid.UUID, offset, limit int) ([]*models.Payment, int64, error) {
	var payments []*models.Payment
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Payment{})

	// Build search conditions
	if reference != "" {
		query = query.Where("reference ILIKE ?", "%"+reference+"%")
	}

	if method != "" {
		query = query.Where("method = ?", method)
	}

	if startDate != nil && endDate != nil {
		query = query.Where("created_at BETWEEN ? AND ?", *startDate, *endDate)
	}

	if saleID != nil {
		query = query.Where("sale_id = ?", *saleID)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("Sale").
		Preload("Sale.Customer").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&payments).Error

	return payments, total, err
}

// GetByReference retrieves payments by reference number
func (r *paymentRepository) GetByReference(ctx context.Context, reference string) ([]*models.Payment, error) {
	var payments []*models.Payment
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Where("reference = ?", reference).
		Find(&payments).Error
	return payments, err
}

// ValidatePayment validates a payment before creation or update
func (r *paymentRepository) ValidatePayment(ctx context.Context, payment *models.Payment) error {
	// Validate payment amount
	if payment.Amount <= 0 {
		return errors.New("payment amount must be greater than 0")
	}

	// Validate payment method
	validMethods := map[models.PaymentMethod]bool{
		models.PaymentMethodCash:         true,
		models.PaymentMethodCard:         true,
		models.PaymentMethodBankTransfer: true,
		models.PaymentMethodEWallet:      true,
		models.PaymentMethodCheck:        true,
	}
	
	if !validMethods[payment.Method] {
		return errors.New("invalid payment method")
	}

	// Validate sale exists
	var sale models.Sale
	if err := r.db.WithContext(ctx).First(&sale, "id = ?", payment.SaleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("sale not found")
		}
		return err
	}

	// Check if total payments would exceed sale total
	currentTotal, err := r.GetSalePaymentTotal(ctx, payment.SaleID)
	if err != nil {
		return err
	}

	// If updating existing payment, subtract its current amount
	if payment.ID != uuid.Nil {
		var existingPayment models.Payment
		if err := r.db.WithContext(ctx).First(&existingPayment, "id = ?", payment.ID).Error; err == nil {
			currentTotal -= existingPayment.Amount
		}
	}

	newTotal := currentTotal + payment.Amount
	if newTotal > sale.TotalAmount {
		return errors.New("total payments cannot exceed sale total")
	}

	return nil
}

// GetSalePaymentTotal calculates total payments made for a sale
func (r *paymentRepository) GetSalePaymentTotal(ctx context.Context, saleID uuid.UUID) (float64, error) {
	var total float64
	err := r.db.WithContext(ctx).Model(&models.Payment{}).
		Where("sale_id = ?", saleID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	return total, err
}

// GetSalePaymentBalance calculates remaining balance for a sale
func (r *paymentRepository) GetSalePaymentBalance(ctx context.Context, saleID uuid.UUID) (float64, error) {
	var sale models.Sale
	if err := r.db.WithContext(ctx).First(&sale, "id = ?", saleID).Error; err != nil {
		return 0, err
	}

	totalPaid, err := r.GetSalePaymentTotal(ctx, saleID)
	if err != nil {
		return 0, err
	}

	return sale.TotalAmount - totalPaid, nil
}

// IsSaleFullyPaid checks if a sale is fully paid
func (r *paymentRepository) IsSaleFullyPaid(ctx context.Context, saleID uuid.UUID) (bool, error) {
	balance, err := r.GetSalePaymentBalance(ctx, saleID)
	if err != nil {
		return false, err
	}
	return balance <= 0.01, nil // Allow for small floating point differences
}

// GetPaymentMethodStats returns statistics by payment method for a date range
func (r *paymentRepository) GetPaymentMethodStats(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.WithContext(ctx).Table("payments").
		Select("method, COUNT(*) as payment_count, SUM(amount) as total_amount").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("method").
		Order("total_amount DESC").
		Find(&results).Error
	
	return results, err
}

// GetDailyPaymentSummary returns payment summary for a specific date
func (r *paymentRepository) GetDailyPaymentSummary(ctx context.Context, date time.Time) (map[string]interface{}, error) {
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-time.Nanosecond)
	
	summary := make(map[string]interface{})

	// Total payments count and amount
	var totalCount int64
	var totalAmount float64
	
	if err := r.db.WithContext(ctx).Model(&models.Payment{}).
		Where("created_at BETWEEN ? AND ?", startOfDay, endOfDay).
		Count(&totalCount).Error; err != nil {
		return nil, err
	}

	if err := r.db.WithContext(ctx).Model(&models.Payment{}).
		Where("created_at BETWEEN ? AND ?", startOfDay, endOfDay).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalAmount).Error; err != nil {
		return nil, err
	}

	// Payment method breakdown
	methodStats, err := r.GetPaymentMethodStats(ctx, startOfDay, endOfDay)
	if err != nil {
		return nil, err
	}

	summary["date"] = date
	summary["total_count"] = totalCount
	summary["total_amount"] = totalAmount
	summary["method_breakdown"] = methodStats

	return summary, nil
}

// GetPaymentTrends returns payment trends over a date range
func (r *paymentRepository) GetPaymentTrends(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := r.db.WithContext(ctx).Table("payments").
		Select("DATE(created_at) as payment_date, COUNT(*) as payment_count, SUM(amount) as total_amount").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("DATE(created_at)").
		Order("payment_date ASC").
		Find(&results).Error
	
	return results, err
}

// GetPaymentsByMethod returns all payments for a specific method in date range
func (r *paymentRepository) GetPaymentsByMethod(ctx context.Context, method models.PaymentMethod, startDate, endDate time.Time) ([]*models.Payment, error) {
	var payments []*models.Payment
	err := r.db.WithContext(ctx).
		Preload("Sale").
		Preload("Sale.Customer").
		Where("method = ? AND created_at BETWEEN ? AND ?", method, startDate, endDate).
		Order("created_at DESC").
		Find(&payments).Error
	
	return payments, err
}

// GetTotalPaymentsByDate returns total payment amount for a date range
func (r *paymentRepository) GetTotalPaymentsByDate(ctx context.Context, startDate, endDate time.Time) (float64, error) {
	var total float64
	err := r.db.WithContext(ctx).Model(&models.Payment{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&total).Error
	
	return total, err
}

// GetPaymentCount returns payment count for a date range
func (r *paymentRepository) GetPaymentCount(ctx context.Context, startDate, endDate time.Time) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Payment{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&count).Error
	
	return count, err
}

// CreateBulk creates multiple payments in a transaction
func (r *paymentRepository) CreateBulk(ctx context.Context, payments []*models.Payment) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Validate all payments first
		for _, payment := range payments {
			if err := r.ValidatePayment(ctx, payment); err != nil {
				return err
			}
		}

		// Create all payments
		return tx.Create(&payments).Error
	})
}

// UpdateBulk updates multiple payments in a transaction
func (r *paymentRepository) UpdateBulk(ctx context.Context, payments []*models.Payment) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, payment := range payments {
			if err := r.ValidatePayment(ctx, payment); err != nil {
				return err
			}
			if err := tx.Save(payment).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// DeleteBySale deletes all payments for a specific sale
func (r *paymentRepository) DeleteBySale(ctx context.Context, saleID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("sale_id = ?", saleID).Delete(&models.Payment{}).Error
}

// ProcessRefund creates a refund payment for an original payment
func (r *paymentRepository) ProcessRefund(ctx context.Context, originalPaymentID uuid.UUID, refundAmount float64, notes string) (*models.Payment, error) {
	// Get original payment
	originalPayment, err := r.GetByID(ctx, originalPaymentID)
	if err != nil {
		return nil, err
	}

	// Validate refund amount
	if refundAmount <= 0 || refundAmount > originalPayment.Amount {
		return nil, errors.New("invalid refund amount")
	}

	// Create refund payment with negative amount
	refundPayment := &models.Payment{
		SaleID:    originalPayment.SaleID,
		Method:    originalPayment.Method,
		Amount:    -refundAmount, // Negative amount for refund
		Reference: "REFUND-" + originalPayment.Reference,
		Notes:     notes,
	}

	if err := r.db.WithContext(ctx).Create(refundPayment).Error; err != nil {
		return nil, err
	}

	return refundPayment, nil
}

// GetRefundsByOriginal retrieves all refunds for an original payment
func (r *paymentRepository) GetRefundsByOriginal(ctx context.Context, originalPaymentID uuid.UUID) ([]*models.Payment, error) {
	originalPayment, err := r.GetByID(ctx, originalPaymentID)
	if err != nil {
		return nil, err
	}

	var refunds []*models.Payment
	err = r.db.WithContext(ctx).
		Where("reference LIKE ? AND amount < 0", "REFUND-"+originalPayment.Reference+"%").
		Order("created_at DESC").
		Find(&refunds).Error
	
	return refunds, err
}