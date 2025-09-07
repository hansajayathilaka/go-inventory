package sale

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrSaleNotFound             = errors.New("sale not found")
	ErrSaleExists               = errors.New("sale already exists")
	ErrInvalidInput             = errors.New("invalid input data")
	ErrInsufficientItems        = errors.New("no items in sale")
	ErrItemNotFound             = errors.New("item not found")
	ErrInvalidQuantity          = errors.New("invalid quantity")
	ErrInsufficientStock        = errors.New("insufficient stock available")
	ErrInvalidDiscountAmount    = errors.New("invalid discount amount")
	ErrInvalidDiscountPercent   = errors.New("invalid discount percentage")
	ErrProductNotFound          = errors.New("product not found")
	ErrCustomerNotFound         = errors.New("customer not found")
	ErrUserNotFound             = errors.New("user (cashier) not found")
	ErrInvalidPaymentAmount     = errors.New("invalid payment amount")
	ErrExceedsTotal             = errors.New("payment amount exceeds sale total")
	ErrUnsupportedPaymentMethod = errors.New("unsupported payment method")
)

type Service interface {
	// Sale operations
	CreateSale(ctx context.Context, sale *models.Sale) (*models.Sale, error)
	GetSaleByID(ctx context.Context, id uuid.UUID) (*models.Sale, error)
	GetSaleByBillNumber(ctx context.Context, billNumber string) (*models.Sale, error)
	UpdateSale(ctx context.Context, sale *models.Sale) error
	DeleteSale(ctx context.Context, id uuid.UUID) error
	ListSales(ctx context.Context, limit, offset int) ([]*models.Sale, int64, error)
	GetSalesByCustomer(ctx context.Context, customerID uuid.UUID, limit, offset int) ([]*models.Sale, int64, error)
	GetSalesByCashier(ctx context.Context, cashierID uuid.UUID, limit, offset int) ([]*models.Sale, int64, error)
	GetSalesByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Sale, int64, error)
	SearchSales(ctx context.Context, billNumber, customerName string, startDate, endDate *time.Time, cashierID *uuid.UUID, limit, offset int) ([]*models.Sale, int64, error)

	// Sale item operations
	CreateSaleItem(ctx context.Context, item *models.SaleItem) (*models.SaleItem, error)
	GetSaleItem(ctx context.Context, itemID uuid.UUID) (*models.SaleItem, error)
	GetSaleItemsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error)
	UpdateSaleItem(ctx context.Context, item *models.SaleItem) error
	DeleteSaleItem(ctx context.Context, itemID uuid.UUID) error

	// Payment operations
	CreatePayment(ctx context.Context, payment *models.Payment) (*models.Payment, error)
	GetPaymentsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error)
	UpdatePayment(ctx context.Context, payment *models.Payment) error
	DeletePayment(ctx context.Context, paymentID uuid.UUID) error
	ProcessSalePayment(ctx context.Context, saleID uuid.UUID, payments []*models.Payment) error
	GetSalePaymentStatus(ctx context.Context, saleID uuid.UUID) (map[string]interface{}, error)

	// Business logic operations
	GenerateBillNumber(ctx context.Context) (string, error)
	CalculateSaleTotals(ctx context.Context, sale *models.Sale) error
	CalculateItemDiscount(baseAmount, discountPercentage, discountAmount float64) (float64, float64)
	CalculateBillDiscount(itemsTotal, discountPercentage, discountAmount float64) (float64, float64)
	CalculateItemProfit(unitCost, unitPrice, discountAmount, quantity float64) float64
	ValidateSale(ctx context.Context, sale *models.Sale, isUpdate bool) error
	ValidateSaleItem(ctx context.Context, item *models.SaleItem, isUpdate bool) error
	ValidatePayment(ctx context.Context, payment *models.Payment, isUpdate bool) error

	// Stock and inventory integration
	ProcessStockReduction(ctx context.Context, saleItem *models.SaleItem) error
	ValidateStockAvailability(ctx context.Context, productID uuid.UUID, quantity int) error
	GetProductCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error)

	// Analytics and reporting
	GetSalesSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetCustomerSalesHistory(ctx context.Context, customerID uuid.UUID, limit, offset int) (map[string]interface{}, error)
	GetCashierPerformance(ctx context.Context, cashierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error)
	GetSalesStatistics(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetProfitAnalysis(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error)
	GetTopSellingProducts(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error)
}

type service struct {
	saleRepo          interfaces.SaleRepository
	saleItemRepo      interfaces.SaleItemRepository
	paymentRepo       interfaces.PaymentRepository
	productRepo       interfaces.ProductRepository
	customerRepo      interfaces.CustomerRepository
	userRepo          interfaces.UserRepository
	inventoryRepo     interfaces.InventoryRepository
	stockBatchRepo    interfaces.StockBatchRepository
	stockMovementRepo interfaces.StockMovementRepository
}

func NewService(
	saleRepo interfaces.SaleRepository,
	saleItemRepo interfaces.SaleItemRepository,
	paymentRepo interfaces.PaymentRepository,
	productRepo interfaces.ProductRepository,
	customerRepo interfaces.CustomerRepository,
	userRepo interfaces.UserRepository,
	inventoryRepo interfaces.InventoryRepository,
	stockBatchRepo interfaces.StockBatchRepository,
	stockMovementRepo interfaces.StockMovementRepository,
) Service {
	return &service{
		saleRepo:          saleRepo,
		saleItemRepo:      saleItemRepo,
		paymentRepo:       paymentRepo,
		productRepo:       productRepo,
		customerRepo:      customerRepo,
		userRepo:          userRepo,
		inventoryRepo:     inventoryRepo,
		stockBatchRepo:    stockBatchRepo,
		stockMovementRepo: stockMovementRepo,
	}
}

// Sale Operations

func (s *service) CreateSale(ctx context.Context, sale *models.Sale) (*models.Sale, error) {
	if err := s.ValidateSale(ctx, sale, false); err != nil {
		return nil, err
	}

	// Generate bill number if not provided
	if sale.BillNumber == "" {
		billNumber, err := s.GenerateBillNumber(ctx)
		if err != nil {
			return nil, err
		}
		sale.BillNumber = billNumber
	}

	// Set sale date if not provided
	if sale.SaleDate.IsZero() {
		sale.SaleDate = time.Now()
	}

	if err := s.saleRepo.Create(ctx, sale); err != nil {
		return nil, err
	}

	return sale, nil
}

func (s *service) GetSaleByID(ctx context.Context, id uuid.UUID) (*models.Sale, error) {
	sale, err := s.saleRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrSaleNotFound
	}
	return sale, nil
}

func (s *service) GetSaleByBillNumber(ctx context.Context, billNumber string) (*models.Sale, error) {
	sale, err := s.saleRepo.GetByBillNumber(ctx, billNumber)
	if err != nil {
		return nil, ErrSaleNotFound
	}
	return sale, nil
}

func (s *service) UpdateSale(ctx context.Context, sale *models.Sale) error {
	if err := s.ValidateSale(ctx, sale, true); err != nil {
		return err
	}

	return s.saleRepo.Update(ctx, sale)
}

func (s *service) DeleteSale(ctx context.Context, id uuid.UUID) error {
	// Check if sale exists
	_, err := s.GetSaleByID(ctx, id)
	if err != nil {
		return err
	}

	return s.saleRepo.Delete(ctx, id)
}

func (s *service) ListSales(ctx context.Context, limit, offset int) ([]*models.Sale, int64, error) {
	return s.saleRepo.List(ctx, offset, limit)
}

func (s *service) GetSalesByCustomer(ctx context.Context, customerID uuid.UUID, limit, offset int) ([]*models.Sale, int64, error) {
	return s.saleRepo.GetByCustomer(ctx, customerID, offset, limit)
}

func (s *service) GetSalesByCashier(ctx context.Context, cashierID uuid.UUID, limit, offset int) ([]*models.Sale, int64, error) {
	return s.saleRepo.GetByCashier(ctx, cashierID, offset, limit)
}

func (s *service) GetSalesByDateRange(ctx context.Context, startDate, endDate time.Time, limit, offset int) ([]*models.Sale, int64, error) {
	return s.saleRepo.GetByDateRange(ctx, startDate, endDate, offset, limit)
}

func (s *service) SearchSales(ctx context.Context, billNumber, customerName string, startDate, endDate *time.Time, cashierID *uuid.UUID, limit, offset int) ([]*models.Sale, int64, error) {
	return s.saleRepo.Search(ctx, billNumber, customerName, startDate, endDate, cashierID, offset, limit)
}

// Sale Item Operations

func (s *service) CreateSaleItem(ctx context.Context, item *models.SaleItem) (*models.SaleItem, error) {
	if err := s.ValidateSaleItem(ctx, item, false); err != nil {
		return nil, err
	}

	// Validate stock availability
	if err := s.ValidateStockAvailability(ctx, item.ProductID, item.Quantity); err != nil {
		return nil, err
	}

	// Get product cost from stock batches
	unitCost, err := s.GetProductCost(ctx, item.ProductID, item.Quantity)
	if err != nil {
		return nil, err
	}
	item.UnitCost = unitCost

	// Calculate line total with discounts
	discountAmount, lineTotal := s.CalculateItemDiscount(
		item.UnitPrice*float64(item.Quantity),
		item.ItemDiscountPercentage,
		item.ItemDiscountAmount,
	)
	item.ItemDiscountAmount = discountAmount
	item.LineTotal = lineTotal

	if err := s.saleItemRepo.Create(ctx, item); err != nil {
		return nil, err
	}

	// Process stock reduction
	if err := s.ProcessStockReduction(ctx, item); err != nil {
		return nil, err
	}

	// Recalculate sale totals
	sale, err := s.GetSaleByID(ctx, item.SaleID)
	if err != nil {
		return nil, err
	}
	if err := s.CalculateSaleTotals(ctx, sale); err != nil {
		return nil, err
	}

	return item, nil
}

func (s *service) GetSaleItem(ctx context.Context, itemID uuid.UUID) (*models.SaleItem, error) {
	return s.saleItemRepo.GetByID(ctx, itemID)
}

func (s *service) GetSaleItemsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.SaleItem, error) {
	return s.saleItemRepo.GetBySale(ctx, saleID)
}

func (s *service) UpdateSaleItem(ctx context.Context, item *models.SaleItem) error {
	if err := s.ValidateSaleItem(ctx, item, true); err != nil {
		return err
	}

	// Calculate line total with discounts
	discountAmount, lineTotal := s.CalculateItemDiscount(
		item.UnitPrice*float64(item.Quantity),
		item.ItemDiscountPercentage,
		item.ItemDiscountAmount,
	)
	item.ItemDiscountAmount = discountAmount
	item.LineTotal = lineTotal

	if err := s.saleItemRepo.Update(ctx, item); err != nil {
		return err
	}

	// Recalculate sale totals
	sale, err := s.GetSaleByID(ctx, item.SaleID)
	if err != nil {
		return err
	}
	return s.CalculateSaleTotals(ctx, sale)
}

func (s *service) DeleteSaleItem(ctx context.Context, itemID uuid.UUID) error {
	item, err := s.GetSaleItem(ctx, itemID)
	if err != nil {
		return err
	}

	if err := s.saleItemRepo.Delete(ctx, itemID); err != nil {
		return err
	}

	// Recalculate sale totals
	sale, err := s.GetSaleByID(ctx, item.SaleID)
	if err != nil {
		return err
	}
	return s.CalculateSaleTotals(ctx, sale)
}

// Payment Operations

func (s *service) CreatePayment(ctx context.Context, payment *models.Payment) (*models.Payment, error) {
	if err := s.ValidatePayment(ctx, payment, false); err != nil {
		return nil, err
	}

	if err := s.paymentRepo.Create(ctx, payment); err != nil {
		return nil, err
	}

	return payment, nil
}

func (s *service) GetPaymentsBySale(ctx context.Context, saleID uuid.UUID) ([]*models.Payment, error) {
	return s.paymentRepo.GetBySale(ctx, saleID)
}

func (s *service) UpdatePayment(ctx context.Context, payment *models.Payment) error {
	if err := s.ValidatePayment(ctx, payment, true); err != nil {
		return err
	}

	return s.paymentRepo.Update(ctx, payment)
}

func (s *service) DeletePayment(ctx context.Context, paymentID uuid.UUID) error {
	return s.paymentRepo.Delete(ctx, paymentID)
}

func (s *service) ProcessSalePayment(ctx context.Context, saleID uuid.UUID, payments []*models.Payment) error {
	// Validate all payments first
	var totalPaymentAmount float64
	for _, payment := range payments {
		payment.SaleID = saleID
		if err := s.ValidatePayment(ctx, payment, false); err != nil {
			return err
		}
		totalPaymentAmount += payment.Amount
	}

	// Get sale to check total
	sale, err := s.GetSaleByID(ctx, saleID)
	if err != nil {
		return err
	}

	if totalPaymentAmount > sale.TotalAmount {
		return ErrExceedsTotal
	}

	// Create all payments
	for _, payment := range payments {
		if err := s.paymentRepo.Create(ctx, payment); err != nil {
			return err
		}
	}

	return nil
}

func (s *service) GetSalePaymentStatus(ctx context.Context, saleID uuid.UUID) (map[string]interface{}, error) {
	sale, err := s.GetSaleByID(ctx, saleID)
	if err != nil {
		return nil, err
	}

	payments, err := s.GetPaymentsBySale(ctx, saleID)
	if err != nil {
		return nil, err
	}

	var totalPaid float64
	paymentsByMethod := make(map[string]float64)
	
	for _, payment := range payments {
		totalPaid += payment.Amount
		paymentsByMethod[string(payment.Method)] += payment.Amount
	}

	balance := sale.TotalAmount - totalPaid
	isFullyPaid := balance <= 0.01 // Allow for small floating point differences

	return map[string]interface{}{
		"sale_id":            saleID,
		"bill_number":        sale.BillNumber,
		"total_amount":       sale.TotalAmount,
		"total_paid":         totalPaid,
		"balance":            balance,
		"is_fully_paid":      isFullyPaid,
		"payments_count":     len(payments),
		"payments_by_method": paymentsByMethod,
	}, nil
}

// Business Logic Operations

func (s *service) GenerateBillNumber(ctx context.Context) (string, error) {
	return s.saleRepo.GenerateBillNumber(ctx)
}

func (s *service) CalculateSaleTotals(ctx context.Context, sale *models.Sale) error {
	// Get all items for the sale
	items, err := s.GetSaleItemsBySale(ctx, sale.ID)
	if err != nil {
		return err
	}

	var itemsTotal float64
	for _, item := range items {
		itemsTotal += item.LineTotal
	}

	// Apply bill-level discounts
	discountAmount, total := s.CalculateBillDiscount(
		itemsTotal,
		sale.BillDiscountPercentage,
		sale.BillDiscountAmount,
	)
	
	sale.BillDiscountAmount = discountAmount
	sale.TotalAmount = total

	return s.saleRepo.Update(ctx, sale)
}

func (s *service) CalculateItemDiscount(baseAmount, discountPercentage, discountAmount float64) (float64, float64) {
	if discountPercentage < 0 || discountPercentage > 100 {
		discountPercentage = 0
	}
	if discountAmount < 0 {
		discountAmount = 0
	}

	var finalDiscountAmount float64
	var total float64

	// Apply percentage discount first
	if discountPercentage > 0 {
		finalDiscountAmount = baseAmount * (discountPercentage / 100)
		total = baseAmount - finalDiscountAmount
	} else {
		total = baseAmount
	}

	// Apply fixed discount amount (additional to percentage)
	if discountAmount > 0 {
		finalDiscountAmount += discountAmount
		total -= discountAmount
	}

	// Ensure total is not negative
	if total < 0 {
		total = 0
		finalDiscountAmount = baseAmount
	}

	return finalDiscountAmount, total
}

func (s *service) CalculateBillDiscount(itemsTotal, discountPercentage, discountAmount float64) (float64, float64) {
	return s.CalculateItemDiscount(itemsTotal, discountPercentage, discountAmount)
}

func (s *service) CalculateItemProfit(unitCost, unitPrice, discountAmount, quantity float64) float64 {
	// Calculate total cost and revenue
	totalCost := unitCost * quantity
	totalRevenue := (unitPrice * quantity) - discountAmount
	
	profit := totalRevenue - totalCost
	return math.Max(0, profit) // Ensure profit is not negative
}

func (s *service) ValidateSale(ctx context.Context, sale *models.Sale, isUpdate bool) error {
	if sale == nil {
		return ErrInvalidInput
	}

	// Validate cashier exists
	if _, err := s.userRepo.GetByID(ctx, sale.CashierID); err != nil {
		return ErrUserNotFound
	}

	// Validate customer if provided
	if sale.CustomerID != nil {
		if _, err := s.customerRepo.GetByID(ctx, *sale.CustomerID); err != nil {
			return ErrCustomerNotFound
		}
	}

	// Validate discounts
	if sale.BillDiscountPercentage < 0 || sale.BillDiscountPercentage > 100 {
		return ErrInvalidDiscountPercent
	}
	if sale.BillDiscountAmount < 0 {
		return ErrInvalidDiscountAmount
	}

	// Check bill number uniqueness for new sales
	if !isUpdate && sale.BillNumber != "" {
		existing, err := s.saleRepo.GetByBillNumber(ctx, sale.BillNumber)
		if err == nil && existing != nil {
			return ErrSaleExists
		}
	}

	return nil
}

func (s *service) ValidateSaleItem(ctx context.Context, item *models.SaleItem, isUpdate bool) error {
	if item == nil {
		return ErrInvalidInput
	}

	// Validate quantity
	if item.Quantity <= 0 {
		return ErrInvalidQuantity
	}

	// Validate unit price
	if item.UnitPrice < 0 {
		return ErrInvalidInput
	}

	// Validate product exists
	if _, err := s.productRepo.GetByID(ctx, item.ProductID); err != nil {
		return ErrProductNotFound
	}

	// Validate sale exists
	if _, err := s.GetSaleByID(ctx, item.SaleID); err != nil {
		return err
	}

	// Validate discounts
	if item.ItemDiscountPercentage < 0 || item.ItemDiscountPercentage > 100 {
		return ErrInvalidDiscountPercent
	}
	if item.ItemDiscountAmount < 0 {
		return ErrInvalidDiscountAmount
	}

	return nil
}

func (s *service) ValidatePayment(ctx context.Context, payment *models.Payment, isUpdate bool) error {
	if payment == nil {
		return ErrInvalidInput
	}

	// Validate amount
	if payment.Amount <= 0 {
		return ErrInvalidPaymentAmount
	}

	// Validate payment method
	validMethods := map[models.PaymentMethod]bool{
		models.PaymentMethodCash:         true,
		models.PaymentMethodCard:         true,
		models.PaymentMethodBankTransfer: true,
		models.PaymentMethodEWallet:      true,
		models.PaymentMethodCheck:        true,
	}
	if !validMethods[payment.Method] {
		return ErrUnsupportedPaymentMethod
	}

	// Validate sale exists and check payment limits
	sale, err := s.GetSaleByID(ctx, payment.SaleID)
	if err != nil {
		return err
	}

	// Check total payments don't exceed sale total
	currentPayments, err := s.GetPaymentsBySale(ctx, payment.SaleID)
	if err != nil {
		return err
	}

	var totalPaid float64
	for _, p := range currentPayments {
		if !isUpdate || p.ID != payment.ID {
			totalPaid += p.Amount
		}
	}

	if totalPaid+payment.Amount > sale.TotalAmount {
		return ErrExceedsTotal
	}

	return nil
}

// Stock and Inventory Integration

func (s *service) ProcessStockReduction(ctx context.Context, saleItem *models.SaleItem) error {
	// Get current inventory
	inventory, err := s.inventoryRepo.GetByProduct(ctx, saleItem.ProductID)
	if err != nil {
		return err
	}

	// Reduce stock using FIFO method
	remainingQuantity := saleItem.Quantity
	batches, err := s.stockBatchRepo.GetActiveByProduct(ctx, saleItem.ProductID)
	if err != nil {
		return err
	}

	for _, batch := range batches {
		if remainingQuantity <= 0 {
			break
		}

		quantityFromBatch := remainingQuantity
		if quantityFromBatch > batch.AvailableQuantity {
			quantityFromBatch = batch.AvailableQuantity
		}

		// Create stock movement record
		movement := &models.StockMovement{
			ProductID:     saleItem.ProductID,
			BatchID:       &batch.ID,
			MovementType:  models.MovementSALE,
			Quantity:      quantityFromBatch,
			ReferenceID:   saleItem.ID.String(),
			ReferenceType: "sale_item",
			UserID:        uuid.Nil, // TODO: Get from context
			Notes:         fmt.Sprintf("Sale item ID: %s", saleItem.ID),
		}

		if err := s.stockMovementRepo.Create(ctx, movement); err != nil {
			return err
		}

		// Update batch available quantity
		batch.AvailableQuantity -= quantityFromBatch
		if err := s.stockBatchRepo.Update(ctx, batch); err != nil {
			return err
		}

		remainingQuantity -= quantityFromBatch
	}

	// Update inventory totals
	inventory.Quantity -= saleItem.Quantity
	return s.inventoryRepo.Update(ctx, inventory)
}

func (s *service) ValidateStockAvailability(ctx context.Context, productID uuid.UUID, quantity int) error {
	inventory, err := s.inventoryRepo.GetByProduct(ctx, productID)
	if err != nil {
		return err
	}

	if inventory.AvailableQuantity() < quantity {
		return ErrInsufficientStock
	}

	return nil
}

func (s *service) GetProductCost(ctx context.Context, productID uuid.UUID, quantity int) (float64, error) {
	// Get stock batches using FIFO
	batches, err := s.stockBatchRepo.GetActiveByProduct(ctx, productID)
	if err != nil {
		return 0, err
	}

	var totalCost float64
	var totalQuantity int
	remainingNeeded := quantity

	for _, batch := range batches {
		if remainingNeeded <= 0 {
			break
		}

		quantityFromBatch := remainingNeeded
		if quantityFromBatch > batch.AvailableQuantity {
			quantityFromBatch = batch.AvailableQuantity
		}

		totalCost += batch.CostPrice * float64(quantityFromBatch)
		totalQuantity += quantityFromBatch
		remainingNeeded -= quantityFromBatch
	}

	if totalQuantity == 0 {
		return 0, nil
	}

	return totalCost / float64(totalQuantity), nil
}

// Analytics and Reporting

func (s *service) GetSalesSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	stats, err := s.saleRepo.GetStatsByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// Get profit data
	profit, err := s.saleRepo.GetProfitByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	stats["total_profit"] = profit
	return stats, nil
}

func (s *service) GetCustomerSalesHistory(ctx context.Context, customerID uuid.UUID, limit, offset int) (map[string]interface{}, error) {
	sales, total, err := s.GetSalesByCustomer(ctx, customerID, limit, offset)
	if err != nil {
		return nil, err
	}

	var totalAmount float64
	for _, sale := range sales {
		totalAmount += sale.TotalAmount
	}

	return map[string]interface{}{
		"customer_id":    customerID,
		"sales":          sales,
		"total_records":  total,
		"total_amount":   totalAmount,
		"average_amount": totalAmount / float64(len(sales)),
	}, nil
}

func (s *service) GetCashierPerformance(ctx context.Context, cashierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	sales, _, err := s.GetSalesByCashier(ctx, cashierID, 1000, 0) // Get all sales for the period
	if err != nil {
		return nil, err
	}

	// Filter by date range
	var filteredSales []*models.Sale
	var totalAmount float64
	for _, sale := range sales {
		if sale.SaleDate.After(startDate) && sale.SaleDate.Before(endDate) {
			filteredSales = append(filteredSales, sale)
			totalAmount += sale.TotalAmount
		}
	}

	var averageAmount float64
	if len(filteredSales) > 0 {
		averageAmount = totalAmount / float64(len(filteredSales))
	}

	return map[string]interface{}{
		"cashier_id":      cashierID,
		"period_start":    startDate,
		"period_end":      endDate,
		"total_sales":     len(filteredSales),
		"total_amount":    totalAmount,
		"average_amount":  averageAmount,
	}, nil
}

func (s *service) GetSalesStatistics(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	return s.GetSalesSummary(ctx, startDate, endDate)
}

func (s *service) GetProfitAnalysis(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	totalProfit, err := s.saleRepo.GetProfitByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	count, totalRevenue, err := s.saleRepo.GetSalesVolume(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}

	var profitMargin float64
	if totalRevenue > 0 {
		profitMargin = (totalProfit / totalRevenue) * 100
	}

	return map[string]interface{}{
		"period_start":    startDate,
		"period_end":      endDate,
		"total_sales":     count,
		"total_revenue":   totalRevenue,
		"total_profit":    totalProfit,
		"profit_margin":   profitMargin,
		"average_profit":  totalProfit / float64(count),
	}, nil
}

func (s *service) GetTopSellingProducts(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error) {
	// This would require a more complex query, implementing basic structure
	return []map[string]interface{}{}, nil
}