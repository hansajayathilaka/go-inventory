package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LocationType string

const (
	LocationWarehouse LocationType = "warehouse"
	LocationStore     LocationType = "store"
	LocationOnline    LocationType = "online"
)

type Location struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Type        LocationType   `gorm:"not null;type:varchar(20)" json:"type"`
	Address     string         `gorm:"size:500" json:"address"`
	Description string         `gorm:"size:500" json:"description"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	Inventory     []Inventory     `gorm:"foreignKey:LocationID" json:"inventory,omitempty"`
	StockMovements []StockMovement `gorm:"foreignKey:LocationID" json:"stock_movements,omitempty"`
}

func (Location) TableName() string {
	return "locations"
}