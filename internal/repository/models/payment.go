package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodCard         PaymentMethod = "card"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
	PaymentMethodEWallet      PaymentMethod = "ewallet"
	PaymentMethodCheck        PaymentMethod = "check"
)

type Payment struct {
	ID        uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	SaleID    uuid.UUID      `gorm:"type:text;not null" json:"sale_id"`
	Method    PaymentMethod  `gorm:"type:varchar(20);not null" json:"method"`
	Amount    float64        `gorm:"type:decimal(15,2);not null;default:0.00" json:"amount"`
	Reference string         `gorm:"size:100" json:"reference"`
	Notes     string         `gorm:"type:text" json:"notes"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Sale Sale `gorm:"foreignKey:SaleID;references:ID" json:"sale,omitempty"`
}

func (Payment) TableName() string {
	return "payments"
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}