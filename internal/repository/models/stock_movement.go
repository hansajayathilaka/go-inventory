package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MovementType string

const (
	MovementIN         MovementType = "IN"
	MovementOUT        MovementType = "OUT"
	MovementTRANSFER   MovementType = "TRANSFER"
	MovementADJUSTMENT MovementType = "ADJUSTMENT"
	MovementSALE       MovementType = "SALE"
	MovementRETURN     MovementType = "RETURN"
	MovementDAMAGE     MovementType = "DAMAGE"
)

type StockMovement struct {
	ID            uuid.UUID      `gorm:"type:text;primaryKey" json:"id"`
	ProductID     uuid.UUID      `gorm:"type:text;not null;index" json:"product_id"`
	BatchID       *uuid.UUID     `gorm:"type:text" json:"batch_id"`
	MovementType  MovementType   `gorm:"not null;type:varchar(20)" json:"movement_type"`
	Quantity      int            `gorm:"not null" json:"quantity"`
	ReferenceID   string         `gorm:"size:100" json:"reference_id"`
	ReferenceType string         `gorm:"size:50" json:"reference_type"`
	UserID        uuid.UUID      `gorm:"type:text;not null;index" json:"user_id"`
	Notes         string         `gorm:"type:text" json:"notes"`
	UnitCost      float64        `gorm:"type:decimal(10,2);default:0.00" json:"unit_cost"`
	TotalCost     float64        `gorm:"type:decimal(15,2);default:0.00" json:"total_cost"`
	CreatedAt     time.Time      `json:"created_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	Product    Product     `gorm:"foreignKey:ProductID;references:ID" json:"product,omitempty"`
	Batch      *StockBatch `gorm:"foreignKey:BatchID;references:ID" json:"batch,omitempty"`
	User       User        `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}

func (sm *StockMovement) BeforeCreate(tx *gorm.DB) error {
	if sm.ID == uuid.Nil {
		sm.ID = uuid.New()
	}
	if sm.UnitCost > 0 {
		sm.TotalCost = sm.UnitCost * float64(sm.Quantity)
	}
	return nil
}

func (sm *StockMovement) IsIncoming() bool {
	return sm.MovementType == MovementIN || sm.MovementType == MovementRETURN
}

func (sm *StockMovement) IsOutgoing() bool {
	return sm.MovementType == MovementOUT || sm.MovementType == MovementSALE || sm.MovementType == MovementDAMAGE
}