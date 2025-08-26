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
	LocationID       uuid.UUID `json:"location_id"`
	LocationName     string    `json:"location_name"`
	Quantity         int       `json:"quantity"`
	ReservedQuantity int       `json:"reserved_quantity"`
	ReorderLevel     int       `json:"reorder_level"`
	LastUpdated      time.Time `json:"last_updated"`
}

type CreateInventoryRequest struct {
	ProductID        uuid.UUID `json:"product_id" binding:"required"`
	LocationID       uuid.UUID `json:"location_id" binding:"required"`
	Quantity         int       `json:"quantity" binding:"required,min=0"`
	ReservedQuantity int       `json:"reserved_quantity" binding:"min=0"`
	ReorderLevel     int       `json:"reorder_level" binding:"required,min=0"`
}

type StockAdjustmentRequest struct {
	ProductID    uuid.UUID `json:"product_id" binding:"required"`
	LocationID   uuid.UUID `json:"location_id" binding:"required"`
	Quantity     int       `json:"quantity" binding:"required"`
	MovementType string    `json:"movement_type" binding:"required,oneof=IN OUT ADJUSTMENT"`
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

type StockTransferRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required"`
	FromLocationID uuid.UUID `json:"from_location_id" binding:"required"`
	ToLocationID   uuid.UUID `json:"to_location_id" binding:"required"`
	Quantity       int       `json:"quantity" binding:"required,min=1"`
	Notes          *string   `json:"notes"`
}

type StockTransferResponse struct {
	TransferID     uuid.UUID `json:"transfer_id"`
	ProductID      uuid.UUID `json:"product_id"`
	FromLocationID uuid.UUID `json:"from_location_id"`
	ToLocationID   uuid.UUID `json:"to_location_id"`
	Quantity       int       `json:"quantity"`
	UserID         uuid.UUID `json:"user_id"`
	Notes          *string   `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
}

type LowStockItemResponse struct {
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductSKU   string    `json:"product_sku"`
	LocationID   uuid.UUID `json:"location_id"`
	LocationName string    `json:"location_name"`
	Quantity     int       `json:"quantity"`
	ReorderLevel int       `json:"reorder_level"`
	Deficit      int       `json:"deficit"`
}

type ZeroStockItemResponse struct {
	ProductID    uuid.UUID `json:"product_id"`
	ProductName  string    `json:"product_name"`
	ProductSKU   string    `json:"product_sku"`
	LocationID   uuid.UUID `json:"location_id"`
	LocationName string    `json:"location_name"`
	LastUpdated  time.Time `json:"last_updated"`
}

type ReorderLevelUpdate struct {
	ProductID    uuid.UUID `json:"product_id" binding:"required"`
	LocationID   uuid.UUID `json:"location_id" binding:"required"`
	ReorderLevel int       `json:"reorder_level" binding:"required,min=0"`
}

type UpdateReorderLevelsRequest struct {
	ReorderLevels []ReorderLevelUpdate `json:"reorder_levels" binding:"required,min=1"`
}