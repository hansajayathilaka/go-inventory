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

func (m *MockPurchaseReceiptRepository) List(ctx context.Context, limit, offset int) ([]*models.PurchaseReceipt, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseReceipt, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) GetByStatus(ctx context.Context, status models.PurchaseReceiptStatus) ([]*models.PurchaseReceipt, error) {
	args := m.Called(ctx, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseReceipt, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceipt), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockPurchaseReceiptRepository) AddItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) UpdateItem(ctx context.Context, item *models.PurchaseReceiptItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) RemoveItem(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseReceiptRepository) GetItems(ctx context.Context, purchaseReceiptID uuid.UUID) ([]*models.PurchaseReceiptItem, error) {
	args := m.Called(ctx, purchaseReceiptID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.PurchaseReceiptItem), args.Error(1)
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

func (m *MockSupplierRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Supplier, error) {
	args := m.Called(ctx, query, limit, offset)
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

func (m *MockProductRepository) GetLowStockProducts(ctx context.Context, threshold int) ([]*models.Product, error) {
	args := m.Called(ctx, threshold)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Product), args.Error(1)
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

func (m *MockInventoryRepository) GetByProductID(ctx context.Context, productID uuid.UUID) (*models.Inventory, error) {
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

func (m *MockInventoryRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Inventory, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetLowStockItems(ctx context.Context, threshold int) ([]*models.Inventory, error) {
	args := m.Called(ctx, threshold)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) AdjustQuantity(ctx context.Context, productID uuid.UUID, quantity int, reason string) error {
	args := m.Called(ctx, productID, quantity, reason)
	return args.Error(0)
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

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

	item := createTestPurchaseReceiptItem()
	product := createTestProduct()
	pr := createTestPurchaseReceipt()

	// Mock expectations
	mockProductRepo.On("GetByID", mock.Anything, item.ProductID).Return(product, nil)
	mockPRRepo.On("GetByID", mock.Anything, item.PurchaseReceiptID).Return(pr, nil)
	mockPRRepo.On("AddItem", mock.Anything, item).Return(nil)

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

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

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

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

	item := createTestPurchaseReceiptItem()

	// Mock expectations
	mockProductRepo.On("GetByID", mock.Anything, item.ProductID).Return(nil, errors.New("product not found"))

	// Execute
	err := service.AddPurchaseReceiptItem(context.Background(), item)

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "product not found")
	mockProductRepo.AssertExpectations(t)
}

func TestUpdatePurchaseReceiptItem_Success(t *testing.T) {
	mockPRRepo := &MockPurchaseReceiptRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockProductRepo := &MockProductRepository{}
	mockInventoryRepo := &MockInventoryRepository{}

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

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

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

	itemID := uuid.New()

	// Mock expectations
	mockPRRepo.On("RemoveItem", mock.Anything, itemID).Return(nil)

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

	service := NewService(mockPRRepo, mockSupplierRepo, mockProductRepo, mockInventoryRepo)

	prID := uuid.New()
	expectedItems := []*models.PurchaseReceiptItem{
		createTestPurchaseReceiptItem(),
		createTestPurchaseReceiptItem(),
	}

	// Mock expectations
	mockPRRepo.On("GetItems", mock.Anything, prID).Return(expectedItems, nil)

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