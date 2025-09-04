package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Brand struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Description string         `gorm:"size:500" json:"description"`
	Website     string         `gorm:"size:200" json:"website"`
	CountryCode string         `gorm:"size:10" json:"country_code"`
	LogoURL     string         `gorm:"size:500" json:"logo_url"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Brand) TableName() string {
	return "brands"
}

func (b *Brand) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}