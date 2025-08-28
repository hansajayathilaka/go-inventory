package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PurchaseOrderStatus string

const (
	PurchaseOrderStatusDraft     PurchaseOrderStatus = "draft"
	PurchaseOrderStatusPending   PurchaseOrderStatus = "pending"
	PurchaseOrderStatusApproved  PurchaseOrderStatus = "approved"
	PurchaseOrderStatusOrdered   PurchaseOrderStatus = "ordered"
	PurchaseOrderStatusReceived  PurchaseOrderStatus = "received"
	PurchaseOrderStatusCancelled PurchaseOrderStatus = "cancelled"
)

type PurchaseOrder struct {
	ID                uuid.UUID            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PONumber          string               `gorm:"uniqueIndex;not null;size:50" json:"po_number"`
	SupplierID        uuid.UUID            `gorm:"type:uuid;not null;index" json:"supplier_id"`
	Supplier          Supplier             `gorm:"foreignKey:SupplierID" json:"supplier"`
	Status            PurchaseOrderStatus  `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	OrderDate         time.Time            `gorm:"not null" json:"order_date"`
	ExpectedDate      *time.Time           `json:"expected_date,omitempty"`
	DeliveryDate      *time.Time           `json:"delivery_date,omitempty"`
	SubTotal          float64              `gorm:"type:decimal(15,2);not null;default:0.00" json:"sub_total"`
	TaxAmount         float64              `gorm:"type:decimal(15,2);not null;default:0.00" json:"tax_amount"`
	TaxRate           float64              `gorm:"type:decimal(5,2);not null;default:0.00" json:"tax_rate"`
	ShippingCost      float64              `gorm:"type:decimal(10,2);not null;default:0.00" json:"shipping_cost"`
	DiscountAmount    float64              `gorm:"type:decimal(10,2);not null;default:0.00" json:"discount_amount"`
	TotalAmount       float64              `gorm:"type:decimal(15,2);not null;default:0.00" json:"total_amount"`
	Currency          string               `gorm:"size:3;not null;default:'MYR'" json:"currency"`
	Notes             string               `gorm:"size:1000" json:"notes"`
	Terms             string               `gorm:"size:1000" json:"terms"`
	Reference         string               `gorm:"size:100" json:"reference"`
	CreatedByID       uuid.UUID            `gorm:"type:uuid;not null;index" json:"created_by_id"`
	CreatedBy         User                 `gorm:"foreignKey:CreatedByID" json:"created_by"`
	ApprovedByID      *uuid.UUID           `gorm:"type:uuid;index" json:"approved_by_id,omitempty"`
	ApprovedBy        *User                `gorm:"foreignKey:ApprovedByID" json:"approved_by,omitempty"`
	ApprovedAt        *time.Time           `json:"approved_at,omitempty"`
	CreatedAt         time.Time            `json:"created_at"`
	UpdatedAt         time.Time            `json:"updated_at"`
	DeletedAt         gorm.DeletedAt       `gorm:"index" json:"-"`

	Items []PurchaseOrderItem `gorm:"foreignKey:PurchaseOrderID" json:"items,omitempty"`
}

func (PurchaseOrder) TableName() string {
	return "purchase_orders"
}

type PurchaseOrderItem struct {
	ID               uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	PurchaseOrderID  uuid.UUID     `gorm:"type:uuid;not null;index" json:"purchase_order_id"`
	PurchaseOrder    PurchaseOrder `gorm:"foreignKey:PurchaseOrderID" json:"-"`
	ProductID        uuid.UUID     `gorm:"type:uuid;not null;index" json:"product_id"`
	Product          Product       `gorm:"foreignKey:ProductID" json:"product"`
	Quantity         int           `gorm:"not null;default:0" json:"quantity"`
	UnitPrice        float64       `gorm:"type:decimal(10,2);not null;default:0.00" json:"unit_price"`
	TotalPrice       float64       `gorm:"type:decimal(15,2);not null;default:0.00" json:"total_price"`
	DiscountAmount   float64       `gorm:"type:decimal(10,2);not null;default:0.00" json:"discount_amount"`
	TaxAmount        float64       `gorm:"type:decimal(10,2);not null;default:0.00" json:"tax_amount"`
	ReceivedQuantity int           `gorm:"not null;default:0" json:"received_quantity"`
	Notes            string        `gorm:"size:500" json:"notes"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (PurchaseOrderItem) TableName() string {
	return "purchase_order_items"
}