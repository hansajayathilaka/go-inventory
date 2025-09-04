package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VehicleBrand struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Description string         `gorm:"size:500" json:"description"`
	CountryCode string         `gorm:"size:10" json:"country_code"`
	LogoURL     string         `gorm:"size:500" json:"logo_url"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	VehicleModels []VehicleModel `gorm:"foreignKey:VehicleBrandID" json:"vehicle_models,omitempty"`
}

func (VehicleBrand) TableName() string {
	return "vehicle_brands"
}

func (vb *VehicleBrand) BeforeCreate(tx *gorm.DB) error {
	if vb.ID == uuid.Nil {
		vb.ID = uuid.New()
	}
	return nil
}