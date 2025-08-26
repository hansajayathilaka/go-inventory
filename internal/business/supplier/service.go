package supplier

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrSupplierNotFound      = errors.New("supplier not found")
	ErrSupplierExists        = errors.New("supplier already exists")
	ErrInvalidSupplier       = errors.New("invalid supplier data")
	ErrCodeExists           = errors.New("supplier code already exists")
)

type Service interface {
	CreateSupplier(ctx context.Context, supplier *models.Supplier) error
	GetSupplier(ctx context.Context, id uuid.UUID) (*models.Supplier, error)
	GetSupplierByCode(ctx context.Context, code string) (*models.Supplier, error)
	GetSupplierByName(ctx context.Context, name string) (*models.Supplier, error)
	UpdateSupplier(ctx context.Context, supplier *models.Supplier) error
	DeleteSupplier(ctx context.Context, id uuid.UUID) error
	ListSuppliers(ctx context.Context, limit, offset int) ([]*models.Supplier, error)
	GetActiveSuppliers(ctx context.Context) ([]*models.Supplier, error)
	CountSuppliers(ctx context.Context) (int64, error)
}

type service struct {
	supplierRepo interfaces.SupplierRepository
}

func NewService(supplierRepo interfaces.SupplierRepository) Service {
	return &service{
		supplierRepo: supplierRepo,
	}
}

func (s *service) CreateSupplier(ctx context.Context, supplier *models.Supplier) error {
	if err := s.validateSupplier(supplier, false); err != nil {
		return err
	}

	// Check if code already exists
	if existing, _ := s.supplierRepo.GetByCode(ctx, supplier.Code); existing != nil {
		return ErrCodeExists
	}

	return s.supplierRepo.Create(ctx, supplier)
}

func (s *service) GetSupplier(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	return s.supplierRepo.GetByID(ctx, id)
}

func (s *service) GetSupplierByCode(ctx context.Context, code string) (*models.Supplier, error) {
	if strings.TrimSpace(code) == "" {
		return nil, ErrInvalidSupplier
	}
	return s.supplierRepo.GetByCode(ctx, code)
}

func (s *service) GetSupplierByName(ctx context.Context, name string) (*models.Supplier, error) {
	if strings.TrimSpace(name) == "" {
		return nil, ErrInvalidSupplier
	}
	return s.supplierRepo.GetByName(ctx, name)
}

func (s *service) UpdateSupplier(ctx context.Context, supplier *models.Supplier) error {
	if err := s.validateSupplier(supplier, true); err != nil {
		return err
	}

	// Check if another supplier has this code
	if existing, _ := s.supplierRepo.GetByCode(ctx, supplier.Code); existing != nil && existing.ID != supplier.ID {
		return ErrCodeExists
	}

	return s.supplierRepo.Update(ctx, supplier)
}

func (s *service) DeleteSupplier(ctx context.Context, id uuid.UUID) error {
	// Check if supplier exists
	_, err := s.supplierRepo.GetByID(ctx, id)
	if err != nil {
		return ErrSupplierNotFound
	}

	return s.supplierRepo.Delete(ctx, id)
}

func (s *service) ListSuppliers(ctx context.Context, limit, offset int) ([]*models.Supplier, error) {
	if limit <= 0 {
		limit = 50 // Default limit
	}
	if offset < 0 {
		offset = 0
	}
	return s.supplierRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveSuppliers(ctx context.Context) ([]*models.Supplier, error) {
	return s.supplierRepo.GetActive(ctx)
}

func (s *service) CountSuppliers(ctx context.Context) (int64, error) {
	return s.supplierRepo.Count(ctx)
}

func (s *service) validateSupplier(supplier *models.Supplier, isUpdate bool) error {
	if supplier == nil {
		return ErrInvalidSupplier
	}

	// Validate required fields
	if strings.TrimSpace(supplier.Name) == "" {
		return ErrInvalidSupplier
	}
	if strings.TrimSpace(supplier.Code) == "" {
		return ErrInvalidSupplier
	}

	return nil
}