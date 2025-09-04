package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// PurchaseReceiptResponse represents a purchase receipt in API responses (simplified)
type PurchaseReceiptResponse struct {
	ID                    uuid.UUID                          `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ReceiptNumber         string                             `json:"receipt_number" example:"PR-2024-001"`
	SupplierID            uuid.UUID                          `json:"supplier_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	Status                models.PurchaseReceiptStatus       `json:"status" example:"pending"`
	
	// Essential Information
	PurchaseDate          time.Time                          `json:"purchase_date" example:"2023-01-01T12:00:00Z"`
	SupplierBillNumber    string                             `json:"supplier_bill_number,omitempty" example:"SUPP-001"`
	
	// Financial Information
	BillDiscountAmount    float64                            `json:"bill_discount_amount" example:"50.00"`
	BillDiscountPercentage float64                           `json:"bill_discount_percentage" example:"5.00"`
	TotalAmount           float64                            `json:"total_amount" example:"1110.00"`
	
	// Additional Information
	Notes                 string                             `json:"notes,omitempty" example:"Urgent order"`
	
	// User Tracking
	CreatedByID           uuid.UUID                          `json:"created_by_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	VerifiedAt     *time.Time                         `json:"verified_at,omitempty" example:"2023-01-02T15:00:00Z"`
	
	// Timestamps
	CreatedAt      time.Time                          `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time                          `json:"updated_at" example:"2023-01-01T12:00:00Z"`
	
	// Items
	Items          []PurchaseReceiptItemResponse      `json:"items,omitempty"`
}

// PurchaseReceiptItemResponse represents a purchase receipt item in API responses
type PurchaseReceiptItemResponse struct {
	ID                  uuid.UUID        `json:"id" example:"550e8400-e29b-41d4-a716-446655440004"`
	PurchaseReceiptID   uuid.UUID        `json:"purchase_receipt_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ProductID           uuid.UUID        `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440005"`
	
	// Order Information
	OrderedQuantity     int              `json:"ordered_quantity" example:"10"`
	UnitPrice           float64          `json:"unit_price" example:"100.00"`
	TotalPrice          float64          `json:"total_price" example:"1000.00"`
	DiscountAmount      float64          `json:"discount_amount" example:"0.00"`
	TaxAmount           float64          `json:"tax_amount" example:"60.00"`
	OrderNotes          string           `json:"order_notes,omitempty" example:"High priority item"`
	
	// Receipt Information
	ReceivedQuantity    int              `json:"received_quantity" example:"10"`
	AcceptedQuantity    int              `json:"accepted_quantity" example:"9"`
	RejectedQuantity    int              `json:"rejected_quantity" example:"0"`
	DamagedQuantity     int              `json:"damaged_quantity" example:"1"`
	ExpiryDate          *time.Time       `json:"expiry_date,omitempty" example:"2025-12-31T23:59:59Z"`
	BatchNumber         string           `json:"batch_number,omitempty" example:"BATCH001"`
	SerialNumbers       string           `json:"serial_numbers,omitempty" example:"[\"SN001\",\"SN002\"]"`
	QualityStatus       string           `json:"quality_status" example:"good"`
	QualityNotes        string           `json:"quality_notes,omitempty" example:"One unit damaged during transport"`
	ReceiptNotes        string           `json:"receipt_notes,omitempty" example:"Inspection notes"`
	StockUpdated        bool             `json:"stock_updated" example:"false"`
	
	// Timestamps
	CreatedAt           time.Time        `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt           time.Time        `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreatePurchaseReceiptRequest represents a request to create a new purchase receipt
type CreatePurchaseReceiptRequest struct {
	SupplierID     uuid.UUID                             `json:"supplier_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440001"`
	OrderDate      time.Time                             `json:"order_date" binding:"required" example:"2023-01-01T12:00:00Z"`
	ExpectedDate   *time.Time                            `json:"expected_date,omitempty" example:"2023-01-15T12:00:00Z"`
	Reference      string                                `json:"reference,omitempty" binding:"omitempty,max=100" example:"REF-001"`
	Terms          string                                `json:"terms,omitempty" binding:"omitempty,max=1000" example:"Net 30 days"`
	OrderNotes     string                                `json:"order_notes,omitempty" binding:"omitempty,max=1000" example:"Urgent order"`
	TaxRate        float64                               `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	ShippingCost   float64                               `json:"shipping_cost,omitempty" binding:"omitempty,min=0" example:"50.00"`
	DiscountAmount float64                               `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency       string                                `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	Items          []CreatePurchaseReceiptItemRequest    `json:"items,omitempty"`
}

// CreatePurchaseReceiptItemRequest represents a request to add a purchase receipt item
type CreatePurchaseReceiptItemRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440005"`
	OrderedQuantity int      `json:"ordered_quantity" binding:"required,min=1" example:"10"`
	UnitPrice      float64   `json:"unit_price" binding:"required,min=0" example:"100.00"`
	DiscountAmount float64   `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	OrderNotes     string    `json:"order_notes,omitempty" binding:"omitempty,max=500" example:"High priority item"`
}

// UpdatePurchaseReceiptRequest represents a request to update an existing purchase receipt
type UpdatePurchaseReceiptRequest struct {
	SupplierID     *uuid.UUID `json:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	OrderDate      *time.Time `json:"order_date,omitempty" example:"2023-01-01T12:00:00Z"`
	ExpectedDate   *time.Time `json:"expected_date,omitempty" example:"2023-01-15T12:00:00Z"`
	Reference      string     `json:"reference,omitempty" binding:"omitempty,max=100" example:"REF-001"`
	Terms          string     `json:"terms,omitempty" binding:"omitempty,max=1000" example:"Updated terms"`
	OrderNotes     string     `json:"order_notes,omitempty" binding:"omitempty,max=1000" example:"Updated notes"`
	TaxRate        *float64   `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	ShippingCost   *float64   `json:"shipping_cost,omitempty" binding:"omitempty,min=0" example:"50.00"`
	DiscountAmount *float64   `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency       string     `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	
	// Receipt Information (for receipt phase updates)
	ReceivedDate   *time.Time `json:"received_date,omitempty" example:"2023-01-14T12:00:00Z"`
	DeliveryDate   *time.Time `json:"delivery_date,omitempty" example:"2023-01-14T08:00:00Z"`
	DeliveryNote   string     `json:"delivery_note,omitempty" binding:"omitempty,max=100" example:"DN-001"`
	InvoiceNumber  string     `json:"invoice_number,omitempty" binding:"omitempty,max=100" example:"INV-001"`
	InvoiceDate    *time.Time `json:"invoice_date,omitempty" example:"2023-01-01T12:00:00Z"`
	VehicleNumber  string     `json:"vehicle_number,omitempty" binding:"omitempty,max=50" example:"ABC1234"`
	DriverName     string     `json:"driver_name,omitempty" binding:"omitempty,max=100" example:"John Doe"`
	QualityCheck   *bool      `json:"quality_check,omitempty" example:"true"`
	QualityNotes   string     `json:"quality_notes,omitempty" binding:"omitempty,max=1000" example:"All items in good condition"`
	ReceiptNotes   string     `json:"receipt_notes,omitempty" binding:"omitempty,max=1000" example:"All items received in good condition"`
}

// UpdatePurchaseReceiptItemRequest represents a request to update a purchase receipt item
type UpdatePurchaseReceiptItemRequest struct {
	// Order Information Updates
	OrderedQuantity *int     `json:"ordered_quantity,omitempty" binding:"omitempty,min=1" example:"15"`
	UnitPrice       *float64 `json:"unit_price,omitempty" binding:"omitempty,min=0" example:"120.00"`
	DiscountAmount  *float64 `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"5.00"`
	OrderNotes      string   `json:"order_notes,omitempty" binding:"omitempty,max=500" example:"Updated notes"`
	
	// Receipt Information Updates
	ReceivedQuantity *int       `json:"received_quantity,omitempty" binding:"omitempty,min=0" example:"10"`
	AcceptedQuantity *int       `json:"accepted_quantity,omitempty" binding:"omitempty,min=0" example:"9"`
	RejectedQuantity *int       `json:"rejected_quantity,omitempty" binding:"omitempty,min=0" example:"0"`
	DamagedQuantity  *int       `json:"damaged_quantity,omitempty" binding:"omitempty,min=0" example:"1"`
	ExpiryDate       *time.Time `json:"expiry_date,omitempty" example:"2025-12-31T23:59:59Z"`
	BatchNumber      string     `json:"batch_number,omitempty" binding:"omitempty,max=100" example:"BATCH001"`
	SerialNumbers    string     `json:"serial_numbers,omitempty" binding:"omitempty,max=2000" example:"[\"SN001\",\"SN002\"]"`
	QualityStatus    string     `json:"quality_status,omitempty" binding:"omitempty,max=20" example:"good"`
	QualityNotes     string     `json:"quality_notes,omitempty" binding:"omitempty,max=500" example:"Updated quality notes"`
	ReceiptNotes     string     `json:"receipt_notes,omitempty" binding:"omitempty,max=500" example:"Updated receipt notes"`
}

// PurchaseReceiptListRequest represents parameters for listing purchase receipts
type PurchaseReceiptListRequest struct {
	Page       int                              `form:"page" example:"1"`
	Limit      int                              `form:"limit" example:"10"`
	Search     string                           `form:"search,omitempty" example:"PR-2024"`
	Status     models.PurchaseReceiptStatus     `form:"status,omitempty" example:"draft"`
	SupplierID *uuid.UUID                       `form:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	StartDate  *time.Time                       `form:"start_date,omitempty" example:"2023-01-01T00:00:00Z"`
	EndDate    *time.Time                       `form:"end_date,omitempty" example:"2023-12-31T23:59:59Z"`
	Phase      string                           `form:"phase,omitempty" example:"order"` // order, receipt, all
}

// ReceiveGoodsRequest represents a request to receive goods
type ReceiveGoodsRequest struct {
	ReceivedByID   uuid.UUID  `json:"received_by_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440004"`
	ReceivedDate   time.Time  `json:"received_date" binding:"required" example:"2023-01-14T12:00:00Z"`
	DeliveryDate   *time.Time `json:"delivery_date,omitempty" example:"2023-01-14T08:00:00Z"`
	DeliveryNote   string     `json:"delivery_note,omitempty" binding:"omitempty,max=100" example:"DN-001"`
	InvoiceNumber  string     `json:"invoice_number,omitempty" binding:"omitempty,max=100" example:"INV-001"`
	InvoiceDate    *time.Time `json:"invoice_date,omitempty" example:"2023-01-01T12:00:00Z"`
	VehicleNumber  string     `json:"vehicle_number,omitempty" binding:"omitempty,max=50" example:"ABC1234"`
	DriverName     string     `json:"driver_name,omitempty" binding:"omitempty,max=100" example:"John Doe"`
	ReceiptNotes   string     `json:"receipt_notes,omitempty" binding:"omitempty,max=1000" example:"All items received"`
}

// VerifyGoodsRequest represents a request to verify received goods
type VerifyGoodsRequest struct {
	VerifierID   uuid.UUID `json:"verifier_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440005"`
	QualityCheck bool      `json:"quality_check" example:"true"`
	QualityNotes string    `json:"quality_notes,omitempty" binding:"omitempty,max=1000" example:"All items verified"`
}

// ApproveRequest represents a request to approve a purchase receipt
type ApproveRequest struct {
	ApproverID uuid.UUID `json:"approver_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440003"`
}

// SendOrderRequest represents a request to send order to supplier
type SendOrderRequest struct {
	SendDate time.Time `json:"send_date" binding:"required" example:"2023-01-02T09:00:00Z"`
}

// ToPurchaseReceiptResponse converts a purchase receipt model to a purchase receipt response DTO (simplified)
func ToPurchaseReceiptResponse(pr *models.PurchaseReceipt) PurchaseReceiptResponse {
	response := PurchaseReceiptResponse{
		ID:                    pr.ID,
		ReceiptNumber:         pr.ReceiptNumber,
		SupplierID:            pr.SupplierID,
		Status:                pr.Status,
		PurchaseDate:          pr.PurchaseDate,
		SupplierBillNumber:    pr.SupplierBillNumber,
		BillDiscountAmount:    pr.BillDiscountAmount,
		BillDiscountPercentage: pr.BillDiscountPercentage,
		TotalAmount:           pr.TotalAmount,
		Notes:                 pr.Notes,
		CreatedByID:           pr.CreatedByID,
		CreatedAt:             pr.CreatedAt,
		UpdatedAt:             pr.UpdatedAt,
	}

	// Convert items if available
	if len(pr.Items) > 0 {
		itemPointers := make([]*models.PurchaseReceiptItem, len(pr.Items))
		for i := range pr.Items {
			itemPointers[i] = &pr.Items[i]
		}
		response.Items = ToPurchaseReceiptItemResponseList(itemPointers)
	}

	return response
}

// ToPurchaseReceiptResponseList converts a list of purchase receipt models to purchase receipt response DTOs
func ToPurchaseReceiptResponseList(prs []*models.PurchaseReceipt) []PurchaseReceiptResponse {
	responses := make([]PurchaseReceiptResponse, len(prs))
	for i, pr := range prs {
		responses[i] = ToPurchaseReceiptResponse(pr)
	}
	return responses
}

// ToPurchaseReceiptItemResponse converts a purchase receipt item model to a purchase receipt item response DTO
func ToPurchaseReceiptItemResponse(item *models.PurchaseReceiptItem) PurchaseReceiptItemResponse {
	return PurchaseReceiptItemResponse{
		ID:                  item.ID,
		PurchaseReceiptID:   item.PurchaseReceiptID,
		ProductID:           item.ProductID,
		OrderedQuantity:     item.OrderedQuantity,
		UnitPrice:           item.UnitPrice,
		TotalPrice:          item.TotalPrice,
		DiscountAmount:      item.DiscountAmount,
		TaxAmount:           item.TaxAmount,
		OrderNotes:          item.OrderNotes,
		ReceivedQuantity:    item.ReceivedQuantity,
		AcceptedQuantity:    item.AcceptedQuantity,
		RejectedQuantity:    item.RejectedQuantity,
		DamagedQuantity:     item.DamagedQuantity,
		ExpiryDate:          item.ExpiryDate,
		BatchNumber:         item.BatchNumber,
		SerialNumbers:       item.SerialNumbers,
		QualityStatus:       item.QualityStatus,
		QualityNotes:        item.QualityNotes,
		ReceiptNotes:        item.ReceiptNotes,
		StockUpdated:        item.StockUpdated,
		CreatedAt:           item.CreatedAt,
		UpdatedAt:           item.UpdatedAt,
	}
}

// ToPurchaseReceiptItemResponseList converts a list of purchase receipt item models to purchase receipt item response DTOs
func ToPurchaseReceiptItemResponseList(items []*models.PurchaseReceiptItem) []PurchaseReceiptItemResponse {
	responses := make([]PurchaseReceiptItemResponse, len(items))
	for i, item := range items {
		responses[i] = ToPurchaseReceiptItemResponse(item)
	}
	return responses
}

// ToPurchaseReceiptModel converts CreatePurchaseReceiptRequest to purchase receipt model
func (req *CreatePurchaseReceiptRequest) ToPurchaseReceiptModel() *models.PurchaseReceipt {
	pr := &models.PurchaseReceipt{
		SupplierID:     req.SupplierID,
		Status:         models.PurchaseReceiptStatusDraft,
		OrderDate:      req.OrderDate,
		ExpectedDate:   req.ExpectedDate,
		Reference:      req.Reference,
		Terms:          req.Terms,
		OrderNotes:     req.OrderNotes,
		TaxRate:        req.TaxRate,
		ShippingCost:   req.ShippingCost,
		DiscountAmount: req.DiscountAmount,
		Currency:       "MYR", // Default currency
	}

	if req.Currency != "" {
		pr.Currency = req.Currency
	}

	// Convert items if provided
	if len(req.Items) > 0 {
		pr.Items = make([]models.PurchaseReceiptItem, len(req.Items))
		for i, itemReq := range req.Items {
			pr.Items[i] = models.PurchaseReceiptItem{
				ProductID:       itemReq.ProductID,
				OrderedQuantity: itemReq.OrderedQuantity,
				UnitPrice:       itemReq.UnitPrice,
				DiscountAmount:  itemReq.DiscountAmount,
				OrderNotes:      itemReq.OrderNotes,
			}
		}
	}

	return pr
}

// ToPurchaseReceiptItemModel converts CreatePurchaseReceiptItemRequest to purchase receipt item model
func (req *CreatePurchaseReceiptItemRequest) ToPurchaseReceiptItemModel(purchaseReceiptID uuid.UUID) *models.PurchaseReceiptItem {
	return &models.PurchaseReceiptItem{
		PurchaseReceiptID: purchaseReceiptID,
		ProductID:         req.ProductID,
		OrderedQuantity:   req.OrderedQuantity,
		UnitPrice:         req.UnitPrice,
		DiscountAmount:    req.DiscountAmount,
		OrderNotes:        req.OrderNotes,
	}
}

// ApplyToPurchaseReceiptModel applies UpdatePurchaseReceiptRequest to existing purchase receipt model
func (req *UpdatePurchaseReceiptRequest) ApplyToPurchaseReceiptModel(pr *models.PurchaseReceipt) {
	if req.SupplierID != nil {
		pr.SupplierID = *req.SupplierID
	}
	if req.OrderDate != nil {
		pr.OrderDate = *req.OrderDate
	}
	if req.ExpectedDate != nil {
		pr.ExpectedDate = req.ExpectedDate
	}
	if req.Reference != "" {
		pr.Reference = req.Reference
	}
	if req.Terms != "" {
		pr.Terms = req.Terms
	}
	if req.OrderNotes != "" {
		pr.OrderNotes = req.OrderNotes
	}
	if req.TaxRate != nil {
		pr.TaxRate = *req.TaxRate
	}
	if req.ShippingCost != nil {
		pr.ShippingCost = *req.ShippingCost
	}
	if req.DiscountAmount != nil {
		pr.DiscountAmount = *req.DiscountAmount
	}
	if req.Currency != "" {
		pr.Currency = req.Currency
	}
	
	// Receipt information updates
	if req.ReceivedDate != nil {
		pr.ReceivedDate = req.ReceivedDate
	}
	if req.DeliveryDate != nil {
		pr.DeliveryDate = req.DeliveryDate
	}
	if req.DeliveryNote != "" {
		pr.DeliveryNote = req.DeliveryNote
	}
	if req.InvoiceNumber != "" {
		pr.InvoiceNumber = req.InvoiceNumber
	}
	if req.InvoiceDate != nil {
		pr.InvoiceDate = req.InvoiceDate
	}
	if req.VehicleNumber != "" {
		pr.VehicleNumber = req.VehicleNumber
	}
	if req.DriverName != "" {
		pr.DriverName = req.DriverName
	}
	if req.QualityCheck != nil {
		pr.QualityCheck = *req.QualityCheck
	}
	if req.QualityNotes != "" {
		pr.QualityNotes = req.QualityNotes
	}
	if req.ReceiptNotes != "" {
		pr.ReceiptNotes = req.ReceiptNotes
	}
}

// ApplyToPurchaseReceiptItemModel applies UpdatePurchaseReceiptItemRequest to existing purchase receipt item model
func (req *UpdatePurchaseReceiptItemRequest) ApplyToPurchaseReceiptItemModel(item *models.PurchaseReceiptItem) {
	// Order information updates
	if req.OrderedQuantity != nil {
		item.OrderedQuantity = *req.OrderedQuantity
	}
	if req.UnitPrice != nil {
		item.UnitPrice = *req.UnitPrice
	}
	if req.DiscountAmount != nil {
		item.DiscountAmount = *req.DiscountAmount
	}
	if req.OrderNotes != "" {
		item.OrderNotes = req.OrderNotes
	}
	
	// Receipt information updates
	if req.ReceivedQuantity != nil {
		item.ReceivedQuantity = *req.ReceivedQuantity
	}
	if req.AcceptedQuantity != nil {
		item.AcceptedQuantity = *req.AcceptedQuantity
	}
	if req.RejectedQuantity != nil {
		item.RejectedQuantity = *req.RejectedQuantity
	}
	if req.DamagedQuantity != nil {
		item.DamagedQuantity = *req.DamagedQuantity
	}
	if req.ExpiryDate != nil {
		item.ExpiryDate = req.ExpiryDate
	}
	if req.BatchNumber != "" {
		item.BatchNumber = req.BatchNumber
	}
	if req.SerialNumbers != "" {
		item.SerialNumbers = req.SerialNumbers
	}
	if req.QualityStatus != "" {
		item.QualityStatus = req.QualityStatus
	}
	if req.QualityNotes != "" {
		item.QualityNotes = req.QualityNotes
	}
	if req.ReceiptNotes != "" {
		item.ReceiptNotes = req.ReceiptNotes
	}
}