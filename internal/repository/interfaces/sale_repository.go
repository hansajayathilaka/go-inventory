package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// SaleRepository defines the interface for sale data access operations
type SaleRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, sale *models.Sale) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Sale, error)
	GetByBillNumber(ctx context.Context, billNumber string) (*models.Sale, error)
	Update(ctx context.Context, sale *models.Sale) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// List operations
	List(ctx context.Context, offset, limit int) ([]*models.Sale, int64, error)
	GetByCustomer(ctx context.Context, customerID uuid.UUID, offset, limit int) ([]*models.Sale, int64, error)
	GetByCashier(ctx context.Context, cashierID uuid.UUID, offset, limit int) ([]*models.Sale, int64, error)
	
	// Date-based operations
	GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.Sale, int64, error)
	GetBySaleDate(ctx context.Context, saleDate time.Time, offset, limit int) ([]*models.Sale, int64, error)
	
	// Search operations
	Search(ctx context.Context, billNumber, customerName string, startDate, endDate *time.Time, cashierID *uuid.UUID, offset, limit int) ([]*models.Sale, int64, error)
	
	// Financial operations
	UpdateDiscounts(ctx context.Context, id uuid.UUID, billDiscountAmount, billDiscountPercentage float64) error
	RecalculateTotal(ctx context.Context, id uuid.UUID) error
	
	// Item operations
	CreateItem(ctx context.Context, item *models.SaleItem) error
	GetItem(ctx context.Context, itemID uuid.UUID) (*models.SaleItem, error)
	GetItemsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error)
	UpdateItem(ctx context.Context, item *models.SaleItem) error
	DeleteItem(ctx context.Context, itemID uuid.UUID) error
	
	// Payment operations
	CreatePayment(ctx context.Context, payment *models.Payment) error
	GetPaymentsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error)
	UpdatePayment(ctx context.Context, payment *models.Payment) error
	DeletePayment(ctx context.Context, paymentID uuid.UUID) error
	
	// Reporting operations
	GetStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetTopCustomers(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error)
	GetDailySales(ctx context.Context, date time.Time) ([]*models.Sale, error)
	
	// Bill number generation
	GenerateBillNumber(ctx context.Context) (string, error)
	
	// Sales analysis
	GetProfitByDateRange(ctx context.Context, startDate, endDate time.Time) (float64, error)
	GetSalesVolume(ctx context.Context, startDate, endDate time.Time) (int64, float64, error)
}