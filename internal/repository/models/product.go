package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Product struct {
	ID            uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	SKU           string         `gorm:"uniqueIndex;not null;size:50" json:"sku"`
	Name          string         `gorm:"not null;size:200" json:"name"`
	Description   string         `gorm:"size:1000" json:"description"`
	CategoryID    uuid.UUID      `gorm:"type:text;not null;index" json:"category_id"`
	Category      Category       `gorm:"foreignKey:CategoryID" json:"category"`
	SupplierID    *uuid.UUID     `gorm:"type:text;index" json:"supplier_id,omitempty"`
	Supplier      *Supplier      `gorm:"foreignKey:SupplierID" json:"supplier,omitempty"`
	BrandID       *uuid.UUID     `gorm:"type:text;index" json:"brand_id,omitempty"`
	Brand         *Brand         `gorm:"foreignKey:BrandID" json:"brand,omitempty"`
	CostPrice     float64        `gorm:"type:real;not null;default:0" json:"cost_price"`
	RetailPrice   float64        `gorm:"type:real;not null;default:0" json:"retail_price"`
	WholesalePrice float64       `gorm:"type:real;not null;default:0" json:"wholesale_price"`
	Barcode       string         `gorm:"size:100" json:"barcode"`
	Weight        float64        `gorm:"type:real" json:"weight"`
	Dimensions    string         `gorm:"size:100" json:"dimensions"`
	IsActive      bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	
	Inventory     []Inventory     `gorm:"foreignKey:ProductID" json:"inventory,omitempty"`
	StockMovements []StockMovement `gorm:"foreignKey:ProductID" json:"stock_movements,omitempty"`
}

func (Product) TableName() string {
	return "products"
}

func (p *Product) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}