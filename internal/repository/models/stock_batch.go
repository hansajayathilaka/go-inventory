package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StockBatch struct {
	ID                uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	ProductID         uuid.UUID      `gorm:"type:text;not null" json:"product_id"`
	BatchNumber       string         `gorm:"size:100" json:"batch_number"`
	LotNumber         string         `gorm:"size:100" json:"lot_number"`
	SupplierID        *uuid.UUID     `gorm:"type:text" json:"supplier_id"`
	Quantity          int            `gorm:"not null;default:0" json:"quantity"`
	AvailableQuantity int            `gorm:"not null;default:0" json:"available_quantity"`
	CostPrice         float64        `gorm:"type:decimal(10,2);not null;default:0.00" json:"cost_price"`
	ManufactureDate   *time.Time     `gorm:"type:date" json:"manufacture_date"`
	ExpiryDate        *time.Time     `gorm:"type:date" json:"expiry_date"`
	ReceivedDate      *time.Time     `gorm:"type:date" json:"received_date"`
	Notes             string         `gorm:"type:text" json:"notes"`
	IsActive          bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Product       Product         `gorm:"foreignKey:ProductID;references:ID" json:"product,omitempty"`
	Supplier      *Supplier       `gorm:"foreignKey:SupplierID;references:ID" json:"supplier,omitempty"`
	StockMovements []StockMovement `gorm:"foreignKey:BatchID;references:ID" json:"stock_movements,omitempty"`
}

func (StockBatch) TableName() string {
	return "stock_batches"
}

func (sb *StockBatch) BeforeCreate(tx *gorm.DB) error {
	if sb.ID == uuid.Nil {
		sb.ID = uuid.New()
	}
	return nil
}