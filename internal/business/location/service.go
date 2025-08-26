package location

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrLocationNotFound      = errors.New("location not found")
	ErrLocationExists        = errors.New("location already exists")
	ErrInvalidLocation       = errors.New("invalid location data")
	ErrCodeExists           = errors.New("location code already exists")
)

type Service interface {
	CreateLocation(ctx context.Context, location *models.Location) error
	GetLocation(ctx context.Context, id uuid.UUID) (*models.Location, error)
	GetLocationByCode(ctx context.Context, code string) (*models.Location, error)
	GetLocationByName(ctx context.Context, name string) (*models.Location, error)
	UpdateLocation(ctx context.Context, location *models.Location) error
	DeleteLocation(ctx context.Context, id uuid.UUID) error
	ListLocations(ctx context.Context, limit, offset int) ([]*models.Location, error)
	GetActiveLocations(ctx context.Context) ([]*models.Location, error)
	GetLocationsByType(ctx context.Context, locationType models.LocationType) ([]*models.Location, error)
	CountLocations(ctx context.Context) (int64, error)
	GetLocationInventory(ctx context.Context, id uuid.UUID) ([]*models.Inventory, error)
}

type service struct {
	locationRepo  interfaces.LocationRepository
	inventoryRepo interfaces.InventoryRepository
}

func NewService(locationRepo interfaces.LocationRepository, inventoryRepo interfaces.InventoryRepository) Service {
	return &service{
		locationRepo:  locationRepo,
		inventoryRepo: inventoryRepo,
	}
}

func (s *service) CreateLocation(ctx context.Context, location *models.Location) error {
	if err := s.validateLocation(location, false); err != nil {
		return err
	}

	// Check if code already exists
	if existing, _ := s.locationRepo.GetByCode(ctx, location.Code); existing != nil {
		return ErrCodeExists
	}

	return s.locationRepo.Create(ctx, location)
}

func (s *service) GetLocation(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	return s.locationRepo.GetByID(ctx, id)
}

func (s *service) GetLocationByCode(ctx context.Context, code string) (*models.Location, error) {
	if strings.TrimSpace(code) == "" {
		return nil, ErrInvalidLocation
	}
	return s.locationRepo.GetByCode(ctx, code)
}

func (s *service) GetLocationByName(ctx context.Context, name string) (*models.Location, error) {
	if strings.TrimSpace(name) == "" {
		return nil, ErrInvalidLocation
	}
	return s.locationRepo.GetByName(ctx, name)
}

func (s *service) UpdateLocation(ctx context.Context, location *models.Location) error {
	if err := s.validateLocation(location, true); err != nil {
		return err
	}

	// Check if another location has this code
	if existing, _ := s.locationRepo.GetByCode(ctx, location.Code); existing != nil && existing.ID != location.ID {
		return ErrCodeExists
	}

	return s.locationRepo.Update(ctx, location)
}

func (s *service) DeleteLocation(ctx context.Context, id uuid.UUID) error {
	// Check if location exists
	_, err := s.locationRepo.GetByID(ctx, id)
	if err != nil {
		return ErrLocationNotFound
	}

	return s.locationRepo.Delete(ctx, id)
}

func (s *service) ListLocations(ctx context.Context, limit, offset int) ([]*models.Location, error) {
	if limit <= 0 {
		limit = 50 // Default limit
	}
	if offset < 0 {
		offset = 0
	}
	return s.locationRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveLocations(ctx context.Context) ([]*models.Location, error) {
	return s.locationRepo.GetActive(ctx)
}

func (s *service) GetLocationsByType(ctx context.Context, locationType models.LocationType) ([]*models.Location, error) {
	return s.locationRepo.GetByType(ctx, locationType)
}

func (s *service) CountLocations(ctx context.Context) (int64, error) {
	return s.locationRepo.Count(ctx)
}

func (s *service) GetLocationInventory(ctx context.Context, id uuid.UUID) ([]*models.Inventory, error) {
	// First check if location exists
	_, err := s.locationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrLocationNotFound
	}

	return s.inventoryRepo.GetByLocation(ctx, id)
}

func (s *service) validateLocation(location *models.Location, isUpdate bool) error {
	if location == nil {
		return ErrInvalidLocation
	}

	// Validate required fields
	if strings.TrimSpace(location.Name) == "" {
		return ErrInvalidLocation
	}
	if strings.TrimSpace(location.Code) == "" {
		return ErrInvalidLocation
	}
	if location.Type == "" {
		return ErrInvalidLocation
	}

	// Validate location type
	validTypes := []models.LocationType{
		models.LocationWarehouse,
		models.LocationStore,
		models.LocationOnline,
	}
	isValidType := false
	for _, validType := range validTypes {
		if location.Type == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return ErrInvalidLocation
	}

	return nil
}