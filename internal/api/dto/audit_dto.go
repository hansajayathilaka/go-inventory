package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/business/audit"
	"inventory-api/internal/repository/models"
)

// AuditLogResponse represents an audit log in API responses
type AuditLogResponse struct {
	ID         uuid.UUID           `json:"id"`
	AuditTable string              `json:"audit_table"`
	RecordID   string              `json:"record_id"`
	Action     models.AuditAction  `json:"action"`
	OldValues  interface{}         `json:"old_values,omitempty"`
	NewValues  interface{}         `json:"new_values,omitempty"`
	UserID     uuid.UUID           `json:"user_id"`
	Username   string              `json:"username,omitempty"`
	IPAddress  string              `json:"ip_address"`
	UserAgent  string              `json:"user_agent"`
	Timestamp  time.Time           `json:"timestamp"`
}

// AuditLogListRequest represents query parameters for listing audit logs
type AuditLogListRequest struct {
	Table      string              `form:"table"`
	RecordID   string              `form:"record_id"`
	Action     models.AuditAction  `form:"action"`
	UserID     string              `form:"user_id"`
	StartDate  string              `form:"start_date"`
	EndDate    string              `form:"end_date"`
	Limit      int                 `form:"limit"`
	Offset     int                 `form:"offset"`
}

// AuditStatisticsResponse represents audit statistics in API responses
type AuditStatisticsResponse struct {
	TotalLogs       int64                       `json:"total_logs"`
	LogsByAction    map[models.AuditAction]int64 `json:"logs_by_action"`
	LogsByTable     map[string]int64            `json:"logs_by_table"`
	TopUsers        []audit.UserActivity        `json:"top_users"`
	RecentActivity  []*AuditLogResponse         `json:"recent_activity"`
}

// StockMovementReportRequest represents query parameters for stock movement reports
type StockMovementReportRequest struct {
	ProductID    string `form:"product_id"`
	MovementType string `form:"movement_type"`
	StartDate    string `form:"start_date"`
	EndDate      string `form:"end_date"`
	Limit        int    `form:"limit"`
	Offset       int    `form:"offset"`
}

// StockMovementReportResponse represents a stock movement in reports
type StockMovementReportResponse struct {
	ID            uuid.UUID            `json:"id"`
	ProductID     uuid.UUID            `json:"product_id"`
	ProductName   string               `json:"product_name"`
	ProductSKU    string               `json:"product_sku"`
	MovementType  models.MovementType  `json:"movement_type"`
	Quantity      int                  `json:"quantity"`
	ReferenceID   string               `json:"reference_id,omitempty"`
	UserID        uuid.UUID            `json:"user_id"`
	Username      string               `json:"username,omitempty"`
	Notes         string               `json:"notes,omitempty"`
	CreatedAt     time.Time            `json:"created_at"`
}

// InventorySummaryResponse represents inventory summary data
type InventorySummaryResponse struct {
	TotalProducts     int                          `json:"total_products"`
	TotalStockValue   float64                      `json:"total_stock_value"`
	LowStockItems     []InventorySummaryItem       `json:"low_stock_items"`
	ZeroStockItems    []InventorySummaryItem       `json:"zero_stock_items"`
	TopProducts       []InventorySummaryItem       `json:"top_products"`
	StockByCategory   []CategoryStockSummary       `json:"stock_by_category"`
}

// InventorySummaryItem represents a single item in inventory summary
type InventorySummaryItem struct {
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductSKU   string    `json:"product_sku"`
	TotalStock   int       `json:"total_stock"`
	StockValue   float64   `json:"stock_value"`
	ReorderLevel int       `json:"reorder_level"`
	Category     string    `json:"category,omitempty"`
}

// CategoryStockSummary represents stock summary by category
type CategoryStockSummary struct {
	CategoryID   uuid.UUID `json:"category_id"`
	CategoryName string    `json:"category_name"`
	TotalItems   int       `json:"total_items"`
	TotalValue   float64   `json:"total_value"`
}