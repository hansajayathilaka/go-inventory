package purchase

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
	ErrPurchaseOrderNotFound     = errors.New("purchase order not found")
	ErrPurchaseOrderExists       = errors.New("purchase order already exists")
	ErrGRNNotFound              = errors.New("goods received note not found")
	ErrGRNExists                = errors.New("goods received note already exists")
	ErrInvalidInput             = errors.New("invalid input data")
	ErrInvalidStatus            = errors.New("invalid status transition")
	ErrInsufficientItems        = errors.New("no items in purchase order")
	ErrItemNotFound             = errors.New("item not found")
	ErrQuantityExceedsOrdered   = errors.New("received quantity exceeds ordered quantity")
	ErrAlreadyFullyReceived     = errors.New("purchase order already fully received")
	ErrCannotModifyReceived     = errors.New("cannot modify received purchase order")
	ErrInvalidQuantity          = errors.New("invalid quantity")
)

type Service interface {
	// Purchase Order operations
	CreatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) (*models.PurchaseOrder, error)
	GetPurchaseOrderByID(ctx context.Context, id uuid.UUID) (*models.PurchaseOrder, error)
	GetPurchaseOrderByNumber(ctx context.Context, poNumber string) (*models.PurchaseOrder, error)
	UpdatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) error
	DeletePurchaseOrder(ctx context.Context, id uuid.UUID) error
	ListPurchaseOrders(ctx context.Context, limit, offset int) ([]*models.PurchaseOrder, error)
	GetPurchaseOrdersBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseOrder, error)
	GetPurchaseOrdersByStatus(ctx context.Context, status models.PurchaseOrderStatus) ([]*models.PurchaseOrder, error)
	SearchPurchaseOrders(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseOrder, error)
	CountPurchaseOrders(ctx context.Context) (int64, error)
	
	// Purchase Order status operations
	ApprovePurchaseOrder(ctx context.Context, id uuid.UUID, approverID uuid.UUID) error
	SendPurchaseOrder(ctx context.Context, id uuid.UUID) error
	CancelPurchaseOrder(ctx context.Context, id uuid.UUID) error
	MarkAsReceived(ctx context.Context, id uuid.UUID) error
	
	// Purchase Order item operations
	AddPurchaseOrderItem(ctx context.Context, item *models.PurchaseOrderItem) error
	UpdatePurchaseOrderItem(ctx context.Context, item *models.PurchaseOrderItem) error
	RemovePurchaseOrderItem(ctx context.Context, id uuid.UUID) error
	GetPurchaseOrderItems(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.PurchaseOrderItem, error)
	
	// GRN operations
	CreateGRN(ctx context.Context, grn *models.GRN) (*models.GRN, error)
	GetGRNByID(ctx context.Context, id uuid.UUID) (*models.GRN, error)
	GetGRNByNumber(ctx context.Context, grnNumber string) (*models.GRN, error)
	UpdateGRN(ctx context.Context, grn *models.GRN) error
	DeleteGRN(ctx context.Context, id uuid.UUID) error
	ListGRNs(ctx context.Context, limit, offset int) ([]*models.GRN, error)
	GetGRNsByPurchaseOrder(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.GRN, error)
	GetGRNsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.GRN, error)
	SearchGRNs(ctx context.Context, query string, limit, offset int) ([]*models.GRN, error)
	CountGRNs(ctx context.Context) (int64, error)
	
	// GRN processing operations
	ProcessGRNReceipt(ctx context.Context, id uuid.UUID, receivedByID uuid.UUID) error
	VerifyGRN(ctx context.Context, id uuid.UUID, verifierID uuid.UUID) error
	CompleteGRN(ctx context.Context, id uuid.UUID) error
	
	// GRN item operations
	AddGRNItem(ctx context.Context, item *models.GRNItem) error
	UpdateGRNItem(ctx context.Context, item *models.GRNItem) error
	RemoveGRNItem(ctx context.Context, id uuid.UUID) error
	GetGRNItems(ctx context.Context, grnID uuid.UUID) ([]*models.GRNItem, error)
	
	// Business logic operations
	CalculatePurchaseOrderTotals(ctx context.Context, po *models.PurchaseOrder) error
	CalculateGRNTotals(ctx context.Context, grn *models.GRN) error
	GeneratePONumber(ctx context.Context) (string, error)
	GenerateGRNNumber(ctx context.Context) (string, error)
	ValidatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder, isUpdate bool) error
	ValidateGRN(ctx context.Context, grn *models.GRN, isUpdate bool) error
	
	// Analytics and reporting
	GetPurchaseOrderSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetGRNSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error)
}

type service struct {
	purchaseOrderRepo interfaces.PurchaseOrderRepository
	grnRepo          interfaces.GRNRepository
	supplierRepo     interfaces.SupplierRepository
	productRepo      interfaces.ProductRepository
	inventoryRepo    interfaces.InventoryRepository
}

func NewService(
	purchaseOrderRepo interfaces.PurchaseOrderRepository,
	grnRepo interfaces.GRNRepository,
	supplierRepo interfaces.SupplierRepository,
	productRepo interfaces.ProductRepository,
	inventoryRepo interfaces.InventoryRepository,
) Service {
	return &service{
		purchaseOrderRepo: purchaseOrderRepo,
		grnRepo:          grnRepo,
		supplierRepo:     supplierRepo,
		productRepo:      productRepo,
		inventoryRepo:    inventoryRepo,
	}
}

// Purchase Order Operations

func (s *service) CreatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) (*models.PurchaseOrder, error) {
	if err := s.ValidatePurchaseOrder(ctx, po, false); err != nil {
		return nil, err
	}
	
	// Verify supplier exists
	supplier, err := s.supplierRepo.GetByID(ctx, po.SupplierID)
	if err != nil {
		return nil, errors.New("supplier not found")
	}
	if !supplier.IsActive {
		return nil, errors.New("supplier is inactive")
	}
	
	// Generate PO number if not provided
	if po.PONumber == "" {
		poNumber, err := s.GeneratePONumber(ctx)
		if err != nil {
			return nil, err
		}
		po.PONumber = poNumber
	} else {
		// Check if PO number already exists
		existing, _ := s.purchaseOrderRepo.GetByPONumber(ctx, po.PONumber)
		if existing != nil {
			return nil, ErrPurchaseOrderExists
		}
	}
	
	// Set defaults
	if po.Status == "" {
		po.Status = models.PurchaseOrderStatusDraft
	}
	if po.Currency == "" {
		po.Currency = "MYR"
	}
	if po.TaxRate == 0 {
		po.TaxRate = 6.0 // Default 6% SST in Malaysia
	}
	
	// Calculate totals
	if err := s.CalculatePurchaseOrderTotals(ctx, po); err != nil {
		return nil, err
	}
	
	if err := s.purchaseOrderRepo.Create(ctx, po); err != nil {
		return nil, fmt.Errorf("failed to create purchase order: %w", err)
	}
	
	return po, nil
}

func (s *service) GetPurchaseOrderByID(ctx context.Context, id uuid.UUID) (*models.PurchaseOrder, error) {
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrPurchaseOrderNotFound
	}
	return po, nil
}

func (s *service) GetPurchaseOrderByNumber(ctx context.Context, poNumber string) (*models.PurchaseOrder, error) {
	po, err := s.purchaseOrderRepo.GetByPONumber(ctx, poNumber)
	if err != nil {
		return nil, ErrPurchaseOrderNotFound
	}
	return po, nil
}

func (s *service) UpdatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder) error {
	if err := s.ValidatePurchaseOrder(ctx, po, true); err != nil {
		return err
	}
	
	// Check if purchase order exists
	existing, err := s.purchaseOrderRepo.GetByID(ctx, po.ID)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	// Cannot modify received purchase orders
	if existing.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	// Check if PO number already exists (if changed)
	if po.PONumber != existing.PONumber {
		existingPO, _ := s.purchaseOrderRepo.GetByPONumber(ctx, po.PONumber)
		if existingPO != nil && existingPO.ID != po.ID {
			return ErrPurchaseOrderExists
		}
	}
	
	// Calculate totals
	if err := s.CalculatePurchaseOrderTotals(ctx, po); err != nil {
		return err
	}
	
	if err := s.purchaseOrderRepo.Update(ctx, po); err != nil {
		return fmt.Errorf("failed to update purchase order: %w", err)
	}
	
	return nil
}

func (s *service) DeletePurchaseOrder(ctx context.Context, id uuid.UUID) error {
	// Check if purchase order exists
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	// Cannot delete received purchase orders
	if po.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	if err := s.purchaseOrderRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete purchase order: %w", err)
	}
	
	return nil
}

func (s *service) ListPurchaseOrders(ctx context.Context, limit, offset int) ([]*models.PurchaseOrder, error) {
	return s.purchaseOrderRepo.List(ctx, limit, offset)
}

func (s *service) GetPurchaseOrdersBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseOrder, error) {
	return s.purchaseOrderRepo.GetBySupplier(ctx, supplierID)
}

func (s *service) GetPurchaseOrdersByStatus(ctx context.Context, status models.PurchaseOrderStatus) ([]*models.PurchaseOrder, error) {
	return s.purchaseOrderRepo.GetByStatus(ctx, status)
}

func (s *service) SearchPurchaseOrders(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseOrder, error) {
	if query == "" {
		return s.purchaseOrderRepo.List(ctx, limit, offset)
	}
	return s.purchaseOrderRepo.Search(ctx, query, limit, offset)
}

func (s *service) CountPurchaseOrders(ctx context.Context) (int64, error) {
	return s.purchaseOrderRepo.Count(ctx)
}

// Purchase Order Status Operations

func (s *service) ApprovePurchaseOrder(ctx context.Context, id uuid.UUID, approverID uuid.UUID) error {
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status != models.PurchaseOrderStatusPending {
		return ErrInvalidStatus
	}
	
	now := time.Now()
	po.Status = models.PurchaseOrderStatusApproved
	po.ApprovedByID = &approverID
	po.ApprovedAt = &now
	
	return s.purchaseOrderRepo.Update(ctx, po)
}

func (s *service) SendPurchaseOrder(ctx context.Context, id uuid.UUID) error {
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status != models.PurchaseOrderStatusApproved {
		return ErrInvalidStatus
	}
	
	po.Status = models.PurchaseOrderStatusOrdered
	
	return s.purchaseOrderRepo.Update(ctx, po)
}

func (s *service) CancelPurchaseOrder(ctx context.Context, id uuid.UUID) error {
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	po.Status = models.PurchaseOrderStatusCancelled
	
	return s.purchaseOrderRepo.Update(ctx, po)
}

func (s *service) MarkAsReceived(ctx context.Context, id uuid.UUID) error {
	po, err := s.purchaseOrderRepo.GetByID(ctx, id)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status != models.PurchaseOrderStatusOrdered {
		return ErrInvalidStatus
	}
	
	now := time.Now()
	po.Status = models.PurchaseOrderStatusReceived
	po.DeliveryDate = &now
	
	return s.purchaseOrderRepo.Update(ctx, po)
}

// Purchase Order Item Operations

func (s *service) AddPurchaseOrderItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	// Validate item
	if item.Quantity <= 0 {
		return ErrInvalidQuantity
	}
	
	// Verify purchase order exists and is modifiable
	po, err := s.purchaseOrderRepo.GetByID(ctx, item.PurchaseOrderID)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	// Verify product exists
	product, err := s.productRepo.GetByID(ctx, item.ProductID)
	if err != nil {
		return errors.New("product not found")
	}
	if !product.IsActive {
		return errors.New("product is inactive")
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.Quantity) * item.UnitPrice
	if item.DiscountAmount > 0 {
		item.TotalPrice -= item.DiscountAmount
	}
	item.TaxAmount = item.TotalPrice * (po.TaxRate / 100)
	
	if err := s.purchaseOrderRepo.CreateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to add purchase order item: %w", err)
	}
	
	// Recalculate purchase order totals
	po.Items = nil // Clear items to force reload
	return s.CalculatePurchaseOrderTotals(ctx, po)
}

func (s *service) UpdatePurchaseOrderItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	if item.Quantity <= 0 {
		return ErrInvalidQuantity
	}
	
	// Verify purchase order exists and is modifiable
	po, err := s.purchaseOrderRepo.GetByID(ctx, item.PurchaseOrderID)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.Quantity) * item.UnitPrice
	if item.DiscountAmount > 0 {
		item.TotalPrice -= item.DiscountAmount
	}
	item.TaxAmount = item.TotalPrice * (po.TaxRate / 100)
	
	if err := s.purchaseOrderRepo.UpdateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to update purchase order item: %w", err)
	}
	
	// Recalculate purchase order totals
	po.Items = nil // Clear items to force reload
	return s.CalculatePurchaseOrderTotals(ctx, po)
}

func (s *service) RemovePurchaseOrderItem(ctx context.Context, id uuid.UUID) error {
	// Get item to find purchase order
	items, err := s.purchaseOrderRepo.GetItemsByPurchaseOrderID(ctx, uuid.Nil) // This is a workaround - need to get all items and find the right one
	if err != nil {
		return ErrItemNotFound
	}
	
	var poID uuid.UUID
	found := false
	for _, item := range items {
		if item.ID == id {
			poID = item.PurchaseOrderID
			found = true
			break
		}
	}
	
	if !found {
		return ErrItemNotFound
	}
	
	// Verify purchase order is modifiable
	po, err := s.purchaseOrderRepo.GetByID(ctx, poID)
	if err != nil {
		return ErrPurchaseOrderNotFound
	}
	
	if po.Status == models.PurchaseOrderStatusReceived {
		return ErrCannotModifyReceived
	}
	
	if err := s.purchaseOrderRepo.DeleteItem(ctx, id); err != nil {
		return fmt.Errorf("failed to remove purchase order item: %w", err)
	}
	
	// Recalculate purchase order totals
	po.Items = nil // Clear items to force reload
	return s.CalculatePurchaseOrderTotals(ctx, po)
}

func (s *service) GetPurchaseOrderItems(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.PurchaseOrderItem, error) {
	return s.purchaseOrderRepo.GetItemsByPurchaseOrderID(ctx, purchaseOrderID)
}

// GRN Operations

func (s *service) CreateGRN(ctx context.Context, grn *models.GRN) (*models.GRN, error) {
	if err := s.ValidateGRN(ctx, grn, false); err != nil {
		return nil, err
	}
	
	// Verify purchase order exists
	po, err := s.purchaseOrderRepo.GetByID(ctx, grn.PurchaseOrderID)
	if err != nil {
		return nil, errors.New("purchase order not found")
	}
	
	if po.Status != models.PurchaseOrderStatusOrdered {
		return nil, errors.New("purchase order must be in ordered status")
	}
	
	// Verify supplier matches purchase order
	if grn.SupplierID != po.SupplierID {
		return nil, errors.New("supplier must match purchase order supplier")
	}
	
	
	// Generate GRN number if not provided
	if grn.GRNNumber == "" {
		grnNumber, err := s.GenerateGRNNumber(ctx)
		if err != nil {
			return nil, err
		}
		grn.GRNNumber = grnNumber
	} else {
		// Check if GRN number already exists
		existing, _ := s.grnRepo.GetByGRNNumber(ctx, grn.GRNNumber)
		if existing != nil {
			return nil, ErrGRNExists
		}
	}
	
	// Set defaults
	if grn.Status == "" {
		grn.Status = models.GRNStatusDraft
	}
	if grn.Currency == "" {
		grn.Currency = po.Currency
	}
	if grn.TaxRate == 0 {
		grn.TaxRate = po.TaxRate
	}
	
	// Calculate totals
	if err := s.CalculateGRNTotals(ctx, grn); err != nil {
		return nil, err
	}
	
	if err := s.grnRepo.Create(ctx, grn); err != nil {
		return nil, fmt.Errorf("failed to create GRN: %w", err)
	}
	
	return grn, nil
}

func (s *service) GetGRNByID(ctx context.Context, id uuid.UUID) (*models.GRN, error) {
	grn, err := s.grnRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrGRNNotFound
	}
	return grn, nil
}

func (s *service) GetGRNByNumber(ctx context.Context, grnNumber string) (*models.GRN, error) {
	grn, err := s.grnRepo.GetByGRNNumber(ctx, grnNumber)
	if err != nil {
		return nil, ErrGRNNotFound
	}
	return grn, nil
}

func (s *service) UpdateGRN(ctx context.Context, grn *models.GRN) error {
	if err := s.ValidateGRN(ctx, grn, true); err != nil {
		return err
	}
	
	// Check if GRN exists
	existing, err := s.grnRepo.GetByID(ctx, grn.ID)
	if err != nil {
		return ErrGRNNotFound
	}
	
	// Cannot modify completed GRNs
	if existing.Status == models.GRNStatusCompleted {
		return errors.New("cannot modify completed GRN")
	}
	
	// Check if GRN number already exists (if changed)
	if grn.GRNNumber != existing.GRNNumber {
		existingGRN, _ := s.grnRepo.GetByGRNNumber(ctx, grn.GRNNumber)
		if existingGRN != nil && existingGRN.ID != grn.ID {
			return ErrGRNExists
		}
	}
	
	// Calculate totals
	if err := s.CalculateGRNTotals(ctx, grn); err != nil {
		return err
	}
	
	if err := s.grnRepo.Update(ctx, grn); err != nil {
		return fmt.Errorf("failed to update GRN: %w", err)
	}
	
	return nil
}

func (s *service) DeleteGRN(ctx context.Context, id uuid.UUID) error {
	// Check if GRN exists
	grn, err := s.grnRepo.GetByID(ctx, id)
	if err != nil {
		return ErrGRNNotFound
	}
	
	// Cannot delete completed GRNs
	if grn.Status == models.GRNStatusCompleted {
		return errors.New("cannot delete completed GRN")
	}
	
	if err := s.grnRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete GRN: %w", err)
	}
	
	return nil
}

func (s *service) ListGRNs(ctx context.Context, limit, offset int) ([]*models.GRN, error) {
	return s.grnRepo.List(ctx, limit, offset)
}

func (s *service) GetGRNsByPurchaseOrder(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.GRN, error) {
	return s.grnRepo.GetByPurchaseOrder(ctx, purchaseOrderID)
}

func (s *service) GetGRNsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.GRN, error) {
	return s.grnRepo.GetBySupplier(ctx, supplierID)
}

func (s *service) SearchGRNs(ctx context.Context, query string, limit, offset int) ([]*models.GRN, error) {
	if query == "" {
		return s.grnRepo.List(ctx, limit, offset)
	}
	return s.grnRepo.Search(ctx, query, limit, offset)
}

func (s *service) CountGRNs(ctx context.Context) (int64, error) {
	return s.grnRepo.Count(ctx)
}

// GRN Processing Operations

func (s *service) ProcessGRNReceipt(ctx context.Context, id uuid.UUID, receivedByID uuid.UUID) error {
	grn, err := s.grnRepo.GetByID(ctx, id)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status != models.GRNStatusDraft {
		return ErrInvalidStatus
	}
	
	grn.Status = models.GRNStatusReceived
	grn.ReceivedByID = receivedByID
	
	return s.grnRepo.Update(ctx, grn)
}

func (s *service) VerifyGRN(ctx context.Context, id uuid.UUID, verifierID uuid.UUID) error {
	grn, err := s.grnRepo.GetByID(ctx, id)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status != models.GRNStatusReceived {
		return ErrInvalidStatus
	}
	
	now := time.Now()
	grn.VerifiedByID = &verifierID
	grn.VerifiedAt = &now
	
	return s.grnRepo.Update(ctx, grn)
}

func (s *service) CompleteGRN(ctx context.Context, id uuid.UUID) error {
	grn, err := s.grnRepo.GetByID(ctx, id)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status != models.GRNStatusReceived {
		return ErrInvalidStatus
	}
	
	grn.Status = models.GRNStatusCompleted
	
	return s.grnRepo.Update(ctx, grn)
}

// GRN Item Operations

func (s *service) AddGRNItem(ctx context.Context, item *models.GRNItem) error {
	// Validate item
	if item.ReceivedQuantity < 0 || item.AcceptedQuantity < 0 || item.RejectedQuantity < 0 {
		return ErrInvalidQuantity
	}
	
	// Verify GRN exists and is modifiable
	grn, err := s.grnRepo.GetByID(ctx, item.GRNID)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status == models.GRNStatusCompleted {
		return errors.New("cannot modify completed GRN")
	}
	
	// Verify purchase order item exists
	poItem, err := s.purchaseOrderRepo.GetItemsByPurchaseOrderID(ctx, grn.PurchaseOrderID)
	if err != nil {
		return errors.New("purchase order items not found")
	}
	
	found := false
	for _, poi := range poItem {
		if poi.ID == item.PurchaseOrderItemID {
			found = true
			item.OrderedQuantity = poi.Quantity
			break
		}
	}
	
	if !found {
		return errors.New("purchase order item not found")
	}
	
	// Validate received quantity doesn't exceed ordered
	if item.ReceivedQuantity > item.OrderedQuantity {
		return ErrQuantityExceedsOrdered
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.AcceptedQuantity) * item.UnitPrice
	
	if err := s.grnRepo.CreateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to add GRN item: %w", err)
	}
	
	// Recalculate GRN totals
	grn.Items = nil // Clear items to force reload
	return s.CalculateGRNTotals(ctx, grn)
}

func (s *service) UpdateGRNItem(ctx context.Context, item *models.GRNItem) error {
	// Validate item
	if item.ReceivedQuantity < 0 || item.AcceptedQuantity < 0 || item.RejectedQuantity < 0 {
		return ErrInvalidQuantity
	}
	
	// Verify GRN exists and is modifiable
	grn, err := s.grnRepo.GetByID(ctx, item.GRNID)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status == models.GRNStatusCompleted {
		return errors.New("cannot modify completed GRN")
	}
	
	// Validate received quantity doesn't exceed ordered
	if item.ReceivedQuantity > item.OrderedQuantity {
		return ErrQuantityExceedsOrdered
	}
	
	// Calculate item total
	item.TotalPrice = float64(item.AcceptedQuantity) * item.UnitPrice
	
	if err := s.grnRepo.UpdateItem(ctx, item); err != nil {
		return fmt.Errorf("failed to update GRN item: %w", err)
	}
	
	// Recalculate GRN totals
	grn.Items = nil // Clear items to force reload
	return s.CalculateGRNTotals(ctx, grn)
}

func (s *service) RemoveGRNItem(ctx context.Context, id uuid.UUID) error {
	// Get item to find GRN
	items, err := s.grnRepo.GetItemsByGRNID(ctx, uuid.Nil) // This is a workaround
	if err != nil {
		return ErrItemNotFound
	}
	
	var grnID uuid.UUID
	found := false
	for _, item := range items {
		if item.ID == id {
			grnID = item.GRNID
			found = true
			break
		}
	}
	
	if !found {
		return ErrItemNotFound
	}
	
	// Verify GRN is modifiable
	grn, err := s.grnRepo.GetByID(ctx, grnID)
	if err != nil {
		return ErrGRNNotFound
	}
	
	if grn.Status == models.GRNStatusCompleted {
		return errors.New("cannot modify completed GRN")
	}
	
	if err := s.grnRepo.DeleteItem(ctx, id); err != nil {
		return fmt.Errorf("failed to remove GRN item: %w", err)
	}
	
	// Recalculate GRN totals
	grn.Items = nil // Clear items to force reload
	return s.CalculateGRNTotals(ctx, grn)
}

func (s *service) GetGRNItems(ctx context.Context, grnID uuid.UUID) ([]*models.GRNItem, error) {
	return s.grnRepo.GetItemsByGRNID(ctx, grnID)
}

// Business Logic Operations

func (s *service) CalculatePurchaseOrderTotals(ctx context.Context, po *models.PurchaseOrder) error {
	if po.Items == nil || len(po.Items) == 0 {
		items, err := s.purchaseOrderRepo.GetItemsByPurchaseOrderID(ctx, po.ID)
		if err != nil {
			return err
		}
		// Convert pointer slice to value slice
		po.Items = make([]models.PurchaseOrderItem, len(items))
		for i, item := range items {
			po.Items[i] = *item
		}
	}
	
	var subTotal float64 = 0
	var totalDiscount float64 = 0
	
	for _, item := range po.Items {
		itemTotal := float64(item.Quantity) * item.UnitPrice
		subTotal += itemTotal
		totalDiscount += item.DiscountAmount
	}
	
	po.SubTotal = subTotal
	po.DiscountAmount = totalDiscount
	
	discountedSubTotal := subTotal - totalDiscount
	po.TaxAmount = discountedSubTotal * (po.TaxRate / 100)
	po.TotalAmount = discountedSubTotal + po.TaxAmount + po.ShippingCost
	
	return s.purchaseOrderRepo.Update(ctx, po)
}

func (s *service) CalculateGRNTotals(ctx context.Context, grn *models.GRN) error {
	if grn.Items == nil || len(grn.Items) == 0 {
		items, err := s.grnRepo.GetItemsByGRNID(ctx, grn.ID)
		if err != nil {
			return err
		}
		// Convert pointer slice to value slice
		grn.Items = make([]models.GRNItem, len(items))
		for i, item := range items {
			grn.Items[i] = *item
		}
	}
	
	var subTotal float64 = 0
	
	for _, item := range grn.Items {
		subTotal += item.TotalPrice
	}
	
	po, err := s.purchaseOrderRepo.GetByID(ctx, grn.PurchaseOrderID)
	if err != nil {
		return err
	}
	
	grn.SubTotal = subTotal
	grn.DiscountAmount = po.DiscountAmount * (subTotal / po.SubTotal) // Proportional discount
	
	discountedSubTotal := subTotal - grn.DiscountAmount
	grn.TaxAmount = discountedSubTotal * (grn.TaxRate / 100)
	grn.TotalAmount = discountedSubTotal + grn.TaxAmount
	
	return s.grnRepo.Update(ctx, grn)
}

func (s *service) GeneratePONumber(ctx context.Context) (string, error) {
	prefix := fmt.Sprintf("PO%s", time.Now().Format("200601"))
	
	for i := 1; i <= 9999; i++ {
		poNumber := fmt.Sprintf("%s%04d", prefix, i)
		
		_, err := s.purchaseOrderRepo.GetByPONumber(ctx, poNumber)
		if err != nil {
			return poNumber, nil
		}
	}
	
	return "", errors.New("unable to generate unique PO number")
}

func (s *service) GenerateGRNNumber(ctx context.Context) (string, error) {
	prefix := fmt.Sprintf("GRN%s", time.Now().Format("200601"))
	
	for i := 1; i <= 9999; i++ {
		grnNumber := fmt.Sprintf("%s%04d", prefix, i)
		
		_, err := s.grnRepo.GetByGRNNumber(ctx, grnNumber)
		if err != nil {
			return grnNumber, nil
		}
	}
	
	return "", errors.New("unable to generate unique GRN number")
}

func (s *service) ValidatePurchaseOrder(ctx context.Context, po *models.PurchaseOrder, isUpdate bool) error {
	if po == nil {
		return ErrInvalidInput
	}
	
	// Validate required fields
	if po.SupplierID == uuid.Nil {
		return errors.New("supplier ID is required")
	}
	
	if po.CreatedByID == uuid.Nil {
		return errors.New("created by ID is required")
	}
	
	if po.OrderDate.IsZero() {
		return errors.New("order date is required")
	}
	
	// Validate field lengths
	if len(po.PONumber) > 50 {
		return errors.New("PO number must be less than 50 characters")
	}
	
	if len(po.Notes) > 1000 {
		return errors.New("notes must be less than 1000 characters")
	}
	
	if len(po.Terms) > 1000 {
		return errors.New("terms must be less than 1000 characters")
	}
	
	if len(po.Reference) > 100 {
		return errors.New("reference must be less than 100 characters")
	}
	
	if len(po.Currency) > 3 {
		return errors.New("currency must be 3 characters")
	}
	
	// Validate amounts
	if po.SubTotal < 0 {
		return errors.New("subtotal cannot be negative")
	}
	
	if po.TaxAmount < 0 {
		return errors.New("tax amount cannot be negative")
	}
	
	if po.TaxRate < 0 || po.TaxRate > 100 {
		return errors.New("tax rate must be between 0 and 100")
	}
	
	if po.ShippingCost < 0 {
		return errors.New("shipping cost cannot be negative")
	}
	
	if po.DiscountAmount < 0 {
		return errors.New("discount amount cannot be negative")
	}
	
	if po.TotalAmount < 0 {
		return errors.New("total amount cannot be negative")
	}
	
	return nil
}

func (s *service) ValidateGRN(ctx context.Context, grn *models.GRN, isUpdate bool) error {
	if grn == nil {
		return ErrInvalidInput
	}
	
	// Validate required fields
	if grn.PurchaseOrderID == uuid.Nil {
		return errors.New("purchase order ID is required")
	}
	
	if grn.SupplierID == uuid.Nil {
		return errors.New("supplier ID is required")
	}
	
	if grn.ReceivedByID == uuid.Nil {
		return errors.New("received by ID is required")
	}
	
	if grn.ReceivedDate.IsZero() {
		return errors.New("received date is required")
	}
	
	// Validate field lengths
	if len(grn.GRNNumber) > 50 {
		return errors.New("GRN number must be less than 50 characters")
	}
	
	if len(grn.DeliveryNote) > 100 {
		return errors.New("delivery note must be less than 100 characters")
	}
	
	if len(grn.InvoiceNumber) > 100 {
		return errors.New("invoice number must be less than 100 characters")
	}
	
	if len(grn.VehicleNumber) > 50 {
		return errors.New("vehicle number must be less than 50 characters")
	}
	
	if len(grn.DriverName) > 100 {
		return errors.New("driver name must be less than 100 characters")
	}
	
	if len(grn.QualityNotes) > 1000 {
		return errors.New("quality notes must be less than 1000 characters")
	}
	
	if len(grn.Notes) > 1000 {
		return errors.New("notes must be less than 1000 characters")
	}
	
	if len(grn.Currency) > 3 {
		return errors.New("currency must be 3 characters")
	}
	
	// Validate amounts
	if grn.SubTotal < 0 {
		return errors.New("subtotal cannot be negative")
	}
	
	if grn.TaxAmount < 0 {
		return errors.New("tax amount cannot be negative")
	}
	
	if grn.TaxRate < 0 || grn.TaxRate > 100 {
		return errors.New("tax rate must be between 0 and 100")
	}
	
	if grn.DiscountAmount < 0 {
		return errors.New("discount amount cannot be negative")
	}
	
	if grn.TotalAmount < 0 {
		return errors.New("total amount cannot be negative")
	}
	
	return nil
}

// Analytics and Reporting

func (s *service) GetPurchaseOrderSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	orders, err := s.purchaseOrderRepo.GetByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}
	
	summary := map[string]interface{}{
		"total_orders":     len(orders),
		"total_value":      0.0,
		"draft_orders":     0,
		"pending_orders":   0,
		"approved_orders":  0,
		"ordered_orders":   0,
		"received_orders":  0,
		"cancelled_orders": 0,
	}
	
	var totalValue float64 = 0
	statusCounts := make(map[string]int)
	
	for _, order := range orders {
		totalValue += order.TotalAmount
		statusCounts[string(order.Status)]++
	}
	
	summary["total_value"] = totalValue
	summary["draft_orders"] = statusCounts["draft"]
	summary["pending_orders"] = statusCounts["pending"]
	summary["approved_orders"] = statusCounts["approved"]
	summary["ordered_orders"] = statusCounts["ordered"]
	summary["received_orders"] = statusCounts["received"]
	summary["cancelled_orders"] = statusCounts["cancelled"]
	
	return summary, nil
}

func (s *service) GetGRNSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	grns, err := s.grnRepo.GetByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}
	
	summary := map[string]interface{}{
		"total_grns":       len(grns),
		"total_value":      0.0,
		"draft_grns":       0,
		"received_grns":    0,
		"partial_grns":     0,
		"completed_grns":   0,
		"cancelled_grns":   0,
	}
	
	var totalValue float64 = 0
	statusCounts := make(map[string]int)
	
	for _, grn := range grns {
		totalValue += grn.TotalAmount
		statusCounts[string(grn.Status)]++
	}
	
	summary["total_value"] = totalValue
	summary["draft_grns"] = statusCounts["draft"]
	summary["received_grns"] = statusCounts["received"]
	summary["partial_grns"] = statusCounts["partial"]
	summary["completed_grns"] = statusCounts["completed"]
	summary["cancelled_grns"] = statusCounts["cancelled"]
	
	return summary, nil
}

func (s *service) GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	// Get purchase orders for supplier in date range
	orders, err := s.purchaseOrderRepo.GetBySupplier(ctx, supplierID)
	if err != nil {
		return nil, err
	}
	
	// Filter by date range
	filteredOrders := []*models.PurchaseOrder{}
	for _, order := range orders {
		if order.OrderDate.After(startDate) && order.OrderDate.Before(endDate) {
			filteredOrders = append(filteredOrders, order)
		}
	}
	
	// Get GRNs for supplier in date range
	grns, err := s.grnRepo.GetBySupplier(ctx, supplierID)
	if err != nil {
		return nil, err
	}
	
	// Filter by date range
	filteredGRNs := []*models.GRN{}
	for _, grn := range grns {
		if grn.ReceivedDate.After(startDate) && grn.ReceivedDate.Before(endDate) {
			filteredGRNs = append(filteredGRNs, grn)
		}
	}
	
	performance := map[string]interface{}{
		"supplier_id":        supplierID,
		"period_start":       startDate,
		"period_end":         endDate,
		"total_orders":       len(filteredOrders),
		"total_grns":         len(filteredGRNs),
		"total_order_value":  0.0,
		"total_grn_value":    0.0,
		"delivery_rate":      0.0,
		"on_time_deliveries": 0,
		"late_deliveries":    0,
	}
	
	var totalOrderValue float64 = 0
	var totalGRNValue float64 = 0
	onTime := 0
	late := 0
	
	for _, order := range filteredOrders {
		totalOrderValue += order.TotalAmount
		
		// Check delivery performance
		if order.DeliveryDate != nil && order.ExpectedDate != nil {
			if order.DeliveryDate.Before(*order.ExpectedDate) || order.DeliveryDate.Equal(*order.ExpectedDate) {
				onTime++
			} else {
				late++
			}
		}
	}
	
	for _, grn := range filteredGRNs {
		totalGRNValue += grn.TotalAmount
	}
	
	performance["total_order_value"] = totalOrderValue
	performance["total_grn_value"] = totalGRNValue
	performance["on_time_deliveries"] = onTime
	performance["late_deliveries"] = late
	
	if len(filteredOrders) > 0 {
		performance["delivery_rate"] = float64(len(filteredGRNs)) / float64(len(filteredOrders)) * 100
	}
	
	return performance, nil
}