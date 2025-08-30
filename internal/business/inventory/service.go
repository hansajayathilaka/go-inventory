package inventory

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrInventoryNotFound    = errors.New("inventory record not found")
	ErrInsufficientStock    = errors.New("insufficient stock")
	ErrInvalidQuantity      = errors.New("invalid quantity")
	ErrInventoryExists      = errors.New("inventory record already exists")
	ErrProductNotFound      = errors.New("product not found")
	ErrGRNNotFound          = errors.New("grn not found")
	ErrGRNItemNotFound      = errors.New("grn item not found")
	ErrGRNStockAlreadyUpdated = errors.New("grn stock already updated")
	ErrGRNStockNotUpdated   = errors.New("grn stock not yet updated")
	ErrInvalidGRNStatus     = errors.New("invalid grn status for stock operation")
)

type Service interface {
	CreateInventory(ctx context.Context, productID uuid.UUID, initialQuantity, reorderLevel, maxLevel int) (*models.Inventory, error)
	GetInventory(ctx context.Context, productID uuid.UUID) (*models.Inventory, error)
	UpdateStock(ctx context.Context, productID uuid.UUID, quantity int, userID uuid.UUID, notes string) error
	AdjustStock(ctx context.Context, productID uuid.UUID, adjustment int, userID uuid.UUID, notes string) error
	ReserveStock(ctx context.Context, productID uuid.UUID, quantity int) error
	ReleaseReservedStock(ctx context.Context, productID uuid.UUID, quantity int) error
	GetLowStock(ctx context.Context) ([]*models.Inventory, error)
	GetZeroStock(ctx context.Context) ([]*models.Inventory, error)
	GetInventoryByProduct(ctx context.Context, productID uuid.UUID) (*models.Inventory, error)
	GetTotalStockByProduct(ctx context.Context, productID uuid.UUID) (int, error)
	UpdateReorderLevels(ctx context.Context, productID uuid.UUID, reorderLevel, maxLevel int) error
	
	// GRN Integration methods
	ProcessGRNStockUpdate(ctx context.Context, grn *models.GRN, userID uuid.UUID) error
	ProcessGRNItemStock(ctx context.Context, grnItem *models.GRNItem, userID uuid.UUID, notes string) error
	ReverseGRNStockUpdate(ctx context.Context, grn *models.GRN, userID uuid.UUID) error
	ValidateGRNStockCapacity(ctx context.Context, grn *models.GRN) error
}

type service struct {
	inventoryRepo     interfaces.InventoryRepository
	stockMovementRepo interfaces.StockMovementRepository
	productRepo       interfaces.ProductRepository
}

func NewService(
	inventoryRepo interfaces.InventoryRepository,
	stockMovementRepo interfaces.StockMovementRepository,
	productRepo interfaces.ProductRepository,
) Service {
	return &service{
		inventoryRepo:     inventoryRepo,
		stockMovementRepo: stockMovementRepo,
		productRepo:       productRepo,
	}
}

func (s *service) CreateInventory(ctx context.Context, productID uuid.UUID, initialQuantity, reorderLevel, maxLevel int) (*models.Inventory, error) {
	if initialQuantity < 0 || reorderLevel < 0 || maxLevel < 0 {
		return nil, ErrInvalidQuantity
	}

	_, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	existing, _ := s.inventoryRepo.GetByProduct(ctx, productID)
	if existing != nil {
		return nil, ErrInventoryExists
	}

	inventory := &models.Inventory{
		ProductID:    productID,
		Quantity:     initialQuantity,
		ReorderLevel: reorderLevel,
		MaxLevel:     maxLevel,
	}

	if err := s.inventoryRepo.Create(ctx, inventory); err != nil {
		return nil, err
	}

	return inventory, nil
}

func (s *service) GetInventory(ctx context.Context, productID uuid.UUID) (*models.Inventory, error) {
	return s.inventoryRepo.GetByProduct(ctx, productID)
}

func (s *service) UpdateStock(ctx context.Context, productID uuid.UUID, quantity int, userID uuid.UUID, notes string) error {
	if quantity < 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return ErrInventoryNotFound
	}

	oldQuantity := inventory.Quantity
	inventory.Quantity = quantity

	if err := s.inventoryRepo.Update(ctx, inventory); err != nil {
		return err
	}

	movementType := models.MovementADJUSTMENT
	movementQuantity := quantity - oldQuantity

	if movementQuantity > 0 {
		movementType = models.MovementIN
	} else if movementQuantity < 0 {
		movementType = models.MovementOUT
		movementQuantity = -movementQuantity
	}

	if movementQuantity != 0 {
		movement := &models.StockMovement{
			ProductID:    productID,
			MovementType: movementType,
			Quantity:     movementQuantity,
			UserID:       userID,
			Notes:        notes,
		}

		return s.stockMovementRepo.Create(ctx, movement)
	}

	return nil
}

func (s *service) AdjustStock(ctx context.Context, productID uuid.UUID, adjustment int, userID uuid.UUID, notes string) error {
	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return ErrInventoryNotFound
	}

	newQuantity := inventory.Quantity + adjustment
	if newQuantity < 0 {
		return ErrInsufficientStock
	}

	inventory.Quantity = newQuantity

	if err := s.inventoryRepo.Update(ctx, inventory); err != nil {
		return err
	}

	movementType := models.MovementADJUSTMENT
	movementQuantity := adjustment

	if adjustment > 0 {
		movementType = models.MovementIN
	} else if adjustment < 0 {
		movementType = models.MovementOUT
		movementQuantity = -adjustment
	}

	if adjustment != 0 {
		movement := &models.StockMovement{
			ProductID:    productID,
			MovementType: movementType,
			Quantity:     movementQuantity,
			UserID:       userID,
			Notes:        notes,
		}

		return s.stockMovementRepo.Create(ctx, movement)
	}

	return nil
}

func (s *service) ReserveStock(ctx context.Context, productID uuid.UUID, quantity int) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return ErrInventoryNotFound
	}

	if inventory.AvailableQuantity() < quantity {
		return ErrInsufficientStock
	}

	return s.inventoryRepo.ReserveStock(ctx, productID, quantity)
}

func (s *service) ReleaseReservedStock(ctx context.Context, productID uuid.UUID, quantity int) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	return s.inventoryRepo.ReleaseReservedStock(ctx, productID, quantity)
}


func (s *service) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetLowStock(ctx)
}

func (s *service) GetZeroStock(ctx context.Context) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetZeroStock(ctx)
}

func (s *service) GetInventoryByProduct(ctx context.Context, productID uuid.UUID) (*models.Inventory, error) {
	return s.inventoryRepo.GetByProduct(ctx, productID)
}

func (s *service) GetTotalStockByProduct(ctx context.Context, productID uuid.UUID) (int, error) {
	return s.inventoryRepo.GetTotalQuantityByProduct(ctx, productID)
}

func (s *service) UpdateReorderLevels(ctx context.Context, productID uuid.UUID, reorderLevel, maxLevel int) error {
	if reorderLevel < 0 || maxLevel < 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return ErrInventoryNotFound
	}

	inventory.ReorderLevel = reorderLevel
	inventory.MaxLevel = maxLevel

	return s.inventoryRepo.Update(ctx, inventory)
}

// GRN Integration Methods

func (s *service) ProcessGRNStockUpdate(ctx context.Context, grn *models.GRN, userID uuid.UUID) error {
	if grn == nil {
		return ErrGRNNotFound
	}

	// Only allow stock updates for completed GRNs
	if grn.Status != models.GRNStatusCompleted {
		return ErrInvalidGRNStatus
	}

	// Check if stock is already updated to prevent double processing
	for _, item := range grn.Items {
		if item.StockUpdated {
			return ErrGRNStockAlreadyUpdated
		}
	}

	// Process each GRN item
	for i := range grn.Items {
		item := &grn.Items[i]
		
		// Only process items with accepted quantity > 0
		if item.AcceptedQuantity <= 0 {
			continue
		}

		err := s.ProcessGRNItemStock(ctx, item, userID, 
			fmt.Sprintf("GRN %s - %s", grn.GRNNumber, grn.DeliveryNote))
		if err != nil {
			return fmt.Errorf("failed to process GRN item %s: %w", item.ID, err)
		}
	}

	return nil
}

func (s *service) ProcessGRNItemStock(ctx context.Context, grnItem *models.GRNItem, userID uuid.UUID, notes string) error {
	if grnItem == nil {
		return ErrGRNItemNotFound
	}

	// Prevent double processing
	if grnItem.StockUpdated {
		return ErrGRNStockAlreadyUpdated
	}

	// Only process accepted quantity
	if grnItem.AcceptedQuantity <= 0 {
		return ErrInvalidQuantity
	}

	// Get or create inventory record
	inventory, err := s.inventoryRepo.GetByProduct(ctx, grnItem.ProductID)
	if err != nil {
		// Create new inventory record if it doesn't exist
		inventory = &models.Inventory{
			ProductID:    grnItem.ProductID,
			Quantity:     0,
			ReorderLevel: 10, // Default reorder level
			MaxLevel:     1000, // Default max level
		}
		if err := s.inventoryRepo.Create(ctx, inventory); err != nil {
			return fmt.Errorf("failed to create inventory record: %w", err)
		}
	}

	// Update inventory quantity
	inventory.Quantity += grnItem.AcceptedQuantity
	if err := s.inventoryRepo.Update(ctx, inventory); err != nil {
		return fmt.Errorf("failed to update inventory: %w", err)
	}

	// Create stock movement record
	movement := &models.StockMovement{
		ProductID:    grnItem.ProductID,
		MovementType: models.MovementIN,
		Quantity:     grnItem.AcceptedQuantity,
		ReferenceID:  grnItem.GRNID.String(),
		UserID:       userID,
		Notes:        fmt.Sprintf("%s - Batch: %s", notes, grnItem.BatchNumber),
	}

	if err := s.stockMovementRepo.Create(ctx, movement); err != nil {
		return fmt.Errorf("failed to create stock movement: %w", err)
	}

	return nil
}

func (s *service) ReverseGRNStockUpdate(ctx context.Context, grn *models.GRN, userID uuid.UUID) error {
	if grn == nil {
		return ErrGRNNotFound
	}

	// Only allow reversal for GRNs that have had their stock updated
	hasUpdatedStock := false
	for _, item := range grn.Items {
		if item.StockUpdated {
			hasUpdatedStock = true
			break
		}
	}
	
	if !hasUpdatedStock {
		return ErrGRNStockNotUpdated
	}

	// Process each GRN item in reverse
	for i := range grn.Items {
		item := &grn.Items[i]
		
		// Skip items that weren't previously updated
		if !item.StockUpdated || item.AcceptedQuantity <= 0 {
			continue
		}

		// Get inventory record
		inventory, err := s.inventoryRepo.GetByProduct(ctx, item.ProductID)
		if err != nil {
			return fmt.Errorf("inventory record not found for reversal: %w", err)
		}

		// Check if we have sufficient stock to reverse
		if inventory.Quantity < item.AcceptedQuantity {
			return fmt.Errorf("insufficient stock to reverse GRN item %s: have %d, need %d", 
				item.ID, inventory.Quantity, item.AcceptedQuantity)
		}

		// Update inventory quantity (subtract)
		inventory.Quantity -= item.AcceptedQuantity
		if err := s.inventoryRepo.Update(ctx, inventory); err != nil {
			return fmt.Errorf("failed to reverse inventory update: %w", err)
		}

		// Create reversal stock movement record
		movement := &models.StockMovement{
			ProductID:    item.ProductID,
			MovementType: models.MovementOUT,
			Quantity:     item.AcceptedQuantity,
			ReferenceID:  item.GRNID.String(),
			UserID:       userID,
			Notes:        fmt.Sprintf("GRN %s REVERSAL - %s", grn.GRNNumber, grn.Notes),
		}

		if err := s.stockMovementRepo.Create(ctx, movement); err != nil {
			return fmt.Errorf("failed to create reversal stock movement: %w", err)
		}
	}

	return nil
}

func (s *service) ValidateGRNStockCapacity(ctx context.Context, grn *models.GRN) error {
	if grn == nil {
		return ErrGRNNotFound
	}

	// Validate each GRN item against max levels
	for _, item := range grn.Items {
		if item.AcceptedQuantity <= 0 {
			continue
		}

		// Get current inventory
		inventory, err := s.inventoryRepo.GetByProduct(ctx, item.ProductID)
		if err != nil {
			// If no inventory exists, validation passes (will be created)
			continue
		}

		// Check if adding accepted quantity would exceed max level
		if inventory.MaxLevel > 0 {
			newQuantity := inventory.Quantity + item.AcceptedQuantity
			if newQuantity > inventory.MaxLevel {
				return fmt.Errorf("adding %d units of product %s would exceed max level %d (current: %d)", 
					item.AcceptedQuantity, item.ProductID, inventory.MaxLevel, inventory.Quantity)
			}
		}
	}

	return nil
}