package brand

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"inventory-api/internal/repository/models"
)

// MockBrandRepository is a mock implementation of BrandRepository
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

func TestBrandService_CreateBrand(t *testing.T) {
	ctx := context.Background()

	t.Run("successful brand creation", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name:        "Bosch",
			Description: "German automotive parts manufacturer",
			Website:     "https://www.bosch.com",
			CountryCode: "DE",
		}

		mockRepo.On("GetByCode", ctx, "BOSC").Return(nil, errors.New("not found")).Once()
		mockRepo.On("GetByName", ctx, "Bosch").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Brand")).Return(nil).Once()

		result, err := service.CreateBrand(ctx, brand)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.True(t, result.IsActive)
		assert.NotEmpty(t, result.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("brand name already exists", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		
		existingBrand := &models.Brand{
			ID:   uuid.New(),
			Name: "Bosch",
		}

		brand := &models.Brand{
			Name: "Bosch",
		}

		mockRepo.On("GetByName", ctx, "Bosch").Return(existingBrand, nil).Once()

		_, err := service.CreateBrand(ctx, brand)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandExists, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("brand code already exists", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		
		existingBrand := &models.Brand{
			ID:   uuid.New(),
			Code: "BOSCH",
		}

		brand := &models.Brand{
			Name: "Bosch",
			Code: "BOSCH",
		}

		mockRepo.On("GetByName", ctx, "Bosch").Return(nil, errors.New("not found")).Once()
		mockRepo.On("GetByCode", ctx, "BOSCH").Return(existingBrand, nil).Once()

		_, err := service.CreateBrand(ctx, brand)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandCodeExists, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid brand name", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		
		brand := &models.Brand{
			Name: "", // Empty name
		}

		_, err := service.CreateBrand(ctx, brand)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "brand name is required")
	})
}

func TestBrandService_GetBrandByID(t *testing.T) {
	ctx := context.Background()
	brandID := uuid.New()

	t.Run("successful retrieval", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		expectedBrand := &models.Brand{
			ID:   brandID,
			Name: "NGK",
			Code: "NGK",
		}

		mockRepo.On("GetByID", ctx, brandID).Return(expectedBrand, nil).Once()

		result, err := service.GetBrandByID(ctx, brandID)

		assert.NoError(t, err)
		assert.Equal(t, expectedBrand, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("brand not found", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		
		mockRepo.On("GetByID", ctx, brandID).Return(nil, errors.New("not found")).Once()

		_, err := service.GetBrandByID(ctx, brandID)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestBrandService_UpdateBrand(t *testing.T) {
	ctx := context.Background()
	brandID := uuid.New()

	t.Run("successful update", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		existingBrand := &models.Brand{
			ID:   brandID,
			Name: "NGK",
			Code: "NGK",
		}

		updatedBrand := &models.Brand{
			ID:          brandID,
			Name:        "NGK Spark Plugs",
			Code:        "NGK",
			Description: "Updated description",
		}

		mockRepo.On("GetByID", ctx, brandID).Return(existingBrand, nil).Once()
		mockRepo.On("GetByName", ctx, "NGK Spark Plugs").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Update", ctx, updatedBrand).Return(nil).Once()

		err := service.UpdateBrand(ctx, updatedBrand)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("brand not found", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			ID:   brandID,
			Name: "NonExistent",
		}

		mockRepo.On("GetByID", ctx, brandID).Return(nil, errors.New("not found")).Once()

		err := service.UpdateBrand(ctx, brand)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate name", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		existingBrand := &models.Brand{
			ID:   brandID,
			Name: "NGK",
			Code: "NGK",
		}

		duplicateBrand := &models.Brand{
			ID:   uuid.New(),
			Name: "Bosch",
			Code: "BOSCH",
		}

		updatedBrand := &models.Brand{
			ID:   brandID,
			Name: "Bosch", // Trying to change to existing name
			Code: "NGK",
		}

		mockRepo.On("GetByID", ctx, brandID).Return(existingBrand, nil).Once()
		mockRepo.On("GetByName", ctx, "Bosch").Return(duplicateBrand, nil).Once()

		err := service.UpdateBrand(ctx, updatedBrand)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandExists, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestBrandService_ValidateBrand(t *testing.T) {
	ctx := context.Background()

	t.Run("valid brand", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name:        "Bosch",
			Code:        "BOSCH",
			Description: "German automotive manufacturer",
			Website:     "https://www.bosch.com",
			CountryCode: "de",
			LogoURL:     "https://www.bosch.com/logo.png",
		}

		err := service.ValidateBrand(ctx, brand, false)

		assert.NoError(t, err)
		assert.Equal(t, "DE", brand.CountryCode) // Should be normalized to uppercase
	})

	t.Run("invalid brand - nil", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)

		err := service.ValidateBrand(ctx, nil, false)

		assert.Error(t, err)
		assert.Equal(t, ErrInvalidInput, err)
	})

	t.Run("invalid brand - empty name", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name: "",
		}

		err := service.ValidateBrand(ctx, brand, false)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "brand name is required")
	})

	t.Run("invalid brand - name too long", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name: strings.Repeat("a", 101),
		}

		err := service.ValidateBrand(ctx, brand, false)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "brand name must be less than 100 characters")
	})

	t.Run("invalid brand - invalid website URL", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name:    "Test Brand",
			Website: "invalid-url",
		}

		err := service.ValidateBrand(ctx, brand, false)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid website URL format")
	})

	t.Run("invalid brand - invalid country code", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		brand := &models.Brand{
			Name:        "Test Brand",
			CountryCode: "INVALID",
		}

		err := service.ValidateBrand(ctx, brand, false)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "country code must be 2 or 3 letter ISO country code")
	})
}

func TestBrandService_GenerateBrandCode(t *testing.T) {
	ctx := context.Background()

	t.Run("single word brand", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)

		mockRepo.On("GetByCode", ctx, "BOSC").Return(nil, errors.New("not found")).Once()

		code, err := service.GenerateBrandCode(ctx, "Bosch")

		assert.NoError(t, err)
		assert.Equal(t, "BOSC", code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("multi-word brand", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)

		mockRepo.On("GetByCode", ctx, "NSP").Return(nil, errors.New("not found")).Once()

		code, err := service.GenerateBrandCode(ctx, "NGK Spark Plugs")

		assert.NoError(t, err)
		assert.Equal(t, "NSP", code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("code collision - sequential numbering", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		existingBrand := &models.Brand{Code: "NSP"}
		
		mockRepo.On("GetByCode", ctx, "NSP").Return(existingBrand, nil).Once()
		mockRepo.On("GetByCode", ctx, "NSP01").Return(nil, errors.New("not found")).Once()

		code, err := service.GenerateBrandCode(ctx, "NGK Spark Plugs")

		assert.NoError(t, err)
		assert.Equal(t, "NSP01", code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty name", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)

		_, err := service.GenerateBrandCode(ctx, "")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "brand name is required")
	})
}

func TestBrandService_DeactivateBrand(t *testing.T) {
	ctx := context.Background()
	brandID := uuid.New()

	t.Run("successful deactivation", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)
		existingBrand := &models.Brand{
			ID:       brandID,
			Name:     "Test Brand",
			IsActive: true,
		}

		mockRepo.On("GetByID", ctx, brandID).Return(existingBrand, nil).Once()
		mockRepo.On("Update", ctx, mock.MatchedBy(func(brand *models.Brand) bool {
			return brand.ID == brandID && !brand.IsActive
		})).Return(nil).Once()

		err := service.DeactivateBrand(ctx, brandID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("brand not found", func(t *testing.T) {
		mockRepo := new(MockBrandRepository)
		service := NewService(mockRepo)

		mockRepo.On("GetByID", ctx, brandID).Return(nil, errors.New("not found")).Once()

		err := service.DeactivateBrand(ctx, brandID)

		assert.Error(t, err)
		assert.Equal(t, ErrBrandNotFound, err)
		mockRepo.AssertExpectations(t)
	})
}