package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VehicleCompatibility struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProductID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"product_id"`
	VehicleModelID uuid.UUID      `gorm:"type:uuid;not null;index" json:"vehicle_model_id"`
	YearFrom       int            `json:"year_from"`
	YearTo         int            `json:"year_to"`
	Notes          string         `gorm:"size:500" json:"notes"`
	IsVerified     bool           `gorm:"not null;default:false" json:"is_verified"`
	IsActive       bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Product      Product      `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	VehicleModel VehicleModel `gorm:"foreignKey:VehicleModelID" json:"vehicle_model,omitempty"`
}

func (VehicleCompatibility) TableName() string {
	return "vehicle_compatibilities"
}