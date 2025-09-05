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

// PurchaseReceiptItemResponse represents a purchase receipt item in API responses (simplified)
type PurchaseReceiptItemResponse struct {
	ID                      uuid.UUID        `json:"id" example:"550e8400-e29b-41d4-a716-446655440004"`
	PurchaseReceiptID       uuid.UUID        `json:"purchase_receipt_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ProductID               uuid.UUID        `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440005"`
	
	// Essential Information
	Quantity                int              `json:"quantity" example:"10"`
	UnitCost                float64          `json:"unit_cost" example:"100.00"`
	ItemDiscountAmount      float64          `json:"item_discount_amount" example:"10.00"`
	ItemDiscountPercentage  float64          `json:"item_discount_percentage" example:"5.00"`
	LineTotal               float64          `json:"line_total" example:"945.00"`
	
	// Timestamps
	CreatedAt               time.Time        `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt               time.Time        `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreatePurchaseReceiptRequest represents a request to create a new purchase receipt (simplified)
type CreatePurchaseReceiptRequest struct {
	SupplierID             uuid.UUID                             `json:"supplier_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440001"`
	PurchaseDate           time.Time                             `json:"purchase_date" binding:"required" example:"2023-01-01T12:00:00Z"`
	SupplierBillNumber     string                                `json:"supplier_bill_number,omitempty" binding:"omitempty,max=100" example:"SUPP-BILL-001"`
	BillDiscountAmount     float64                               `json:"bill_discount_amount,omitempty" binding:"omitempty,min=0" example:"50.00"`
	BillDiscountPercentage float64                               `json:"bill_discount_percentage,omitempty" binding:"omitempty,min=0,max=100" example:"5.00"`
	Notes                  string                                `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Purchase notes"`
	Items                  []CreatePurchaseReceiptItemRequest    `json:"items,omitempty"`
}

// CreatePurchaseReceiptItemRequest represents a request to add a purchase receipt item (simplified)
type CreatePurchaseReceiptItemRequest struct {
	ProductID               uuid.UUID `json:"product_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440005"`
	Quantity                int       `json:"quantity" binding:"required,min=1" example:"10"`
	UnitCost                float64   `json:"unit_cost" binding:"required,min=0" example:"100.00"`
	ItemDiscountAmount      float64   `json:"item_discount_amount,omitempty" binding:"omitempty,min=0" example:"10.00"`
	ItemDiscountPercentage  float64   `json:"item_discount_percentage,omitempty" binding:"omitempty,min=0,max=100" example:"5.00"`
}

// UpdatePurchaseReceiptRequest represents a request to update an existing purchase receipt (simplified)
type UpdatePurchaseReceiptRequest struct {
	SupplierID             *uuid.UUID `json:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	PurchaseDate           *time.Time `json:"purchase_date,omitempty" example:"2023-01-01T12:00:00Z"`
	SupplierBillNumber     string     `json:"supplier_bill_number,omitempty" binding:"omitempty,max=100" example:"SUPP-BILL-001"`
	BillDiscountAmount     *float64   `json:"bill_discount_amount,omitempty" binding:"omitempty,min=0" example:"50.00"`
	BillDiscountPercentage *float64   `json:"bill_discount_percentage,omitempty" binding:"omitempty,min=0,max=100" example:"5.00"`
	Notes                  string     `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Purchase notes"`
	QualityNotes   string     `json:"quality_notes,omitempty" binding:"omitempty,max=1000" example:"All items in good condition"`
	ReceiptNotes   string     `json:"receipt_notes,omitempty" binding:"omitempty,max=1000" example:"All items received in good condition"`
}

// UpdatePurchaseReceiptItemRequest represents a request to update a purchase receipt item (simplified)
type UpdatePurchaseReceiptItemRequest struct {
	Quantity               *int     `json:"quantity,omitempty" binding:"omitempty,min=1" example:"10"`
	UnitCost               *float64 `json:"unit_cost,omitempty" binding:"omitempty,min=0" example:"100.00"`
	ItemDiscountAmount     *float64 `json:"item_discount_amount,omitempty" binding:"omitempty,min=0" example:"10.00"`
	ItemDiscountPercentage *float64 `json:"item_discount_percentage,omitempty" binding:"omitempty,min=0,max=100" example:"5.00"`
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

// ToPurchaseReceiptItemResponse converts a purchase receipt item model to a purchase receipt item response DTO (simplified)
func ToPurchaseReceiptItemResponse(item *models.PurchaseReceiptItem) PurchaseReceiptItemResponse {
	return PurchaseReceiptItemResponse{
		ID:                     item.ID,
		PurchaseReceiptID:      item.PurchaseReceiptID,
		ProductID:              item.ProductID,
		Quantity:               item.Quantity,
		UnitCost:               item.UnitCost,
		ItemDiscountAmount:     item.ItemDiscountAmount,
		ItemDiscountPercentage: item.ItemDiscountPercentage,
		LineTotal:              item.LineTotal,
		CreatedAt:              item.CreatedAt,
		UpdatedAt:              item.UpdatedAt,
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

// ToPurchaseReceiptModel converts CreatePurchaseReceiptRequest to purchase receipt model (simplified)
func (req *CreatePurchaseReceiptRequest) ToPurchaseReceiptModel() *models.PurchaseReceipt {
	pr := &models.PurchaseReceipt{
		SupplierID:             req.SupplierID,
		Status:                 models.PurchaseReceiptStatusPending,
		PurchaseDate:           req.PurchaseDate,
		SupplierBillNumber:     req.SupplierBillNumber,
		BillDiscountAmount:     req.BillDiscountAmount,
		BillDiscountPercentage: req.BillDiscountPercentage,
		Notes:                  req.Notes,
	}

	// Convert items if provided
	if len(req.Items) > 0 {
		pr.Items = make([]models.PurchaseReceiptItem, len(req.Items))
		for i, itemReq := range req.Items {
			pr.Items[i] = models.PurchaseReceiptItem{
				ProductID:              itemReq.ProductID,
				Quantity:               itemReq.Quantity,
				UnitCost:               itemReq.UnitCost,
				ItemDiscountAmount:     itemReq.ItemDiscountAmount,
				ItemDiscountPercentage: itemReq.ItemDiscountPercentage,
			}
		}
	}

	return pr
}

// ToPurchaseReceiptItemModel converts CreatePurchaseReceiptItemRequest to purchase receipt item model (simplified)
func (req *CreatePurchaseReceiptItemRequest) ToPurchaseReceiptItemModel(purchaseReceiptID uuid.UUID) *models.PurchaseReceiptItem {
	return &models.PurchaseReceiptItem{
		PurchaseReceiptID:      purchaseReceiptID,
		ProductID:              req.ProductID,
		Quantity:               req.Quantity,
		UnitCost:               req.UnitCost,
		ItemDiscountAmount:     req.ItemDiscountAmount,
		ItemDiscountPercentage: req.ItemDiscountPercentage,
	}
}

// ApplyToPurchaseReceiptModel applies UpdatePurchaseReceiptRequest to existing purchase receipt model
func (req *UpdatePurchaseReceiptRequest) ApplyToPurchaseReceiptModel(pr *models.PurchaseReceipt) {
	if req.SupplierID != nil {
		pr.SupplierID = *req.SupplierID
	}
	if req.PurchaseDate != nil {
		pr.PurchaseDate = *req.PurchaseDate
	}
	if req.SupplierBillNumber != "" {
		pr.SupplierBillNumber = req.SupplierBillNumber
	}
	if req.BillDiscountAmount != nil {
		pr.BillDiscountAmount = *req.BillDiscountAmount
	}
	if req.BillDiscountPercentage != nil {
		pr.BillDiscountPercentage = *req.BillDiscountPercentage
	}
	if req.Notes != "" {
		pr.Notes = req.Notes
	}
}

// ApplyToPurchaseReceiptItemModel applies UpdatePurchaseReceiptItemRequest to existing purchase receipt item model
func (req *UpdatePurchaseReceiptItemRequest) ApplyToPurchaseReceiptItemModel(item *models.PurchaseReceiptItem) {
	if req.Quantity != nil {
		item.Quantity = *req.Quantity
	}
	if req.UnitCost != nil {
		item.UnitCost = *req.UnitCost
	}
	if req.ItemDiscountAmount != nil {
		item.ItemDiscountAmount = *req.ItemDiscountAmount
	}
	if req.ItemDiscountPercentage != nil {
		item.ItemDiscountPercentage = *req.ItemDiscountPercentage
	}
}