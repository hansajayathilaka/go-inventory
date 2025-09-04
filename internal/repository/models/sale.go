package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Sale struct {
	ID                      uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	BillNumber              string         `gorm:"uniqueIndex;not null;size:50" json:"bill_number"`
	CustomerID              *uuid.UUID     `gorm:"type:text" json:"customer_id"`
	CashierID               uuid.UUID      `gorm:"type:text;not null" json:"cashier_id"`
	SaleDate                time.Time      `gorm:"not null" json:"sale_date"`
	BillDiscountAmount      float64        `gorm:"type:decimal(10,2);default:0.00" json:"bill_discount_amount"`
	BillDiscountPercentage  float64        `gorm:"type:decimal(5,2);default:0.00" json:"bill_discount_percentage"`
	TotalAmount             float64        `gorm:"type:decimal(15,2);not null;default:0.00" json:"total_amount"`
	Notes                   string         `gorm:"type:text" json:"notes"`
	CreatedAt               time.Time      `json:"created_at"`
	UpdatedAt               time.Time      `json:"updated_at"`
	DeletedAt               gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Customer  *Customer  `gorm:"foreignKey:CustomerID;references:ID" json:"customer,omitempty"`
	Cashier   User       `gorm:"foreignKey:CashierID;references:ID" json:"cashier,omitempty"`
	SaleItems []SaleItem `gorm:"foreignKey:SaleID;references:ID" json:"sale_items,omitempty"`
	Payments  []Payment  `gorm:"foreignKey:SaleID;references:ID" json:"payments,omitempty"`
}

func (Sale) TableName() string {
	return "sales"
}

func (s *Sale) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.SaleDate.IsZero() {
		s.SaleDate = time.Now()
	}
	return nil
}