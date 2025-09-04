package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// PaymentRepository defines the interface for payment data access operations
type PaymentRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, payment *models.Payment) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Payment, error)
	Update(ctx context.Context, payment *models.Payment) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// List operations
	List(ctx context.Context, offset, limit int) ([]*models.Payment, int64, error)
	GetBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error)
	GetByMethod(ctx context.Context, method models.PaymentMethod, offset, limit int) ([]*models.Payment, int64, error)
	
	// Date-based operations
	GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.Payment, int64, error)
	GetByCreatedDate(ctx context.Context, date time.Time, offset, limit int) ([]*models.Payment, int64, error)
	
	// Search operations
	Search(ctx context.Context, reference string, method models.PaymentMethod, startDate, endDate *time.Time, saleID *uuid.UUID, offset, limit int) ([]*models.Payment, int64, error)
	GetByReference(ctx context.Context, reference string) ([]*models.Payment, error)
	
	// Payment validation
	ValidatePayment(ctx context.Context, payment *models.Payment) error
	GetSalePaymentTotal(ctx context.Context, saleID uuid.UUID) (float64, error)
	GetSalePaymentBalance(ctx context.Context, saleID uuid.UUID) (float64, error)
	IsSaleFullyPaid(ctx context.Context, saleID uuid.UUID) (bool, error)
	
	// Payment method analytics
	GetPaymentMethodStats(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error)
	GetDailyPaymentSummary(ctx context.Context, date time.Time) (map[string]interface{}, error)
	GetPaymentTrends(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error)
	
	// Reporting operations
	GetPaymentsByMethod(ctx context.Context, method models.PaymentMethod, startDate, endDate time.Time) ([]*models.Payment, error)
	GetTotalPaymentsByDate(ctx context.Context, startDate, endDate time.Time) (float64, error)
	GetPaymentCount(ctx context.Context, startDate, endDate time.Time) (int64, error)
	
	// Bulk operations
	CreateBulk(ctx context.Context, payments []*models.Payment) error
	UpdateBulk(ctx context.Context, payments []*models.Payment) error
	DeleteBySale(ctx context.Context, saleID uuid.UUID) error
	
	// Transaction operations
	ProcessRefund(ctx context.Context, originalPaymentID uuid.UUID, refundAmount float64, notes string) (*models.Payment, error)
	GetRefundsByOriginal(ctx context.Context, originalPaymentID uuid.UUID) ([]*models.Payment, error)
}