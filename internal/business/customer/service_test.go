package customer

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"inventory-api/internal/repository/models"
)

// MockCustomerRepository is a mock implementation of CustomerRepository
type MockCustomerRepository struct {
	mock.Mock
}

func (m *MockCustomerRepository) Create(ctx context.Context, customer *models.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *MockCustomerRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Customer, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) GetByCode(ctx context.Context, code string) (*models.Customer, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) GetByName(ctx context.Context, name string) (*models.Customer, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) GetByEmail(ctx context.Context, email string) (*models.Customer, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) Update(ctx context.Context, customer *models.Customer) error {
	args := m.Called(ctx, customer)
	return args.Error(0)
}

func (m *MockCustomerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockCustomerRepository) List(ctx context.Context, limit, offset int) ([]*models.Customer, error) {
	args := m.Called(ctx, limit, offset)
	return args.Get(0).([]*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) GetActive(ctx context.Context) ([]*models.Customer, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.Customer), args.Error(1)
}

func (m *MockCustomerRepository) Count(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockCustomerRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Customer, error) {
	args := m.Called(ctx, query, limit, offset)
	return args.Get(0).([]*models.Customer), args.Error(1)
}

func TestNewService(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	service := NewService(mockRepo)
	
	assert.NotNil(t, service)
}

func TestService_ValidateCustomer(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	service := NewService(mockRepo)
	ctx := context.Background()

	tests := []struct {
		name        string
		customer    *models.Customer
		isUpdate    bool
		expectError bool
		errorMsg    string
	}{
		{
			name:        "nil customer",
			customer:    nil,
			isUpdate:    false,
			expectError: true,
			errorMsg:    "invalid input data",
		},
		{
			name: "empty name",
			customer: &models.Customer{
				Name: "",
			},
			isUpdate:    false,
			expectError: true,
			errorMsg:    "customer name is required",
		},
		{
			name: "valid customer",
			customer: &models.Customer{
				Name:        "Test Customer",
				Code:        "TST001",
				Email:       "test@example.com",
				Phone:       "1234567890",
				CreditLimit: 1000.00,
			},
			isUpdate:    false,
			expectError: false,
		},
		{
			name: "invalid email",
			customer: &models.Customer{
				Name:  "Test Customer",
				Email: "invalid-email",
			},
			isUpdate:    false,
			expectError: true,
			errorMsg:    "invalid email format",
		},
		{
			name: "negative credit limit",
			customer: &models.Customer{
				Name:        "Test Customer",
				CreditLimit: -100.00,
			},
			isUpdate:    false,
			expectError: true,
			errorMsg:    "credit limit cannot be negative",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateCustomer(ctx, tt.customer, tt.isUpdate)
			
			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestService_GenerateCustomerCode(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	service := NewService(mockRepo)
	ctx := context.Background()

	tests := []struct {
		name         string
		customerName string
		setupMock    func()
		expectedCode string
		expectError  bool
	}{
		{
			name:         "empty name",
			customerName: "",
			setupMock:    func() {},
			expectError:  true,
		},
		{
			name:         "generate from ABC Customer",
			customerName: "ABC Customer",
			setupMock: func() {
				// Mock that ABC001 doesn't exist
				mockRepo.On("GetByCode", ctx, "ABC001").Return(nil, assert.AnError).Once()
			},
			expectedCode: "ABC001",
			expectError:  false,
		},
		{
			name:         "generate from A Company",
			customerName: "A Company",
			setupMock: func() {
				// Mock that ACO001 doesn't exist
				mockRepo.On("GetByCode", ctx, "ACO001").Return(nil, assert.AnError).Once()
			},
			expectedCode: "ACO001",
			expectError:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo.ExpectedCalls = nil // Clear previous expectations
			tt.setupMock()
			
			code, err := service.GenerateCustomerCode(ctx, tt.customerName)
			
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedCode, code)
			}
			
			mockRepo.AssertExpectations(t)
		})
	}
}

func TestService_CreateCustomer(t *testing.T) {
	mockRepo := new(MockCustomerRepository)
	service := NewService(mockRepo)
	ctx := context.Background()

	validCustomer := &models.Customer{
		Name:        "Test Customer",
		Code:        "TST001",
		Email:       "test@example.com",
		Phone:       "1234567890",
		CreditLimit: 1000.00,
	}

	t.Run("successful creation", func(t *testing.T) {
		mockRepo.ExpectedCalls = nil
		
		// Mock that code and email don't exist
		mockRepo.On("GetByCode", ctx, "TST001").Return(nil, assert.AnError).Once()
		mockRepo.On("GetByEmail", ctx, "test@example.com").Return(nil, assert.AnError).Once()
		mockRepo.On("Create", ctx, mock.MatchedBy(func(c *models.Customer) bool {
			return c.Name == "Test Customer" && c.IsActive == true
		})).Return(nil).Once()

		result, err := service.CreateCustomer(ctx, validCustomer)
		
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "Test Customer", result.Name)
		assert.True(t, result.IsActive)
		assert.Equal(t, "Malaysia", result.Country) // Default country
		
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate customer code", func(t *testing.T) {
		mockRepo.ExpectedCalls = nil
		
		existingCustomer := &models.Customer{ID: uuid.New(), Code: "TST001"}
		mockRepo.On("GetByCode", ctx, "TST001").Return(existingCustomer, nil).Once()

		_, err := service.CreateCustomer(ctx, validCustomer)
		
		assert.Error(t, err)
		assert.Equal(t, ErrCustomerCodeExists, err)
		
		mockRepo.AssertExpectations(t)
	})
}