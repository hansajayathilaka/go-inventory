package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Supplier struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Email       string         `gorm:"size:100" json:"email"`
	Phone       string         `gorm:"size:20" json:"phone"`
	Address     string         `gorm:"size:500" json:"address"`
	ContactName string         `gorm:"size:100" json:"contact_name"`
	Notes       string         `gorm:"size:1000" json:"notes"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	Products []Product `gorm:"foreignKey:SupplierID" json:"products,omitempty"`
}

func (Supplier) TableName() string {
	return "suppliers"
}

func (s *Supplier) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}