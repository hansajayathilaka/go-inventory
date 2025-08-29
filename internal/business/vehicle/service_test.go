package vehicle

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

// Mock repositories for testing
type MockVehicleBrandRepository struct {
	mock.Mock
}

func (m *MockVehicleBrandRepository) Create(ctx context.Context, brand *models.VehicleBrand) error {
	args := m.Called(ctx, brand)
	return args.Error(0)
}

func (m *MockVehicleBrandRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) GetByCode(ctx context.Context, code string) (*models.VehicleBrand, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) GetByName(ctx context.Context, name string) (*models.VehicleBrand, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) Update(ctx context.Context, brand *models.VehicleBrand) error {
	args := m.Called(ctx, brand)
	return args.Error(0)
}

func (m *MockVehicleBrandRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockVehicleBrandRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) GetActive(ctx context.Context) ([]*models.VehicleBrand, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleBrandRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleBrand, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) GetWithModels(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleBrand), args.Error(1)
}

func (m *MockVehicleBrandRepository) ListWithModels(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleBrand), args.Error(1)
}

type MockVehicleModelRepository struct {
	mock.Mock
}

func (m *MockVehicleModelRepository) Create(ctx context.Context, model *models.VehicleModel) error {
	args := m.Called(ctx, model)
	return args.Error(0)
}

func (m *MockVehicleModelRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetByCode(ctx context.Context, code string) (*models.VehicleModel, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetByName(ctx context.Context, name string) (*models.VehicleModel, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) Update(ctx context.Context, model *models.VehicleModel) error {
	args := m.Called(ctx, model)
	return args.Error(0)
}

func (m *MockVehicleModelRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockVehicleModelRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetActive(ctx context.Context) ([]*models.VehicleModel, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetByBrandID(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, brandID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetByYear(ctx context.Context, year int, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, year, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetByFuelType(ctx context.Context, fuelType string, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, fuelType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleModelRepository) CountByBrand(ctx context.Context, brandID uuid.UUID) (int64, error) {
	args := m.Called(ctx, brandID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleModelRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) SearchByBrand(ctx context.Context, brandID uuid.UUID, query string, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, brandID, query, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) GetWithBrand(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleModel), args.Error(1)
}

func (m *MockVehicleModelRepository) ListWithBrand(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	args := m.Called(ctx, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.VehicleModel), args.Error(1)
}

// Test setup helper
func setupVehicleService() (Service, *MockVehicleBrandRepository, *MockVehicleModelRepository) {
	brandRepo := &MockVehicleBrandRepository{}
	modelRepo := &MockVehicleModelRepository{}
	service := NewService(brandRepo, modelRepo)
	return service, brandRepo, modelRepo
}

// Test data helpers
func createTestVehicleBrand() *models.VehicleBrand {
	return &models.VehicleBrand{
		ID:          uuid.New(),
		Name:        "Toyota",
		Code:        "TOYT01",
		Description: "Japanese automotive manufacturer",
		CountryCode: "JP",
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

func createTestVehicleModel(brandID uuid.UUID) *models.VehicleModel {
	return &models.VehicleModel{
		ID:             uuid.New(),
		Name:           "Camry",
		Code:           "TOYT-CAMR01",
		VehicleBrandID: brandID,
		Description:    "Mid-size sedan",
		YearFrom:       2020,
		YearTo:         2024,
		FuelType:       "PETROL",
		Transmission:   "AUTOMATIC",
		EngineSize:     "2.5L",
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

// ===============================
// Vehicle Brand Tests
// ===============================

func TestCreateVehicleBrand_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	brand.Code = "" // Let service generate code

	brandRepo.On("GetByCode", ctx, mock.Anything).Return(nil, errors.New("not found"))
	brandRepo.On("GetByName", ctx, brand.Name).Return(nil, errors.New("not found"))
	brandRepo.On("Create", ctx, mock.AnythingOfType("*models.VehicleBrand")).Return(nil)

	result, err := service.CreateVehicleBrand(ctx, brand)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.IsActive)
	assert.NotEmpty(t, result.Code)
	brandRepo.AssertExpectations(t)
}

func TestCreateVehicleBrand_DuplicateName(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	existingBrand := createTestVehicleBrand()

	brandRepo.On("GetByCode", ctx, mock.Anything).Return(nil, errors.New("not found"))
	brandRepo.On("GetByName", ctx, brand.Name).Return(existingBrand, nil)

	result, err := service.CreateVehicleBrand(ctx, brand)

	assert.Error(t, err)
	assert.Equal(t, ErrVehicleBrandExists, err)
	assert.Nil(t, result)
	brandRepo.AssertExpectations(t)
}

func TestCreateVehicleBrand_InvalidInput(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	// Test nil brand
	result, err := service.CreateVehicleBrand(ctx, nil)
	assert.Error(t, err)
	assert.Equal(t, ErrInvalidInput, err)
	assert.Nil(t, result)

	// Test empty name
	brand := createTestVehicleBrand()
	brand.Name = ""
	result, err = service.CreateVehicleBrand(ctx, brand)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "name is required")
	assert.Nil(t, result)
}

func TestGetVehicleBrandByID_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)

	result, err := service.GetVehicleBrandByID(ctx, brand.ID)

	assert.NoError(t, err)
	assert.Equal(t, brand, result)
	brandRepo.AssertExpectations(t)
}

func TestGetVehicleBrandByID_NotFound(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brandID := uuid.New()
	brandRepo.On("GetByID", ctx, brandID).Return(nil, errors.New("not found"))

	result, err := service.GetVehicleBrandByID(ctx, brandID)

	assert.Error(t, err)
	assert.Equal(t, ErrVehicleBrandNotFound, err)
	assert.Nil(t, result)
	brandRepo.AssertExpectations(t)
}

func TestUpdateVehicleBrand_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	existingBrand := createTestVehicleBrand()
	existingBrand.ID = brand.ID
	existingBrand.Code = "OLD01"
	existingBrand.Name = "OldName"

	brandRepo.On("GetByID", ctx, brand.ID).Return(existingBrand, nil)
	brandRepo.On("GetByCode", ctx, brand.Code).Return(nil, errors.New("not found"))
	brandRepo.On("GetByName", ctx, brand.Name).Return(nil, errors.New("not found"))
	brandRepo.On("Update", ctx, brand).Return(nil)

	err := service.UpdateVehicleBrand(ctx, brand)

	assert.NoError(t, err)
	brandRepo.AssertExpectations(t)
}

func TestDeleteVehicleBrand_Success(t *testing.T) {
	service, brandRepo, modelRepo := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	modelRepo.On("CountByBrand", ctx, brand.ID).Return(int64(0), nil)
	brandRepo.On("Delete", ctx, brand.ID).Return(nil)

	err := service.DeleteVehicleBrand(ctx, brand.ID)

	assert.NoError(t, err)
	brandRepo.AssertExpectations(t)
	modelRepo.AssertExpectations(t)
}

func TestDeleteVehicleBrand_HasModels(t *testing.T) {
	service, brandRepo, modelRepo := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	modelRepo.On("CountByBrand", ctx, brand.ID).Return(int64(5), nil)

	err := service.DeleteVehicleBrand(ctx, brand.ID)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot delete vehicle brand with associated models")
	brandRepo.AssertExpectations(t)
	modelRepo.AssertExpectations(t)
}

// ===============================
// Vehicle Model Tests
// ===============================

func TestCreateVehicleModel_Success(t *testing.T) {
	service, brandRepo, modelRepo := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	model := createTestVehicleModel(brand.ID)
	model.Code = "" // Let service generate code

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	modelRepo.On("GetByCode", ctx, mock.Anything).Return(nil, errors.New("not found"))
	modelRepo.On("GetByBrandID", ctx, brand.ID, 1000, 0).Return([]*models.VehicleModel{}, nil)
	modelRepo.On("Create", ctx, mock.AnythingOfType("*models.VehicleModel")).Return(nil)

	result, err := service.CreateVehicleModel(ctx, model)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, result.IsActive)
	assert.NotEmpty(t, result.Code)
	brandRepo.AssertExpectations(t)
	modelRepo.AssertExpectations(t)
}

func TestCreateVehicleModel_BrandNotFound(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	model := createTestVehicleModel(uuid.New())

	brandRepo.On("GetByID", ctx, model.VehicleBrandID).Return(nil, errors.New("not found"))

	result, err := service.CreateVehicleModel(ctx, model)

	assert.Error(t, err)
	assert.Equal(t, ErrVehicleBrandNotFound, err)
	assert.Nil(t, result)
	brandRepo.AssertExpectations(t)
}

func TestCreateVehicleModel_BrandInactive(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	brand.IsActive = false
	model := createTestVehicleModel(brand.ID)

	brandRepo.On("GetByID", ctx, model.VehicleBrandID).Return(brand, nil)

	result, err := service.CreateVehicleModel(ctx, model)

	assert.Error(t, err)
	assert.Equal(t, ErrVehicleBrandInactive, err)
	assert.Nil(t, result)
	brandRepo.AssertExpectations(t)
}

func TestCreateVehicleModel_DuplicateName(t *testing.T) {
	service, brandRepo, modelRepo := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	model := createTestVehicleModel(brand.ID)
	existingModel := createTestVehicleModel(brand.ID)

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	modelRepo.On("GetByCode", ctx, mock.Anything).Return(nil, errors.New("not found"))
	modelRepo.On("GetByBrandID", ctx, brand.ID, 1000, 0).Return([]*models.VehicleModel{existingModel}, nil)

	result, err := service.CreateVehicleModel(ctx, model)

	assert.Error(t, err)
	assert.Equal(t, ErrVehicleModelExists, err)
	assert.Nil(t, result)
	brandRepo.AssertExpectations(t)
	modelRepo.AssertExpectations(t)
}

func TestGetVehicleModelByID_Success(t *testing.T) {
	service, _, modelRepo := setupVehicleService()
	ctx := context.Background()

	model := createTestVehicleModel(uuid.New())
	modelRepo.On("GetByID", ctx, model.ID).Return(model, nil)

	result, err := service.GetVehicleModelByID(ctx, model.ID)

	assert.NoError(t, err)
	assert.Equal(t, model, result)
	modelRepo.AssertExpectations(t)
}

func TestUpdateVehicleModel_Success(t *testing.T) {
	service, brandRepo, modelRepo := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	model := createTestVehicleModel(brand.ID)
	existingModel := createTestVehicleModel(brand.ID)
	existingModel.ID = model.ID
	existingModel.Code = "OLD-CODE01"
	existingModel.Name = "OldModel"

	modelRepo.On("GetByID", ctx, model.ID).Return(existingModel, nil)
	brandRepo.On("GetByID", ctx, model.VehicleBrandID).Return(brand, nil)
	modelRepo.On("GetByCode", ctx, model.Code).Return(nil, errors.New("not found"))
	modelRepo.On("GetByBrandID", ctx, model.VehicleBrandID, 1000, 0).Return([]*models.VehicleModel{}, nil)
	modelRepo.On("Update", ctx, model).Return(nil)

	err := service.UpdateVehicleModel(ctx, model)

	assert.NoError(t, err)
	brandRepo.AssertExpectations(t)
	modelRepo.AssertExpectations(t)
}

// ===============================
// Validation Tests
// ===============================

func TestValidateVehicleBrand_Success(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	err := service.ValidateVehicleBrand(ctx, brand, false)

	assert.NoError(t, err)
}

func TestValidateVehicleBrand_InvalidInput(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	// Test nil brand
	err := service.ValidateVehicleBrand(ctx, nil, false)
	assert.Equal(t, ErrInvalidInput, err)

	// Test empty name
	brand := createTestVehicleBrand()
	brand.Name = ""
	err = service.ValidateVehicleBrand(ctx, brand, false)
	assert.Contains(t, err.Error(), "name is required")

	// Test invalid country code
	brand = createTestVehicleBrand()
	brand.CountryCode = "invalid"
	err = service.ValidateVehicleBrand(ctx, brand, false)
	assert.Contains(t, err.Error(), "country code must be 2-3 uppercase letters")
}

func TestValidateVehicleModel_Success(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	model := createTestVehicleModel(uuid.New())
	err := service.ValidateVehicleModel(ctx, model, false)

	assert.NoError(t, err)
}

func TestValidateVehicleModel_InvalidInput(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	// Test nil model
	err := service.ValidateVehicleModel(ctx, nil, false)
	assert.Equal(t, ErrInvalidInput, err)

	// Test empty name
	model := createTestVehicleModel(uuid.New())
	model.Name = ""
	err = service.ValidateVehicleModel(ctx, model, false)
	assert.Contains(t, err.Error(), "name is required")

	// Test nil brand ID
	model = createTestVehicleModel(uuid.Nil)
	err = service.ValidateVehicleModel(ctx, model, false)
	assert.Contains(t, err.Error(), "brand ID is required")

	// Test invalid year range
	model = createTestVehicleModel(uuid.New())
	model.YearFrom = 2025
	model.YearTo = 2020
	err = service.ValidateVehicleModel(ctx, model, false)
	assert.Contains(t, err.Error(), "year from cannot be greater than year to")

	// Test invalid fuel type
	model = createTestVehicleModel(uuid.New())
	model.FuelType = "INVALID"
	err = service.ValidateVehicleModel(ctx, model, false)
	assert.Contains(t, err.Error(), "invalid fuel type")
}

// ===============================
// Code Generation Tests
// ===============================

func TestGenerateVehicleBrandCode_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brandRepo.On("GetByCode", ctx, "TOYO01").Return(nil, errors.New("not found"))

	code, err := service.GenerateVehicleBrandCode(ctx, "Toyota")

	assert.NoError(t, err)
	assert.Equal(t, "TOYO01", code)
	brandRepo.AssertExpectations(t)
}

func TestGenerateVehicleBrandCode_EmptyName(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	code, err := service.GenerateVehicleBrandCode(ctx, "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "name is required")
	assert.Empty(t, code)
}

func TestGenerateVehicleModelCode_Success(t *testing.T) {
	service, _, modelRepo := setupVehicleService()
	ctx := context.Background()

	modelRepo.On("GetByCode", ctx, "TOYO01-CAMR01").Return(nil, errors.New("not found"))

	code, err := service.GenerateVehicleModelCode(ctx, "TOYO01", "Camry")

	assert.NoError(t, err)
	assert.Equal(t, "TOYO01-CAMR01", code)
	modelRepo.AssertExpectations(t)
}

func TestGenerateVehicleModelCode_EmptyBrandCode(t *testing.T) {
	service, _, _ := setupVehicleService()
	ctx := context.Background()

	code, err := service.GenerateVehicleModelCode(ctx, "", "Camry")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "brand code is required")
	assert.Empty(t, code)
}

// ===============================
// Business Logic Tests
// ===============================

func TestDeactivateVehicleBrand_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	brand.IsActive = true

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	brandRepo.On("Update", ctx, mock.MatchedBy(func(b *models.VehicleBrand) bool {
		return b.ID == brand.ID && !b.IsActive
	})).Return(nil)

	err := service.DeactivateVehicleBrand(ctx, brand.ID)

	assert.NoError(t, err)
	brandRepo.AssertExpectations(t)
}

func TestActivateVehicleBrand_Success(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brand := createTestVehicleBrand()
	brand.IsActive = false

	brandRepo.On("GetByID", ctx, brand.ID).Return(brand, nil)
	brandRepo.On("Update", ctx, mock.MatchedBy(func(b *models.VehicleBrand) bool {
		return b.ID == brand.ID && b.IsActive
	})).Return(nil)

	err := service.ActivateVehicleBrand(ctx, brand.ID)

	assert.NoError(t, err)
	brandRepo.AssertExpectations(t)
}

func TestSearchVehicleBrands_EmptyQuery(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brands := []*models.VehicleBrand{createTestVehicleBrand()}
	brandRepo.On("List", ctx, 10, 0).Return(brands, nil)

	result, err := service.SearchVehicleBrands(ctx, "", 10, 0)

	assert.NoError(t, err)
	assert.Equal(t, brands, result)
	brandRepo.AssertExpectations(t)
}

func TestSearchVehicleBrands_WithQuery(t *testing.T) {
	service, brandRepo, _ := setupVehicleService()
	ctx := context.Background()

	brands := []*models.VehicleBrand{createTestVehicleBrand()}
	brandRepo.On("Search", ctx, "Toyota", 10, 0).Return(brands, nil)

	result, err := service.SearchVehicleBrands(ctx, "Toyota", 10, 0)

	assert.NoError(t, err)
	assert.Equal(t, brands, result)
	brandRepo.AssertExpectations(t)
}

func TestGetVehicleModelsByFuelType_Success(t *testing.T) {
	service, _, modelRepo := setupVehicleService()
	ctx := context.Background()

	models := []*models.VehicleModel{createTestVehicleModel(uuid.New())}
	modelRepo.On("GetByFuelType", ctx, "PETROL", 10, 0).Return(models, nil)

	result, err := service.GetVehicleModelsByFuelType(ctx, "PETROL", 10, 0)

	assert.NoError(t, err)
	assert.Equal(t, models, result)
	modelRepo.AssertExpectations(t)
}