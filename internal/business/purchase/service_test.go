package purchase

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"inventory-api/internal/repository/models"
)

// Mock repositories
type MockPurchaseOrderRepository struct {
	mock.Mock
}

func (m *MockPurchaseOrderRepository) Create(ctx context.Context, po *models.PurchaseOrder) error {
	args := m.Called(ctx, po)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.PurchaseOrder, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) GetByPONumber(ctx context.Context, poNumber string) (*models.PurchaseOrder, error) {
	args := m.Called(ctx, poNumber)
	return args.Get(0).(*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) Update(ctx context.Context, po *models.PurchaseOrder) error {
	args := m.Called(ctx, po)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) List(ctx context.Context, limit, offset int) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx, supplierID)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) GetByStatus(ctx context.Context, status models.PurchaseOrderStatus) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx, status)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx, startDate, endDate)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx, query, limit, offset)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockPurchaseOrderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.PurchaseOrderStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) GetPendingOrders(ctx context.Context) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) GetOrdersAwaitingDelivery(ctx context.Context) ([]*models.PurchaseOrder, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.PurchaseOrder), args.Error(1)
}

func (m *MockPurchaseOrderRepository) CreateItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) GetItemsByPurchaseOrderID(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.PurchaseOrderItem, error) {
	args := m.Called(ctx, purchaseOrderID)
	return args.Get(0).([]*models.PurchaseOrderItem), args.Error(1)
}

func (m *MockPurchaseOrderRepository) UpdateItem(ctx context.Context, item *models.PurchaseOrderItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockPurchaseOrderRepository) DeleteItem(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

type MockGRNRepository struct {
	mock.Mock
}

func (m *MockGRNRepository) Create(ctx context.Context, grn *models.GRN) error {
	args := m.Called(ctx, grn)
	return args.Error(0)
}

func (m *MockGRNRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.GRN, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetByGRNNumber(ctx context.Context, grnNumber string) (*models.GRN, error) {
	args := m.Called(ctx, grnNumber)
	return args.Get(0).(*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) Update(ctx context.Context, grn *models.GRN) error {
	args := m.Called(ctx, grn)
	return args.Error(0)
}

func (m *MockGRNRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockGRNRepository) List(ctx context.Context, limit, offset int) ([]*models.GRN, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetByPurchaseOrder(ctx context.Context, purchaseOrderID uuid.UUID) ([]*models.GRN, error) {
	args := m.Called(ctx, purchaseOrderID)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.GRN, error) {
	args := m.Called(ctx, supplierID)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.GRN, error) {
	args := m.Called(ctx, locationID)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetByStatus(ctx context.Context, status models.GRNStatus) ([]*models.GRN, error) {
	args := m.Called(ctx, status)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.GRN, error) {
	args := m.Called(ctx, startDate, endDate)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.GRN, error) {
	args := m.Called(ctx, query, limit, offset)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockGRNRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status models.GRNStatus) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockGRNRepository) GetPendingVerification(ctx context.Context) ([]*models.GRN, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) GetRecentGRNs(ctx context.Context, days int) ([]*models.GRN, error) {
	args := m.Called(ctx, days)
	return args.Get(0).([]*models.GRN), args.Error(1)
}

func (m *MockGRNRepository) CreateItem(ctx context.Context, item *models.GRNItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockGRNRepository) GetItemsByGRNID(ctx context.Context, grnID uuid.UUID) ([]*models.GRNItem, error) {
	args := m.Called(ctx, grnID)
	return args.Get(0).([]*models.GRNItem), args.Error(1)
}

func (m *MockGRNRepository) UpdateItem(ctx context.Context, item *models.GRNItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockGRNRepository) DeleteItem(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockGRNRepository) GetItemsByProduct(ctx context.Context, productID uuid.UUID) ([]*models.GRNItem, error) {
	args := m.Called(ctx, productID)
	return args.Get(0).([]*models.GRNItem), args.Error(1)
}

func (m *MockGRNRepository) UpdateItemStockStatus(ctx context.Context, id uuid.UUID, stockUpdated bool) error {
	args := m.Called(ctx, id, stockUpdated)
	return args.Error(0)
}

func (m *MockGRNRepository) GetPendingStockUpdates(ctx context.Context) ([]*models.GRNItem, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.GRNItem), args.Error(1)
}

func (m *MockGRNRepository) GetSupplierPerformance(ctx context.Context, supplierID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	args := m.Called(ctx, supplierID, startDate, endDate)
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockGRNRepository) GetReceiptSummary(ctx context.Context, startDate, endDate time.Time) (map[string]interface{}, error) {
	args := m.Called(ctx, startDate, endDate)
	return args.Get(0).(map[string]interface{}), args.Error(1)
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
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetByCode(ctx context.Context, code string) (*models.Supplier, error) {
	args := m.Called(ctx, code)
	return args.Get(0).(*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetByName(ctx context.Context, name string) (*models.Supplier, error) {
	args := m.Called(ctx, name)
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
	return args.Get(0).([]*models.Supplier), args.Error(1)
}

func (m *MockSupplierRepository) GetActive(ctx context.Context) ([]*models.Supplier, error) {
	args := m.Called(ctx)
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
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	args := m.Called(ctx, sku)
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	args := m.Called(ctx, barcode)
	return args.Get(0).(*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByName(ctx context.Context, name string) ([]*models.Product, error) {
	args := m.Called(ctx, name)
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
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, categoryID)
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, supplierID)
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error) {
	args := m.Called(ctx, brandID)
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) GetActive(ctx context.Context) ([]*models.Product, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	args := m.Called(ctx, query, limit, offset)
	return args.Get(0).([]*models.Product), args.Error(1)
}

func (m *MockProductRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

type MockLocationRepository struct {
	mock.Mock
}

func (m *MockLocationRepository) Create(ctx context.Context, location *models.Location) error {
	args := m.Called(ctx, location)
	return args.Error(0)
}

func (m *MockLocationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Location), args.Error(1)
}

func (m *MockLocationRepository) GetByName(ctx context.Context, name string) (*models.Location, error) {
	args := m.Called(ctx, name)
	return args.Get(0).(*models.Location), args.Error(1)
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
	return args.Get(0).(*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetByProductAndLocation(ctx context.Context, productID, locationID uuid.UUID) (*models.Inventory, error) {
	args := m.Called(ctx, productID, locationID)
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
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetByProduct(ctx context.Context, productID uuid.UUID) ([]*models.Inventory, error) {
	args := m.Called(ctx, productID)
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetByLocation(ctx context.Context, locationID uuid.UUID) ([]*models.Inventory, error) {
	args := m.Called(ctx, locationID)
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetLowStock(ctx context.Context) ([]*models.Inventory, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) GetZeroStock(ctx context.Context) ([]*models.Inventory, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) UpdateQuantity(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, locationID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) ReserveStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, locationID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) ReleaseReservedStock(ctx context.Context, productID, locationID uuid.UUID, quantity int) error {
	args := m.Called(ctx, productID, locationID, quantity)
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

func TestPurchaseService_CreatePurchaseOrder(t *testing.T) {
	// Setup mocks
	poRepo := &MockPurchaseOrderRepository{}
	grnRepo := &MockGRNRepository{}
	supplierRepo := &MockSupplierRepository{}
	productRepo := &MockProductRepository{}
	locationRepo := &MockLocationRepository{}
	inventoryRepo := &MockInventoryRepository{}

	service := NewService(poRepo, grnRepo, supplierRepo, productRepo, locationRepo, inventoryRepo)

	ctx := context.Background()
	supplierID := uuid.New()
	userID := uuid.New()

	// Test data
	po := &models.PurchaseOrder{
		SupplierID:  supplierID,
		OrderDate:   time.Now(),
		CreatedByID: userID,
		Status:      models.PurchaseOrderStatusDraft,
	}

	supplier := &models.Supplier{
		ID:       supplierID,
		IsActive: true,
	}

	// Setup expectations
	supplierRepo.On("GetByID", ctx, supplierID).Return(supplier, nil)
	poRepo.On("GetByPONumber", ctx, mock.AnythingOfType("string")).Return((*models.PurchaseOrder)(nil), assert.AnError)
	poRepo.On("GetItemsByPurchaseOrderID", ctx, po.ID).Return([]*models.PurchaseOrderItem{}, nil)
	poRepo.On("Create", ctx, po).Return(nil)
	poRepo.On("Update", ctx, po).Return(nil)

	// Execute
	result, err := service.CreatePurchaseOrder(ctx, po)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.PONumber)
	assert.Equal(t, "MYR", result.Currency)
	assert.Equal(t, 6.0, result.TaxRate)

	// Verify all expectations
	poRepo.AssertExpectations(t)
	supplierRepo.AssertExpectations(t)
}

func TestPurchaseService_ValidatePurchaseOrder(t *testing.T) {
	service := NewService(nil, nil, nil, nil, nil, nil)
	ctx := context.Background()

	t.Run("Valid Purchase Order", func(t *testing.T) {
		po := &models.PurchaseOrder{
			SupplierID:  uuid.New(),
			CreatedByID: uuid.New(),
			OrderDate:   time.Now(),
			PONumber:    "PO123",
			Currency:    "MYR",
			TaxRate:     6.0,
		}

		err := service.ValidatePurchaseOrder(ctx, po, false)
		assert.NoError(t, err)
	})

	t.Run("Missing Supplier ID", func(t *testing.T) {
		po := &models.PurchaseOrder{
			CreatedByID: uuid.New(),
			OrderDate:   time.Now(),
		}

		err := service.ValidatePurchaseOrder(ctx, po, false)
		assert.EqualError(t, err, "supplier ID is required")
	})

	t.Run("Missing Created By ID", func(t *testing.T) {
		po := &models.PurchaseOrder{
			SupplierID: uuid.New(),
			OrderDate:  time.Now(),
		}

		err := service.ValidatePurchaseOrder(ctx, po, false)
		assert.EqualError(t, err, "created by ID is required")
	})

	t.Run("Invalid Tax Rate", func(t *testing.T) {
		po := &models.PurchaseOrder{
			SupplierID:  uuid.New(),
			CreatedByID: uuid.New(),
			OrderDate:   time.Now(),
			TaxRate:     150.0, // Invalid - greater than 100
		}

		err := service.ValidatePurchaseOrder(ctx, po, false)
		assert.EqualError(t, err, "tax rate must be between 0 and 100")
	})

	t.Run("Negative Total Amount", func(t *testing.T) {
		po := &models.PurchaseOrder{
			SupplierID:  uuid.New(),
			CreatedByID: uuid.New(),
			OrderDate:   time.Now(),
			TotalAmount: -100.0,
		}

		err := service.ValidatePurchaseOrder(ctx, po, false)
		assert.EqualError(t, err, "total amount cannot be negative")
	})
}

func TestPurchaseService_GeneratePONumber(t *testing.T) {
	poRepo := &MockPurchaseOrderRepository{}
	service := NewService(poRepo, nil, nil, nil, nil, nil)
	ctx := context.Background()

	// Setup expectations - first call returns error (number doesn't exist), so it's available
	poRepo.On("GetByPONumber", ctx, mock.AnythingOfType("string")).Return((*models.PurchaseOrder)(nil), assert.AnError)

	// Execute
	poNumber, err := service.GeneratePONumber(ctx)

	// Assert
	assert.NoError(t, err)
	assert.NotEmpty(t, poNumber)
	assert.Contains(t, poNumber, "PO")
	assert.Contains(t, poNumber, time.Now().Format("200601")) // Current year-month

	poRepo.AssertExpectations(t)
}

func TestPurchaseService_ApprovePurchaseOrder(t *testing.T) {
	poRepo := &MockPurchaseOrderRepository{}
	service := NewService(poRepo, nil, nil, nil, nil, nil)
	ctx := context.Background()

	poID := uuid.New()
	approverID := uuid.New()

	t.Run("Successful Approval", func(t *testing.T) {
		po := &models.PurchaseOrder{
			ID:     poID,
			Status: models.PurchaseOrderStatusPending,
		}

		poRepo.On("GetByID", ctx, poID).Return(po, nil)
		poRepo.On("Update", ctx, mock.MatchedBy(func(updatedPO *models.PurchaseOrder) bool {
			return updatedPO.Status == models.PurchaseOrderStatusApproved &&
				updatedPO.ApprovedByID != nil &&
				*updatedPO.ApprovedByID == approverID &&
				updatedPO.ApprovedAt != nil
		})).Return(nil)

		err := service.ApprovePurchaseOrder(ctx, poID, approverID)
		assert.NoError(t, err)

		poRepo.AssertExpectations(t)
	})

	t.Run("Invalid Status", func(t *testing.T) {
		po := &models.PurchaseOrder{
			ID:     poID,
			Status: models.PurchaseOrderStatusDraft, // Wrong status for approval
		}

		poRepo.On("GetByID", ctx, poID).Return(po, nil)

		err := service.ApprovePurchaseOrder(ctx, poID, approverID)
		assert.Equal(t, ErrInvalidStatus, err)

		poRepo.AssertExpectations(t)
	})
}

func TestPurchaseService_CreateGRN(t *testing.T) {
	poRepo := &MockPurchaseOrderRepository{}
	grnRepo := &MockGRNRepository{}
	supplierRepo := &MockSupplierRepository{}
	locationRepo := &MockLocationRepository{}
	service := NewService(poRepo, grnRepo, supplierRepo, nil, locationRepo, nil)

	ctx := context.Background()
	poID := uuid.New()
	supplierID := uuid.New()
	locationID := uuid.New()
	receivedByID := uuid.New()

	grn := &models.GRN{
		PurchaseOrderID: poID,
		SupplierID:      supplierID,
		LocationID:      locationID,
		ReceivedByID:    receivedByID,
		ReceivedDate:    time.Now(),
	}

	po := &models.PurchaseOrder{
		ID:         poID,
		SupplierID: supplierID,
		Status:     models.PurchaseOrderStatusOrdered,
		Currency:   "MYR",
		TaxRate:    6.0,
	}

	location := &models.Location{
		ID:       locationID,
		IsActive: true,
	}

	// Setup expectations
	poRepo.On("GetByID", ctx, poID).Return(po, nil)
	locationRepo.On("GetByID", ctx, locationID).Return(location, nil)
	grnRepo.On("GetByGRNNumber", ctx, mock.AnythingOfType("string")).Return((*models.GRN)(nil), assert.AnError)
	grnRepo.On("GetItemsByGRNID", ctx, grn.ID).Return([]*models.GRNItem{}, nil)
	grnRepo.On("Create", ctx, grn).Return(nil)
	grnRepo.On("Update", ctx, grn).Return(nil)

	// Execute
	result, err := service.CreateGRN(ctx, grn)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.GRNNumber)
	assert.Equal(t, models.GRNStatusDraft, result.Status)
	assert.Equal(t, "MYR", result.Currency)
	assert.Equal(t, 6.0, result.TaxRate)

	// Verify expectations
	poRepo.AssertExpectations(t)
	grnRepo.AssertExpectations(t)
	locationRepo.AssertExpectations(t)
}

func TestPurchaseService_ValidateGRN(t *testing.T) {
	service := NewService(nil, nil, nil, nil, nil, nil)
	ctx := context.Background()

	t.Run("Valid GRN", func(t *testing.T) {
		grn := &models.GRN{
			PurchaseOrderID: uuid.New(),
			SupplierID:      uuid.New(),
			LocationID:      uuid.New(),
			ReceivedByID:    uuid.New(),
			ReceivedDate:    time.Now(),
			GRNNumber:       "GRN123",
			Currency:        "MYR",
			TaxRate:         6.0,
		}

		err := service.ValidateGRN(ctx, grn, false)
		assert.NoError(t, err)
	})

	t.Run("Missing Purchase Order ID", func(t *testing.T) {
		grn := &models.GRN{
			SupplierID:   uuid.New(),
			LocationID:   uuid.New(),
			ReceivedByID: uuid.New(),
			ReceivedDate: time.Now(),
		}

		err := service.ValidateGRN(ctx, grn, false)
		assert.EqualError(t, err, "purchase order ID is required")
	})

	t.Run("Missing Received Date", func(t *testing.T) {
		grn := &models.GRN{
			PurchaseOrderID: uuid.New(),
			SupplierID:      uuid.New(),
			LocationID:      uuid.New(),
			ReceivedByID:    uuid.New(),
		}

		err := service.ValidateGRN(ctx, grn, false)
		assert.EqualError(t, err, "received date is required")
	})

	t.Run("Invalid Tax Rate", func(t *testing.T) {
		grn := &models.GRN{
			PurchaseOrderID: uuid.New(),
			SupplierID:      uuid.New(),
			LocationID:      uuid.New(),
			ReceivedByID:    uuid.New(),
			ReceivedDate:    time.Now(),
			TaxRate:         -5.0, // Invalid - negative
		}

		err := service.ValidateGRN(ctx, grn, false)
		assert.EqualError(t, err, "tax rate must be between 0 and 100")
	})
}

func TestPurchaseService_ProcessGRNReceipt(t *testing.T) {
	grnRepo := &MockGRNRepository{}
	service := NewService(nil, grnRepo, nil, nil, nil, nil)
	ctx := context.Background()

	grnID := uuid.New()
	receivedByID := uuid.New()

	t.Run("Successful Processing", func(t *testing.T) {
		grn := &models.GRN{
			ID:     grnID,
			Status: models.GRNStatusDraft,
		}

		grnRepo.On("GetByID", ctx, grnID).Return(grn, nil)
		grnRepo.On("Update", ctx, mock.MatchedBy(func(updatedGRN *models.GRN) bool {
			return updatedGRN.Status == models.GRNStatusReceived &&
				updatedGRN.ReceivedByID == receivedByID
		})).Return(nil)

		err := service.ProcessGRNReceipt(ctx, grnID, receivedByID)
		assert.NoError(t, err)

		grnRepo.AssertExpectations(t)
	})

	t.Run("Invalid Status", func(t *testing.T) {
		grn := &models.GRN{
			ID:     grnID,
			Status: models.GRNStatusCompleted, // Wrong status
		}

		grnRepo.On("GetByID", ctx, grnID).Return(grn, nil)

		err := service.ProcessGRNReceipt(ctx, grnID, receivedByID)
		assert.Equal(t, ErrInvalidStatus, err)

		grnRepo.AssertExpectations(t)
	})
}

func TestPurchaseService_GetPurchaseOrderSummary(t *testing.T) {
	poRepo := &MockPurchaseOrderRepository{}
	service := NewService(poRepo, nil, nil, nil, nil, nil)
	ctx := context.Background()

	startDate := time.Now().AddDate(0, -1, 0) // 1 month ago
	endDate := time.Now()

	orders := []*models.PurchaseOrder{
		{
			ID:          uuid.New(),
			Status:      models.PurchaseOrderStatusDraft,
			TotalAmount: 1000.0,
		},
		{
			ID:          uuid.New(),
			Status:      models.PurchaseOrderStatusApproved,
			TotalAmount: 2000.0,
		},
		{
			ID:          uuid.New(),
			Status:      models.PurchaseOrderStatusReceived,
			TotalAmount: 1500.0,
		},
	}

	poRepo.On("GetByDateRange", ctx, startDate, endDate).Return(orders, nil)

	// Execute
	summary, err := service.GetPurchaseOrderSummary(ctx, startDate, endDate)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, summary)
	assert.Equal(t, 3, summary["total_orders"])
	assert.Equal(t, 4500.0, summary["total_value"])
	assert.Equal(t, 1, summary["draft_orders"])
	assert.Equal(t, 1, summary["approved_orders"])
	assert.Equal(t, 1, summary["received_orders"])

	poRepo.AssertExpectations(t)
}