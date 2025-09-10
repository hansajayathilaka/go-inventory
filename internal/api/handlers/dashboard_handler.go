package handlers

import (
	"net/http"
	"time"
	"inventory-api/internal/business/sale"
	"inventory-api/internal/business/product"
	"inventory-api/internal/business/customer"
	"inventory-api/internal/business/inventory"
	"inventory-api/internal/repository/interfaces"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	saleService        sale.Service
	productService     product.Service
	customerService    customer.Service
	inventoryService   inventory.Service
	inventoryRepo      interfaces.InventoryRepository
	productRepo        interfaces.ProductRepository
	saleRepo          interfaces.SaleRepository
	customerRepo      interfaces.CustomerRepository
}

func NewDashboardHandler(
	saleService sale.Service,
	productService product.Service,
	customerService customer.Service,
	inventoryService inventory.Service,
	inventoryRepo interfaces.InventoryRepository,
	productRepo interfaces.ProductRepository,
	saleRepo interfaces.SaleRepository,
	customerRepo interfaces.CustomerRepository,
) *DashboardHandler {
	return &DashboardHandler{
		saleService:        saleService,
		productService:     productService,
		customerService:    customerService,
		inventoryService:   inventoryService,
		inventoryRepo:      inventoryRepo,
		productRepo:        productRepo,
		saleRepo:          saleRepo,
		customerRepo:      customerRepo,
	}
}

// GetDashboardStats godoc
// @Summary Get dashboard statistics
// @Description Get comprehensive dashboard statistics including sales, products, customers, and inventory data
// @Tags dashboard
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} dto.ErrorResponse
// @Security BearerAuth
// @Router /dashboard/stats [get]
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	ctx := c.Request.Context()
	
	// Calculate date ranges
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastMonth := today.AddDate(0, -1, 0)
	
	stats := make(map[string]interface{})
	
	// Get total counts
	totalProducts, err := h.productRepo.Count(ctx)
	if err == nil {
		stats["total_products"] = totalProducts
	}
	
	totalCustomers, err := h.customerRepo.Count(ctx)
	if err == nil {
		stats["total_customers"] = totalCustomers
	}
	
	// Get sales statistics for the last month
	salesStats, err := h.saleService.GetSalesStatistics(ctx, lastMonth, now)
	if err == nil {
		if totalSales, ok := salesStats["total_sales"]; ok {
			stats["total_sales_last_month"] = totalSales
		}
		if totalAmount, ok := salesStats["total_amount"]; ok {
			stats["total_revenue_last_month"] = totalAmount
		}
		if avgAmount, ok := salesStats["average_sale_amount"]; ok {
			stats["average_sale_amount"] = avgAmount
		}
	}
	
	// Get today's sales
	todaySalesStats, err := h.saleService.GetSalesStatistics(ctx, today, now)
	if err == nil {
		if todayAmount, ok := todaySalesStats["total_amount"]; ok {
			stats["today_revenue"] = todayAmount
		}
		if todaySales, ok := todaySalesStats["total_sales"]; ok {
			stats["today_sales_count"] = todaySales
		}
	}
	
	// Get low stock items count
	lowStockItems, err := h.inventoryRepo.GetLowStock(ctx)
	if err == nil {
		stats["low_stock_items_count"] = len(lowStockItems)
	}
	
	// Get zero stock items count
	zeroStockItems, err := h.inventoryRepo.GetZeroStock(ctx)
	if err == nil {
		stats["zero_stock_items_count"] = len(zeroStockItems)
	}
	
	// Get top selling products (last 30 days)
	topProducts, err := h.saleService.GetTopSellingProducts(ctx, 5, &lastMonth, &now)
	if err == nil {
		stats["top_selling_products"] = topProducts
	}
	
	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "Dashboard statistics retrieved successfully",
		"data":      stats,
		"timestamp": time.Now().UTC(),
	})
}