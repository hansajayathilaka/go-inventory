package inventory

import (
	"context"
	"errors"

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

	// Batch tracking operations
	AllocateStock(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error)
	ConsumeStock(ctx context.Context, productID uuid.UUID, quantity int, method string, userID uuid.UUID, reference string, notes string) error
	GetAvailableBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error)
	CalculateStockValue(ctx context.Context, productID uuid.UUID) (float64, error)
	CalculateFIFOCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error)
	CalculateLIFOCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error)
	CalculateAverageCost(ctx context.Context, productID uuid.UUID) (float64, error)
	GetStockMovementsWithBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockMovement, error)
}

type service struct {
	inventoryRepo     interfaces.InventoryRepository
	stockMovementRepo interfaces.StockMovementRepository
	stockBatchRepo    interfaces.StockBatchRepository
	productRepo       interfaces.ProductRepository
}

func NewService(
	inventoryRepo interfaces.InventoryRepository,
	stockMovementRepo interfaces.StockMovementRepository,
	stockBatchRepo interfaces.StockBatchRepository,
	productRepo interfaces.ProductRepository,
) Service {
	return &service{
		inventoryRepo:     inventoryRepo,
		stockMovementRepo: stockMovementRepo,
		stockBatchRepo:    stockBatchRepo,
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
		// Calculate average cost for the movement
		avgCost, _ := s.stockBatchRepo.GetWeightedAverageCost(ctx, productID)
		
		movement := &models.StockMovement{
			ProductID:     productID,
			MovementType:  movementType,
			Quantity:      movementQuantity,
			UserID:        userID,
			Notes:         notes,
			UnitCost:      avgCost,
			TotalCost:     avgCost * float64(movementQuantity),
			ReferenceType: "INVENTORY_ADJUSTMENT",
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
		// Calculate average cost for the movement
		avgCost, _ := s.stockBatchRepo.GetWeightedAverageCost(ctx, productID)
		
		movement := &models.StockMovement{
			ProductID:     productID,
			MovementType:  movementType,
			Quantity:      movementQuantity,
			UserID:        userID,
			Notes:         notes,
			UnitCost:      avgCost,
			TotalCost:     avgCost * float64(movementQuantity),
			ReferenceType: "STOCK_ADJUSTMENT",
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

// AllocateStock allocates stock using FIFO/LIFO method without consuming it
func (s *service) AllocateStock(ctx context.Context, productID uuid.UUID, quantity int, method string) ([]*models.StockBatch, error) {
	if quantity <= 0 {
		return nil, ErrInvalidQuantity
	}

	if method != "FIFO" && method != "LIFO" {
		method = "FIFO" // Default to FIFO
	}

	return s.stockBatchRepo.AllocateStock(ctx, productID, quantity, method)
}

// ConsumeStock consumes stock from batches using FIFO/LIFO method and creates stock movement
func (s *service) ConsumeStock(ctx context.Context, productID uuid.UUID, quantity int, method string, userID uuid.UUID, reference string, notes string) error {
	if quantity <= 0 {
		return ErrInvalidQuantity
	}

	if method != "FIFO" && method != "LIFO" {
		method = "FIFO" // Default to FIFO
	}

	// Allocate the stock first to get batches
	allocatedBatches, err := s.stockBatchRepo.AllocateStock(ctx, productID, quantity, method)
	if err != nil {
		return err
	}

	if len(allocatedBatches) == 0 {
		return ErrInsufficientStock
	}

	// Calculate total available quantity from allocated batches
	totalAvailable := 0
	for _, batch := range allocatedBatches {
		totalAvailable += batch.AvailableQuantity
	}

	if totalAvailable < quantity {
		return ErrInsufficientStock
	}

	// Consume from each batch in order
	remainingQuantity := quantity
	totalCost := 0.0

	for _, batch := range allocatedBatches {
		if remainingQuantity <= 0 {
			break
		}

		quantityToConsume := min(remainingQuantity, batch.AvailableQuantity)
		
		// Consume from the batch
		if err := s.stockBatchRepo.ConsumeStock(ctx, batch.ID, quantityToConsume); err != nil {
			return err
		}

		// Calculate cost for this portion
		batchCost := batch.CostPrice * float64(quantityToConsume)
		totalCost += batchCost

		// Create stock movement record with batch tracking
		movement := &models.StockMovement{
			ProductID:     productID,
			BatchID:       &batch.ID,
			MovementType:  models.MovementOUT,
			Quantity:      quantityToConsume,
			ReferenceID:   reference,
			ReferenceType: "SALE",
			UserID:        userID,
			Notes:         notes,
			UnitCost:      batch.CostPrice,
			TotalCost:     batchCost,
		}

		if err := s.stockMovementRepo.Create(ctx, movement); err != nil {
			return err
		}

		remainingQuantity -= quantityToConsume
	}

	// Update inventory quantity
	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return ErrInventoryNotFound
	}

	inventory.Quantity -= quantity
	if inventory.Quantity < 0 {
		return ErrInsufficientStock
	}

	return s.inventoryRepo.Update(ctx, inventory)
}

// GetAvailableBatches returns all available batches for a product
func (s *service) GetAvailableBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	return s.stockBatchRepo.GetAvailableBatches(ctx, productID)
}

// CalculateStockValue calculates the total value of stock for a product
func (s *service) CalculateStockValue(ctx context.Context, productID uuid.UUID) (float64, error) {
	return s.stockBatchRepo.GetProductTotalValue(ctx, productID)
}

// CalculateFIFOCost calculates the cost of stock using FIFO method
func (s *service) CalculateFIFOCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error) {
	if quantity <= 0 {
		return 0, ErrInvalidQuantity
	}

	batches, err := s.stockBatchRepo.AllocateStock(ctx, productID, quantity, "FIFO")
	if err != nil {
		return 0, err
	}

	totalCost := 0.0
	remainingQuantity := quantity

	for _, batch := range batches {
		if remainingQuantity <= 0 {
			break
		}

		quantityFromBatch := min(remainingQuantity, batch.AvailableQuantity)
		totalCost += batch.CostPrice * float64(quantityFromBatch)
		remainingQuantity -= quantityFromBatch
	}

	return totalCost, nil
}

// CalculateLIFOCost calculates the cost of stock using LIFO method
func (s *service) CalculateLIFOCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error) {
	if quantity <= 0 {
		return 0, ErrInvalidQuantity
	}

	batches, err := s.stockBatchRepo.AllocateStock(ctx, productID, quantity, "LIFO")
	if err != nil {
		return 0, err
	}

	totalCost := 0.0
	remainingQuantity := quantity

	for _, batch := range batches {
		if remainingQuantity <= 0 {
			break
		}

		quantityFromBatch := min(remainingQuantity, batch.AvailableQuantity)
		totalCost += batch.CostPrice * float64(quantityFromBatch)
		remainingQuantity -= quantityFromBatch
	}

	return totalCost, nil
}

// CalculateAverageCost calculates the weighted average cost of stock for a product
func (s *service) CalculateAverageCost(ctx context.Context, productID uuid.UUID) (float64, error) {
	return s.stockBatchRepo.GetWeightedAverageCost(ctx, productID)
}

// GetStockMovementsWithBatches returns stock movements with batch information preloaded
func (s *service) GetStockMovementsWithBatches(ctx context.Context, productID uuid.UUID) ([]*models.StockMovement, error) {
	return s.stockMovementRepo.GetByProduct(ctx, productID, 1000, 0)
}

// min is a helper function to find the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

