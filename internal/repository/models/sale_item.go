package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SaleItem struct {
	ID                     uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	SaleID                 uuid.UUID      `gorm:"type:text;not null" json:"sale_id"`
	ProductID              uuid.UUID      `gorm:"type:text;not null" json:"product_id"`
	UnitPrice              float64        `gorm:"type:decimal(10,2);not null;default:0.00" json:"unit_price"`
	UnitCost               float64        `gorm:"type:decimal(10,2);not null;default:0.00" json:"unit_cost"`
	Quantity               int            `gorm:"not null" json:"quantity"`
	ItemDiscountAmount     float64        `gorm:"type:decimal(10,2);default:0.00" json:"item_discount_amount"`
	ItemDiscountPercentage float64        `gorm:"type:decimal(5,2);default:0.00" json:"item_discount_percentage"`
	LineTotal              float64        `gorm:"type:decimal(15,2);not null;default:0.00" json:"line_total"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Sale    Sale    `gorm:"foreignKey:SaleID;references:ID" json:"sale,omitempty"`
	Product Product `gorm:"foreignKey:ProductID;references:ID" json:"product,omitempty"`
}

func (SaleItem) TableName() string {
	return "sale_items"
}

func (si *SaleItem) BeforeCreate(tx *gorm.DB) error {
	if si.ID == uuid.Nil {
		si.ID = uuid.New()
	}
	return nil
}