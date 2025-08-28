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
	ErrLocationNotFound     = errors.New("location not found")
)

type Service interface {
	CreateInventory(ctx context.Context, productID, locationID uuid.UUID, initialQuantity, reorderLevel, maxLevel int) (*models.Inventory, error)
	GetInventory(ctx context.Context, productID, locationID uuid.UUID) (*models.Inventory, error)
	UpdateStock(ctx context.Context, productID, locationID uuid.UUID, quantity int, userID uuid.UUID, notes string) error
	AdjustStock(ctx context.Context, productID, locationID uuid.UUID, adjustment int, userID uuid.UUID, notes string) error
	ReserveStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error
	ReleaseReservedStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error
	TransferStock(ctx context.Context, productID, fromLocationID, toLocationID uuid.UUID, quantity int, userID uuid.UUID, notes string) error
	GetLowStock(ctx context.Context) ([]*models.Inventory, error)
	GetZeroStock(ctx context.Context) ([]*models.Inventory, error)
	GetInventoryByProduct(ctx context.Context, productID uuid.UUID) ([]*models.Inventory, error)
	GetInventoryByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.Inventory, error)
	GetTotalStockByProduct(ctx context.Context, productID uuid.UUID) (int, error)
	UpdateReorderLevels(ctx context.Context, productID, locationID uuid.UUID, reorderLevel, maxLevel int) error
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

func (s *service) CreateInventory(ctx context.Context, productID, locationID uuid.UUID, initialQuantity, reorderLevel, maxLevel int) (*models.Inventory, error) {
	if initialQuantity < 0 || reorderLevel < 0 || maxLevel < 0 {
		return nil, ErrInvalidQuantity
	}

	_, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return nil, ErrProductNotFound
	}

	// Skip location validation - using default hardware store location

	existing, _ := s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
	if existing != nil {
		return nil, ErrInventoryExists
	}

	inventory := &models.Inventory{
		ProductID:    productID,
		LocationID:   &locationID,
		Quantity:     initialQuantity,
		ReorderLevel: reorderLevel,
		MaxLevel:     maxLevel,
	}

	if err := s.inventoryRepo.Create(ctx, inventory); err != nil {
		return nil, err
	}

	return inventory, nil
}

func (s *service) GetInventory(ctx context.Context, productID, locationID uuid.UUID) (*models.Inventory, error) {
	return s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
}

func (s *service) UpdateStock(ctx context.Context, productID, locationID uuid.UUID, quantity int, userID uuid.UUID, notes string) error {
	if quantity < 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
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
			LocationID:   locationID,
			MovementType: movementType,
			Quantity:     movementQuantity,
			UserID:       userID,
			Notes:        notes,
		}

		return s.stockMovementRepo.Create(ctx, movement)
	}

	return nil
}

func (s *service) AdjustStock(ctx context.Context, productID, locationID uuid.UUID, adjustment int, userID uuid.UUID, notes string) error {
	inventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
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
			LocationID:   locationID,
			MovementType: movementType,
			Quantity:     movementQuantity,
			UserID:       userID,
			Notes:        notes,
		}

		return s.stockMovementRepo.Create(ctx, movement)
	}

	return nil
}

func (s *service) ReserveStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
	if err != nil {
		return ErrInventoryNotFound
	}

	if inventory.AvailableQuantity() < quantity {
		return ErrInsufficientStock
	}

	return s.inventoryRepo.ReserveStock(ctx, productID, locationID, quantity)
}

func (s *service) ReleaseReservedStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	return s.inventoryRepo.ReleaseReservedStock(ctx, productID, locationID, quantity)
}

func (s *service) TransferStock(ctx context.Context, productID, fromLocationID, toLocationID uuid.UUID, quantity int, userID uuid.UUID, notes string) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	fromInventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, fromLocationID)
	if err != nil {
		return fmt.Errorf("source inventory not found: %w", err)
	}

	if fromInventory.AvailableQuantity() < quantity {
		return ErrInsufficientStock
	}

	toInventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, toLocationID)
	if err != nil {
		toInventory = &models.Inventory{
			ProductID:  productID,
			LocationID: &toLocationID,
			Quantity:   0,
		}
		if err := s.inventoryRepo.Create(ctx, toInventory); err != nil {
			return err
		}
	}

	fromInventory.Quantity -= quantity
	toInventory.Quantity += quantity

	if err := s.inventoryRepo.Update(ctx, fromInventory); err != nil {
		return err
	}

	if err := s.inventoryRepo.Update(ctx, toInventory); err != nil {
		return err
	}

	referenceID := uuid.New().String()

	outMovement := &models.StockMovement{
		ProductID:    productID,
		LocationID:   fromLocationID,
		MovementType: models.MovementTRANSFER,
		Quantity:     quantity,
		ReferenceID:  referenceID,
		UserID:       userID,
		Notes:        fmt.Sprintf("Transfer OUT to location %s: %s", toLocationID, notes),
	}

	inMovement := &models.StockMovement{
		ProductID:    productID,
		LocationID:   toLocationID,
		MovementType: models.MovementTRANSFER,
		Quantity:     quantity,
		ReferenceID:  referenceID,
		UserID:       userID,
		Notes:        fmt.Sprintf("Transfer IN from location %s: %s", fromLocationID, notes),
	}

	if err := s.stockMovementRepo.Create(ctx, outMovement); err != nil {
		return err
	}

	return s.stockMovementRepo.Create(ctx, inMovement)
}

func (s *service) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetLowStock(ctx)
}

func (s *service) GetZeroStock(ctx context.Context) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetZeroStock(ctx)
}

func (s *service) GetInventoryByProduct(ctx context.Context, productID uuid.UUID) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetByProduct(ctx, productID)
}

func (s *service) GetInventoryByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.Inventory, error) {
	return s.inventoryRepo.GetByLocation(ctx, locationID)
}

func (s *service) GetTotalStockByProduct(ctx context.Context, productID uuid.UUID) (int, error) {
	return s.inventoryRepo.GetTotalQuantityByProduct(ctx, productID)
}

func (s *service) UpdateReorderLevels(ctx context.Context, productID, locationID uuid.UUID, reorderLevel, maxLevel int) error {
	if reorderLevel < 0 || maxLevel < 0 {
		return ErrInvalidQuantity
	}

	inventory, err := s.inventoryRepo.GetByProductAndLocation(ctx, productID, locationID)
	if err != nil {
		return ErrInventoryNotFound
	}

	inventory.ReorderLevel = reorderLevel
	inventory.MaxLevel = maxLevel

	return s.inventoryRepo.Update(ctx, inventory)
}