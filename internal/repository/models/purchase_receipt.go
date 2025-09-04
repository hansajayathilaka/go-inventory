package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseReceiptStatus string

const (
	// Order phase
	PurchaseReceiptStatusDraft     PurchaseReceiptStatus = "draft"     // Initial creation
	PurchaseReceiptStatusPending   PurchaseReceiptStatus = "pending"   // Awaiting approval
	PurchaseReceiptStatusApproved  PurchaseReceiptStatus = "approved"  // Approved, ready to send
	PurchaseReceiptStatusOrdered   PurchaseReceiptStatus = "ordered"   // Sent to supplier
	
	// Receipt phase
	PurchaseReceiptStatusReceived  PurchaseReceiptStatus = "received"  // Goods received, being processed
	PurchaseReceiptStatusPartial   PurchaseReceiptStatus = "partial"   // Partially received/processed
	PurchaseReceiptStatusCompleted PurchaseReceiptStatus = "completed" // Fully received and processed
	
	// Cancelled
	PurchaseReceiptStatusCancelled PurchaseReceiptStatus = "cancelled" // Order cancelled
)

// PurchaseReceipt combines purchase order and goods receipt functionality
// into a single unified model for simplified purchase workflow
type PurchaseReceipt struct {
	ID                uuid.UUID              `gorm:"type:text;primaryKey" json:"id"`
	ReceiptNumber     string                 `gorm:"uniqueIndex;not null;size:50" json:"receipt_number"`
	SupplierID        uuid.UUID              `gorm:"type:text;not null;index" json:"supplier_id"`
	Supplier          Supplier               `gorm:"foreignKey:SupplierID" json:"supplier"`
	Status            PurchaseReceiptStatus  `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	
	// Order Information
	OrderDate         time.Time              `gorm:"not null" json:"order_date"`
	ExpectedDate      *time.Time             `json:"expected_date,omitempty"`
	Reference         string                 `gorm:"size:100" json:"reference"`
	Terms             string                 `gorm:"size:1000" json:"terms"`
	OrderNotes        string                 `gorm:"size:1000" json:"order_notes"`
	
	// Receipt Information (populated when goods are received)
	ReceivedDate      *time.Time             `json:"received_date,omitempty"`
	DeliveryDate      *time.Time             `json:"delivery_date,omitempty"`
	DeliveryNote      string                 `gorm:"size:100" json:"delivery_note"`
	InvoiceNumber     string                 `gorm:"size:100" json:"invoice_number"`
	InvoiceDate       *time.Time             `json:"invoice_date,omitempty"`
	VehicleNumber     string                 `gorm:"size:50" json:"vehicle_number"`
	DriverName        string                 `gorm:"size:100" json:"driver_name"`
	QualityCheck      bool                   `gorm:"not null;default:false" json:"quality_check"`
	QualityNotes      string                 `gorm:"size:1000" json:"quality_notes"`
	ReceiptNotes      string                 `gorm:"size:1000" json:"receipt_notes"`
	
	// Financial Information
	SubTotal          float64                `gorm:"type:real;not null;default:0.00" json:"sub_total"`
	TaxAmount         float64                `gorm:"type:real;not null;default:0.00" json:"tax_amount"`
	TaxRate           float64                `gorm:"type:real;not null;default:0.00" json:"tax_rate"`
	ShippingCost      float64                `gorm:"type:real;not null;default:0.00" json:"shipping_cost"`
	DiscountAmount    float64                `gorm:"type:real;not null;default:0.00" json:"discount_amount"`
	TotalAmount       float64                `gorm:"type:real;not null;default:0.00" json:"total_amount"`
	Currency          string                 `gorm:"size:3;not null;default:'MYR'" json:"currency"`
	
	// User Tracking
	CreatedByID       uuid.UUID              `gorm:"type:text;not null;index" json:"created_by_id"`
	CreatedBy         User                   `gorm:"foreignKey:CreatedByID" json:"created_by"`
	ApprovedByID      *uuid.UUID             `gorm:"type:text;index" json:"approved_by_id,omitempty"`
	ApprovedBy        *User                  `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt        *time.Time             `json:"approved_at,omitempty"`
	ReceivedByID      *uuid.UUID             `gorm:"type:text;index" json:"received_by_id,omitempty"`
	ReceivedBy        *User                  `gorm:"foreignKey:ReceivedByID" json:"received_by,omitempty"`
	VerifiedByID      *uuid.UUID             `gorm:"type:text;index" json:"verified_by_id,omitempty"` 
	VerifiedBy        *User                  `gorm:"foreignKey:VerifiedByID" json:"verified_by,omitempty"`
	VerifiedAt        *time.Time             `json:"verified_at,omitempty"`
	
	// Timestamps
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
	DeletedAt         gorm.DeletedAt         `gorm:"index" json:"-"`

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

// PurchaseReceiptItem combines purchase order item and GRN item functionality
type PurchaseReceiptItem struct {
	ID                  uuid.UUID        `gorm:"type:text;primaryKey" json:"id"`
	PurchaseReceiptID   uuid.UUID        `gorm:"type:text;not null;index" json:"purchase_receipt_id"`
	PurchaseReceipt     PurchaseReceipt  `gorm:"foreignKey:PurchaseReceiptID" json:"-"`
	ProductID           uuid.UUID        `gorm:"type:text;not null;index" json:"product_id"`
	Product             Product          `gorm:"foreignKey:ProductID" json:"product"`
	
	// Order Information
	OrderedQuantity     int              `gorm:"not null;default:0" json:"ordered_quantity"`
	UnitPrice           float64          `gorm:"type:real;not null;default:0.00" json:"unit_price"`
	TotalPrice          float64          `gorm:"type:real;not null;default:0.00" json:"total_price"`
	DiscountAmount      float64          `gorm:"type:real;not null;default:0.00" json:"discount_amount"`
	TaxAmount           float64          `gorm:"type:real;not null;default:0.00" json:"tax_amount"`
	OrderNotes          string           `gorm:"size:500" json:"order_notes"`
	
	// Receipt Information (populated during goods receipt)
	ReceivedQuantity    int              `gorm:"not null;default:0" json:"received_quantity"`
	AcceptedQuantity    int              `gorm:"not null;default:0" json:"accepted_quantity"`
	RejectedQuantity    int              `gorm:"not null;default:0" json:"rejected_quantity"`
	DamagedQuantity     int              `gorm:"not null;default:0" json:"damaged_quantity"`
	ExpiryDate          *time.Time       `json:"expiry_date,omitempty"`
	BatchNumber         string           `gorm:"size:100" json:"batch_number"`
	SerialNumbers       string           `gorm:"size:2000" json:"serial_numbers"` // JSON array of serial numbers
	QualityStatus       string           `gorm:"size:20;not null;default:'good'" json:"quality_status"` // good, damaged, rejected
	QualityNotes        string           `gorm:"size:500" json:"quality_notes"`
	ReceiptNotes        string           `gorm:"size:500" json:"receipt_notes"`
	StockUpdated        bool             `gorm:"not null;default:false" json:"stock_updated"`
	
	// Timestamps
	CreatedAt           time.Time        `json:"created_at"`
	UpdatedAt           time.Time        `json:"updated_at"`
	DeletedAt           gorm.DeletedAt   `gorm:"index" json:"-"`
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

// IsInOrderPhase returns true if the purchase receipt is in the order phase
func (pr *PurchaseReceipt) IsInOrderPhase() bool {
	return pr.Status == PurchaseReceiptStatusDraft ||
		pr.Status == PurchaseReceiptStatusPending ||
		pr.Status == PurchaseReceiptStatusApproved ||
		pr.Status == PurchaseReceiptStatusOrdered
}

// IsInReceiptPhase returns true if the purchase receipt is in the receipt phase
func (pr *PurchaseReceipt) IsInReceiptPhase() bool {
	return pr.Status == PurchaseReceiptStatusReceived ||
		pr.Status == PurchaseReceiptStatusPartial ||
		pr.Status == PurchaseReceiptStatusCompleted
}

// CanBeApproved returns true if the purchase receipt can be approved
func (pr *PurchaseReceipt) CanBeApproved() bool {
	return pr.Status == PurchaseReceiptStatusDraft || pr.Status == PurchaseReceiptStatusPending
}

// CanBeSent returns true if the purchase receipt can be sent to supplier
func (pr *PurchaseReceipt) CanBeSent() bool {
	return pr.Status == PurchaseReceiptStatusApproved
}

// CanReceiveGoods returns true if the purchase receipt can receive goods
func (pr *PurchaseReceipt) CanReceiveGoods() bool {
	return pr.Status == PurchaseReceiptStatusOrdered || pr.Status == PurchaseReceiptStatusPartial
}

// CanBeCancelled returns true if the purchase receipt can be cancelled
func (pr *PurchaseReceipt) CanBeCancelled() bool {
	return pr.Status != PurchaseReceiptStatusCompleted && pr.Status != PurchaseReceiptStatusCancelled
}