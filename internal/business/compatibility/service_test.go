package compatibility

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
type MockVehicleCompatibilityRepository struct {
	mock.Mock
}

func (m *MockVehicleCompatibilityRepository) Create(ctx context.Context, compatibility *models.VehicleCompatibility) error {
	args := m.Called(ctx, compatibility)
	return args.Error(0)
}

func (m *MockVehicleCompatibilityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) Update(ctx context.Context, compatibility *models.VehicleCompatibility) error {
	args := m.Called(ctx, compatibility)
	return args.Error(0)
}

func (m *MockVehicleCompatibilityRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockVehicleCompatibilityRepository) List(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetActive(ctx context.Context) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetByProductID(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, productID, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetByVehicleModelID(ctx context.Context, vehicleModelID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, vehicleModelID, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetByProductAndVehicle(ctx context.Context, productID, vehicleModelID uuid.UUID) (*models.VehicleCompatibility, error) {
	args := m.Called(ctx, productID, vehicleModelID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetCompatibleProducts(ctx context.Context, vehicleModelID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, vehicleModelID, year, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetCompatibleVehicles(ctx context.Context, productID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, productID, year, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetVerified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetUnverified(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) CountByProduct(ctx context.Context, productID uuid.UUID) (int64, error) {
	args := m.Called(ctx, productID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) CountByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) (int64, error) {
	args := m.Called(ctx, vehicleModelID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) GetWithRelations(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) ListWithRelations(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.VehicleCompatibility), args.Error(1)
}

func (m *MockVehicleCompatibilityRepository) BulkCreate(ctx context.Context, compatibilities []*models.VehicleCompatibility) error {
	args := m.Called(ctx, compatibilities)
	return args.Error(0)
}

func (m *MockVehicleCompatibilityRepository) DeleteByProduct(ctx context.Context, productID uuid.UUID) error {
	args := m.Called(ctx, productID)
	return args.Error(0)
}

func (m *MockVehicleCompatibilityRepository) DeleteByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) error {
	args := m.Called(ctx, vehicleModelID)
	return args.Error(0)
}

type MockProductRepository struct {
	mock.Mock
}

func (m *MockProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Product), args.Error(1)
}

type MockVehicleModelRepository struct {
	mock.Mock
}

func (m *MockVehicleModelRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.VehicleModel), args.Error(1)
}

// Test helper functions
func createTestCompatibility() *models.VehicleCompatibility {
	return &models.VehicleCompatibility{
		ID:             uuid.New(),
		ProductID:      uuid.New(),
		VehicleModelID: uuid.New(),
		YearFrom:       2020,
		YearTo:         2023,
		Notes:          "Compatible with all variants",
		IsVerified:     false,
		IsActive:       true,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

func createTestProduct(isActive bool) *models.Product {
	return &models.Product{
		ID:          uuid.New(),
		SKU:         "TEST-001",
		Name:        "Test Product",
		IsActive:    isActive,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

func createTestVehicleModel(isActive bool) *models.VehicleModel {
	return &models.VehicleModel{
		ID:             uuid.New(),
		VehicleBrandID: uuid.New(),
		Code:           "TEST-001",
		Name:           "Test Model",
		IsActive:       isActive,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
}

// Test CreateCompatibility
func TestService_CreateCompatibility(t *testing.T) {
	tests := []struct {
		name           string
		compatibility  *models.VehicleCompatibility
		setupMocks     func(*MockVehicleCompatibilityRepository, *MockProductRepository, *MockVehicleModelRepository)
		expectedError  error
		expectedResult bool
	}{
		{
			name:          "successful creation",
			compatibility: createTestCompatibility(),
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				product := createTestProduct(true)
				vehicleModel := createTestVehicleModel(true)
				
				mockCompatRepo.On("GetByProductAndVehicle", mock.Anything, mock.Anything, mock.Anything).Return(nil, assert.AnError)
				mockProductRepo.On("GetByID", mock.Anything, mock.Anything).Return(product, nil)
				mockVehicleModelRepo.On("GetByID", mock.Anything, mock.Anything).Return(vehicleModel, nil)
				mockCompatRepo.On("Create", mock.Anything, mock.Anything).Return(nil)
			},
			expectedError:  nil,
			expectedResult: true,
		},
		{
			name:          "invalid input - nil compatibility",
			compatibility: nil,
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				// No mocks needed
			},
			expectedError:  ErrInvalidInput,
			expectedResult: false,
		},
		{
			name: "invalid input - missing product ID",
			compatibility: &models.VehicleCompatibility{
				VehicleModelID: uuid.New(),
				YearFrom:       2020,
				YearTo:         2023,
			},
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				// No mocks needed
			},
			expectedError:  assert.AnError,
			expectedResult: false,
		},
		{
			name: "duplicate compatibility",
			compatibility: createTestCompatibility(),
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				existingCompatibility := createTestCompatibility()
				mockCompatRepo.On("GetByProductAndVehicle", mock.Anything, mock.Anything, mock.Anything).Return(existingCompatibility, nil)
			},
			expectedError:  ErrDuplicateCompatibility,
			expectedResult: false,
		},
		{
			name:          "product not found",
			compatibility: createTestCompatibility(),
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				mockCompatRepo.On("GetByProductAndVehicle", mock.Anything, mock.Anything, mock.Anything).Return(nil, assert.AnError)
				mockProductRepo.On("GetByID", mock.Anything, mock.Anything).Return(nil, assert.AnError)
			},
			expectedError:  ErrProductNotFound,
			expectedResult: false,
		},
		{
			name:          "product inactive",
			compatibility: createTestCompatibility(),
			setupMocks: func(mockCompatRepo *MockVehicleCompatibilityRepository, mockProductRepo *MockProductRepository, mockVehicleModelRepo *MockVehicleModelRepository) {
				product := createTestProduct(false)
				mockCompatRepo.On("GetByProductAndVehicle", mock.Anything, mock.Anything, mock.Anything).Return(nil, assert.AnError)
				mockProductRepo.On("GetByID", mock.Anything, mock.Anything).Return(product, nil)
			},
			expectedError:  ErrProductInactive,
			expectedResult: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCompatRepo := &MockVehicleCompatibilityRepository{}
			mockProductRepo := &MockProductRepository{}
			mockVehicleModelRepo := &MockVehicleModelRepository{}

			tt.setupMocks(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			service := NewService(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			result, err := service.CreateCompatibility(context.Background(), tt.compatibility)

			if tt.expectedError != nil {
				assert.Error(t, err)
				assert.Nil(t, result)
			} else {
				assert.NoError(t, err)
				if tt.expectedResult {
					assert.NotNil(t, result)
					assert.True(t, result.IsActive)
					assert.False(t, result.IsVerified)
				}
			}

			mockCompatRepo.AssertExpectations(t)
			mockProductRepo.AssertExpectations(t)
			mockVehicleModelRepo.AssertExpectations(t)
		})
	}
}

// Test GetCompatibilityByID
func TestService_GetCompatibilityByID(t *testing.T) {
	tests := []struct {
		name          string
		id            uuid.UUID
		setupMocks    func(*MockVehicleCompatibilityRepository)
		expectedError error
	}{
		{
			name: "successful retrieval",
			id:   uuid.New(),
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				compatibility := createTestCompatibility()
				mockRepo.On("GetByID", mock.Anything, mock.Anything).Return(compatibility, nil)
			},
			expectedError: nil,
		},
		{
			name: "compatibility not found",
			id:   uuid.New(),
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				mockRepo.On("GetByID", mock.Anything, mock.Anything).Return(&models.VehicleCompatibility{}, assert.AnError)
			},
			expectedError: ErrCompatibilityNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCompatRepo := &MockVehicleCompatibilityRepository{}
			mockProductRepo := &MockProductRepository{}
			mockVehicleModelRepo := &MockVehicleModelRepository{}

			tt.setupMocks(mockCompatRepo)

			service := NewService(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			result, err := service.GetCompatibilityByID(context.Background(), tt.id)

			if tt.expectedError != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.expectedError, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockCompatRepo.AssertExpectations(t)
		})
	}
}

// Test ValidateYearRange
func TestService_ValidateYearRange(t *testing.T) {
	tests := []struct {
		name          string
		yearFrom      int
		yearTo        int
		expectedError bool
	}{
		{
			name:          "valid range",
			yearFrom:      2020,
			yearTo:        2023,
			expectedError: false,
		},
		{
			name:          "valid range - same year",
			yearFrom:      2020,
			yearTo:        2020,
			expectedError: false,
		},
		{
			name:          "invalid range - from greater than to",
			yearFrom:      2023,
			yearTo:        2020,
			expectedError: true,
		},
		{
			name:          "invalid yearFrom - too old",
			yearFrom:      1800,
			yearTo:        2020,
			expectedError: true,
		},
		{
			name:          "invalid yearFrom - too future",
			yearFrom:      2200,
			yearTo:        2300,
			expectedError: true,
		},
		{
			name:          "invalid yearTo - too old",
			yearFrom:      2020,
			yearTo:        1800,
			expectedError: true,
		},
		{
			name:          "invalid yearTo - too future",
			yearFrom:      2020,
			yearTo:        2200,
			expectedError: true,
		},
		{
			name:          "zero years - valid",
			yearFrom:      0,
			yearTo:        0,
			expectedError: false,
		},
		{
			name:          "only yearFrom provided - valid",
			yearFrom:      2020,
			yearTo:        0,
			expectedError: false,
		},
		{
			name:          "only yearTo provided - valid",
			yearFrom:      0,
			yearTo:        2020,
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := NewService(nil, nil, nil)

			err := service.ValidateYearRange(tt.yearFrom, tt.yearTo)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

// Test BulkCreateCompatibilities
func TestService_BulkCreateCompatibilities(t *testing.T) {
	tests := []struct {
		name            string
		compatibilities []*models.VehicleCompatibility
		setupMocks      func(*MockVehicleCompatibilityRepository)
		expectedError   bool
	}{
		{
			name: "successful bulk creation",
			compatibilities: []*models.VehicleCompatibility{
				createTestCompatibility(),
				createTestCompatibility(),
			},
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				mockRepo.On("BulkCreate", mock.Anything, mock.Anything).Return(nil)
			},
			expectedError: false,
		},
		{
			name:            "empty compatibilities",
			compatibilities: []*models.VehicleCompatibility{},
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				// No mocks needed
			},
			expectedError: true,
		},
		{
			name: "invalid compatibility in bulk",
			compatibilities: []*models.VehicleCompatibility{
				createTestCompatibility(),
				{
					// Missing required fields
					YearFrom: 2020,
					YearTo:   2023,
				},
			},
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				// No mocks needed
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCompatRepo := &MockVehicleCompatibilityRepository{}
			mockProductRepo := &MockProductRepository{}
			mockVehicleModelRepo := &MockVehicleModelRepository{}

			tt.setupMocks(mockCompatRepo)

			service := NewService(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			err := service.BulkCreateCompatibilities(context.Background(), tt.compatibilities)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				// Verify that defaults are set
				for _, comp := range tt.compatibilities {
					assert.True(t, comp.IsActive)
					assert.False(t, comp.IsVerified)
				}
			}

			mockCompatRepo.AssertExpectations(t)
		})
	}
}

// Test VerifyCompatibility
func TestService_VerifyCompatibility(t *testing.T) {
	tests := []struct {
		name          string
		id            uuid.UUID
		setupMocks    func(*MockVehicleCompatibilityRepository)
		expectedError error
	}{
		{
			name: "successful verification",
			id:   uuid.New(),
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				compatibility := createTestCompatibility()
				compatibility.IsVerified = false
				mockRepo.On("GetByID", mock.Anything, mock.Anything).Return(compatibility, nil)
				mockRepo.On("Update", mock.Anything, mock.MatchedBy(func(c *models.VehicleCompatibility) bool {
					return c.IsVerified == true
				})).Return(nil)
			},
			expectedError: nil,
		},
		{
			name: "compatibility not found",
			id:   uuid.New(),
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				mockRepo.On("GetByID", mock.Anything, mock.Anything).Return(&models.VehicleCompatibility{}, assert.AnError)
			},
			expectedError: ErrCompatibilityNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCompatRepo := &MockVehicleCompatibilityRepository{}
			mockProductRepo := &MockProductRepository{}
			mockVehicleModelRepo := &MockVehicleModelRepository{}

			tt.setupMocks(mockCompatRepo)

			service := NewService(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			err := service.VerifyCompatibility(context.Background(), tt.id)

			if tt.expectedError != nil {
				assert.Error(t, err)
				assert.Equal(t, tt.expectedError, err)
			} else {
				assert.NoError(t, err)
			}

			mockCompatRepo.AssertExpectations(t)
		})
	}
}

// Test GetCompatibleProducts
func TestService_GetCompatibleProducts(t *testing.T) {
	tests := []struct {
		name            string
		vehicleModelID  uuid.UUID
		year            int
		limit           int
		offset          int
		setupMocks      func(*MockVehicleCompatibilityRepository)
		expectedError   error
	}{
		{
			name:           "successful retrieval",
			vehicleModelID: uuid.New(),
			year:           2022,
			limit:          10,
			offset:         0,
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				compatibilities := []*models.VehicleCompatibility{createTestCompatibility()}
				mockRepo.On("GetCompatibleProducts", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(compatibilities, nil)
			},
			expectedError: nil,
		},
		{
			name:           "invalid year - too old",
			vehicleModelID: uuid.New(),
			year:           1800,
			limit:          10,
			offset:         0,
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				// No mocks needed
			},
			expectedError: assert.AnError,
		},
		{
			name:           "invalid year - too future",
			vehicleModelID: uuid.New(),
			year:           2200,
			limit:          10,
			offset:         0,
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				// No mocks needed
			},
			expectedError: assert.AnError,
		},
		{
			name:           "year zero (no year filter)",
			vehicleModelID: uuid.New(),
			year:           0,
			limit:          10,
			offset:         0,
			setupMocks: func(mockRepo *MockVehicleCompatibilityRepository) {
				compatibilities := []*models.VehicleCompatibility{createTestCompatibility()}
				mockRepo.On("GetCompatibleProducts", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(compatibilities, nil)
			},
			expectedError: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockCompatRepo := &MockVehicleCompatibilityRepository{}
			mockProductRepo := &MockProductRepository{}
			mockVehicleModelRepo := &MockVehicleModelRepository{}

			tt.setupMocks(mockCompatRepo)

			service := NewService(mockCompatRepo, mockProductRepo, mockVehicleModelRepo)

			result, err := service.GetCompatibleProducts(context.Background(), tt.vehicleModelID, tt.year, tt.limit, tt.offset)

			if tt.expectedError != nil {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, result)
			}

			mockCompatRepo.AssertExpectations(t)
		})
	}
}