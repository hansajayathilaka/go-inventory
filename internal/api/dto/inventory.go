package dto

import (
	"time"

	"github.com/google/uuid"
)

// Inventory DTOs

type InventoryResponse struct {
	ID               uuid.UUID `json:"id"`
	ProductID        uuid.UUID `json:"product_id"`
	ProductName      string    `json:"product_name"`
	ProductSKU       string    `json:"product_sku"`
	ProductBarcode   string    `json:"product_barcode"`
	Quantity         int       `json:"quantity"`
	ReservedQuantity int       `json:"reserved_quantity"`
	ReorderLevel     int       `json:"reorder_level"`
	LastUpdated      time.Time `json:"last_updated"`
}

type CreateInventoryRequest struct {
	ProductID        uuid.UUID `json:"product_id" binding:"required"`
	Quantity         int       `json:"quantity" binding:"required,min=0"`
	ReservedQuantity int       `json:"reserved_quantity" binding:"min=0"`
	ReorderLevel     int       `json:"reorder_level" binding:"required,min=0"`
}

type StockAdjustmentRequest struct {
	ProductID    uuid.UUID `json:"product_id" binding:"required"`
	Quantity     int       `json:"quantity" binding:"required"`
	MovementType string    `json:"movement_type" binding:"required,oneof=IN OUT ADJUSTMENT"`
	Reason       string    `json:"reason" binding:"required,oneof=receiving sale sales damage corrections correction inventory_count return supplier_return other"`
	Notes        *string   `json:"notes"`
}

type StockMovementResponse struct {
	ID           uuid.UUID  `json:"id"`
	ProductID    uuid.UUID  `json:"product_id"`
	ProductName  string     `json:"product_name"`
	ProductSKU   string     `json:"product_sku"`
	LocationID   *uuid.UUID `json:"location_id"`
	LocationName *string    `json:"location_name"`
	MovementType string     `json:"movement_type"`
	Quantity     int        `json:"quantity"`
	ReferenceID  *uuid.UUID `json:"reference_id"`
	UserID       uuid.UUID  `json:"user_id"`
	Notes        *string    `json:"notes"`
	CreatedAt    time.Time  `json:"created_at"`
}


type LowStockItemResponse struct {
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductSKU   string    `json:"product_sku"`
	ProductBarcode string  `json:"product_barcode"`
	Quantity     int       `json:"quantity"`
	ReorderLevel int       `json:"reorder_level"`
	Deficit      int       `json:"deficit"`
}

type ZeroStockItemResponse struct {
	ProductID      uuid.UUID `json:"product_id"`
	ProductName    string    `json:"product_name"`
	ProductSKU     string    `json:"product_sku"`
	ProductBarcode string    `json:"product_barcode"`
	LastUpdated    time.Time `json:"last_updated"`
}

type ReorderLevelUpdate struct {
	ProductID    uuid.UUID `json:"product_id" binding:"required"`
	ReorderLevel int       `json:"reorder_level" binding:"required,min=0"`
}

type UpdateReorderLevelsRequest struct {
	ReorderLevels []ReorderLevelUpdate `json:"reorder_levels" binding:"required,min=1"`
}

// POS-ready DTOs

type POSProduct struct {
	ID            uuid.UUID `json:"id"`
	SKU           string    `json:"sku"`
	Name          string    `json:"name"`
	Barcode       string    `json:"barcode"`
	RetailPrice   float64   `json:"retail_price"`
	CostPrice     float64   `json:"cost_price"`
	Quantity      int       `json:"quantity"`
	TaxCategory   string    `json:"tax_category"`
	QuickSale     bool      `json:"quick_sale"`
	IsActive      bool      `json:"is_active"`
}

type POSLookupRequest struct {
	Query string `json:"query" binding:"required" form:"q"`
}

type POSLookupResponse struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	Data    []POSProduct `json:"data"`
}