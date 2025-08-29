package vehicle

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrVehicleBrandNotFound     = errors.New("vehicle brand not found")
	ErrVehicleBrandExists       = errors.New("vehicle brand already exists")
	ErrVehicleBrandCodeExists   = errors.New("vehicle brand code already exists")
	ErrVehicleModelNotFound     = errors.New("vehicle model not found")
	ErrVehicleModelExists       = errors.New("vehicle model already exists")
	ErrVehicleModelCodeExists   = errors.New("vehicle model code already exists")
	ErrInvalidInput             = errors.New("invalid input data")
	ErrVehicleBrandInactive     = errors.New("vehicle brand is inactive")
	ErrVehicleModelInactive     = errors.New("vehicle model is inactive")
)

type Service interface {
	// Vehicle Brand operations
	CreateVehicleBrand(ctx context.Context, brand *models.VehicleBrand) (*models.VehicleBrand, error)
	GetVehicleBrandByID(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error)
	GetVehicleBrandByCode(ctx context.Context, code string) (*models.VehicleBrand, error)
	GetVehicleBrandByName(ctx context.Context, name string) (*models.VehicleBrand, error)
	UpdateVehicleBrand(ctx context.Context, brand *models.VehicleBrand) error
	DeleteVehicleBrand(ctx context.Context, id uuid.UUID) error
	ListVehicleBrands(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error)
	GetActiveVehicleBrands(ctx context.Context) ([]*models.VehicleBrand, error)
	SearchVehicleBrands(ctx context.Context, query string, limit, offset int) ([]*models.VehicleBrand, error)
	CountVehicleBrands(ctx context.Context) (int64, error)
	DeactivateVehicleBrand(ctx context.Context, id uuid.UUID) error
	ActivateVehicleBrand(ctx context.Context, id uuid.UUID) error
	GetVehicleBrandWithModels(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error)
	ListVehicleBrandsWithModels(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error)
	
	// Vehicle Model operations
	CreateVehicleModel(ctx context.Context, model *models.VehicleModel) (*models.VehicleModel, error)
	GetVehicleModelByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error)
	GetVehicleModelByCode(ctx context.Context, code string) (*models.VehicleModel, error)
	GetVehicleModelByName(ctx context.Context, name string) (*models.VehicleModel, error)
	UpdateVehicleModel(ctx context.Context, model *models.VehicleModel) error
	DeleteVehicleModel(ctx context.Context, id uuid.UUID) error
	ListVehicleModels(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error)
	GetActiveVehicleModels(ctx context.Context) ([]*models.VehicleModel, error)
	GetVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*models.VehicleModel, error)
	GetVehicleModelsByYear(ctx context.Context, year int, limit, offset int) ([]*models.VehicleModel, error)
	GetVehicleModelsByFuelType(ctx context.Context, fuelType string, limit, offset int) ([]*models.VehicleModel, error)
	SearchVehicleModels(ctx context.Context, query string, limit, offset int) ([]*models.VehicleModel, error)
	SearchVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID, query string, limit, offset int) ([]*models.VehicleModel, error)
	CountVehicleModels(ctx context.Context) (int64, error)
	CountVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID) (int64, error)
	DeactivateVehicleModel(ctx context.Context, id uuid.UUID) error
	ActivateVehicleModel(ctx context.Context, id uuid.UUID) error
	GetVehicleModelWithBrand(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error)
	ListVehicleModelsWithBrand(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error)
	
	// Utility methods
	ValidateVehicleBrand(ctx context.Context, brand *models.VehicleBrand, isUpdate bool) error
	ValidateVehicleModel(ctx context.Context, model *models.VehicleModel, isUpdate bool) error
	GenerateVehicleBrandCode(ctx context.Context, name string) (string, error)
	GenerateVehicleModelCode(ctx context.Context, brandCode, modelName string) (string, error)
}

type service struct {
	vehicleBrandRepo interfaces.VehicleBrandRepository
	vehicleModelRepo interfaces.VehicleModelRepository
}

func NewService(vehicleBrandRepo interfaces.VehicleBrandRepository, vehicleModelRepo interfaces.VehicleModelRepository) Service {
	return &service{
		vehicleBrandRepo: vehicleBrandRepo,
		vehicleModelRepo: vehicleModelRepo,
	}
}

// ===============================
// Vehicle Brand Operations
// ===============================

func (s *service) CreateVehicleBrand(ctx context.Context, brand *models.VehicleBrand) (*models.VehicleBrand, error) {
	if err := s.ValidateVehicleBrand(ctx, brand, false); err != nil {
		return nil, err
	}

	// Check if brand code already exists
	if brand.Code != "" {
		existingBrand, _ := s.vehicleBrandRepo.GetByCode(ctx, brand.Code)
		if existingBrand != nil {
			return nil, ErrVehicleBrandCodeExists
		}
	} else {
		// Generate brand code if not provided
		code, err := s.GenerateVehicleBrandCode(ctx, brand.Name)
		if err != nil {
			return nil, err
		}
		brand.Code = code
	}

	// Check if brand name already exists
	existingBrand, _ := s.vehicleBrandRepo.GetByName(ctx, brand.Name)
	if existingBrand != nil {
		return nil, ErrVehicleBrandExists
	}

	// Set defaults
	brand.IsActive = true

	if err := s.vehicleBrandRepo.Create(ctx, brand); err != nil {
		return nil, fmt.Errorf("failed to create vehicle brand: %w", err)
	}

	return brand, nil
}

func (s *service) GetVehicleBrandByID(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	brand, err := s.vehicleBrandRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrVehicleBrandNotFound
	}
	return brand, nil
}

func (s *service) GetVehicleBrandByCode(ctx context.Context, code string) (*models.VehicleBrand, error) {
	brand, err := s.vehicleBrandRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, ErrVehicleBrandNotFound
	}
	return brand, nil
}

func (s *service) GetVehicleBrandByName(ctx context.Context, name string) (*models.VehicleBrand, error) {
	brand, err := s.vehicleBrandRepo.GetByName(ctx, name)
	if err != nil {
		return nil, ErrVehicleBrandNotFound
	}
	return brand, nil
}

func (s *service) UpdateVehicleBrand(ctx context.Context, brand *models.VehicleBrand) error {
	if err := s.ValidateVehicleBrand(ctx, brand, true); err != nil {
		return err
	}

	// Check if brand exists
	existingBrand, err := s.vehicleBrandRepo.GetByID(ctx, brand.ID)
	if err != nil {
		return ErrVehicleBrandNotFound
	}

	// Check if brand code already exists (if changed)
	if brand.Code != existingBrand.Code {
		codeExists, _ := s.vehicleBrandRepo.GetByCode(ctx, brand.Code)
		if codeExists != nil && codeExists.ID != brand.ID {
			return ErrVehicleBrandCodeExists
		}
	}

	// Check if brand name already exists (if changed)
	if brand.Name != existingBrand.Name {
		nameExists, _ := s.vehicleBrandRepo.GetByName(ctx, brand.Name)
		if nameExists != nil && nameExists.ID != brand.ID {
			return ErrVehicleBrandExists
		}
	}

	if err := s.vehicleBrandRepo.Update(ctx, brand); err != nil {
		return fmt.Errorf("failed to update vehicle brand: %w", err)
	}

	return nil
}

func (s *service) DeleteVehicleBrand(ctx context.Context, id uuid.UUID) error {
	// Check if brand exists
	_, err := s.vehicleBrandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleBrandNotFound
	}

	// Check if brand has associated models
	modelCount, err := s.vehicleModelRepo.CountByBrand(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check associated models: %w", err)
	}

	if modelCount > 0 {
		return errors.New("cannot delete vehicle brand with associated models")
	}

	if err := s.vehicleBrandRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete vehicle brand: %w", err)
	}

	return nil
}

func (s *service) ListVehicleBrands(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	return s.vehicleBrandRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveVehicleBrands(ctx context.Context) ([]*models.VehicleBrand, error) {
	return s.vehicleBrandRepo.GetActive(ctx)
}

func (s *service) SearchVehicleBrands(ctx context.Context, query string, limit, offset int) ([]*models.VehicleBrand, error) {
	if query == "" {
		return s.vehicleBrandRepo.List(ctx, limit, offset)
	}
	return s.vehicleBrandRepo.Search(ctx, query, limit, offset)
}

func (s *service) CountVehicleBrands(ctx context.Context) (int64, error) {
	return s.vehicleBrandRepo.Count(ctx)
}

func (s *service) DeactivateVehicleBrand(ctx context.Context, id uuid.UUID) error {
	brand, err := s.vehicleBrandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleBrandNotFound
	}

	brand.IsActive = false
	return s.vehicleBrandRepo.Update(ctx, brand)
}

func (s *service) ActivateVehicleBrand(ctx context.Context, id uuid.UUID) error {
	brand, err := s.vehicleBrandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleBrandNotFound
	}

	brand.IsActive = true
	return s.vehicleBrandRepo.Update(ctx, brand)
}

func (s *service) GetVehicleBrandWithModels(ctx context.Context, id uuid.UUID) (*models.VehicleBrand, error) {
	brand, err := s.vehicleBrandRepo.GetWithModels(ctx, id)
	if err != nil {
		return nil, ErrVehicleBrandNotFound
	}
	return brand, nil
}

func (s *service) ListVehicleBrandsWithModels(ctx context.Context, limit, offset int) ([]*models.VehicleBrand, error) {
	return s.vehicleBrandRepo.ListWithModels(ctx, limit, offset)
}

// ===============================
// Vehicle Model Operations
// ===============================

func (s *service) CreateVehicleModel(ctx context.Context, model *models.VehicleModel) (*models.VehicleModel, error) {
	if err := s.ValidateVehicleModel(ctx, model, false); err != nil {
		return nil, err
	}

	// Check if parent brand exists and is active
	brand, err := s.vehicleBrandRepo.GetByID(ctx, model.VehicleBrandID)
	if err != nil {
		return nil, ErrVehicleBrandNotFound
	}
	if !brand.IsActive {
		return nil, ErrVehicleBrandInactive
	}

	// Check if model code already exists
	if model.Code != "" {
		existingModel, _ := s.vehicleModelRepo.GetByCode(ctx, model.Code)
		if existingModel != nil {
			return nil, ErrVehicleModelCodeExists
		}
	} else {
		// Generate model code if not provided
		code, err := s.GenerateVehicleModelCode(ctx, brand.Code, model.Name)
		if err != nil {
			return nil, err
		}
		model.Code = code
	}

	// Check if model name already exists within the same brand
	models, err := s.vehicleModelRepo.GetByBrandID(ctx, model.VehicleBrandID, 1000, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing models: %w", err)
	}
	
	for _, existingModel := range models {
		if strings.EqualFold(existingModel.Name, model.Name) {
			return nil, ErrVehicleModelExists
		}
	}

	// Set defaults
	model.IsActive = true

	if err := s.vehicleModelRepo.Create(ctx, model); err != nil {
		return nil, fmt.Errorf("failed to create vehicle model: %w", err)
	}

	return model, nil
}

func (s *service) GetVehicleModelByID(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	model, err := s.vehicleModelRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrVehicleModelNotFound
	}
	return model, nil
}

func (s *service) GetVehicleModelByCode(ctx context.Context, code string) (*models.VehicleModel, error) {
	model, err := s.vehicleModelRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, ErrVehicleModelNotFound
	}
	return model, nil
}

func (s *service) GetVehicleModelByName(ctx context.Context, name string) (*models.VehicleModel, error) {
	model, err := s.vehicleModelRepo.GetByName(ctx, name)
	if err != nil {
		return nil, ErrVehicleModelNotFound
	}
	return model, nil
}

func (s *service) UpdateVehicleModel(ctx context.Context, model *models.VehicleModel) error {
	if err := s.ValidateVehicleModel(ctx, model, true); err != nil {
		return err
	}

	// Check if model exists
	existingModel, err := s.vehicleModelRepo.GetByID(ctx, model.ID)
	if err != nil {
		return ErrVehicleModelNotFound
	}

	// Check if parent brand exists and is active
	brand, err := s.vehicleBrandRepo.GetByID(ctx, model.VehicleBrandID)
	if err != nil {
		return ErrVehicleBrandNotFound
	}
	if !brand.IsActive {
		return ErrVehicleBrandInactive
	}

	// Check if model code already exists (if changed)
	if model.Code != existingModel.Code {
		codeExists, _ := s.vehicleModelRepo.GetByCode(ctx, model.Code)
		if codeExists != nil && codeExists.ID != model.ID {
			return ErrVehicleModelCodeExists
		}
	}

	// Check if model name already exists within the same brand (if changed)
	if model.Name != existingModel.Name || model.VehicleBrandID != existingModel.VehicleBrandID {
		models, err := s.vehicleModelRepo.GetByBrandID(ctx, model.VehicleBrandID, 1000, 0)
		if err != nil {
			return fmt.Errorf("failed to check existing models: %w", err)
		}
		
		for _, existing := range models {
			if existing.ID != model.ID && strings.EqualFold(existing.Name, model.Name) {
				return ErrVehicleModelExists
			}
		}
	}

	if err := s.vehicleModelRepo.Update(ctx, model); err != nil {
		return fmt.Errorf("failed to update vehicle model: %w", err)
	}

	return nil
}

func (s *service) DeleteVehicleModel(ctx context.Context, id uuid.UUID) error {
	// Check if model exists
	_, err := s.vehicleModelRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleModelNotFound
	}

	if err := s.vehicleModelRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete vehicle model: %w", err)
	}

	return nil
}

func (s *service) ListVehicleModels(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveVehicleModels(ctx context.Context) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.GetActive(ctx)
}

func (s *service) GetVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID, limit, offset int) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.GetByBrandID(ctx, brandID, limit, offset)
}

func (s *service) GetVehicleModelsByYear(ctx context.Context, year int, limit, offset int) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.GetByYear(ctx, year, limit, offset)
}

func (s *service) GetVehicleModelsByFuelType(ctx context.Context, fuelType string, limit, offset int) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.GetByFuelType(ctx, fuelType, limit, offset)
}

func (s *service) SearchVehicleModels(ctx context.Context, query string, limit, offset int) ([]*models.VehicleModel, error) {
	if query == "" {
		return s.vehicleModelRepo.List(ctx, limit, offset)
	}
	return s.vehicleModelRepo.Search(ctx, query, limit, offset)
}

func (s *service) SearchVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID, query string, limit, offset int) ([]*models.VehicleModel, error) {
	if query == "" {
		return s.vehicleModelRepo.GetByBrandID(ctx, brandID, limit, offset)
	}
	return s.vehicleModelRepo.SearchByBrand(ctx, brandID, query, limit, offset)
}

func (s *service) CountVehicleModels(ctx context.Context) (int64, error) {
	return s.vehicleModelRepo.Count(ctx)
}

func (s *service) CountVehicleModelsByBrand(ctx context.Context, brandID uuid.UUID) (int64, error) {
	return s.vehicleModelRepo.CountByBrand(ctx, brandID)
}

func (s *service) DeactivateVehicleModel(ctx context.Context, id uuid.UUID) error {
	model, err := s.vehicleModelRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleModelNotFound
	}

	model.IsActive = false
	return s.vehicleModelRepo.Update(ctx, model)
}

func (s *service) ActivateVehicleModel(ctx context.Context, id uuid.UUID) error {
	model, err := s.vehicleModelRepo.GetByID(ctx, id)
	if err != nil {
		return ErrVehicleModelNotFound
	}

	model.IsActive = true
	return s.vehicleModelRepo.Update(ctx, model)
}

func (s *service) GetVehicleModelWithBrand(ctx context.Context, id uuid.UUID) (*models.VehicleModel, error) {
	model, err := s.vehicleModelRepo.GetWithBrand(ctx, id)
	if err != nil {
		return nil, ErrVehicleModelNotFound
	}
	return model, nil
}

func (s *service) ListVehicleModelsWithBrand(ctx context.Context, limit, offset int) ([]*models.VehicleModel, error) {
	return s.vehicleModelRepo.ListWithBrand(ctx, limit, offset)
}

// ===============================
// Validation Methods
// ===============================

func (s *service) ValidateVehicleBrand(ctx context.Context, brand *models.VehicleBrand, isUpdate bool) error {
	if brand == nil {
		return ErrInvalidInput
	}

	// Validate required fields
	if brand.Name == "" {
		return errors.New("vehicle brand name is required")
	}

	if len(brand.Name) > 100 {
		return errors.New("vehicle brand name must be less than 100 characters")
	}

	// Validate brand code
	if brand.Code != "" {
		if len(brand.Code) > 20 {
			return errors.New("vehicle brand code must be less than 20 characters")
		}
		
		// Brand code should be alphanumeric with hyphens/underscores
		if matched, _ := regexp.MatchString(`^[A-Za-z0-9_-]+$`, brand.Code); !matched {
			return errors.New("vehicle brand code can only contain alphanumeric characters, hyphens, and underscores")
		}
	}

	// Validate other field lengths
	if len(brand.Description) > 500 {
		return errors.New("vehicle brand description must be less than 500 characters")
	}

	if len(brand.CountryCode) > 10 {
		return errors.New("country code must be less than 10 characters")
	}

	// Validate country code format if provided
	if brand.CountryCode != "" {
		if matched, _ := regexp.MatchString(`^[A-Z]{2,3}$`, brand.CountryCode); !matched {
			return errors.New("country code must be 2-3 uppercase letters")
		}
	}

	return nil
}

func (s *service) ValidateVehicleModel(ctx context.Context, model *models.VehicleModel, isUpdate bool) error {
	if model == nil {
		return ErrInvalidInput
	}

	// Validate required fields
	if model.Name == "" {
		return errors.New("vehicle model name is required")
	}

	if len(model.Name) > 100 {
		return errors.New("vehicle model name must be less than 100 characters")
	}

	if model.VehicleBrandID == uuid.Nil {
		return errors.New("vehicle brand ID is required")
	}

	// Validate model code
	if model.Code != "" {
		if len(model.Code) > 30 {
			return errors.New("vehicle model code must be less than 30 characters")
		}
		
		// Model code should be alphanumeric with hyphens/underscores
		if matched, _ := regexp.MatchString(`^[A-Za-z0-9_-]+$`, model.Code); !matched {
			return errors.New("vehicle model code can only contain alphanumeric characters, hyphens, and underscores")
		}
	}

	// Validate other fields
	if len(model.Description) > 500 {
		return errors.New("vehicle model description must be less than 500 characters")
	}

	// Validate year range
	if model.YearFrom > 0 && model.YearTo > 0 {
		if model.YearFrom > model.YearTo {
			return errors.New("year from cannot be greater than year to")
		}
	}

	if model.YearFrom > 0 {
		if model.YearFrom < 1900 || model.YearFrom > 2100 {
			return errors.New("year from must be between 1900 and 2100")
		}
	}

	if model.YearTo > 0 {
		if model.YearTo < 1900 || model.YearTo > 2100 {
			return errors.New("year to must be between 1900 and 2100")
		}
	}

	// Validate fuel type if provided
	if model.FuelType != "" {
		validFuelTypes := []string{"PETROL", "DIESEL", "HYBRID", "ELECTRIC", "CNG", "LPG"}
		valid := false
		for _, validType := range validFuelTypes {
			if strings.ToUpper(model.FuelType) == validType {
				valid = true
				model.FuelType = validType // Normalize to uppercase
				break
			}
		}
		if !valid {
			return errors.New("invalid fuel type. Valid types are: PETROL, DIESEL, HYBRID, ELECTRIC, CNG, LPG")
		}
	}

	// Validate transmission if provided
	if model.Transmission != "" {
		validTransmissions := []string{"MANUAL", "AUTOMATIC", "CVT", "DCT", "AMT"}
		valid := false
		for _, validTrans := range validTransmissions {
			if strings.ToUpper(model.Transmission) == validTrans {
				valid = true
				model.Transmission = validTrans // Normalize to uppercase
				break
			}
		}
		if !valid {
			return errors.New("invalid transmission type. Valid types are: MANUAL, AUTOMATIC, CVT, DCT, AMT")
		}
	}

	// Validate engine size if provided
	if len(model.EngineSize) > 20 {
		return errors.New("engine size must be less than 20 characters")
	}

	return nil
}

// ===============================
// Code Generation Methods
// ===============================

func (s *service) GenerateVehicleBrandCode(ctx context.Context, name string) (string, error) {
	if name == "" {
		return "", errors.New("vehicle brand name is required to generate code")
	}

	// Generate base code from name (first 4 characters, uppercase)
	baseCode := ""
	for _, r := range name {
		if len(baseCode) >= 4 {
			break
		}
		if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
			if r >= 'a' && r <= 'z' {
				baseCode += string(r - 32) // Convert to uppercase
			} else {
				baseCode += string(r)
			}
		}
	}

	// Pad with 'X' if less than 4 characters
	for len(baseCode) < 4 {
		baseCode += "X"
	}

	// Try sequential numbers
	for i := 1; i <= 99; i++ {
		code := fmt.Sprintf("%s%02d", baseCode, i)
		
		// Check if code already exists
		_, err := s.vehicleBrandRepo.GetByCode(ctx, code)
		if err != nil {
			// Code doesn't exist, we can use it
			return code, nil
		}
	}

	return "", errors.New("unable to generate unique vehicle brand code")
}

func (s *service) GenerateVehicleModelCode(ctx context.Context, brandCode, modelName string) (string, error) {
	if brandCode == "" {
		return "", errors.New("vehicle brand code is required to generate model code")
	}
	if modelName == "" {
		return "", errors.New("vehicle model name is required to generate code")
	}

	// Generate base code from model name (first 4 characters, uppercase)
	modelCode := ""
	for _, r := range modelName {
		if len(modelCode) >= 4 {
			break
		}
		if (r >= 'A' && r <= 'Z') || (r >= 'a' && r <= 'z') {
			if r >= 'a' && r <= 'z' {
				modelCode += string(r - 32) // Convert to uppercase
			} else {
				modelCode += string(r)
			}
		}
	}

	// Pad with 'X' if less than 4 characters
	for len(modelCode) < 4 {
		modelCode += "X"
	}

	// Combine brand code and model code with hyphen
	baseCode := fmt.Sprintf("%s-%s", brandCode, modelCode)

	// Try sequential numbers
	for i := 1; i <= 99; i++ {
		code := fmt.Sprintf("%s%02d", baseCode, i)
		
		// Check if code already exists
		_, err := s.vehicleModelRepo.GetByCode(ctx, code)
		if err != nil {
			// Code doesn't exist, we can use it
			return code, nil
		}
	}

	return "", errors.New("unable to generate unique vehicle model code")
}