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