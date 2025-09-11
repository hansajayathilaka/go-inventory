package dto

import (
	"time"

	"github.com/google/uuid"
)

// Sale DTOs
type CreateSaleRequest struct {
	BillNumber      string                    `json:"bill_number" binding:"required"`
	CustomerID      *uuid.UUID                `json:"customer_id"`
	DiscountPercent float64                   `json:"discount_percent"`
	DiscountAmount  float64                   `json:"discount_amount"`
	TaxAmount       float64                   `json:"tax_amount"`
	Notes           string                    `json:"notes"`
	Items           []CreateSaleItemRequest   `json:"items" binding:"required,min=1"`
	Payments        []CreatePaymentRequest    `json:"payments" binding:"required,min=1"`
}

type CreateSaleItemRequest struct {
	ProductID       uuid.UUID `json:"product_id" binding:"required"`
	Quantity        int       `json:"quantity" binding:"required,min=1"`
	UnitPrice       float64   `json:"unit_price" binding:"required,min=0"`
	UnitCost        float64   `json:"unit_cost"`
	DiscountPercent float64   `json:"discount_percent"`
	DiscountAmount  float64   `json:"discount_amount"`
	TaxAmount       float64   `json:"tax_amount"`
}

type CreatePaymentRequest struct {
	Method    string  `json:"method" binding:"required"`
	Amount    float64 `json:"amount" binding:"required,min=0"`
	Reference string  `json:"reference"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type SaleResponse struct {
	ID              uuid.UUID  `json:"id"`
	BillNumber      string     `json:"bill_number"`
	CustomerID      *uuid.UUID `json:"customer_id"`
	CashierID       uuid.UUID  `json:"cashier_id"`
	SubTotal        float64    `json:"sub_total"`
	DiscountPercent float64    `json:"discount_percent"`
	DiscountAmount  float64    `json:"discount_amount"`
	TaxAmount       float64    `json:"tax_amount"`
	TotalAmount     float64    `json:"total_amount"`
	Notes           string     `json:"notes"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type SaleDetailResponse struct {
	Sale     SaleResponse         `json:"sale"`
	Items    []SaleItemResponse   `json:"items"`
	Payments []PaymentResponse    `json:"payments"`
}

type SaleItemResponse struct {
	ID              uuid.UUID `json:"id"`
	ProductID       uuid.UUID `json:"product_id"`
	Quantity        int       `json:"quantity"`
	UnitPrice       float64   `json:"unit_price"`
	UnitCost        float64   `json:"unit_cost"`
	DiscountPercent float64   `json:"discount_percent"`
	DiscountAmount  float64   `json:"discount_amount"`
	TaxAmount       float64   `json:"tax_amount"`
	SubTotal        float64   `json:"sub_total"`
}

type PaymentResponse struct {
	ID        uuid.UUID `json:"id"`
	Method    string    `json:"method"`
	Amount    float64   `json:"amount"`
	Reference string    `json:"reference"`
	CreatedAt time.Time `json:"created_at"`
}

type SalesListResponse struct {
	Sales   []SaleResponse `json:"sales"`
	Total   int            `json:"total"`
	Page    int            `json:"page"`
	Limit   int            `json:"limit"`
	HasMore bool           `json:"has_more"`
}

type BillNumberResponse struct {
	BillNumber string `json:"bill_number"`
}

// Personal sales history response (for staff interface)
type PersonalSalesHistoryResponse struct {
	Sales       []SaleResponse `json:"sales"`
	TotalSales  int            `json:"total_sales"`
	TotalAmount float64        `json:"total_amount"`
	Period      string         `json:"period"`
}

// Sales summary for analytics
type SalesSummaryResponse struct {
	TotalSales    int     `json:"total_sales"`
	TotalRevenue  float64 `json:"total_revenue"`
	TotalProfit   float64 `json:"total_profit"`
	AverageOrder  float64 `json:"average_order"`
	TopProducts   []TopProductResponse `json:"top_products"`
	Period        string  `json:"period"`
}

type TopProductResponse struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Quantity    int       `json:"quantity"`
	Revenue     float64   `json:"revenue"`
}

// POS Reports DTOs
type POSDailyReportResponse struct {
	Date           string                  `json:"date"`
	TotalSales     int                     `json:"total_sales"`
	TotalAmount    float64                 `json:"total_amount"`
	AverageOrder   float64                 `json:"average_order"`
	TopProducts    []TopProductSummary     `json:"top_products"`
	PaymentMethods []PaymentMethodSummary  `json:"payment_methods"`
	GeneratedAt    time.Time              `json:"generated_at"`
}

type POSWeeklyReportResponse struct {
	Week           string           `json:"week"`
	StartDate      string           `json:"start_date"`
	EndDate        string           `json:"end_date"`
	TotalSales     int              `json:"total_sales"`
	TotalAmount    float64          `json:"total_amount"`
	AverageDaily   float64          `json:"average_daily"`
	DailyBreakdown []DailySummary   `json:"daily_breakdown"`
	GeneratedAt    time.Time        `json:"generated_at"`
}

type POSMonthlyReportResponse struct {
	Month        string    `json:"month"`
	StartDate    string    `json:"start_date"`
	EndDate      string    `json:"end_date"`
	TotalSales   int       `json:"total_sales"`
	TotalAmount  float64   `json:"total_amount"`
	TotalProfit  float64   `json:"total_profit"`
	ProfitMargin float64   `json:"profit_margin"`
	AverageDaily float64   `json:"average_daily"`
	GeneratedAt  time.Time `json:"generated_at"`
}

type POSStaffPerformanceResponse struct {
	StartDate   string             `json:"start_date"`
	EndDate     string             `json:"end_date"`
	Staff       []StaffPerformance `json:"staff"`
	GeneratedAt time.Time          `json:"generated_at"`
}

type TopProductSummary struct {
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Revenue     float64 `json:"revenue"`
}

type PaymentMethodSummary struct {
	Method string  `json:"method"`
	Count  int     `json:"count"`
	Amount float64 `json:"amount"`
}

type DailySummary struct {
	Date        string  `json:"date"`
	TotalSales  int     `json:"total_sales"`
	TotalAmount float64 `json:"total_amount"`
}

type StaffPerformance struct {
	UserID     uuid.UUID `json:"user_id"`
	Name       string    `json:"name"`
	SalesCount int       `json:"sales_count"`
	SalesTotal float64   `json:"sales_total"`
	AvgOrder   float64   `json:"avg_order"`
}

// POS Dashboard DTOs
type POSDashboardMetricsResponse struct {
	TodayRevenue         float64              `json:"today_revenue"`
	TodaySalesCount      int                  `json:"today_sales_count"`
	WeekRevenue          float64              `json:"week_revenue"`
	WeekSalesCount       int                  `json:"week_sales_count"`
	MonthRevenue         float64              `json:"month_revenue"`
	MonthSalesCount      int                  `json:"month_sales_count"`
	RevenueChangePercent float64              `json:"revenue_change_percent"`
	SalesChangePercent   float64              `json:"sales_change_percent"`
	RecentTransactions   []RecentTransaction  `json:"recent_transactions"`
	LastUpdated          time.Time            `json:"last_updated"`
}

type POSDashboardAlertsResponse struct {
	Alerts      []DashboardAlert `json:"alerts"`
	TotalCount  int              `json:"total_count"`
	LastChecked time.Time        `json:"last_checked"`
}

type POSDashboardSummaryResponse struct {
	Overview     SummaryOverview    `json:"overview"`
	StockStatus  StockStatus        `json:"stock_status"`
	TopProducts  []TopProductSummary `json:"top_products"`
	GeneratedAt  time.Time          `json:"generated_at"`
}

type RecentTransaction struct {
	ID         uuid.UUID `json:"id"`
	BillNumber string    `json:"bill_number"`
	Amount     float64   `json:"amount"`
	CreatedAt  time.Time `json:"created_at"`
}

type DashboardAlert struct {
	Type      string    `json:"type"`
	Severity  string    `json:"severity"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Count     int       `json:"count"`
	CreatedAt time.Time `json:"created_at"`
}

type SummaryOverview struct {
	TodayRevenue float64 `json:"today_revenue"`
	TodaySales   int     `json:"today_sales"`
	TodayProfit  float64 `json:"today_profit"`
	WeekRevenue  float64 `json:"week_revenue"`
	WeekSales    int     `json:"week_sales"`
	MonthRevenue float64 `json:"month_revenue"`
	MonthSales   int     `json:"month_sales"`
}

type StockStatus struct {
	LowStockCount  int    `json:"low_stock_count"`
	ZeroStockCount int    `json:"zero_stock_count"`
	StockHealth    string `json:"stock_health"`
}