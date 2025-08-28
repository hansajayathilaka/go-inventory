package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VehicleModel struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name           string         `gorm:"not null;size:100" json:"name"`
	Code           string         `gorm:"uniqueIndex;not null;size:30" json:"code"`
	VehicleBrandID uuid.UUID      `gorm:"type:uuid;not null" json:"vehicle_brand_id"`
	Description    string         `gorm:"size:500" json:"description"`
	YearFrom       int            `gorm:"not null" json:"year_from"`
	YearTo         int            `json:"year_to"`
	EngineSize     string         `gorm:"size:20" json:"engine_size"`
	FuelType       string         `gorm:"size:20" json:"fuel_type"`
	Transmission   string         `gorm:"size:20" json:"transmission"`
	IsActive       bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	VehicleBrand VehicleBrand `gorm:"foreignKey:VehicleBrandID" json:"vehicle_brand,omitempty"`
}

func (VehicleModel) TableName() string {
	return "vehicle_models"
}