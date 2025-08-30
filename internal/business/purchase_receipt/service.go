package purchase_receipt

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrPurchaseReceiptNotFound   = errors.New("purchase receipt not found")
	ErrPurchaseReceiptExists     = errors.New("purchase receipt already exists")
	ErrInvalidInput              = errors.New("invalid input data")
	ErrInvalidStatus             = errors.New("invalid status transition")
	ErrInsufficientItems         = errors.New("no items in purchase receipt")
	ErrItemNotFound              = errors.New("item not found")
	ErrQuantityExceedsOrdered    = errors.New("received quantity exceeds ordered quantity")
	ErrCannotModifyCompleted     = errors.New("cannot modify completed purchase receipt")
	ErrInvalidQuantity           = errors.New("invalid quantity")
	ErrCannotApprove             = errors.New("cannot approve purchase receipt")
	ErrCannotSend                = errors.New("cannot send purchase receipt")
	ErrCannotReceive             = errors.New("cannot receive goods for purchase receipt")
	ErrCannotCancel              = errors.New("cannot cancel purchase receipt")
)

type Service interface {
	// Purchase Receipt operations
	CreatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt) (*models.PurchaseReceipt, error)
	GetPurchaseReceiptByID(ctx context.Context, id uuid.UUID) (*models.PurchaseReceipt, error)
	GetPurchaseReceiptByNumber(ctx context.Context, receiptNumber string) (*models.PurchaseReceipt, error)
	UpdatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt) error
	DeletePurchaseReceipt(ctx context.Context, id uuid.UUID) error
	ListPurchaseReceipts(ctx context.Context, limit, offset int) ([]*models.PurchaseReceipt, error)
	GetPurchaseReceiptsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseReceipt, error)
	GetPurchaseReceiptsByStatus(ctx context.Context, status models.PurchaseReceiptStatus) ([]*models.PurchaseReceipt, error)
	SearchPurchaseReceipts(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseReceipt, error)
	CountPurchaseReceipts(ctx context.Context) (int64, error)
	
	// Purchase Receipt status operations
	ApprovePurchaseReceipt(ctx context.Context, id uuid.UUID, approverID uuid.UUID) error
	SendPurchaseOrder(ctx context.Context, id uuid.UUID) error
	ReceiveGoods(ctx context.Context, id uuid.UUID, receivedByID uuid.UUID, receivedDate time.Time) error
	VerifyGoods(ctx context.Context, id uuid.UUID, verifierID uuid.UUID, qualityCheck bool, qualityNotes string) error
	CompletePurchaseReceipt(ctx context.Context, id uuid.UUID) error
	CancelPurchaseReceipt(ctx context.Context, id uuid.UUID) error
	
	// Purchase Receipt item operations
	AddPurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error
	UpdatePurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error
	RemovePurchaseReceiptItem(ctx context.Context, id uuid.UUID) error
	GetPurchaseReceiptItems(ctx context.Context, purchaseReceiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error)
	
	// Business logic operations
	CalculatePurchaseReceiptTotals(ctx context.Context, pr *models.PurchaseReceipt) error
	GenerateReceiptNumber(ctx context.Context) (string, error)
	ValidatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt, isUpdate bool) error
	
	// Analytics and reporting
	GetPurchaseReceiptSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error)
}

type service struct {
	purchaseReceiptRepo interfaces.PurchaseReceiptRepository
	supplierRepo        interfaces.SupplierRepository
	productRepo         interfaces.ProductRepository
	inventoryRepo       interfaces.InventoryRepository
}

func NewService(
	purchaseReceiptRepo interfaces.PurchaseReceiptRepository,
	supplierRepo interfaces.SupplierRepository,
	productRepo interfaces.ProductRepository,
	inventoryRepo interfaces.InventoryRepository,
) Service {
	return &service{
		purchaseReceiptRepo: purchaseReceiptRepo,
		supplierRepo:        supplierRepo,
		productRepo:         productRepo,
		inventoryRepo:       inventoryRepo,
	}
}

// Purchase Receipt Operations

func (s *service) CreatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt) (*models.PurchaseReceipt, error) {
	if err := s.ValidatePurchaseReceipt(ctx, pr, false); err != nil {
		return nil, err
	}
	
	// Verify supplier exists and is active
	supplier, err := s.supplierRepo.GetByID(ctx, pr.SupplierID)
	if err != nil {
		return nil, errors.New("supplier not found")
	}
	if !supplier.IsActive {
		return nil, errors.New("supplier is inactive")
	}
	
	// Generate receipt number if not provided
	if pr.ReceiptNumber == "" {
		receiptNumber, err := s.GenerateReceiptNumber(ctx)
		if err != nil {
			return nil, err
		}
		pr.ReceiptNumber = receiptNumber
	} else {
		// Check if receipt number already exists
		existing, _ := s.purchaseReceiptRepo.GetByReceiptNumber(ctx, pr.ReceiptNumber)
		if existing != nil {
			return nil, ErrPurchaseReceiptExists
		}
	}
	
	// Set defaults
	if pr.Status == "" {
		pr.Status = models.PurchaseReceiptStatusDraft
	}
	if pr.Currency == "" {
		pr.Currency = "MYR"
	}
	if pr.TaxRate == 0 {
		pr.TaxRate = 6.0 // Default 6% SST in Malaysia
	}
	
	// Calculate totals
	if err := s.CalculatePurchaseReceiptTotals(ctx, pr); err != nil {
		return nil, err
	}
	
	if err := s.purchaseReceiptRepo.Create(ctx, pr); err != nil {
		return nil, fmt.Errorf("failed to create purchase receipt: %w", err)
	}
	
	return pr, nil
}

func (s *service) GetPurchaseReceiptByID(ctx context.Context, id uuid.UUID) (*models.PurchaseReceipt, error) {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrPurchaseReceiptNotFound
	}
	return pr, nil
}

func (s *service) GetPurchaseReceiptByNumber(ctx context.Context, receiptNumber string) (*models.PurchaseReceipt, error) {
	pr, err := s.purchaseReceiptRepo.GetByReceiptNumber(ctx, receiptNumber)
	if err != nil {
		return nil, ErrPurchaseReceiptNotFound
	}
	return pr, nil
}

func (s *service) UpdatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt) error {
	if err := s.ValidatePurchaseReceipt(ctx, pr, true); err != nil {
		return err
	}
	
	// Check if purchase receipt exists
	existing, err := s.purchaseReceiptRepo.GetByID(ctx, pr.ID)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	// Cannot modify completed purchase receipts
	if existing.Status == models.PurchaseReceiptStatusCompleted {
		return ErrCannotModifyCompleted
	}
	
	// Check if receipt number already exists (if changed)
	if pr.ReceiptNumber != existing.ReceiptNumber {
		existingPR, _ := s.purchaseReceiptRepo.GetByReceiptNumber(ctx, pr.ReceiptNumber)
		if existingPR != nil && existingPR.ID != pr.ID {
			return ErrPurchaseReceiptExists
		}
	}
	
	// Calculate totals
	if err := s.CalculatePurchaseReceiptTotals(ctx, pr); err != nil {
		return err
	}
	
	if err := s.purchaseReceiptRepo.Update(ctx, pr); err != nil {
		return fmt.Errorf("failed to update purchase receipt: %w", err)
	}
	
	return nil
}

func (s *service) DeletePurchaseReceipt(ctx context.Context, id uuid.UUID) error {
	// Check if purchase receipt exists
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	// Cannot delete completed purchase receipts
	if pr.Status == models.PurchaseReceiptStatusCompleted {
		return ErrCannotModifyCompleted
	}
	
	if err := s.purchaseReceiptRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete purchase receipt: %w", err)
	}
	
	return nil
}

func (s *service) ListPurchaseReceipts(ctx context.Context, limit, offset int) ([]*models.PurchaseReceipt, error) {
	receipts, _, err := s.purchaseReceiptRepo.List(ctx, offset, limit)
	return receipts, err
}

func (s *service) GetPurchaseReceiptsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseReceipt, error) {
	receipts, _, err := s.purchaseReceiptRepo.GetBySupplier(ctx, supplierID, 0, 1000) // Get all, up to 1000 limit
	return receipts, err
}

func (s *service) GetPurchaseReceiptsByStatus(ctx context.Context, status models.PurchaseReceiptStatus) ([]*models.PurchaseReceipt, error) {
	receipts, _, err := s.purchaseReceiptRepo.GetByStatus(ctx, status, 0, 1000) // Get all, up to 1000 limit
	return receipts, err
}

func (s *service) SearchPurchaseReceipts(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseReceipt, error) {
	// Using the search interface - assuming we search by receipt number
	receipts, _, err := s.purchaseReceiptRepo.Search(ctx, query, "", "", "", nil, nil, nil, offset, limit)
	return receipts, err
}

func (s *service) CountPurchaseReceipts(ctx context.Context) (int64, error) {
	// Since there's no Count method, we'll use List with limit 0 to get just the count
	_, count, err := s.purchaseReceiptRepo.List(ctx, 0, 0)
	return count, err
}

// Purchase Receipt Status Operations

func (s *service) ApprovePurchaseReceipt(ctx context.Context, id uuid.UUID, approverID uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if !pr.CanBeApproved() {
		return ErrCannotApprove
	}
	
	now := time.Now()
	pr.Status = models.PurchaseReceiptStatusApproved
	pr.ApprovedByID = &approverID
	pr.ApprovedAt = &now
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) SendPurchaseOrder(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if !pr.CanBeSent() {
		return ErrCannotSend
	}
	
	pr.Status = models.PurchaseReceiptStatusOrdered
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) ReceiveGoods(ctx context.Context, id uuid.UUID, receivedByID uuid.UUID, receivedDate time.Time) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if !pr.CanReceiveGoods() {
		return ErrCannotReceive
	}
	
	pr.Status = models.PurchaseReceiptStatusReceived
	pr.ReceivedByID = &receivedByID
	pr.ReceivedDate = &receivedDate
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) VerifyGoods(ctx context.Context, id uuid.UUID, verifierID uuid.UUID, qualityCheck bool, qualityNotes string) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if pr.Status != models.PurchaseReceiptStatusReceived && pr.Status != models.PurchaseReceiptStatusPartial {
		return ErrInvalidStatus
	}
	
	now := time.Now()
	pr.VerifiedByID = &verifierID
	pr.VerifiedAt = &now
	pr.QualityCheck = qualityCheck
	pr.QualityNotes = qualityNotes
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) CompletePurchaseReceipt(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if pr.Status != models.PurchaseReceiptStatusReceived && pr.Status != models.PurchaseReceiptStatusPartial {
		return ErrInvalidStatus
	}
	
	pr.Status = models.PurchaseReceiptStatusCompleted
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) CancelPurchaseReceipt(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if !pr.CanBeCancelled() {
		return ErrCannotCancel
	}
	
	pr.Status = models.PurchaseReceiptStatusCancelled
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

// Purchase Receipt Item Operations

func (s *service) AddPurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	// Validate item
	if item.OrderedQuantity <= 0 {
		return ErrInvalidQuantity
	}
	
	// Verify purchase receipt exists and is modifiable
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, item.PurchaseReceiptID)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if pr.Status == models.PurchaseReceiptStatusCompleted {
		return ErrCannotModifyCompleted
	}
	
	// Verify product exists and is active
	product, err := s.productRepo.GetByID(ctx, item.ProductID)
	if err != nil {
		return errors.New("product not found")
	}
	if !product.IsActive {
		return errors.New("product is inactive")
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.OrderedQuantity) * item.UnitPrice
	if item.DiscountAmount > 0 {
		item.TotalPrice -= item.DiscountAmount
	}
	item.TaxAmount = item.TotalPrice * (pr.TaxRate / 100)
	
	if err := s.purchaseReceiptRepo.CreateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to add purchase receipt item: %w", err)
	}
	
	// Recalculate purchase receipt totals
	pr.Items = nil // Clear items to force reload
	return s.CalculatePurchaseReceiptTotals(ctx, pr)
}

func (s *service) UpdatePurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	if item.OrderedQuantity <= 0 {
		return ErrInvalidQuantity
	}
	
	// Verify purchase receipt exists and is modifiable
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, item.PurchaseReceiptID)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if pr.Status == models.PurchaseReceiptStatusCompleted {
		return ErrCannotModifyCompleted
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.OrderedQuantity) * item.UnitPrice
	if item.DiscountAmount > 0 {
		item.TotalPrice -= item.DiscountAmount
	}
	item.TaxAmount = item.TotalPrice * (pr.TaxRate / 100)
	
	if err := s.purchaseReceiptRepo.UpdateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to update purchase receipt item: %w", err)
	}
	
	// Recalculate purchase receipt totals
	pr.Items = nil // Clear items to force reload
	return s.CalculatePurchaseReceiptTotals(ctx, pr)
}

func (s *service) RemovePurchaseReceiptItem(ctx context.Context, id uuid.UUID) error {
	// Get the item first to find the purchase receipt ID
	item, err := s.purchaseReceiptRepo.GetItem(ctx, id)
	if err != nil {
		return ErrItemNotFound
	}
	
	// Verify purchase receipt is modifiable
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, item.PurchaseReceiptID)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	if pr.Status == models.PurchaseReceiptStatusCompleted {
		return ErrCannotModifyCompleted
	}
	
	if err := s.purchaseReceiptRepo.DeleteItem(ctx, id); err != nil {
		return fmt.Errorf("failed to remove purchase receipt item: %w", err)
	}
	
	// Recalculate purchase receipt totals
	pr.Items = nil // Clear items to force reload
	return s.CalculatePurchaseReceiptTotals(ctx, pr)
}

func (s *service) GetPurchaseReceiptItems(ctx context.Context, purchaseReceiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error) {
	return s.purchaseReceiptRepo.GetItemsByReceipt(ctx, purchaseReceiptID)
}

// Business Logic Operations

func (s *service) CalculatePurchaseReceiptTotals(ctx context.Context, pr *models.PurchaseReceipt) error {
	if pr.Items == nil || len(pr.Items) == 0 {
		items, err := s.purchaseReceiptRepo.GetItemsByReceipt(ctx, pr.ID)
		if err != nil {
			return err
		}
		// Convert pointer slice to value slice
		pr.Items = make([]models.PurchaseReceiptItem, len(items))
		for i, item := range items {
			pr.Items[i] = *item
		}
	}
	
	var subTotal float64 = 0
	var totalDiscount float64 = 0
	
	for _, item := range pr.Items {
		itemTotal := float64(item.OrderedQuantity) * item.UnitPrice
		subTotal += itemTotal
		totalDiscount += item.DiscountAmount
	}
	
	pr.SubTotal = subTotal
	pr.DiscountAmount = totalDiscount
	
	discountedSubTotal := subTotal - totalDiscount
	pr.TaxAmount = discountedSubTotal * (pr.TaxRate / 100)
	pr.TotalAmount = discountedSubTotal + pr.TaxAmount + pr.ShippingCost
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) GenerateReceiptNumber(ctx context.Context) (string, error) {
	prefix := fmt.Sprintf("PR%s", time.Now().Format("200601"))
	
	for i := 1; i <= 9999; i++ {
		receiptNumber := fmt.Sprintf("%s%04d", prefix, i)
		
		_, err := s.purchaseReceiptRepo.GetByReceiptNumber(ctx, receiptNumber)
		if err != nil {
			return receiptNumber, nil
		}
	}
	
	return "", errors.New("unable to generate unique receipt number")
}

func (s *service) ValidatePurchaseReceipt(ctx context.Context, pr *models.PurchaseReceipt, isUpdate bool) error {
	if pr == nil {
		return ErrInvalidInput
	}
	
	// Validate required fields
	if pr.SupplierID == uuid.Nil {
		return errors.New("supplier ID is required")
	}
	
	if pr.CreatedByID == uuid.Nil {
		return errors.New("created by ID is required")
	}
	
	if pr.OrderDate.IsZero() {
		return errors.New("order date is required")
	}
	
	// Validate field lengths
	if len(pr.ReceiptNumber) > 50 {
		return errors.New("receipt number must be less than 50 characters")
	}
	
	if len(pr.OrderNotes) > 1000 {
		return errors.New("order notes must be less than 1000 characters")
	}
	
	if len(pr.ReceiptNotes) > 1000 {
		return errors.New("receipt notes must be less than 1000 characters")
	}
	
	if len(pr.Terms) > 1000 {
		return errors.New("terms must be less than 1000 characters")
	}
	
	if len(pr.Reference) > 100 {
		return errors.New("reference must be less than 100 characters")
	}
	
	if len(pr.Currency) > 3 {
		return errors.New("currency must be 3 characters")
	}
	
	// Validate amounts
	if pr.SubTotal < 0 {
		return errors.New("subtotal cannot be negative")
	}
	
	if pr.TaxAmount < 0 {
		return errors.New("tax amount cannot be negative")
	}
	
	if pr.TaxRate < 0 || pr.TaxRate > 100 {
		return errors.New("tax rate must be between 0 and 100")
	}
	
	if pr.ShippingCost < 0 {
		return errors.New("shipping cost cannot be negative")
	}
	
	if pr.DiscountAmount < 0 {
		return errors.New("discount amount cannot be negative")
	}
	
	if pr.TotalAmount < 0 {
		return errors.New("total amount cannot be negative")
	}
	
	return nil
}

// Analytics and Reporting

func (s *service) GetPurchaseReceiptSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	receipts, _, err := s.purchaseReceiptRepo.GetByDateRange(ctx, startDate, endDate, 0, 10000)
	if err != nil {
		return nil, err
	}
	
	summary := map[string]interface{}{
		"total_receipts":     len(receipts),
		"total_value":        0.0,
		"draft_receipts":     0,
		"pending_receipts":   0,
		"approved_receipts":  0,
		"ordered_receipts":   0,
		"received_receipts":  0,
		"partial_receipts":   0,
		"completed_receipts": 0,
		"cancelled_receipts": 0,
	}
	
	var totalValue float64 = 0
	statusCounts := make(map[string]int)
	
	for _, receipt := range receipts {
		totalValue += receipt.TotalAmount
		statusCounts[string(receipt.Status)]++
	}
	
	summary["total_value"] = totalValue
	summary["draft_receipts"] = statusCounts["draft"]
	summary["pending_receipts"] = statusCounts["pending"]
	summary["approved_receipts"] = statusCounts["approved"]
	summary["ordered_receipts"] = statusCounts["ordered"]
	summary["received_receipts"] = statusCounts["received"]
	summary["partial_receipts"] = statusCounts["partial"]
	summary["completed_receipts"] = statusCounts["completed"]
	summary["cancelled_receipts"] = statusCounts["cancelled"]
	
	return summary, nil
}

func (s *service) GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	// Get purchase receipts for supplier in date range
	receipts, _, err := s.purchaseReceiptRepo.GetBySupplier(ctx, supplierID, 0, 10000)
	if err != nil {
		return nil, err
	}
	
	// Filter by date range
	filteredReceipts := []*models.PurchaseReceipt{}
	for _, receipt := range receipts {
		if receipt.OrderDate.After(startDate) && receipt.OrderDate.Before(endDate) {
			filteredReceipts = append(filteredReceipts, receipt)
		}
	}
	
	performance := map[string]interface{}{
		"supplier_id":        supplierID,
		"period_start":       startDate,
		"period_end":         endDate,
		"total_receipts":     len(filteredReceipts),
		"total_order_value":  0.0,
		"completed_receipts": 0,
		"delivery_rate":      0.0,
		"on_time_deliveries": 0,
		"late_deliveries":    0,
	}
	
	var totalOrderValue float64 = 0
	completed := 0
	onTime := 0
	late := 0
	
	for _, receipt := range filteredReceipts {
		totalOrderValue += receipt.TotalAmount
		
		if receipt.Status == models.PurchaseReceiptStatusCompleted {
			completed++
		}
		
		// Check delivery performance
		if receipt.DeliveryDate != nil && receipt.ExpectedDate != nil {
			if receipt.DeliveryDate.Before(*receipt.ExpectedDate) || receipt.DeliveryDate.Equal(*receipt.ExpectedDate) {
				onTime++
			} else {
				late++
			}
		}
	}
	
	performance["total_order_value"] = totalOrderValue
	performance["completed_receipts"] = completed
	performance["on_time_deliveries"] = onTime
	performance["late_deliveries"] = late
	
	if len(filteredReceipts) > 0 {
		performance["delivery_rate"] = float64(completed) / float64(len(filteredReceipts)) * 100
	}
	
	return performance, nil
}