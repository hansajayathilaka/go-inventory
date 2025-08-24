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
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProductID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"product_id"`
	Product      Product        `gorm:"foreignKey:ProductID" json:"product"`
	LocationID   uuid.UUID      `gorm:"type:uuid;not null;index" json:"location_id"`
	Location     Location       `gorm:"foreignKey:LocationID" json:"location"`
	MovementType MovementType   `gorm:"not null;type:varchar(20)" json:"movement_type"`
	Quantity     int            `gorm:"not null" json:"quantity"`
	ReferenceID  string         `gorm:"size:100" json:"reference_id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user"`
	Notes        string         `gorm:"size:1000" json:"notes"`
	UnitCost     float64        `gorm:"type:decimal(10,2)" json:"unit_cost"`
	TotalCost    float64        `gorm:"type:decimal(10,2)" json:"total_cost"`
	CreatedAt    time.Time      `json:"created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (StockMovement) TableName() string {
	return "stock_movements"
}

func (sm *StockMovement) BeforeCreate(tx *gorm.DB) error {
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