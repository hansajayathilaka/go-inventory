package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Location model for warehouse/store locations
type Location struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null;size:100;default:'Hardware Store'" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Type        string         `gorm:"not null;size:20" json:"type"`
	Address     string         `gorm:"size:500" json:"address"`
	Description string         `gorm:"size:500" json:"description"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Location) TableName() string {
	return "locations"
}

// GetDefaultLocation returns the default hardware store location
func GetDefaultLocation() *Location {
	return &Location{
		ID:          GetDefaultLocationID(),
		Name:        "Hardware Store",
		Code:        "MAIN",
		Type:        "WAREHOUSE",
		Address:     "123 Main Street, Springfield, IL",
		Description: "Main warehouse and retail location",
	}
}