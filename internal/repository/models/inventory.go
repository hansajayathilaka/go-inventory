package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Inventory struct {
	ID               uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	ProductID        uuid.UUID      `gorm:"type:text;not null;uniqueIndex" json:"product_id"`
	Product          Product        `gorm:"foreignKey:ProductID" json:"product"`
	Quantity         int            `gorm:"not null;default:0" json:"quantity"`
	ReservedQuantity int            `gorm:"not null;default:0" json:"reserved_quantity"`
	ReorderLevel     int            `gorm:"not null;default:0" json:"reorder_level"`
	MaxLevel         int            `gorm:"not null;default:0" json:"max_level"`
	LastUpdated      time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"last_updated"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Inventory) TableName() string {
	return "inventory"
}

func (i *Inventory) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

func (i *Inventory) AvailableQuantity() int {
	return i.Quantity - i.ReservedQuantity
}

func (i *Inventory) IsLowStock() bool {
	return i.Quantity <= i.ReorderLevel
}

func (i *Inventory) BeforeUpdate(tx *gorm.DB) error {
	i.LastUpdated = time.Now()
	return nil
}

