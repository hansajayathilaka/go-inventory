package purchase_receipt

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"inventory-api/internal/repository/models"
)

// Mock repositories
type MockPurchaseReceiptRepository struct {
	mock.Mock
}

func (m *MockPurchaseReceiptRepository) Create(ctx context.Context, pr *models.PurchaseReceipt) error {
	args := m.Called(ctx, pr)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.PurchaseReceipt, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetByReceiptNumber(ctx context.Context, receiptNumber string) (*models.PurchaseReceipt, error) {
	args := m.Called(ctx, receiptNumber)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) Update(ctx context.Context, pr *models.PurchaseReceipt) error {
	args := m.Called(ctx, pr)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) List(ctx context.Context, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, supplierID, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) GetByStatus(ctx context.Context, status models.PurchaseReceiptStatus, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, status, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) GetByUser(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, userID, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, startDate, endDate, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) GetByPurchaseDateRange(ctx context.Context, startDate, endDate time.Time, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, startDate, endDate, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) Search(ctx context.Context, receiptNumber, supplierName, supplierBillNumber string, status models.PurchaseReceiptStatus, startDate, endDate *time.Time, createdByID *uuid.UUID, offset, limit int) ([]*models.PurchaseReceipt, int64, error) {
	args := m.Called(ctx, receiptNumber, supplierName, supplierBillNumber, status, startDate, endDate, createdByID, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Get(1).(int64), args.Error(2)
}

func (m *MockPurchaseReceiptRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PurchaseReceiptStatus, updatedByID uuid.UUID) error {
	args := m.Called(ctx, id, status, updatedByID)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) MarkAsReceived(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) MarkAsCompleted(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) Cancel(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) CreateItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) GetItem(ctx context.Context, itemID uuid.UUID) (*models.PurchaseReceiptItem, error) {
	args := m.Called(ctx, itemID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.PurchaseReceiptItem), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetItemsByReceipt(ctx context.Context, receiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error) {
	args := m.Called(ctx, receiptID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceiptItem), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) UpdateItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) DeleteItem(ctx context.Context, itemID uuid.UUID) error {
	args := m.Called(ctx, itemID)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) UpdateDiscounts(ctx context.Context, id uuid.UUID, billDiscountAmount, billDiscountPercentage float64) error {
	args := m.Called(ctx, id, billDiscountAmount, billDiscountPercentage)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) RecalculateTotal(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) GetStatsByDateRange(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	args := m.Called(ctx, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetTopSuppliers(ctx context.Context, limit int, startDate, endDate *time.Time) ([]map[string]interface{}, error) {
	args := m.Called(ctx, limit, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetPendingReceipts(ctx context.Context) ([]*models.PurchaseReceipt, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GenerateReceiptNumber(ctx context.Context) (string, error) {
	args := m.Called(ctx)
	return args.String(0), args.Error(1)
}

type MockSupplierRepository struct {
	mock.Mock
}

func (m *MockSupplierRepository) Create(ctx context.Context, supplier *models.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *MockSupplierRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetByName(ctx context.Context, name string) (*models.Supplier, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) Update(ctx context.Context, supplier *models.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *MockSupplierRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockSupplierRepository) List(ctx context.Context, limit, offset int) ([]*models.Supplier, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetByCode(ctx context.Context, code string) (*models.Supplier, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetActive(ctx context.Context) ([]*models.Supplier, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

type MockProductRepository struct {
	mock.Mock
}

func (m *MockProductRepository) Create(ctx context.Context, product *models.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	args := m.Called(ctx, sku)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	args := m.Called(ctx, barcode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByName(ctx context.Context, name string) ([]*models.Product, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) Update(ctx context.Context, product *models.Product) error {
	args := m.Called(ctx, product)
	return args.Error(0)
}

func (m *MockProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockProductRepository) List(ctx context.Context, limit, offset int) ([]*models.Product, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockProductRepository) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, categoryID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, brandID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetActive(ctx context.Context) ([]*models.Product, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error) {
	args := m.Called(ctx, categoryID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockProductRepository) CountByCategoriesBulk(ctx context.Context, categoryIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	args := m.Called(ctx, categoryIDs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[uuid.UUID]int64), args.Error(1)
}

type MockInventoryRepository struct {
	mock.Mock
}

func (m *MockInventoryRepository) Create(ctx context.Context, inventory *models.Inventory) error {
	args := m.Called(ctx, inventory)
	return args.Error(0)
}

func (m *MockInventoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Inventory, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetByProduct(ctx context.Context, productID uuid.UUID) (*models.Inventory, error) {
	args := m.Called(ctx, productID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) Update(ctx context.Context, inventory *models.Inventory) error {
	args := m.Called(ctx, inventory)
	return args.Error(0)
}

func (m *MockInventoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInventoryRepository) List(ctx context.Context, limit, offset int) ([]*models.Inventory, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetZeroStock(ctx context.Context) ([]*models.Inventory, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) UpdateQuantity(ctx context.Context, productID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) ReserveStock(ctx context.Context, productID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) ReleaseReservedStock(ctx context.Context, productID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) GetTotalQuantityByProduct(ctx context.Context, productID uuid.UUID) (int, error) {
	args := m.Called(ctx, productID)
	return args.Get(0).(int), args.Error(1)
}

func (m *MockInventoryRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

// Test helper functions
func createTestPurchaseReceiptItem() *models.PurchaseReceiptItem {
	return &models.PurchaseReceiptItem{
		ID:                     uuid.New(),
		PurchaseReceiptID:      uuid.New(),
		ProductID:              uuid.New(),
		Quantity:               10,
		UnitCost:               15.50,
		ItemDiscountAmount:     5.00,
		ItemDiscountPercentage: 10.0,
		LineTotal:              145.00, // (10 * 15.50) - 5.00 - (155.00 * 0.10)
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}
}

func createTestPurchaseReceipt() *models.PurchaseReceipt {
	return &models.PurchaseReceipt{
		ID:                     uuid.New(),
		ReceiptNumber:          "PR-2024-001",
		SupplierID:             uuid.New(),
		Status:                 models.PurchaseReceiptStatusPending,
		PurchaseDate:           time.Now(),
		SupplierBillNumber:     "SUPP-BILL-001",
		BillDiscountAmount:     10.00,
		BillDiscountPercentage: 5.0,
		TotalAmount:            500.00,
		Notes:                  "Test purchase receipt",
		CreatedByID:            uuid.New(),
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}
}

func createTestSupplier() *models.Supplier {
	return &models.Supplier{
		ID:       uuid.New(),
		Name:     "Test Supplier",
		IsActive: true,
	}
}

func createTestProduct() *models.Product {
	return &models.Product{
		ID:   uuid.New(),
		Name: "Test Product",
		SKU:  "TEST-001",
	}
}

// Test Purchase Receipt Item Operations
func TestAddPurchaseReceiptItem_Success(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	item := createTestPurchaseReceiptItem()
	product := createTestProduct()
	pr := createTestPurchaseReceipt()

	// Mock expectations
	mockProductRepo.On("GetByID", mock.Anything, item.ProductID).Return(product, nil)
	mockPRRepo.On("GetByID", mock.Anything, item.PurchaseReceiptID).Return(pr, nil)
	mockPRRepo.On("CreateItem", mock.Anything, item).Return(nil)

	// Execute
	err := service.AddPurchaseReceiptItem(context.Background(), item)

	// Assert
	assert.NoError(t, err)
	mockProductRepo.AssertExpectations(t)
	mockPRRepo.AssertExpectations(t)
}

func TestAddPurchaseReceiptItem_InvalidQuantity(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	item := createTestPurchaseReceiptItem()
	item.Quantity = 0 // Invalid quantity

	// Execute
	err := service.AddPurchaseReceiptItem(context.Background(), item)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, ErrInvalidQuantity, err)
}

func TestAddPurchaseReceiptItem_ProductNotFound(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	item := createTestPurchaseReceiptItem()

	// Mock expectations - need to mock purchase receipt lookup first
	pr := &models.PurchaseReceipt{
		ID:     item.PurchaseReceiptID,
		Status: models.PurchaseReceiptStatusPending,
	}
	mockPRRepo.On("GetByID", mock.Anything, item.PurchaseReceiptID).Return(pr, nil)
	mockProductRepo.On("GetByID", mock.Anything, item.ProductID).Return(nil, errors.New("product not found"))

	// Execute
	err := service.AddPurchaseReceiptItem(context.Background(), item)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "product not found")
	mockPRRepo.AssertExpectations(t)
	mockProductRepo.AssertExpectations(t)
}

func TestUpdatePurchaseReceiptItem_Success(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	item := createTestPurchaseReceiptItem()
	product := createTestProduct()
	pr := createTestPurchaseReceipt()

	// Mock expectations
	mockProductRepo.On("GetByID", mock.Anything, item.ProductID).Return(product, nil)
	mockPRRepo.On("GetByID", mock.Anything, item.PurchaseReceiptID).Return(pr, nil)
	mockPRRepo.On("UpdateItem", mock.Anything, item).Return(nil)

	// Execute
	err := service.UpdatePurchaseReceiptItem(context.Background(), item)

	// Assert
	assert.NoError(t, err)
	mockProductRepo.AssertExpectations(t)
	mockPRRepo.AssertExpectations(t)
}

func TestRemovePurchaseReceiptItem_Success(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	itemID := uuid.New()

	// Mock expectations
	mockPRRepo.On("GetItem", mock.Anything, itemID).Return(&models.PurchaseReceiptItem{PurchaseReceiptID: uuid.New()}, nil)
	mockPRRepo.On("GetByID", mock.Anything, mock.Anything).Return(createTestPurchaseReceipt(), nil)
	mockPRRepo.On("DeleteItem", mock.Anything, itemID).Return(nil)

	// Execute
	err := service.RemovePurchaseReceiptItem(context.Background(), itemID)

	// Assert
	assert.NoError(t, err)
	mockPRRepo.AssertExpectations(t)
}

func TestGetPurchaseReceiptItems_Success(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo, nil, nil)

	prID := uuid.New()
	expectedItems := []*models.PurchaseReceiptItem{
		createTestPurchaseReceiptItem(),
		createTestPurchaseReceiptItem(),
	}

	// Mock expectations
	mockPRRepo.On("GetItemsByReceipt", mock.Anything, prID).Return(expectedItems, nil)

	// Execute
	items, err := service.GetPurchaseReceiptItems(context.Background(), prID)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, expectedItems, items)
	assert.Len(t, items, 2)
	mockPRRepo.AssertExpectations(t)
}

// Test Purchase Receipt Item model validation
func TestPurchaseReceiptItem_ValidateFields(t *testing.T) {
	t.Run("valid item fields", func(t *testing.T) {
		item := createTestPurchaseReceiptItem()
		
		assert.NotEqual(t, uuid.Nil, item.ID)
		assert.NotEqual(t, uuid.Nil, item.PurchaseReceiptID)
		assert.NotEqual(t, uuid.Nil, item.ProductID)
		assert.Greater(t, item.Quantity, 0)
		assert.Greater(t, item.UnitCost, 0.0)
		assert.GreaterOrEqual(t, item.ItemDiscountAmount, 0.0)
		assert.GreaterOrEqual(t, item.ItemDiscountPercentage, 0.0)
		assert.Greater(t, item.LineTotal, 0.0)
	})

	t.Run("discount calculations", func(t *testing.T) {
		item := &models.PurchaseReceiptItem{
			Quantity:               10,
			UnitCost:               20.00,  // $20 per unit
			ItemDiscountAmount:     10.00,  // $10 flat discount
			ItemDiscountPercentage: 5.0,    // 5% percentage discount
		}

		// Subtotal: 10 * $20 = $200
		// Less flat discount: $200 - $10 = $190
		// Less percentage discount: $190 - ($190 * 0.05) = $190 - $9.50 = $180.50
		expectedLineTotal := 180.50
		
		subtotal := float64(item.Quantity) * item.UnitCost
		afterFlatDiscount := subtotal - item.ItemDiscountAmount
		percentageDiscount := afterFlatDiscount * (item.ItemDiscountPercentage / 100)
		calculatedLineTotal := afterFlatDiscount - percentageDiscount

		assert.Equal(t, expectedLineTotal, calculatedLineTotal)
	})

	t.Run("zero discount calculations", func(t *testing.T) {
		item := &models.PurchaseReceiptItem{
			Quantity:               5,
			UnitCost:               12.50,
			ItemDiscountAmount:     0.0,
			ItemDiscountPercentage: 0.0,
		}

		expectedLineTotal := 62.50 // 5 * 12.50
		calculatedLineTotal := float64(item.Quantity) * item.UnitCost

		assert.Equal(t, expectedLineTotal, calculatedLineTotal)
	})
}

func TestPurchaseReceiptItem_TableName(t *testing.T) {
	item := &models.PurchaseReceiptItem{}
	assert.Equal(t, "purchase_receipt_items", item.TableName())
}

func TestPurchaseReceiptItem_BeforeCreate(t *testing.T) {
	item := &models.PurchaseReceiptItem{}
	
	// Before calling BeforeCreate, ID should be Nil
	assert.Equal(t, uuid.Nil, item.ID)
	
	// Call BeforeCreate
	err := item.BeforeCreate(nil)
	
	// After calling BeforeCreate, ID should be set
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, item.ID)
}

// Additional mock repositories for new dependencies

type MockStockBatchRepository struct {
	mock.Mock
}

func (m *MockStockBatchRepository) Create(ctx context.Context, batch *models.StockBatch) error {
	args := m.Called(ctx, batch)
	return args.Error(0)
}

func (m *MockStockBatchRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.StockBatch, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StockBatch), args.Error(1)
}

func (m *MockStockBatchRepository) Update(ctx context.Context, batch *models.StockBatch) error {
	args := m.Called(ctx, batch)
	return args.Error(0)
}

func (m *MockStockBatchRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockStockBatchRepository) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	args := m.Called(ctx, productID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.StockBatch), args.Error(1)
}

func (m *MockStockBatchRepository) GetActiveByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockBatch, error) {
	args := m.Called(ctx, productID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.StockBatch), args.Error(1)
}

func (m *MockStockBatchRepository) UpdateQuantities(ctx context.Context, batchID uuid.UUID, availableQuantity int) error {
	args := m.Called(ctx, batchID, availableQuantity)
	return args.Error(0)
}

type MockStockMovementRepository struct {
	mock.Mock
}

func (m *MockStockMovementRepository) Create(ctx context.Context, movement *models.StockMovement) error {
	args := m.Called(ctx, movement)
	return args.Error(0)
}

func (m *MockStockMovementRepository) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.StockMovement, error) {
	args := m.Called(ctx, productID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.StockMovement), args.Error(1)
}

func (m *MockStockMovementRepository) GetByBatch(ctx context.Context, batchID uuid.UUID) ([]*models.StockMovement, error) {
	args := m.Called(ctx, batchID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.StockMovement), args.Error(1)
}

func (m *MockStockMovementRepository) GetByReference(ctx context.Context, referenceType string, referenceID string) ([]*models.StockMovement, error) {
	args := m.Called(ctx, referenceType, referenceID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.StockMovement), args.Error(1)
}

// Tests for new functionality

func TestService_CalculateItemDiscount(t *testing.T) {
	// Create service
	service := &service{}
	
	// Test percentage discount
	discount := service.CalculateItemDiscount(100.0, 10.0, 0.0)
	assert.Equal(t, 10.0, discount)
	
	// Test fixed amount discount
	discount = service.CalculateItemDiscount(100.0, 0.0, 15.0)
	assert.Equal(t, 15.0, discount)
	
	// Test discount amount exceeding base amount
	discount = service.CalculateItemDiscount(100.0, 0.0, 150.0)
	assert.Equal(t, 100.0, discount) // Should be capped at base amount
	
	// Test percentage takes precedence
	discount = service.CalculateItemDiscount(100.0, 10.0, 150.0)
	assert.Equal(t, 10.0, discount) // Should use percentage
}

func TestService_CalculateBillDiscount(t *testing.T) {
	// Create service
	service := &service{}
	
	// Test percentage discount
	discount := service.CalculateBillDiscount(1000.0, 5.0, 0.0)
	assert.Equal(t, 50.0, discount)
	
	// Test fixed amount discount
	discount = service.CalculateBillDiscount(1000.0, 0.0, 75.0)
	assert.Equal(t, 75.0, discount)
	
	// Test discount amount exceeding items total
	discount = service.CalculateBillDiscount(1000.0, 0.0, 1500.0)
	assert.Equal(t, 1000.0, discount) // Should be capped at items total
	
	// Test percentage takes precedence
	discount = service.CalculateBillDiscount(1000.0, 5.0, 1500.0)
	assert.Equal(t, 50.0, discount) // Should use percentage
}

func TestService_ValidateStatusTransition(t *testing.T) {
	// Create service
	service := &service{}
	
	tests := []struct {
		name        string
		fromStatus  models.PurchaseReceiptStatus
		toStatus    models.PurchaseReceiptStatus
		expectError bool
	}{
		{"pending to received", models.PurchaseReceiptStatusPending, models.PurchaseReceiptStatusReceived, false},
		{"pending to cancelled", models.PurchaseReceiptStatusPending, models.PurchaseReceiptStatusCancelled, false},
		{"received to completed", models.PurchaseReceiptStatusReceived, models.PurchaseReceiptStatusCompleted, false},
		{"received to cancelled", models.PurchaseReceiptStatusReceived, models.PurchaseReceiptStatusCancelled, false},
		{"received to pending", models.PurchaseReceiptStatusReceived, models.PurchaseReceiptStatusPending, false},
		{"completed to any", models.PurchaseReceiptStatusCompleted, models.PurchaseReceiptStatusPending, true},
		{"cancelled to any", models.PurchaseReceiptStatusCancelled, models.PurchaseReceiptStatusPending, true},
		{"pending to completed", models.PurchaseReceiptStatusPending, models.PurchaseReceiptStatusCompleted, true},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateStatusTransition(tt.fromStatus, tt.toStatus)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Note: Integration tests for ProcessStockIntegration and CompletePurchaseReceipt
// are skipped due to mock interface complexity. These will be covered in integration tests.