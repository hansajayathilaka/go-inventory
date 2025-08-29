package brand

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
	ErrBrandNotFound   = errors.New("brand not found")
	ErrBrandExists     = errors.New("brand already exists")
	ErrInvalidInput    = errors.New("invalid input data")
	ErrBrandCodeExists = errors.New("brand code already exists")
	ErrBrandInactive   = errors.New("brand is inactive")
)

type Service interface {
	CreateBrand(ctx context.Context, brand *models.Brand) (*models.Brand, error)
	GetBrandByID(ctx context.Context, id uuid.UUID) (*models.Brand, error)
	GetBrandByCode(ctx context.Context, code string) (*models.Brand, error)
	GetBrandByName(ctx context.Context, name string) (*models.Brand, error)
	UpdateBrand(ctx context.Context, brand *models.Brand) error
	DeleteBrand(ctx context.Context, id uuid.UUID) error
	ListBrands(ctx context.Context, limit, offset int) ([]*models.Brand, error)
	GetActiveBrands(ctx context.Context) ([]*models.Brand, error)
	SearchBrands(ctx context.Context, query string, limit, offset int) ([]*models.Brand, error)
	CountBrands(ctx context.Context) (int64, error)
	DeactivateBrand(ctx context.Context, id uuid.UUID) error
	ActivateBrand(ctx context.Context, id uuid.UUID) error
	ValidateBrand(ctx context.Context, brand *models.Brand, isUpdate bool) error
	GenerateBrandCode(ctx context.Context, name string) (string, error)
}

type service struct {
	brandRepo interfaces.BrandRepository
}

func NewService(brandRepo interfaces.BrandRepository) Service {
	return &service{
		brandRepo: brandRepo,
	}
}

func (s *service) CreateBrand(ctx context.Context, brand *models.Brand) (*models.Brand, error) {
	if err := s.ValidateBrand(ctx, brand, false); err != nil {
		return nil, err
	}

	// Check if brand name already exists first
	existingBrand, _ := s.brandRepo.GetByName(ctx, brand.Name)
	if existingBrand != nil {
		return nil, ErrBrandExists
	}

	// Check if brand code already exists
	if brand.Code != "" {
		existingBrand, _ := s.brandRepo.GetByCode(ctx, brand.Code)
		if existingBrand != nil {
			return nil, ErrBrandCodeExists
		}
	} else {
		// Generate brand code if not provided
		code, err := s.GenerateBrandCode(ctx, brand.Name)
		if err != nil {
			return nil, err
		}
		brand.Code = code
	}

	// Set defaults
	brand.IsActive = true

	if err := s.brandRepo.Create(ctx, brand); err != nil {
		return nil, fmt.Errorf("failed to create brand: %w", err)
	}

	return brand, nil
}

func (s *service) GetBrandByID(ctx context.Context, id uuid.UUID) (*models.Brand, error) {
	brand, err := s.brandRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrBrandNotFound
	}
	return brand, nil
}

func (s *service) GetBrandByCode(ctx context.Context, code string) (*models.Brand, error) {
	brand, err := s.brandRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, ErrBrandNotFound
	}
	return brand, nil
}

func (s *service) GetBrandByName(ctx context.Context, name string) (*models.Brand, error) {
	brand, err := s.brandRepo.GetByName(ctx, name)
	if err != nil {
		return nil, ErrBrandNotFound
	}
	return brand, nil
}

func (s *service) UpdateBrand(ctx context.Context, brand *models.Brand) error {
	if err := s.ValidateBrand(ctx, brand, true); err != nil {
		return err
	}

	// Check if brand exists
	existingBrand, err := s.brandRepo.GetByID(ctx, brand.ID)
	if err != nil {
		return ErrBrandNotFound
	}

	// Check if brand code already exists (if changed)
	if brand.Code != existingBrand.Code {
		codeExists, _ := s.brandRepo.GetByCode(ctx, brand.Code)
		if codeExists != nil && codeExists.ID != brand.ID {
			return ErrBrandCodeExists
		}
	}

	// Check if brand name already exists (if changed)
	if brand.Name != existingBrand.Name {
		nameExists, _ := s.brandRepo.GetByName(ctx, brand.Name)
		if nameExists != nil && nameExists.ID != brand.ID {
			return ErrBrandExists
		}
	}

	if err := s.brandRepo.Update(ctx, brand); err != nil {
		return fmt.Errorf("failed to update brand: %w", err)
	}

	return nil
}

func (s *service) DeleteBrand(ctx context.Context, id uuid.UUID) error {
	// Check if brand exists
	_, err := s.brandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrBrandNotFound
	}

	if err := s.brandRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete brand: %w", err)
	}

	return nil
}

func (s *service) ListBrands(ctx context.Context, limit, offset int) ([]*models.Brand, error) {
	return s.brandRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveBrands(ctx context.Context) ([]*models.Brand, error) {
	return s.brandRepo.GetActive(ctx)
}

func (s *service) SearchBrands(ctx context.Context, query string, limit, offset int) ([]*models.Brand, error) {
	if query == "" {
		return s.brandRepo.List(ctx, limit, offset)
	}
	return s.brandRepo.Search(ctx, query, limit, offset)
}

func (s *service) CountBrands(ctx context.Context) (int64, error) {
	return s.brandRepo.Count(ctx)
}

func (s *service) DeactivateBrand(ctx context.Context, id uuid.UUID) error {
	brand, err := s.brandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrBrandNotFound
	}

	brand.IsActive = false
	return s.brandRepo.Update(ctx, brand)
}

func (s *service) ActivateBrand(ctx context.Context, id uuid.UUID) error {
	brand, err := s.brandRepo.GetByID(ctx, id)
	if err != nil {
		return ErrBrandNotFound
	}

	brand.IsActive = true
	return s.brandRepo.Update(ctx, brand)
}

func (s *service) ValidateBrand(ctx context.Context, brand *models.Brand, isUpdate bool) error {
	if brand == nil {
		return ErrInvalidInput
	}

	// Validate required fields
	if brand.Name == "" {
		return errors.New("brand name is required")
	}

	if len(brand.Name) > 100 {
		return errors.New("brand name must be less than 100 characters")
	}

	// Validate brand code
	if brand.Code != "" {
		if len(brand.Code) > 20 {
			return errors.New("brand code must be less than 20 characters")
		}
		
		// Brand code should be alphanumeric with hyphens/underscores
		if matched, _ := regexp.MatchString(`^[A-Za-z0-9_-]+$`, brand.Code); !matched {
			return errors.New("brand code can only contain alphanumeric characters, hyphens, and underscores")
		}
	}

	// Validate other field lengths
	if len(brand.Description) > 500 {
		return errors.New("description must be less than 500 characters")
	}

	if len(brand.Website) > 200 {
		return errors.New("website must be less than 200 characters")
	}

	if len(brand.CountryCode) > 10 {
		return errors.New("country code must be less than 10 characters")
	}

	if len(brand.LogoURL) > 500 {
		return errors.New("logo URL must be less than 500 characters")
	}

	// Validate website URL format if provided
	if brand.Website != "" {
		urlRegex := regexp.MustCompile(`^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/.*)?$`)
		if !urlRegex.MatchString(brand.Website) {
			return errors.New("invalid website URL format")
		}
	}

	// Validate logo URL format if provided
	if brand.LogoURL != "" {
		urlRegex := regexp.MustCompile(`^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/.*)?$`)
		if !urlRegex.MatchString(brand.LogoURL) {
			return errors.New("invalid logo URL format")
		}
	}

	// Validate country code format if provided (ISO 3166-1 alpha-2 or alpha-3)
	if brand.CountryCode != "" {
		countryCodeRegex := regexp.MustCompile(`^[A-Z]{2,3}$`)
		if !countryCodeRegex.MatchString(strings.ToUpper(brand.CountryCode)) {
			return errors.New("country code must be 2 or 3 letter ISO country code")
		}
		// Normalize to uppercase
		brand.CountryCode = strings.ToUpper(brand.CountryCode)
	}

	return nil
}

func (s *service) GenerateBrandCode(ctx context.Context, name string) (string, error) {
	if name == "" {
		return "", errors.New("brand name is required to generate code")
	}

	// Generate base code from name (first 3-4 characters, uppercase)
	baseCode := ""
	words := strings.Fields(name)
	
	if len(words) > 1 {
		// Multi-word: take first letter of each word (max 4)
		for i, word := range words {
			if i >= 4 || len(baseCode) >= 4 {
				break
			}
			if len(word) > 0 {
				firstChar := word[0]
				if firstChar >= 'a' && firstChar <= 'z' {
					baseCode += string(firstChar - 32) // Convert to uppercase
				} else if firstChar >= 'A' && firstChar <= 'Z' {
					baseCode += string(firstChar)
				}
			}
		}
	} else {
		// Single word: take first 3-4 characters
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
	}

	// Pad with 'X' if less than 3 characters
	for len(baseCode) < 3 {
		baseCode += "X"
	}

	// Try the base code first
	_, err := s.brandRepo.GetByCode(ctx, baseCode)
	if err != nil {
		// Code doesn't exist, we can use it
		return baseCode, nil
	}

	// Try sequential numbers
	for i := 1; i <= 99; i++ {
		code := fmt.Sprintf("%s%02d", baseCode, i)
		
		// Check if code already exists
		_, err := s.brandRepo.GetByCode(ctx, code)
		if err != nil {
			// Code doesn't exist, we can use it
			return code, nil
		}
	}

	return "", errors.New("unable to generate unique brand code")
}