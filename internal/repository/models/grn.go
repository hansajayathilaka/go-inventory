package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GRNStatus string

const (
	GRNStatusDraft     GRNStatus = "draft"
	GRNStatusReceived  GRNStatus = "received"
	GRNStatusPartial   GRNStatus = "partial"
	GRNStatusCompleted GRNStatus = "completed"
	GRNStatusCancelled GRNStatus = "cancelled"
)

type GRN struct {
	ID                uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GRNNumber         string          `gorm:"uniqueIndex;not null;size:50" json:"grn_number"`
	PurchaseOrderID   uuid.UUID       `gorm:"type:uuid;not null;index" json:"purchase_order_id"`
	PurchaseOrder     PurchaseOrder   `gorm:"foreignKey:PurchaseOrderID" json:"purchase_order"`
	SupplierID        uuid.UUID       `gorm:"type:uuid;not null;index" json:"supplier_id"`
	Supplier          Supplier        `gorm:"foreignKey:SupplierID" json:"supplier"`
	LocationID        uuid.UUID       `gorm:"type:uuid;not null;index" json:"location_id"`
	Location          Location        `gorm:"foreignKey:LocationID" json:"location"`
	Status            GRNStatus       `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	ReceivedDate      time.Time       `gorm:"not null" json:"received_date"`
	DeliveryNote      string          `gorm:"size:100" json:"delivery_note"`
	InvoiceNumber     string          `gorm:"size:100" json:"invoice_number"`
	InvoiceDate       *time.Time      `json:"invoice_date,omitempty"`
	VehicleNumber     string          `gorm:"size:50" json:"vehicle_number"`
	DriverName        string          `gorm:"size:100" json:"driver_name"`
	QualityCheck      bool            `gorm:"not null;default:false" json:"quality_check"`
	QualityNotes      string          `gorm:"size:1000" json:"quality_notes"`
	SubTotal          float64         `gorm:"type:decimal(15,2);not null;default:0.00" json:"sub_total"`
	TaxAmount         float64         `gorm:"type:decimal(15,2);not null;default:0.00" json:"tax_amount"`
	TaxRate           float64         `gorm:"type:decimal(5,2);not null;default:0.00" json:"tax_rate"`
	DiscountAmount    float64         `gorm:"type:decimal(10,2);not null;default:0.00" json:"discount_amount"`
	TotalAmount       float64         `gorm:"type:decimal(15,2);not null;default:0.00" json:"total_amount"`
	Currency          string          `gorm:"size:3;not null;default:'MYR'" json:"currency"`
	Notes             string          `gorm:"size:1000" json:"notes"`
	ReceivedByID      uuid.UUID       `gorm:"type:uuid;not null;index" json:"received_by_id"`
	ReceivedBy        User            `gorm:"foreignKey:ReceivedByID" json:"received_by"`
	VerifiedByID      *uuid.UUID      `gorm:"type:uuid;index" json:"verified_by_id,omitempty"`
	VerifiedBy        *User           `gorm:"foreignKey:VerifiedByID" json:"verified_by,omitempty"`
	VerifiedAt        *time.Time      `json:"verified_at,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	DeletedAt         gorm.DeletedAt  `gorm:"index" json:"-"`

	Items []GRNItem `gorm:"foreignKey:GRNID" json:"items,omitempty"`
}

func (GRN) TableName() string {
	return "grns"
}

type GRNItem struct {
	ID                  uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GRNID               uuid.UUID      `gorm:"type:uuid;not null;index" json:"grn_id"`
	GRN                 GRN            `gorm:"foreignKey:GRNID" json:"-"`
	PurchaseOrderItemID uuid.UUID      `gorm:"type:uuid;not null;index" json:"purchase_order_item_id"`
	PurchaseOrderItem   PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderItemID" json:"purchase_order_item"`
	ProductID           uuid.UUID      `gorm:"type:uuid;not null;index" json:"product_id"`
	Product             Product        `gorm:"foreignKey:ProductID" json:"product"`
	OrderedQuantity     int            `gorm:"not null;default:0" json:"ordered_quantity"`
	ReceivedQuantity    int            `gorm:"not null;default:0" json:"received_quantity"`
	AcceptedQuantity    int            `gorm:"not null;default:0" json:"accepted_quantity"`
	RejectedQuantity    int            `gorm:"not null;default:0" json:"rejected_quantity"`
	DamagedQuantity     int            `gorm:"not null;default:0" json:"damaged_quantity"`
	UnitPrice           float64        `gorm:"type:decimal(10,2);not null;default:0.00" json:"unit_price"`
	TotalPrice          float64        `gorm:"type:decimal(15,2);not null;default:0.00" json:"total_price"`
	ExpiryDate          *time.Time     `json:"expiry_date,omitempty"`
	BatchNumber         string         `gorm:"size:100" json:"batch_number"`
	SerialNumbers       string         `gorm:"size:2000" json:"serial_numbers"` // JSON array of serial numbers
	QualityStatus       string         `gorm:"size:20;not null;default:'good'" json:"quality_status"` // good, damaged, rejected
	QualityNotes        string         `gorm:"size:500" json:"quality_notes"`
	StockUpdated        bool           `gorm:"not null;default:false" json:"stock_updated"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           gorm.DeletedAt `gorm:"index" json:"-"`
}

func (GRNItem) TableName() string {
	return "grn_items"
}