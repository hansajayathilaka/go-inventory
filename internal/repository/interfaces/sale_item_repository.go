package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// SaleItemRepository defines the interface for sale item data access operations
type SaleItemRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, item *models.SaleItem) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.SaleItem, error)
	Update(ctx context.Context, item *models.SaleItem) error
	Delete(ctx context.Context, id uuid.UUID) error
	
	// List operations
	List(ctx context.Context, offset, limit int) ([]*models.SaleItem, int64, error)
	GetBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error)
	GetByProduct(ctx context.Context, productID uuid.UUID, offset, limit int) ([]*models.SaleItem, int64, error)
	
	// Date-based operations
	GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.SaleItem, int64, error)
	
	// Profit calculations
	CalculateItemProfit(ctx context.Context, itemID uuid.UUID) (float64, error)
	GetProfitByProduct(ctx context.Context, productID uuid.UUID, startDate, endDate *time.Time) (float64, int, error)
	GetProfitBySale(ctx context.Context, saleID uuid.UUID) (float64, error)
	GetTotalProfit(ctx context.Context, startDate, endDate time.Time) (float64, error)
	
	// Inventory impact operations
	UpdateLineTotal(ctx context.Context, itemID uuid.UUID) error
	RecalculateLineTotal(ctx context.Context, item *models.SaleItem) (float64, error)
	
	// Analytics operations
	GetTopSellingProducts(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error)
	GetProductSalesStats(ctx context.Context, productID uuid.UUID, startDate, endDate *time.Time) (map[string]interface{}, error)
	GetSalesVolumeByProduct(ctx context.Context, startDate, endDate time.Time) ([]map[string]interface{}, error)
	
	// Discount operations
	ApplyItemDiscount(ctx context.Context, itemID uuid.UUID, discountAmount, discountPercentage float64) error
	RemoveItemDiscount(ctx context.Context, itemID uuid.UUID) error
	
	// Bulk operations
	CreateBulk(ctx context.Context, items []*models.SaleItem) error
	UpdateBulk(ctx context.Context, items []*models.SaleItem) error
	DeleteBySale(ctx context.Context, saleID uuid.UUID) error
}