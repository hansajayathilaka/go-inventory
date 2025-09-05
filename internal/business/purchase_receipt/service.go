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
	ErrCannotModifyCompleted     = errors.New("cannot modify completed purchase receipt")
	ErrInvalidQuantity           = errors.New("invalid quantity")
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
	ReceiveGoods(ctx context.Context, id uuid.UUID) error
	CompletePurchaseReceipt(ctx context.Context, id uuid.UUID) error
	CancelPurchaseReceipt(ctx context.Context, id uuid.UUID) error
	ProcessStockIntegration(ctx context.Context, pr *models.PurchaseReceipt) error
	
	// Purchase Receipt item operations
	AddPurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error
	UpdatePurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error
	RemovePurchaseReceiptItem(ctx context.Context, id uuid.UUID) error
	GetPurchaseReceiptItems(ctx context.Context, purchaseReceiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error)
	
	// Business logic operations
	CalculatePurchaseReceiptTotals(ctx context.Context, pr *models.PurchaseReceipt) error
	CalculateItemDiscount(baseAmount, discountPercentage, discountAmount float64) float64
	CalculateBillDiscount(itemsTotal, discountPercentage, discountAmount float64) float64
	ValidateStatusTransition(fromStatus, toStatus models.PurchaseReceiptStatus) error
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
	stockBatchRepo      interfaces.StockBatchRepository
	stockMovementRepo   interfaces.StockMovementRepository
}

func NewService(
	purchaseReceiptRepo interfaces.PurchaseReceiptRepository,
	supplierRepo interfaces.SupplierRepository,
	productRepo interfaces.ProductRepository,
	inventoryRepo interfaces.InventoryRepository,
	stockBatchRepo interfaces.StockBatchRepository,
	stockMovementRepo interfaces.StockMovementRepository,
) Service {
	return &service{
		purchaseReceiptRepo: purchaseReceiptRepo,
		supplierRepo:        supplierRepo,
		productRepo:         productRepo,
		inventoryRepo:       inventoryRepo,
		stockBatchRepo:      stockBatchRepo,
		stockMovementRepo:   stockMovementRepo,
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
		pr.Status = models.PurchaseReceiptStatusPending
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

func (s *service) ReceiveGoods(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	// Validate status transition
	if err := s.ValidateStatusTransition(pr.Status, models.PurchaseReceiptStatusReceived); err != nil {
		return fmt.Errorf("cannot receive goods: %w", err)
	}
	
	pr.Status = models.PurchaseReceiptStatusReceived
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}


func (s *service) CompletePurchaseReceipt(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	// Validate status transition
	if err := s.ValidateStatusTransition(pr.Status, models.PurchaseReceiptStatusCompleted); err != nil {
		return fmt.Errorf("cannot complete purchase receipt: %w", err)
	}
	
	// Process stock integration before marking as completed
	if err := s.ProcessStockIntegration(ctx, pr); err != nil {
		return fmt.Errorf("stock integration failed: %w", err)
	}
	
	pr.Status = models.PurchaseReceiptStatusCompleted
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

func (s *service) CancelPurchaseReceipt(ctx context.Context, id uuid.UUID) error {
	pr, err := s.purchaseReceiptRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseReceiptNotFound
	}
	
	// Validate status transition
	if err := s.ValidateStatusTransition(pr.Status, models.PurchaseReceiptStatusCancelled); err != nil {
		return fmt.Errorf("cannot cancel purchase receipt: %w", err)
	}
	
	pr.Status = models.PurchaseReceiptStatusCancelled
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

// ProcessStockIntegration creates stock batches and updates inventory when purchase receipt is completed
func (s *service) ProcessStockIntegration(ctx context.Context, pr *models.PurchaseReceipt) error {
	// Get all items for this purchase receipt
	items, err := s.purchaseReceiptRepo.GetItemsByReceipt(ctx, pr.ID)
	if err != nil {
		return fmt.Errorf("failed to get purchase receipt items: %w", err)
	}
	
	for _, item := range items {
		// Create stock batch for this item
		stockBatch := &models.StockBatch{
			ID:                uuid.New(),
			ProductID:         item.ProductID,
			SupplierID:        &pr.SupplierID,
			Quantity:          item.Quantity,
			AvailableQuantity: item.Quantity,
			CostPrice:         item.UnitCost,
			ReceivedDate:      &pr.PurchaseDate,
			ExpiryDate:        nil, // TODO: Add expiry date if needed
			BatchNumber:       fmt.Sprintf("%s-%s", pr.ReceiptNumber, item.ID.String()[:8]),
			Notes:             fmt.Sprintf("From purchase receipt %s", pr.ReceiptNumber),
			IsActive:          true,
		}
		
		if err := s.stockBatchRepo.Create(ctx, stockBatch); err != nil {
			return fmt.Errorf("failed to create stock batch for product %s: %w", item.ProductID, err)
		}
		
		// Create stock movement record
		stockMovement := &models.StockMovement{
			ID:            uuid.New(),
			ProductID:     item.ProductID,
			BatchID:       &stockBatch.ID,
			MovementType:  models.MovementIN,
			Quantity:      item.Quantity,
			UnitCost:      item.UnitCost,
			TotalCost:     item.LineTotal,
			ReferenceType: "purchase_receipt",
			ReferenceID:   pr.ID.String(),
			Notes:         fmt.Sprintf("Stock received from purchase receipt %s", pr.ReceiptNumber),
			UserID:        pr.CreatedByID,
		}
		
		if err := s.stockMovementRepo.Create(ctx, stockMovement); err != nil {
			return fmt.Errorf("failed to create stock movement for product %s: %w", item.ProductID, err)
		}
		
		// Update inventory levels
		inventory, err := s.inventoryRepo.GetByProduct(ctx, item.ProductID)
		if err != nil {
			// Create new inventory record if it doesn't exist
			inventory = &models.Inventory{
				ID:           uuid.New(),
				ProductID:    item.ProductID,
				Quantity:     item.Quantity,
				ReorderLevel: 10, // Default reorder level
				MaxLevel:     100, // Default max level
			}
			if err := s.inventoryRepo.Create(ctx, inventory); err != nil {
				return fmt.Errorf("failed to create inventory record for product %s: %w", item.ProductID, err)
			}
		} else {
			// Update existing inventory
			inventory.Quantity += item.Quantity
			if err := s.inventoryRepo.Update(ctx, inventory); err != nil {
				return fmt.Errorf("failed to update inventory for product %s: %w", item.ProductID, err)
			}
		}
	}
	
	return nil
}

// Purchase Receipt Item Operations

func (s *service) AddPurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	// Validate item
	if item.Quantity <= 0 {
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
	
	// Calculate item totals with proper discount handling
	baseAmount := float64(item.Quantity) * item.UnitCost
	item.ItemDiscountAmount = s.CalculateItemDiscount(baseAmount, item.ItemDiscountPercentage, item.ItemDiscountAmount)
	item.LineTotal = baseAmount - item.ItemDiscountAmount
	
	if err := s.purchaseReceiptRepo.CreateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to add purchase receipt item: %w", err)
	}
	
	// Recalculate purchase receipt totals
	pr.Items = nil // Clear items to force reload
	return s.CalculatePurchaseReceiptTotals(ctx, pr)
}

func (s *service) UpdatePurchaseReceiptItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	if item.Quantity <= 0 {
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
	
	// Calculate item totals with proper discount handling
	baseAmount := float64(item.Quantity) * item.UnitCost
	item.ItemDiscountAmount = s.CalculateItemDiscount(baseAmount, item.ItemDiscountPercentage, item.ItemDiscountAmount)
	item.LineTotal = baseAmount - item.ItemDiscountAmount
	
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
	
	var itemsTotal float64 = 0
	
	for _, item := range pr.Items {
		itemsTotal += item.LineTotal
	}
	
	// Apply bill-level discount with proper validation
	billDiscountAmount := s.CalculateBillDiscount(itemsTotal, pr.BillDiscountPercentage, pr.BillDiscountAmount)
	pr.BillDiscountAmount = billDiscountAmount
	
	pr.TotalAmount = itemsTotal - billDiscountAmount
	
	// Ensure total amount is never negative
	if pr.TotalAmount < 0 {
		pr.TotalAmount = 0
	}
	
	return s.purchaseReceiptRepo.Update(ctx, pr)
}

// CalculateItemDiscount calculates discount for individual item
func (s *service) CalculateItemDiscount(baseAmount, discountPercentage, discountAmount float64) float64 {
	// Percentage discount takes precedence over fixed amount
	if discountPercentage > 0 {
		return baseAmount * (discountPercentage / 100)
	}
	
	// Ensure discount amount doesn't exceed base amount
	if discountAmount > baseAmount {
		return baseAmount
	}
	
	return discountAmount
}

// CalculateBillDiscount calculates discount for entire bill
func (s *service) CalculateBillDiscount(itemsTotal, discountPercentage, discountAmount float64) float64 {
	// Percentage discount takes precedence over fixed amount
	if discountPercentage > 0 {
		return itemsTotal * (discountPercentage / 100)
	}
	
	// Ensure discount amount doesn't exceed items total
	if discountAmount > itemsTotal {
		return itemsTotal
	}
	
	return discountAmount
}

// ValidateStatusTransition validates if status transition is allowed
func (s *service) ValidateStatusTransition(fromStatus, toStatus models.PurchaseReceiptStatus) error {
	// Define valid transitions
	validTransitions := map[models.PurchaseReceiptStatus][]models.PurchaseReceiptStatus{
		models.PurchaseReceiptStatusPending: {
			models.PurchaseReceiptStatusReceived,
			models.PurchaseReceiptStatusCancelled,
		},
		models.PurchaseReceiptStatusReceived: {
			models.PurchaseReceiptStatusCompleted,
			models.PurchaseReceiptStatusCancelled,
			models.PurchaseReceiptStatusPending, // Allow going back to pending if needed
		},
		models.PurchaseReceiptStatusCompleted: {
			// No transitions from completed - it's final
		},
		models.PurchaseReceiptStatusCancelled: {
			// No transitions from cancelled - it's final
		},
	}
	
	allowedTransitions, exists := validTransitions[fromStatus]
	if !exists {
		return fmt.Errorf("invalid current status: %s", fromStatus)
	}
	
	for _, allowedStatus := range allowedTransitions {
		if allowedStatus == toStatus {
			return nil
		}
	}
	
	return fmt.Errorf("invalid status transition from %s to %s", fromStatus, toStatus)
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
	
	if pr.PurchaseDate.IsZero() {
		return errors.New("purchase date is required")
	}
	
	// Validate field lengths
	if len(pr.ReceiptNumber) > 50 {
		return errors.New("receipt number must be less than 50 characters")
	}
	
	if len(pr.SupplierBillNumber) > 100 {
		return errors.New("supplier bill number must be less than 100 characters")
	}
	
	if len(pr.Notes) > 1000 {
		return errors.New("notes must be less than 1000 characters")
	}
	
	// Validate amounts
	if pr.BillDiscountAmount < 0 {
		return errors.New("bill discount amount cannot be negative")
	}
	
	if pr.BillDiscountPercentage < 0 || pr.BillDiscountPercentage > 100 {
		return errors.New("bill discount percentage must be between 0 and 100")
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
		"pending_receipts":   0,
		"received_receipts":  0,
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
	summary["pending_receipts"] = statusCounts["pending"]
	summary["received_receipts"] = statusCounts["received"]
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
		if receipt.PurchaseDate.After(startDate) && receipt.PurchaseDate.Before(endDate) {
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
		
		// Simplified performance tracking - completed receipts are considered on time
		if receipt.Status == models.PurchaseReceiptStatusCompleted {
			onTime++
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