package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// PurchaseOrderResponse represents a purchase order in API responses
type PurchaseOrderResponse struct {
	ID             uuid.UUID                   `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	PONumber       string                      `json:"po_number" example:"PO-2024-001"`
	SupplierID     uuid.UUID                   `json:"supplier_id" example:"550e8400-e29b-41d4-a716-446655440001"`
	Status         models.PurchaseOrderStatus  `json:"status" example:"draft"`
	OrderDate      time.Time                   `json:"order_date" example:"2023-01-01T12:00:00Z"`
	ExpectedDate   *time.Time                  `json:"expected_date,omitempty" example:"2023-01-15T12:00:00Z"`
	DeliveryDate   *time.Time                  `json:"delivery_date,omitempty" example:"2023-01-14T12:00:00Z"`
	SubTotal       float64                     `json:"sub_total" example:"1000.00"`
	TaxAmount      float64                     `json:"tax_amount" example:"60.00"`
	TaxRate        float64                     `json:"tax_rate" example:"6.00"`
	ShippingCost   float64                     `json:"shipping_cost" example:"50.00"`
	DiscountAmount float64                     `json:"discount_amount" example:"0.00"`
	TotalAmount    float64                     `json:"total_amount" example:"1110.00"`
	Currency       string                      `json:"currency" example:"MYR"`
	Notes          string                      `json:"notes,omitempty" example:"Urgent order"`
	Terms          string                      `json:"terms,omitempty" example:"Net 30 days"`
	Reference      string                      `json:"reference,omitempty" example:"REF-001"`
	CreatedByID    uuid.UUID                   `json:"created_by_id" example:"550e8400-e29b-41d4-a716-446655440002"`
	ApprovedByID   *uuid.UUID                  `json:"approved_by_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440003"`
	ApprovedAt     *time.Time                  `json:"approved_at,omitempty" example:"2023-01-02T12:00:00Z"`
	CreatedAt      time.Time                   `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt      time.Time                   `json:"updated_at" example:"2023-01-01T12:00:00Z"`
	Items          []PurchaseOrderItemResponse `json:"items,omitempty"`
}

// PurchaseOrderItemResponse represents a purchase order item in API responses
type PurchaseOrderItemResponse struct {
	ID               uuid.UUID        `json:"id" example:"550e8400-e29b-41d4-a716-446655440004"`
	PurchaseOrderID  uuid.UUID        `json:"purchase_order_id" example:"550e8400-e29b-41d4-a716-446655440000"`
	ProductID        uuid.UUID        `json:"product_id" example:"550e8400-e29b-41d4-a716-446655440005"`
	Quantity         int              `json:"quantity" example:"10"`
	UnitPrice        float64          `json:"unit_price" example:"100.00"`
	TotalPrice       float64          `json:"total_price" example:"1000.00"`
	DiscountAmount   float64          `json:"discount_amount" example:"0.00"`
	TaxAmount        float64          `json:"tax_amount" example:"60.00"`
	ReceivedQuantity int              `json:"received_quantity" example:"0"`
	Notes            string           `json:"notes,omitempty" example:"High priority item"`
	CreatedAt        time.Time        `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt        time.Time        `json:"updated_at" example:"2023-01-01T12:00:00Z"`
}

// CreatePurchaseOrderRequest represents a request to create a new purchase order
type CreatePurchaseOrderRequest struct {
	SupplierID     uuid.UUID                          `json:"supplier_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440001"`
	OrderDate      time.Time                          `json:"order_date" binding:"required" example:"2023-01-01T12:00:00Z"`
	ExpectedDate   *time.Time                         `json:"expected_date,omitempty" example:"2023-01-15T12:00:00Z"`
	TaxRate        float64                            `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	ShippingCost   float64                            `json:"shipping_cost,omitempty" binding:"omitempty,min=0" example:"50.00"`
	DiscountAmount float64                            `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency       string                             `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	Notes          string                             `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Urgent order"`
	Terms          string                             `json:"terms,omitempty" binding:"omitempty,max=1000" example:"Net 30 days"`
	Reference      string                             `json:"reference,omitempty" binding:"omitempty,max=100" example:"REF-001"`
	Items          []CreatePurchaseOrderItemRequest   `json:"items,omitempty"`
}

// CreatePurchaseOrderItemRequest represents a request to add a purchase order item
type CreatePurchaseOrderItemRequest struct {
	ProductID      uuid.UUID `json:"product_id" binding:"required" example:"550e8400-e29b-41d4-a716-446655440005"`
	Quantity       int       `json:"quantity" binding:"required,min=1" example:"10"`
	UnitPrice      float64   `json:"unit_price" binding:"required,min=0" example:"100.00"`
	DiscountAmount float64   `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Notes          string    `json:"notes,omitempty" binding:"omitempty,max=500" example:"High priority item"`
}

// UpdatePurchaseOrderRequest represents a request to update an existing purchase order
type UpdatePurchaseOrderRequest struct {
	SupplierID     *uuid.UUID `json:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	OrderDate      *time.Time `json:"order_date,omitempty" example:"2023-01-01T12:00:00Z"`
	ExpectedDate   *time.Time `json:"expected_date,omitempty" example:"2023-01-15T12:00:00Z"`
	DeliveryDate   *time.Time `json:"delivery_date,omitempty" example:"2023-01-14T12:00:00Z"`
	TaxRate        *float64   `json:"tax_rate,omitempty" binding:"omitempty,min=0,max=100" example:"6.00"`
	ShippingCost   *float64   `json:"shipping_cost,omitempty" binding:"omitempty,min=0" example:"50.00"`
	DiscountAmount *float64   `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"0.00"`
	Currency       string     `json:"currency,omitempty" binding:"omitempty,len=3" example:"MYR"`
	Notes          string     `json:"notes,omitempty" binding:"omitempty,max=1000" example:"Updated notes"`
	Terms          string     `json:"terms,omitempty" binding:"omitempty,max=1000" example:"Updated terms"`
	Reference      string     `json:"reference,omitempty" binding:"omitempty,max=100" example:"Updated reference"`
}

// UpdatePurchaseOrderItemRequest represents a request to update a purchase order item
type UpdatePurchaseOrderItemRequest struct {
	Quantity       *int     `json:"quantity,omitempty" binding:"omitempty,min=1" example:"15"`
	UnitPrice      *float64 `json:"unit_price,omitempty" binding:"omitempty,min=0" example:"120.00"`
	DiscountAmount *float64 `json:"discount_amount,omitempty" binding:"omitempty,min=0" example:"5.00"`
	Notes          string   `json:"notes,omitempty" binding:"omitempty,max=500" example:"Updated notes"`
}

// PurchaseOrderListRequest represents parameters for listing purchase orders
type PurchaseOrderListRequest struct {
	Page       int                        `form:"page" example:"1"`
	Limit      int                        `form:"limit" example:"10"`
	Search     string                     `form:"search,omitempty" example:"PO-2024"`
	Status     models.PurchaseOrderStatus `form:"status,omitempty" example:"draft"`
	SupplierID *uuid.UUID                 `form:"supplier_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440001"`
	StartDate  *time.Time                 `form:"start_date,omitempty" example:"2023-01-01T00:00:00Z"`
	EndDate    *time.Time                 `form:"end_date,omitempty" example:"2023-12-31T23:59:59Z"`
}

// PurchaseOrderStatusRequest represents a request to update purchase order status
type PurchaseOrderStatusRequest struct {
	Status models.PurchaseOrderStatus `json:"status" binding:"required" example:"approved"`
}

// ToPurchaseOrderResponse converts a purchase order model to a purchase order response DTO
func ToPurchaseOrderResponse(po *models.PurchaseOrder) PurchaseOrderResponse {
	response := PurchaseOrderResponse{
		ID:             po.ID,
		PONumber:       po.PONumber,
		SupplierID:     po.SupplierID,
		Status:         po.Status,
		OrderDate:      po.OrderDate,
		ExpectedDate:   po.ExpectedDate,
		DeliveryDate:   po.DeliveryDate,
		SubTotal:       po.SubTotal,
		TaxAmount:      po.TaxAmount,
		TaxRate:        po.TaxRate,
		ShippingCost:   po.ShippingCost,
		DiscountAmount: po.DiscountAmount,
		TotalAmount:    po.TotalAmount,
		Currency:       po.Currency,
		Notes:          po.Notes,
		Terms:          po.Terms,
		Reference:      po.Reference,
		CreatedByID:    po.CreatedByID,
		ApprovedByID:   po.ApprovedByID,
		ApprovedAt:     po.ApprovedAt,
		CreatedAt:      po.CreatedAt,
		UpdatedAt:      po.UpdatedAt,
	}

	// Convert items if available
	if len(po.Items) > 0 {
		// Convert slice of values to slice of pointers
		itemPointers := make([]*models.PurchaseOrderItem, len(po.Items))
		for i := range po.Items {
			itemPointers[i] = &po.Items[i]
		}
		response.Items = ToPurchaseOrderItemResponseList(itemPointers)
	}

	return response
}

// ToPurchaseOrderResponseList converts a list of purchase order models to purchase order response DTOs
func ToPurchaseOrderResponseList(pos []*models.PurchaseOrder) []PurchaseOrderResponse {
	responses := make([]PurchaseOrderResponse, len(pos))
	for i, po := range pos {
		responses[i] = ToPurchaseOrderResponse(po)
	}
	return responses
}

// ToPurchaseOrderItemResponse converts a purchase order item model to a purchase order item response DTO
func ToPurchaseOrderItemResponse(item *models.PurchaseOrderItem) PurchaseOrderItemResponse {
	return PurchaseOrderItemResponse{
		ID:               item.ID,
		PurchaseOrderID:  item.PurchaseOrderID,
		ProductID:        item.ProductID,
		Quantity:         item.Quantity,
		UnitPrice:        item.UnitPrice,
		TotalPrice:       item.TotalPrice,
		DiscountAmount:   item.DiscountAmount,
		TaxAmount:        item.TaxAmount,
		ReceivedQuantity: item.ReceivedQuantity,
		Notes:            item.Notes,
		CreatedAt:        item.CreatedAt,
		UpdatedAt:        item.UpdatedAt,
	}
}

// ToPurchaseOrderItemResponseList converts a list of purchase order item models to purchase order item response DTOs
func ToPurchaseOrderItemResponseList(items []*models.PurchaseOrderItem) []PurchaseOrderItemResponse {
	responses := make([]PurchaseOrderItemResponse, len(items))
	for i, item := range items {
		responses[i] = ToPurchaseOrderItemResponse(item)
	}
	return responses
}

// ToPurchaseOrderModel converts CreatePurchaseOrderRequest to purchase order model
func (req *CreatePurchaseOrderRequest) ToPurchaseOrderModel() *models.PurchaseOrder {
	po := &models.PurchaseOrder{
		SupplierID:     req.SupplierID,
		Status:         models.PurchaseOrderStatusDraft,
		OrderDate:      req.OrderDate,
		ExpectedDate:   req.ExpectedDate,
		TaxRate:        req.TaxRate,
		ShippingCost:   req.ShippingCost,
		DiscountAmount: req.DiscountAmount,
		Notes:          req.Notes,
		Terms:          req.Terms,
		Reference:      req.Reference,
		Currency:       "MYR", // Default currency
	}

	if req.Currency != "" {
		po.Currency = req.Currency
	}

	// Convert items if provided
	if len(req.Items) > 0 {
		po.Items = make([]models.PurchaseOrderItem, len(req.Items))
		for i, itemReq := range req.Items {
			po.Items[i] = models.PurchaseOrderItem{
				ProductID:      itemReq.ProductID,
				Quantity:       itemReq.Quantity,
				UnitPrice:      itemReq.UnitPrice,
				DiscountAmount: itemReq.DiscountAmount,
				Notes:          itemReq.Notes,
			}
		}
	}

	return po
}

// ToPurchaseOrderItemModel converts CreatePurchaseOrderItemRequest to purchase order item model
func (req *CreatePurchaseOrderItemRequest) ToPurchaseOrderItemModel(purchaseOrderID uuid.UUID) *models.PurchaseOrderItem {
	return &models.PurchaseOrderItem{
		PurchaseOrderID: purchaseOrderID,
		ProductID:       req.ProductID,
		Quantity:        req.Quantity,
		UnitPrice:       req.UnitPrice,
		DiscountAmount:  req.DiscountAmount,
		Notes:           req.Notes,
	}
}

// ApplyToPurchaseOrderModel applies UpdatePurchaseOrderRequest to existing purchase order model
func (req *UpdatePurchaseOrderRequest) ApplyToPurchaseOrderModel(po *models.PurchaseOrder) {
	if req.SupplierID != nil {
		po.SupplierID = *req.SupplierID
	}
	if req.OrderDate != nil {
		po.OrderDate = *req.OrderDate
	}
	if req.ExpectedDate != nil {
		po.ExpectedDate = req.ExpectedDate
	}
	if req.DeliveryDate != nil {
		po.DeliveryDate = req.DeliveryDate
	}
	if req.TaxRate != nil {
		po.TaxRate = *req.TaxRate
	}
	if req.ShippingCost != nil {
		po.ShippingCost = *req.ShippingCost
	}
	if req.DiscountAmount != nil {
		po.DiscountAmount = *req.DiscountAmount
	}
	if req.Currency != "" {
		po.Currency = req.Currency
	}
	if req.Notes != "" {
		po.Notes = req.Notes
	}
	if req.Terms != "" {
		po.Terms = req.Terms
	}
	if req.Reference != "" {
		po.Reference = req.Reference
	}
}

// ApplyToPurchaseOrderItemModel applies UpdatePurchaseOrderItemRequest to existing purchase order item model
func (req *UpdatePurchaseOrderItemRequest) ApplyToPurchaseOrderItemModel(item *models.PurchaseOrderItem) {
	if req.Quantity != nil {
		item.Quantity = *req.Quantity
	}
	if req.UnitPrice != nil {
		item.UnitPrice = *req.UnitPrice
	}
	if req.DiscountAmount != nil {
		item.DiscountAmount = *req.DiscountAmount
	}
	if req.Notes != "" {
		item.Notes = req.Notes
	}
}