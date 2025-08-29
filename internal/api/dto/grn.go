package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// GRNResponse represents a GRN in API responses
type GRNResponse struct {
	ID              uuid.UUID       `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	GRNNumber       string          `json:"grn_number" example:"GRN-2024-001"`
	PurchaseOrderID uuid.UUID       `json:"purchase_order_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	SupplierID      uuid.UUID       `json:"supplier_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	LocationID      uuid.UUID       `json:"location_id" example:"550e8400-e29b-41d4-a716-446655440003"`
	Status          models.GRNStatus `json:"status" example:"draft"`
	ReceivedDate    time.Time       `json:"received_date" example:"2023-01-01T12:00:00Z"`
	DeliveryNote    string          `json:"delivery_note,omitempty" example:"DN-001"`
	InvoiceNumber   string          `json:"invoice_number,omitempty" example:"INV-001"`
	InvoiceDate     *time.Time      `json:"invoice_date,omitempty" example:"2023-01-01T12:00:00Z"`
	VehicleNumber   string          `json:"vehicle_number,omitempty" example:"ABC1234"`
	DriverName      string          `json:"driver_name,omitempty" example:"John Doe"`
	QualityCheck    bool            `json:"quality_check" example:"true"`
	QualityNotes    string          `json:"quality_notes,omitempty" example:"All items in good condition"`
	SubTotal        float64         `json:"sub_total" example:"1000.00"`
	TaxAmount       float64         `json:"tax_amount" example:"60.00"`
	TaxRate         float64         `json:"tax_rate" example:"6.00"`
	DiscountAmount  float64         `json:"discount_amount" example:"0.00"`
	TotalAmount     float64         `json:"total_amount" example:"1060.00"`
	Currency        string          `json:"currency" example:"MYR"`
	Notes           string          `json:"notes,omitempty" example:"All items received in good condition"`
	ReceivedByID    uuid.UUID       `json:"received_by_id" example:"550e8400-e29b-41d4-a716-446655440004"`
	VerifiedByID    *uuid.UUID      `json:"verified_by_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440005"`
	VerifiedAt      *time.Time      `json:"verified_at,omitempty" example:"2023-01-02T12:00:00Z"`
	CreatedAt       time.Time       `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt       time.Time       `json:"updated_at" example:"2023-01-01T12:00:00Z"`
	Items           []GRNItemResponse `json:"items,omitempty"`
}

// GRNItemResponse represents a GRN item in API responses
type GRNItemResponse struct {
	ID                  uuid.UUID `json:"id" example:"550e8400-e29b-41d4-a716-446655440006"`
	GRNID               uuid.UUID `json:"grn_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PurchaseOrderItemID uuid.UUID `json:"purchase_order_item_id" example:"550e8400-e29b-41d4-a716-446655440007"`
	ProductID           uuid.UUID `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440008"`
	OrderedQuantity     int       `json:"ordered_quantity" example:"10"`
	ReceivedQuantity    int       `json:"received_quantity" example:"10"`
	AcceptedQuantity    int       `json:"accepted_quantity" example:"9"`
	RejectedQuantity    int       `json:"rejected_quantity" example:"0"`
	DamagedQuantity     int       `json:"damaged_quantity" example:"1"`
	UnitPrice           float64   `json:"unit_price" example:"100.00"`
	TotalPrice          float64   `json:"total_price" example:"900.00"`
	ExpiryDate          *time.Time `json:"expiry_date,omitempty" example:"2025-12-31T23:59:59Z"`
	BatchNumber         string    `json:"batch_number,omitempty" example:"BATCH001"`
	SerialNumbers       string    `json:"serial_numbers,omitempty" example:"[\"SN001\",\"SN002\"]"`
	QualityStatus       string    `json:"quality_status" example:"good"`
	QualityNotes        string    `json:"quality_notes,omitempty" example:"One unit damaged during transport"`
	StockUpdated        bool      `json:"stock_updated" example:"false"`
	CreatedAt           time.Time `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt           time.Time `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreateGRNRequest represents a request to create a new GRN
type CreateGRNRequest struct {
	PurchaseOrderID uuid.UUID  `json:"purchase_order_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440001"`
	LocationID      uuid.UUID  `json:"location_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440003"`
	ReceivedDate    time.Time  `json:"received_date" binding:"required" example:"2023-01-01T12:00:00Z"`
	DeliveryNote    string     `json:"delivery_note,omitempty" binding:"omitempty,max=100" example:"DN-001"`
	InvoiceNumber   string     `json:"invoice_number,omitempty" binding:"omitempty,max=100" example:"INV-001"`
	InvoiceDate     *time.Time `json:"invoice_date,omitempty" example:"2023-01-01T12:00:00Z"`
	VehicleNumber   string     `json:"vehicle_number,omitempty" binding:"omitempty,max=50" example:"ABC1234"`
	DriverName      string     `json:"driver_name,omitempty" binding:"omitempty,max=100" example:"John Doe"`
	QualityCheck    bool       `json:"quality_check" example:"true"`
	QualityNotes    string     `json:"quality_notes,omitempty" binding:"omitempty,max=1000" example:"All items in good condition"`
	TaxRate         float64    `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	DiscountAmount  float64    `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency        string     `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	Notes           string     `json:"notes,omitempty" binding:"omitempty,max=1000" example:"All items received in good condition"`
	ReceivedByID    uuid.UUID  `json:"received_by_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440004"`
	Items           []CreateGRNItemRequest `json:"items,omitempty"`
}

// CreateGRNItemRequest represents a request to add a GRN item
type CreateGRNItemRequest struct {
	PurchaseOrderItemID uuid.UUID  `json:"purchase_order_item_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440007"`
	ReceivedQuantity    int        `json:"received_quantity" binding:"required,min=0" example:"10"`
	AcceptedQuantity    int        `json:"accepted_quantity" binding:"required,min=0" example:"9"`
	RejectedQuantity    int        `json:"rejected_quantity,omitempty" binding:"omitempty,min=0" example:"0"`
	DamagedQuantity     int        `json:"damaged_quantity,omitempty" binding:"omitempty,min=0" example:"1"`
	UnitPrice           float64    `json:"unit_price" binding:"required,min=0" example:"100.00"`
	ExpiryDate          *time.Time `json:"expiry_date,omitempty" example:"2025-12-31T23:59:59Z"`
	BatchNumber         string     `json:"batch_number,omitempty" binding:"omitempty,max=100" example:"BATCH001"`
	SerialNumbers       string     `json:"serial_numbers,omitempty" binding:"omitempty,max=2000" example:"[\"SN001\",\"SN002\"]"`
	QualityStatus       string     `json:"quality_status,omitempty" binding:"omitempty,max=20" example:"good"`
	QualityNotes        string     `json:"quality_notes,omitempty" binding:"omitempty,max=500" example:"One unit damaged during transport"`
}

// UpdateGRNRequest represents a request to update an existing GRN
type UpdateGRNRequest struct {
	LocationID     *uuid.UUID `json:"location_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	ReceivedDate   *time.Time `json:"received_date,omitempty" example:"2023-01-01T12:00:00Z"`
	DeliveryNote   string     `json:"delivery_note,omitempty" binding:"omitempty,max=100" example:"DN-001"`
	InvoiceNumber  string     `json:"invoice_number,omitempty" binding:"omitempty,max=100" example:"INV-001"`
	InvoiceDate    *time.Time `json:"invoice_date,omitempty" example:"2023-01-01T12:00:00Z"`
	VehicleNumber  string     `json:"vehicle_number,omitempty" binding:"omitempty,max=50" example:"ABC1234"`
	DriverName     string     `json:"driver_name,omitempty" binding:"omitempty,max=100" example:"John Doe"`
	QualityCheck   *bool      `json:"quality_check,omitempty" example:"true"`
	QualityNotes   string     `json:"quality_notes,omitempty" binding:"omitempty,max=1000" example:"All items in good condition"`
	TaxRate        *float64   `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	DiscountAmount *float64   `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency       string     `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	Notes          string     `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Updated notes"`
	ReceivedByID   *uuid.UUID `json:"received_by_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440004"`
}

// UpdateGRNItemRequest represents a request to update a GRN item
type UpdateGRNItemRequest struct {
	ReceivedQuantity *int       `json:"received_quantity,omitempty" binding:"omitempty,min=0" example:"10"`
	AcceptedQuantity *int       `json:"accepted_quantity,omitempty" binding:"omitempty,min=0" example:"9"`
	RejectedQuantity *int       `json:"rejected_quantity,omitempty" binding:"omitempty,min=0" example:"0"`
	DamagedQuantity  *int       `json:"damaged_quantity,omitempty" binding:"omitempty,min=0" example:"1"`
	UnitPrice        *float64   `json:"unit_price,omitempty" binding:"omitempty,min=0" example:"100.00"`
	ExpiryDate       *time.Time `json:"expiry_date,omitempty" example:"2025-12-31T23:59:59Z"`
	BatchNumber      string     `json:"batch_number,omitempty" binding:"omitempty,max=100" example:"BATCH001"`
	SerialNumbers    string     `json:"serial_numbers,omitempty" binding:"omitempty,max=2000" example:"[\"SN001\",\"SN002\"]"`
	QualityStatus    string     `json:"quality_status,omitempty" binding:"omitempty,max=20" example:"good"`
	QualityNotes     string     `json:"quality_notes,omitempty" binding:"omitempty,max=500" example:"Updated quality notes"`
}

// GRNListRequest represents parameters for listing GRNs
type GRNListRequest struct {
	Page            int             `form:"page" example:"1"`
	Limit           int             `form:"limit" example:"10"`
	Search          string          `form:"search,omitempty" example:"GRN-2024"`
	Status          models.GRNStatus `form:"status,omitempty" example:"draft"`
	PurchaseOrderID *uuid.UUID      `form:"purchase_order_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	SupplierID      *uuid.UUID      `form:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440002"`
	LocationID      *uuid.UUID      `form:"location_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	StartDate       *time.Time      `form:"start_date,omitempty" example:"2023-01-01T00:00:00Z"`
	EndDate         *time.Time      `form:"end_date,omitempty" example:"2023-12-31T23:59:59Z"`
}

// GRNStatusRequest represents a request to update GRN status
type GRNStatusRequest struct {
	Status models.GRNStatus `json:"status" binding:"required" example:"received"`
}

// ProcessGRNRequest represents a request to process GRN receipt
type ProcessGRNRequest struct {
	ReceivedByID uuid.UUID `json:"received_by_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440004"`
}

// VerifyGRNRequest represents a request to verify GRN
type VerifyGRNRequest struct {
	VerifierID uuid.UUID `json:"verifier_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440005"`
}

// ToGRNResponse converts a GRN model to a GRN response DTO
func ToGRNResponse(grn *models.GRN) GRNResponse {
	response := GRNResponse{
		ID:              grn.ID,
		GRNNumber:       grn.GRNNumber,
		PurchaseOrderID: grn.PurchaseOrderID,
		SupplierID:      grn.SupplierID,
		LocationID:      grn.LocationID,
		Status:          grn.Status,
		ReceivedDate:    grn.ReceivedDate,
		DeliveryNote:    grn.DeliveryNote,
		InvoiceNumber:   grn.InvoiceNumber,
		InvoiceDate:     grn.InvoiceDate,
		VehicleNumber:   grn.VehicleNumber,
		DriverName:      grn.DriverName,
		QualityCheck:    grn.QualityCheck,
		QualityNotes:    grn.QualityNotes,
		SubTotal:        grn.SubTotal,
		TaxAmount:       grn.TaxAmount,
		TaxRate:         grn.TaxRate,
		DiscountAmount:  grn.DiscountAmount,
		TotalAmount:     grn.TotalAmount,
		Currency:        grn.Currency,
		Notes:           grn.Notes,
		ReceivedByID:    grn.ReceivedByID,
		VerifiedByID:    grn.VerifiedByID,
		VerifiedAt:      grn.VerifiedAt,
		CreatedAt:       grn.CreatedAt,
		UpdatedAt:       grn.UpdatedAt,
	}

	// Convert items if available
	if len(grn.Items) > 0 {
		// Convert slice of values to slice of pointers
		itemPointers := make([]*models.GRNItem, len(grn.Items))
		for i := range grn.Items {
			itemPointers[i] = &grn.Items[i]
		}
		response.Items = ToGRNItemResponseList(itemPointers)
	}

	return response
}

// ToGRNResponseList converts a list of GRN models to GRN response DTOs
func ToGRNResponseList(grns []*models.GRN) []GRNResponse {
	responses := make([]GRNResponse, len(grns))
	for i, grn := range grns {
		responses[i] = ToGRNResponse(grn)
	}
	return responses
}

// ToGRNItemResponse converts a GRN item model to a GRN item response DTO
func ToGRNItemResponse(item *models.GRNItem) GRNItemResponse {
	return GRNItemResponse{
		ID:                  item.ID,
		GRNID:               item.GRNID,
		PurchaseOrderItemID: item.PurchaseOrderItemID,
		ProductID:           item.ProductID,
		OrderedQuantity:     item.OrderedQuantity,
		ReceivedQuantity:    item.ReceivedQuantity,
		AcceptedQuantity:    item.AcceptedQuantity,
		RejectedQuantity:    item.RejectedQuantity,
		DamagedQuantity:     item.DamagedQuantity,
		UnitPrice:           item.UnitPrice,
		TotalPrice:          item.TotalPrice,
		ExpiryDate:          item.ExpiryDate,
		BatchNumber:         item.BatchNumber,
		SerialNumbers:       item.SerialNumbers,
		QualityStatus:       item.QualityStatus,
		QualityNotes:        item.QualityNotes,
		StockUpdated:        item.StockUpdated,
		CreatedAt:           item.CreatedAt,
		UpdatedAt:           item.UpdatedAt,
	}
}

// ToGRNItemResponseList converts a list of GRN item models to GRN item response DTOs
func ToGRNItemResponseList(items []*models.GRNItem) []GRNItemResponse {
	responses := make([]GRNItemResponse, len(items))
	for i, item := range items {
		responses[i] = ToGRNItemResponse(item)
	}
	return responses
}

// ToGRNModel converts CreateGRNRequest to GRN model
func (req *CreateGRNRequest) ToGRNModel() *models.GRN {
	grn := &models.GRN{
		PurchaseOrderID: req.PurchaseOrderID,
		LocationID:      req.LocationID,
		Status:          models.GRNStatusDraft,
		ReceivedDate:    req.ReceivedDate,
		DeliveryNote:    req.DeliveryNote,
		InvoiceNumber:   req.InvoiceNumber,
		InvoiceDate:     req.InvoiceDate,
		VehicleNumber:   req.VehicleNumber,
		DriverName:      req.DriverName,
		QualityCheck:    req.QualityCheck,
		QualityNotes:    req.QualityNotes,
		TaxRate:         req.TaxRate,
		DiscountAmount:  req.DiscountAmount,
		Notes:           req.Notes,
		ReceivedByID:    req.ReceivedByID,
		Currency:        "MYR", // Default currency
	}

	if req.Currency != "" {
		grn.Currency = req.Currency
	}

	// Convert items if provided
	if len(req.Items) > 0 {
		grn.Items = make([]models.GRNItem, len(req.Items))
		for i, itemReq := range req.Items {
			grn.Items[i] = models.GRNItem{
				PurchaseOrderItemID: itemReq.PurchaseOrderItemID,
				ReceivedQuantity:    itemReq.ReceivedQuantity,
				AcceptedQuantity:    itemReq.AcceptedQuantity,
				RejectedQuantity:    itemReq.RejectedQuantity,
				DamagedQuantity:     itemReq.DamagedQuantity,
				UnitPrice:           itemReq.UnitPrice,
				ExpiryDate:          itemReq.ExpiryDate,
				BatchNumber:         itemReq.BatchNumber,
				SerialNumbers:       itemReq.SerialNumbers,
				QualityStatus:       itemReq.QualityStatus,
				QualityNotes:        itemReq.QualityNotes,
			}
		}
	}

	return grn
}

// ToGRNItemModel converts CreateGRNItemRequest to GRN item model
func (req *CreateGRNItemRequest) ToGRNItemModel(grnID uuid.UUID) *models.GRNItem {
	return &models.GRNItem{
		GRNID:               grnID,
		PurchaseOrderItemID: req.PurchaseOrderItemID,
		ReceivedQuantity:    req.ReceivedQuantity,
		AcceptedQuantity:    req.AcceptedQuantity,
		RejectedQuantity:    req.RejectedQuantity,
		DamagedQuantity:     req.DamagedQuantity,
		UnitPrice:           req.UnitPrice,
		ExpiryDate:          req.ExpiryDate,
		BatchNumber:         req.BatchNumber,
		SerialNumbers:       req.SerialNumbers,
		QualityStatus:       req.QualityStatus,
		QualityNotes:        req.QualityNotes,
	}
}

// ApplyToGRNModel applies UpdateGRNRequest to existing GRN model
func (req *UpdateGRNRequest) ApplyToGRNModel(grn *models.GRN) {
	if req.LocationID != nil {
		grn.LocationID = *req.LocationID
	}
	if req.ReceivedDate != nil {
		grn.ReceivedDate = *req.ReceivedDate
	}
	if req.DeliveryNote != "" {
		grn.DeliveryNote = req.DeliveryNote
	}
	if req.InvoiceNumber != "" {
		grn.InvoiceNumber = req.InvoiceNumber
	}
	if req.InvoiceDate != nil {
		grn.InvoiceDate = req.InvoiceDate
	}
	if req.VehicleNumber != "" {
		grn.VehicleNumber = req.VehicleNumber
	}
	if req.DriverName != "" {
		grn.DriverName = req.DriverName
	}
	if req.QualityCheck != nil {
		grn.QualityCheck = *req.QualityCheck
	}
	if req.QualityNotes != "" {
		grn.QualityNotes = req.QualityNotes
	}
	if req.TaxRate != nil {
		grn.TaxRate = *req.TaxRate
	}
	if req.DiscountAmount != nil {
		grn.DiscountAmount = *req.DiscountAmount
	}
	if req.Currency != "" {
		grn.Currency = req.Currency
	}
	if req.Notes != "" {
		grn.Notes = req.Notes
	}
	if req.ReceivedByID != nil {
		grn.ReceivedByID = *req.ReceivedByID
	}
}

// ApplyToGRNItemModel applies UpdateGRNItemRequest to existing GRN item model
func (req *UpdateGRNItemRequest) ApplyToGRNItemModel(item *models.GRNItem) {
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
	if req.UnitPrice != nil {
		item.UnitPrice = *req.UnitPrice
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
}