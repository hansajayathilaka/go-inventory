package product

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"inventory-api/internal/repository/models"
)

// Mock repositories
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

type MockCategoryRepository struct {
	mock.Mock
}

func (m *MockCategoryRepository) Create(ctx context.Context, category *models.Category) error {
	args := m.Called(ctx, category)
	return args.Error(0)
}

func (m *MockCategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) GetByName(ctx context.Context, name string) (*models.Category, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) Update(ctx context.Context, category *models.Category) error {
	args := m.Called(ctx, category)
	return args.Error(0)
}

func (m *MockCategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockCategoryRepository) List(ctx context.Context, limit, offset int) ([]*models.Category, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Category, error) {
	args := m.Called(ctx, parentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) GetByLevel(ctx context.Context, level int) ([]*models.Category, error) {
	args := m.Called(ctx, level)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) GetRootCategories(ctx context.Context) ([]*models.Category, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) GetCategoryPath(ctx context.Context, id uuid.UUID) ([]*models.Category, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
}

func (m *MockCategoryRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockCategoryRepository) Search(ctx context.Context, query string) ([]*models.Category, error) {
	args := m.Called(ctx, query)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Category), args.Error(1)
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

func (m *MockSupplierRepository) GetByCode(ctx context.Context, code string) (*models.Supplier, error) {
	args := m.Called(ctx, code)
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

type MockBrandRepository struct {
	mock.Mock
}

func (m *MockBrandRepository) Create(ctx context.Context, brand *models.Brand) error {
	args := m.Called(ctx, brand)
	return args.Error(0)
}

func (m *MockBrandRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Brand, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Brand), args.Error(1)
}

func (m *MockBrandRepository) GetByCode(ctx context.Context, code string) (*models.Brand, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Brand), args.Error(1)
}

func (m *MockBrandRepository) GetByName(ctx context.Context, name string) (*models.Brand, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Brand), args.Error(1)
}

func (m *MockBrandRepository) Update(ctx context.Context, brand *models.Brand) error {
	args := m.Called(ctx, brand)
	return args.Error(0)
}

func (m *MockBrandRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockBrandRepository) List(ctx context.Context, limit, offset int) ([]*models.Brand, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Brand), args.Error(1)
}

func (m *MockBrandRepository) GetActive(ctx context.Context) ([]*models.Brand, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Brand), args.Error(1)
}

func (m *MockBrandRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockBrandRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Brand, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Brand), args.Error(1)
}

// Test setup helper
func setupTestService() (*service, *MockProductRepository, *MockCategoryRepository, *MockSupplierRepository, *MockBrandRepository) {
	mockProductRepo := &MockProductRepository{}
	mockCategoryRepo := &MockCategoryRepository{}
	mockSupplierRepo := &MockSupplierRepository{}
	mockBrandRepo := &MockBrandRepository{}

	service := &service{
		productRepo:  mockProductRepo,
		categoryRepo: mockCategoryRepo,
		supplierRepo: mockSupplierRepo,
		brandRepo:    mockBrandRepo,
	}

	return service, mockProductRepo, mockCategoryRepo, mockSupplierRepo, mockBrandRepo
}

// Test GetProductsByBrand
func TestService_GetProductsByBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, _, _, mockBrandRepo := setupTestService()

	brandID := uuid.New()
	brand := &models.Brand{
		ID:   brandID,
		Name: "Toyota",
		Code: "TOYOTA",
	}

	products := []*models.Product{
		{
			ID:      uuid.New(),
			SKU:     "PROD-001",
			Name:    "Toyota Oil Filter",
			BrandID: &brandID,
		},
		{
			ID:      uuid.New(),
			SKU:     "PROD-002",
			Name:    "Toyota Air Filter",
			BrandID: &brandID,
		},
	}

	t.Run("Success", func(t *testing.T) {
		mockBrandRepo.On("GetByID", ctx, brandID).Return(brand, nil).Once()
		mockProductRepo.On("GetByBrand", ctx, brandID).Return(products, nil).Once()

		result, err := service.GetProductsByBrand(ctx, brandID)

		assert.NoError(t, err)
		assert.Equal(t, products, result)
		mockBrandRepo.AssertExpectations(t)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("BrandNotFound", func(t *testing.T) {
		nonExistentBrandID := uuid.New()
		mockBrandRepo.On("GetByID", ctx, nonExistentBrandID).Return(nil, errors.New("brand not found")).Once()

		result, err := service.GetProductsByBrand(ctx, nonExistentBrandID)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		assert.Nil(t, result)
		mockBrandRepo.AssertExpectations(t)
	})
}

// Test SetProductBrand
func TestService_SetProductBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, _, _, mockBrandRepo := setupTestService()

	productID := uuid.New()
	brandID := uuid.New()

	product := &models.Product{
		ID:   productID,
		SKU:  "PROD-001",
		Name: "Oil Filter",
	}

	brand := &models.Brand{
		ID:   brandID,
		Name: "Toyota",
		Code: "TOYOTA",
	}

	t.Run("Success", func(t *testing.T) {
		mockProductRepo.On("GetByID", ctx, productID).Return(product, nil).Once()
		mockBrandRepo.On("GetByID", ctx, brandID).Return(brand, nil).Once()
		mockProductRepo.On("Update", ctx, mock.MatchedBy(func(p *models.Product) bool {
			return p.ID == productID && p.BrandID != nil && *p.BrandID == brandID
		})).Return(nil).Once()

		err := service.SetProductBrand(ctx, productID, brandID)

		assert.NoError(t, err)
		mockProductRepo.AssertExpectations(t)
		mockBrandRepo.AssertExpectations(t)
	})

	t.Run("ProductNotFound", func(t *testing.T) {
		nonExistentProductID := uuid.New()
		mockProductRepo.On("GetByID", ctx, nonExistentProductID).Return(nil, errors.New("product not found")).Once()

		err := service.SetProductBrand(ctx, nonExistentProductID, brandID)

		assert.Error(t, err)
		assert.Equal(t, ErrProductNotFound, err)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("BrandNotFound", func(t *testing.T) {
		nonExistentBrandID := uuid.New()
		mockProductRepo.On("GetByID", ctx, productID).Return(product, nil).Once()
		mockBrandRepo.On("GetByID", ctx, nonExistentBrandID).Return(nil, errors.New("brand not found")).Once()

		err := service.SetProductBrand(ctx, productID, nonExistentBrandID)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		mockProductRepo.AssertExpectations(t)
		mockBrandRepo.AssertExpectations(t)
	})
}

// Test RemoveProductBrand
func TestService_RemoveProductBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, _, _, _ := setupTestService()

	productID := uuid.New()
	brandID := uuid.New()

	product := &models.Product{
		ID:      productID,
		SKU:     "PROD-001",
		Name:    "Oil Filter",
		BrandID: &brandID,
	}

	t.Run("Success", func(t *testing.T) {
		mockProductRepo.On("GetByID", ctx, productID).Return(product, nil).Once()
		mockProductRepo.On("Update", ctx, mock.MatchedBy(func(p *models.Product) bool {
			return p.ID == productID && p.BrandID == nil
		})).Return(nil).Once()

		err := service.RemoveProductBrand(ctx, productID)

		assert.NoError(t, err)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("ProductNotFound", func(t *testing.T) {
		nonExistentProductID := uuid.New()
		mockProductRepo.On("GetByID", ctx, nonExistentProductID).Return(nil, errors.New("product not found")).Once()

		err := service.RemoveProductBrand(ctx, nonExistentProductID)

		assert.Error(t, err)
		assert.Equal(t, ErrProductNotFound, err)
		mockProductRepo.AssertExpectations(t)
	})
}

// Test GetProductsWithoutBrand
func TestService_GetProductsWithoutBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, _, _, _ := setupTestService()

	brandID := uuid.New()
	products := []*models.Product{
		{
			ID:      uuid.New(),
			SKU:     "PROD-001",
			Name:    "Product with brand",
			BrandID: &brandID,
		},
		{
			ID:      uuid.New(),
			SKU:     "PROD-002",
			Name:    "Product without brand",
			BrandID: nil,
		},
		{
			ID:      uuid.New(),
			SKU:     "PROD-003",
			Name:    "Another product without brand",
			BrandID: nil,
		},
	}

	t.Run("Success", func(t *testing.T) {
		mockProductRepo.On("GetActive", ctx).Return(products, nil).Once()

		result, err := service.GetProductsWithoutBrand(ctx)

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, "PROD-002", result[0].SKU)
		assert.Equal(t, "PROD-003", result[1].SKU)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("RepositoryError", func(t *testing.T) {
		mockProductRepo.On("GetActive", ctx).Return(nil, errors.New("repository error")).Once()

		result, err := service.GetProductsWithoutBrand(ctx)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockProductRepo.AssertExpectations(t)
	})
}

// Test CountProductsByBrand
func TestService_CountProductsByBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, _, _, mockBrandRepo := setupTestService()

	brandID := uuid.New()
	brand := &models.Brand{
		ID:   brandID,
		Name: "Toyota",
		Code: "TOYOTA",
	}

	products := []*models.Product{
		{ID: uuid.New(), BrandID: &brandID},
		{ID: uuid.New(), BrandID: &brandID},
		{ID: uuid.New(), BrandID: &brandID},
	}

	t.Run("Success", func(t *testing.T) {
		mockBrandRepo.On("GetByID", ctx, brandID).Return(brand, nil).Once()
		mockProductRepo.On("GetByBrand", ctx, brandID).Return(products, nil).Once()

		count, err := service.CountProductsByBrand(ctx, brandID)

		assert.NoError(t, err)
		assert.Equal(t, int64(3), count)
		mockBrandRepo.AssertExpectations(t)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("BrandNotFound", func(t *testing.T) {
		nonExistentBrandID := uuid.New()
		mockBrandRepo.On("GetByID", ctx, nonExistentBrandID).Return(nil, errors.New("brand not found")).Once()

		count, err := service.CountProductsByBrand(ctx, nonExistentBrandID)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		assert.Equal(t, int64(0), count)
		mockBrandRepo.AssertExpectations(t)
	})
}

// Test product creation with brand validation
func TestService_CreateProduct_WithBrand(t *testing.T) {
	ctx := context.Background()
	service, mockProductRepo, mockCategoryRepo, _, mockBrandRepo := setupTestService()

	categoryID := uuid.New()
	brandID := uuid.New()

	category := &models.Category{
		ID:   categoryID,
		Name: "Filters",
	}

	brand := &models.Brand{
		ID:   brandID,
		Name: "Toyota",
		Code: "TOYOTA",
	}

	product := &models.Product{
		ID:          uuid.New(),
		SKU:         "PROD-001",
		Name:        "Oil Filter",
		CategoryID:  categoryID,
		BrandID:     &brandID,
		CostPrice:   10.0,
		RetailPrice: 15.0,
	}

	t.Run("Success", func(t *testing.T) {
		mockCategoryRepo.On("GetByID", ctx, categoryID).Return(category, nil).Once()
		mockBrandRepo.On("GetByID", ctx, brandID).Return(brand, nil).Once()
		mockProductRepo.On("GetBySKU", ctx, product.SKU).Return(nil, errors.New("not found")).Once()
		mockProductRepo.On("Create", ctx, product).Return(nil).Once()

		err := service.CreateProduct(ctx, product)

		assert.NoError(t, err)
		mockCategoryRepo.AssertExpectations(t)
		mockBrandRepo.AssertExpectations(t)
		mockProductRepo.AssertExpectations(t)
	})

	t.Run("InvalidBrand", func(t *testing.T) {
		invalidBrandID := uuid.New()
		productWithInvalidBrand := &models.Product{
			ID:          uuid.New(),
			SKU:         "PROD-002",
			Name:        "Air Filter",
			CategoryID:  categoryID,
			BrandID:     &invalidBrandID,
			CostPrice:   10.0,
			RetailPrice: 15.0,
		}

		mockCategoryRepo.On("GetByID", ctx, categoryID).Return(category, nil).Once()
		mockBrandRepo.On("GetByID", ctx, invalidBrandID).Return(nil, errors.New("brand not found")).Once()

		err := service.CreateProduct(ctx, productWithInvalidBrand)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		mockCategoryRepo.AssertExpectations(t)
		mockBrandRepo.AssertExpectations(t)
	})
}