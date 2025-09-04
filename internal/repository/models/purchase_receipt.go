package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseReceiptStatus string

const (
	PurchaseReceiptStatusPending   PurchaseReceiptStatus = "pending"   // Order created, awaiting processing
	PurchaseReceiptStatusReceived  PurchaseReceiptStatus = "received"  // Goods received, being processed
	PurchaseReceiptStatusCompleted PurchaseReceiptStatus = "completed" // Fully received and processed
	PurchaseReceiptStatusCancelled PurchaseReceiptStatus = "cancelled" // Order cancelled
)

// PurchaseReceipt simplified model for minimal purchase workflow
type PurchaseReceipt struct {
	ID                    uuid.UUID              `gorm:"type:text;primaryKey" json:"id"`
	ReceiptNumber         string                 `gorm:"uniqueIndex;not null;size:50" json:"receipt_number"`
	SupplierID            uuid.UUID              `gorm:"type:text;not null;index" json:"supplier_id"`
	Supplier              Supplier               `gorm:"foreignKey:SupplierID" json:"supplier"`
	Status                PurchaseReceiptStatus  `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	
	// Essential Information
	PurchaseDate          time.Time              `gorm:"not null" json:"purchase_date"`
	SupplierBillNumber    string                 `gorm:"size:100" json:"supplier_bill_number"`
	
	// Financial Information
	BillDiscountAmount    float64                `gorm:"type:real;not null;default:0.00" json:"bill_discount_amount"`
	BillDiscountPercentage float64               `gorm:"type:real;not null;default:0.00" json:"bill_discount_percentage"`
	TotalAmount           float64                `gorm:"type:real;not null;default:0.00" json:"total_amount"`
	
	// Additional Information
	Notes                 string                 `gorm:"size:1000" json:"notes"`
	
	// User Tracking
	CreatedByID           uuid.UUID              `gorm:"type:text;not null;index" json:"created_by_id"`
	CreatedBy             User                   `gorm:"foreignKey:CreatedByID" json:"created_by"`
	
	// Timestamps
	CreatedAt             time.Time              `json:"created_at"`
	UpdatedAt             time.Time              `json:"updated_at"`
	DeletedAt             gorm.DeletedAt         `gorm:"index" json:"-"`

	// Items relationship
	Items []PurchaseReceiptItem `gorm:"foreignKey:PurchaseReceiptID" json:"items,omitempty"`
}

func (PurchaseReceipt) TableName() string {
	return "purchase_receipts"
}

func (pr *PurchaseReceipt) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}

// PurchaseReceiptItem simplified model for purchase receipt items
type PurchaseReceiptItem struct {
	ID                      uuid.UUID        `gorm:"type:text;primaryKey" json:"id"`
	PurchaseReceiptID       uuid.UUID        `gorm:"type:text;not null;index" json:"purchase_receipt_id"`
	PurchaseReceipt         PurchaseReceipt  `gorm:"foreignKey:PurchaseReceiptID" json:"-"`
	ProductID               uuid.UUID        `gorm:"type:text;not null;index" json:"product_id"`
	Product                 Product          `gorm:"foreignKey:ProductID" json:"product"`
	
	// Essential Information
	Quantity                int              `gorm:"not null;default:0" json:"quantity"`
	UnitCost                float64          `gorm:"type:real;not null;default:0.00" json:"unit_cost"`
	ItemDiscountAmount      float64          `gorm:"type:real;not null;default:0.00" json:"item_discount_amount"`
	ItemDiscountPercentage  float64          `gorm:"type:real;not null;default:0.00" json:"item_discount_percentage"`
	LineTotal               float64          `gorm:"type:real;not null;default:0.00" json:"line_total"`
	
	// Timestamps
	CreatedAt               time.Time        `json:"created_at"`
	UpdatedAt               time.Time        `json:"updated_at"`
	DeletedAt               gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (PurchaseReceiptItem) TableName() string {
	return "purchase_receipt_items"
}

func (pri *PurchaseReceiptItem) BeforeCreate(tx *gorm.DB) error {
	if pri.ID == uuid.Nil {
		pri.ID = uuid.New()
	}
	return nil
}

// CanReceiveGoods returns true if the purchase receipt can receive goods
func (pr *PurchaseReceipt) CanReceiveGoods() bool {
	return pr.Status == PurchaseReceiptStatusPending || pr.Status == PurchaseReceiptStatusReceived
}

// CanBeCancelled returns true if the purchase receipt can be cancelled
func (pr *PurchaseReceipt) CanBeCancelled() bool {
	return pr.Status != PurchaseReceiptStatusCompleted && pr.Status != PurchaseReceiptStatusCancelled
}

// IsCompleted returns true if the purchase receipt is completed
func (pr *PurchaseReceipt) IsCompleted() bool {
	return pr.Status == PurchaseReceiptStatusCompleted
}

// IsCancelled returns true if the purchase receipt is cancelled
func (pr *PurchaseReceipt) IsCancelled() bool {
	return pr.Status == PurchaseReceiptStatusCancelled
}