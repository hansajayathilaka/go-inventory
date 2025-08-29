package compatibility

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrCompatibilityNotFound        = errors.New("vehicle compatibility not found")
	ErrCompatibilityExists          = errors.New("compatibility already exists for this product and vehicle model")
	ErrInvalidInput                 = errors.New("invalid input data")
	ErrInvalidYearRange             = errors.New("invalid year range")
	ErrProductNotFound              = errors.New("product not found")
	ErrVehicleModelNotFound         = errors.New("vehicle model not found")
	ErrProductInactive              = errors.New("product is inactive")
	ErrVehicleModelInactive         = errors.New("vehicle model is inactive")
	ErrDuplicateCompatibility       = errors.New("duplicate compatibility entry")
	ErrCompatibilityInactive        = errors.New("compatibility is inactive")
)

type Service interface {
	// Core CRUD operations
	CreateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility) (*models.VehicleCompatibility, error)
	GetCompatibilityByID(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error)
	UpdateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility) error
	DeleteCompatibility(ctx context.Context, id uuid.UUID) error
	ListCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	
	// Status management
	GetActiveCompatibilities(ctx context.Context) ([]*models.VehicleCompatibility, error)
	GetInactiveCompatibilities(ctx context.Context) ([]*models.VehicleCompatibility, error)
	ActivateCompatibility(ctx context.Context, id uuid.UUID) error
	DeactivateCompatibility(ctx context.Context, id uuid.UUID) error
	
	// Verification management
	GetVerifiedCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetUnverifiedCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	VerifyCompatibility(ctx context.Context, id uuid.UUID) error
	UnverifyCompatibility(ctx context.Context, id uuid.UUID) error
	
	// Search and filter operations
	GetCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetCompatibilityByProductAndVehicle(ctx context.Context, productID, vehicleModelID uuid.UUID) (*models.VehicleCompatibility, error)
	
	// Advanced search operations
	GetCompatibleProducts(ctx context.Context, vehicleModelID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error)
	GetCompatibleVehicles(ctx context.Context, productID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error)
	
	// Bulk operations
	BulkCreateCompatibilities(ctx context.Context, compatibilities []*models.VehicleCompatibility) error
	BulkVerifyCompatibilities(ctx context.Context, ids []uuid.UUID) error
	BulkUnverifyCompatibilities(ctx context.Context, ids []uuid.UUID) error
	BulkActivateCompatibilities(ctx context.Context, ids []uuid.UUID) error
	BulkDeactivateCompatibilities(ctx context.Context, ids []uuid.UUID) error
	
	// Cleanup operations
	DeleteCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID) error
	DeleteCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) error
	
	// Relations and detailed views
	GetCompatibilityWithRelations(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error)
	ListCompatibilitiesWithRelations(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error)
	
	// Statistics and counts
	CountCompatibilities(ctx context.Context) (int64, error)
	CountCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID) (int64, error)
	CountCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) (int64, error)
	CountVerifiedCompatibilities(ctx context.Context) (int64, error)
	CountUnverifiedCompatibilities(ctx context.Context) (int64, error)
	CountActiveCompatibilities(ctx context.Context) (int64, error)
	
	// Validation methods
	ValidateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility, isUpdate bool) error
	ValidateYearRange(yearFrom, yearTo int) error
	CheckDuplicateCompatibility(ctx context.Context, productID, vehicleModelID uuid.UUID, excludeID *uuid.UUID) error
}

type service struct {
	compatibilityRepo interfaces.VehicleCompatibilityRepository
	productRepo       interfaces.ProductRepository
	vehicleModelRepo  interfaces.VehicleModelRepository
}

func NewService(
	compatibilityRepo interfaces.VehicleCompatibilityRepository,
	productRepo interfaces.ProductRepository,
	vehicleModelRepo interfaces.VehicleModelRepository,
) Service {
	return &service{
		compatibilityRepo: compatibilityRepo,
		productRepo:       productRepo,
		vehicleModelRepo:  vehicleModelRepo,
	}
}

// ===============================
// Core CRUD Operations
// ===============================

func (s *service) CreateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility) (*models.VehicleCompatibility, error) {
	if err := s.ValidateCompatibility(ctx, compatibility, false); err != nil {
		return nil, err
	}

	// Check for duplicate compatibility
	if err := s.CheckDuplicateCompatibility(ctx, compatibility.ProductID, compatibility.VehicleModelID, nil); err != nil {
		return nil, err
	}

	// Verify product exists and is active
	product, err := s.productRepo.GetByID(ctx, compatibility.ProductID)
	if err != nil {
		return nil, ErrProductNotFound
	}
	if !product.IsActive {
		return nil, ErrProductInactive
	}

	// Verify vehicle model exists and is active
	vehicleModel, err := s.vehicleModelRepo.GetByID(ctx, compatibility.VehicleModelID)
	if err != nil {
		return nil, ErrVehicleModelNotFound
	}
	if !vehicleModel.IsActive {
		return nil, ErrVehicleModelInactive
	}

	// Set defaults
	compatibility.IsActive = true
	compatibility.IsVerified = false

	if err := s.compatibilityRepo.Create(ctx, compatibility); err != nil {
		return nil, fmt.Errorf("failed to create compatibility: %w", err)
	}

	return compatibility, nil
}

func (s *service) GetCompatibilityByID(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	compatibility, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCompatibilityNotFound
	}
	return compatibility, nil
}

func (s *service) UpdateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility) error {
	if err := s.ValidateCompatibility(ctx, compatibility, true); err != nil {
		return err
	}

	// Check if compatibility exists
	existingCompatibility, err := s.compatibilityRepo.GetByID(ctx, compatibility.ID)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	// Check for duplicate compatibility (excluding current record)
	if compatibility.ProductID != existingCompatibility.ProductID || compatibility.VehicleModelID != existingCompatibility.VehicleModelID {
		if err := s.CheckDuplicateCompatibility(ctx, compatibility.ProductID, compatibility.VehicleModelID, &compatibility.ID); err != nil {
			return err
		}
	}

	// Verify product exists and is active
	product, err := s.productRepo.GetByID(ctx, compatibility.ProductID)
	if err != nil {
		return ErrProductNotFound
	}
	if !product.IsActive {
		return ErrProductInactive
	}

	// Verify vehicle model exists and is active
	vehicleModel, err := s.vehicleModelRepo.GetByID(ctx, compatibility.VehicleModelID)
	if err != nil {
		return ErrVehicleModelNotFound
	}
	if !vehicleModel.IsActive {
		return ErrVehicleModelInactive
	}

	if err := s.compatibilityRepo.Update(ctx, compatibility); err != nil {
		return fmt.Errorf("failed to update compatibility: %w", err)
	}

	return nil
}

func (s *service) DeleteCompatibility(ctx context.Context, id uuid.UUID) error {
	// Check if compatibility exists
	_, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	if err := s.compatibilityRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete compatibility: %w", err)
	}

	return nil
}

func (s *service) ListCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.List(ctx, limit, offset)
}

// ===============================
// Status Management
// ===============================

func (s *service) GetActiveCompatibilities(ctx context.Context) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.GetActive(ctx)
}

func (s *service) GetInactiveCompatibilities(ctx context.Context) ([]*models.VehicleCompatibility, error) {
	// Get all compatibilities and filter inactive ones
	compatibilities, err := s.compatibilityRepo.List(ctx, 1000, 0)
	if err != nil {
		return nil, err
	}

	var inactive []*models.VehicleCompatibility
	for _, comp := range compatibilities {
		if !comp.IsActive {
			inactive = append(inactive, comp)
		}
	}

	return inactive, nil
}

func (s *service) ActivateCompatibility(ctx context.Context, id uuid.UUID) error {
	compatibility, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	compatibility.IsActive = true
	return s.compatibilityRepo.Update(ctx, compatibility)
}

func (s *service) DeactivateCompatibility(ctx context.Context, id uuid.UUID) error {
	compatibility, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	compatibility.IsActive = false
	return s.compatibilityRepo.Update(ctx, compatibility)
}

// ===============================
// Verification Management
// ===============================

func (s *service) GetVerifiedCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.GetVerified(ctx, limit, offset)
}

func (s *service) GetUnverifiedCompatibilities(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.GetUnverified(ctx, limit, offset)
}

func (s *service) VerifyCompatibility(ctx context.Context, id uuid.UUID) error {
	compatibility, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	compatibility.IsVerified = true
	return s.compatibilityRepo.Update(ctx, compatibility)
}

func (s *service) UnverifyCompatibility(ctx context.Context, id uuid.UUID) error {
	compatibility, err := s.compatibilityRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCompatibilityNotFound
	}

	compatibility.IsVerified = false
	return s.compatibilityRepo.Update(ctx, compatibility)
}

// ===============================
// Search and Filter Operations
// ===============================

func (s *service) GetCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.GetByProductID(ctx, productID, limit, offset)
}

func (s *service) GetCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.GetByVehicleModelID(ctx, vehicleModelID, limit, offset)
}

func (s *service) GetCompatibilityByProductAndVehicle(ctx context.Context, productID, vehicleModelID uuid.UUID) (*models.VehicleCompatibility, error) {
	compatibility, err := s.compatibilityRepo.GetByProductAndVehicle(ctx, productID, vehicleModelID)
	if err != nil {
		return nil, ErrCompatibilityNotFound
	}
	return compatibility, nil
}

// ===============================
// Advanced Search Operations
// ===============================

func (s *service) GetCompatibleProducts(ctx context.Context, vehicleModelID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	// Validate year if provided
	if year > 0 {
		if year < 1900 || year > 2100 {
			return nil, errors.New("year must be between 1900 and 2100")
		}
	}

	return s.compatibilityRepo.GetCompatibleProducts(ctx, vehicleModelID, year, limit, offset)
}

func (s *service) GetCompatibleVehicles(ctx context.Context, productID uuid.UUID, year int, limit, offset int) ([]*models.VehicleCompatibility, error) {
	// Validate year if provided
	if year > 0 {
		if year < 1900 || year > 2100 {
			return nil, errors.New("year must be between 1900 and 2100")
		}
	}

	return s.compatibilityRepo.GetCompatibleVehicles(ctx, productID, year, limit, offset)
}

// ===============================
// Bulk Operations
// ===============================

func (s *service) BulkCreateCompatibilities(ctx context.Context, compatibilities []*models.VehicleCompatibility) error {
	if len(compatibilities) == 0 {
		return errors.New("no compatibilities provided")
	}

	// Validate all compatibilities first
	for i, compatibility := range compatibilities {
		if err := s.ValidateCompatibility(ctx, compatibility, false); err != nil {
			return fmt.Errorf("validation failed for compatibility %d: %w", i, err)
		}
		
		// Set defaults
		compatibility.IsActive = true
		compatibility.IsVerified = false
	}

	return s.compatibilityRepo.BulkCreate(ctx, compatibilities)
}

func (s *service) BulkVerifyCompatibilities(ctx context.Context, ids []uuid.UUID) error {
	for _, id := range ids {
		if err := s.VerifyCompatibility(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

func (s *service) BulkUnverifyCompatibilities(ctx context.Context, ids []uuid.UUID) error {
	for _, id := range ids {
		if err := s.UnverifyCompatibility(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

func (s *service) BulkActivateCompatibilities(ctx context.Context, ids []uuid.UUID) error {
	for _, id := range ids {
		if err := s.ActivateCompatibility(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

func (s *service) BulkDeactivateCompatibilities(ctx context.Context, ids []uuid.UUID) error {
	for _, id := range ids {
		if err := s.DeactivateCompatibility(ctx, id); err != nil {
			return err
		}
	}
	return nil
}

// ===============================
// Cleanup Operations
// ===============================

func (s *service) DeleteCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID) error {
	return s.compatibilityRepo.DeleteByProduct(ctx, productID)
}

func (s *service) DeleteCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) error {
	return s.compatibilityRepo.DeleteByVehicleModel(ctx, vehicleModelID)
}

// ===============================
// Relations and Detailed Views
// ===============================

func (s *service) GetCompatibilityWithRelations(ctx context.Context, id uuid.UUID) (*models.VehicleCompatibility, error) {
	compatibility, err := s.compatibilityRepo.GetWithRelations(ctx, id)
	if err != nil {
		return nil, ErrCompatibilityNotFound
	}
	return compatibility, nil
}

func (s *service) ListCompatibilitiesWithRelations(ctx context.Context, limit, offset int) ([]*models.VehicleCompatibility, error) {
	return s.compatibilityRepo.ListWithRelations(ctx, limit, offset)
}

// ===============================
// Statistics and Counts
// ===============================

func (s *service) CountCompatibilities(ctx context.Context) (int64, error) {
	return s.compatibilityRepo.Count(ctx)
}

func (s *service) CountCompatibilitiesByProduct(ctx context.Context, productID uuid.UUID) (int64, error) {
	return s.compatibilityRepo.CountByProduct(ctx, productID)
}

func (s *service) CountCompatibilitiesByVehicleModel(ctx context.Context, vehicleModelID uuid.UUID) (int64, error) {
	return s.compatibilityRepo.CountByVehicleModel(ctx, vehicleModelID)
}

func (s *service) CountVerifiedCompatibilities(ctx context.Context) (int64, error) {
	verified, err := s.compatibilityRepo.GetVerified(ctx, 10000, 0)
	if err != nil {
		return 0, err
	}
	return int64(len(verified)), nil
}

func (s *service) CountUnverifiedCompatibilities(ctx context.Context) (int64, error) {
	unverified, err := s.compatibilityRepo.GetUnverified(ctx, 10000, 0)
	if err != nil {
		return 0, err
	}
	return int64(len(unverified)), nil
}

func (s *service) CountActiveCompatibilities(ctx context.Context) (int64, error) {
	active, err := s.compatibilityRepo.GetActive(ctx)
	if err != nil {
		return 0, err
	}
	return int64(len(active)), nil
}

// ===============================
// Validation Methods
// ===============================

func (s *service) ValidateCompatibility(ctx context.Context, compatibility *models.VehicleCompatibility, isUpdate bool) error {
	if compatibility == nil {
		return ErrInvalidInput
	}

	// Validate required fields
	if compatibility.ProductID == uuid.Nil {
		return errors.New("product ID is required")
	}

	if compatibility.VehicleModelID == uuid.Nil {
		return errors.New("vehicle model ID is required")
	}

	// Validate year range
	if err := s.ValidateYearRange(compatibility.YearFrom, compatibility.YearTo); err != nil {
		return err
	}

	// Validate notes length
	if len(compatibility.Notes) > 500 {
		return errors.New("notes must be less than 500 characters")
	}

	return nil
}

func (s *service) ValidateYearRange(yearFrom, yearTo int) error {
	// Both years are optional, but if provided they must be valid
	if yearFrom > 0 {
		if yearFrom < 1900 || yearFrom > 2100 {
			return errors.New("year from must be between 1900 and 2100")
		}
	}

	if yearTo > 0 {
		if yearTo < 1900 || yearTo > 2100 {
			return errors.New("year to must be between 1900 and 2100")
		}
	}

	// If both are provided, yearFrom must be <= yearTo
	if yearFrom > 0 && yearTo > 0 {
		if yearFrom > yearTo {
			return ErrInvalidYearRange
		}
	}

	return nil
}

func (s *service) CheckDuplicateCompatibility(ctx context.Context, productID, vehicleModelID uuid.UUID, excludeID *uuid.UUID) error {
	existing, err := s.compatibilityRepo.GetByProductAndVehicle(ctx, productID, vehicleModelID)
	if err != nil {
		// No existing compatibility found, which is good
		return nil
	}

	// If we found an existing compatibility
	if excludeID != nil && existing.ID == *excludeID {
		// This is the same record we're updating, so it's okay
		return nil
	}

	return ErrDuplicateCompatibility
}