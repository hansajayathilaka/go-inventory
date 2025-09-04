package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Customer struct {
	ID          uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Code        string         `gorm:"uniqueIndex;not null;size:20" json:"code"`
	Email       string         `gorm:"size:100" json:"email"`
	Phone       string         `gorm:"size:20" json:"phone"`
	Address     string         `gorm:"size:500" json:"address"`
	City        string         `gorm:"size:100" json:"city"`
	State       string         `gorm:"size:100" json:"state"`
	PostalCode  string         `gorm:"size:20" json:"postal_code"`
	Country     string         `gorm:"size:100;default:'Malaysia'" json:"country"`
	TaxNumber   string         `gorm:"size:50" json:"tax_number"`
	CreditLimit float64        `gorm:"type:real;default:0.00" json:"credit_limit"`
	Notes       string         `gorm:"size:1000" json:"notes"`
	IsActive    bool           `gorm:"not null;default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Customer) TableName() string {
	return "customers"
}

func (c *Customer) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}