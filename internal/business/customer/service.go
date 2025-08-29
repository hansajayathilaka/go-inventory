package customer

import (
	"context"
	"errors"
	"fmt"
	"regexp"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrCustomerNotFound   = errors.New("customer not found")
	ErrCustomerExists     = errors.New("customer already exists")
	ErrInvalidInput       = errors.New("invalid input data")
	ErrCustomerCodeExists = errors.New("customer code already exists")
	ErrCustomerInactive   = errors.New("customer is inactive")
)

type Service interface {
	CreateCustomer(ctx context.Context, customer *models.Customer) (*models.Customer, error)
	GetCustomerByID(ctx context.Context, id uuid.UUID) (*models.Customer, error)
	GetCustomerByCode(ctx context.Context, code string) (*models.Customer, error)
	GetCustomerByName(ctx context.Context, name string) (*models.Customer, error)
	GetCustomerByEmail(ctx context.Context, email string) (*models.Customer, error)
	UpdateCustomer(ctx context.Context, customer *models.Customer) error
	DeleteCustomer(ctx context.Context, id uuid.UUID) error
	ListCustomers(ctx context.Context, limit, offset int) ([]*models.Customer, error)
	GetActiveCustomers(ctx context.Context) ([]*models.Customer, error)
	SearchCustomers(ctx context.Context, query string, limit, offset int) ([]*models.Customer, error)
	CountCustomers(ctx context.Context) (int64, error)
	DeactivateCustomer(ctx context.Context, id uuid.UUID) error
	ActivateCustomer(ctx context.Context, id uuid.UUID) error
	ValidateCustomer(ctx context.Context, customer *models.Customer, isUpdate bool) error
	GenerateCustomerCode(ctx context.Context, name string) (string, error)
}

type service struct {
	customerRepo interfaces.CustomerRepository
}

func NewService(customerRepo interfaces.CustomerRepository) Service {
	return &service{
		customerRepo: customerRepo,
	}
}

func (s *service) CreateCustomer(ctx context.Context, customer *models.Customer) (*models.Customer, error) {
	if err := s.ValidateCustomer(ctx, customer, false); err != nil {
		return nil, err
	}

	// Check if customer code already exists
	if customer.Code != "" {
		existingCustomer, _ := s.customerRepo.GetByCode(ctx, customer.Code)
		if existingCustomer != nil {
			return nil, ErrCustomerCodeExists
		}
	} else {
		// Generate customer code if not provided
		code, err := s.GenerateCustomerCode(ctx, customer.Name)
		if err != nil {
			return nil, err
		}
		customer.Code = code
	}

	// Check if customer email already exists (if provided)
	if customer.Email != "" {
		existingCustomer, _ := s.customerRepo.GetByEmail(ctx, customer.Email)
		if existingCustomer != nil {
			return nil, ErrCustomerExists
		}
	}

	// Set defaults
	if customer.Country == "" {
		customer.Country = "Malaysia"
	}
	customer.IsActive = true

	if err := s.customerRepo.Create(ctx, customer); err != nil {
		return nil, fmt.Errorf("failed to create customer: %w", err)
	}

	return customer, nil
}

func (s *service) GetCustomerByID(ctx context.Context, id uuid.UUID) (*models.Customer, error) {
	customer, err := s.customerRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCustomerNotFound
	}
	return customer, nil
}

func (s *service) GetCustomerByCode(ctx context.Context, code string) (*models.Customer, error) {
	customer, err := s.customerRepo.GetByCode(ctx, code)
	if err != nil {
		return nil, ErrCustomerNotFound
	}
	return customer, nil
}

func (s *service) GetCustomerByName(ctx context.Context, name string) (*models.Customer, error) {
	customer, err := s.customerRepo.GetByName(ctx, name)
	if err != nil {
		return nil, ErrCustomerNotFound
	}
	return customer, nil
}

func (s *service) GetCustomerByEmail(ctx context.Context, email string) (*models.Customer, error) {
	customer, err := s.customerRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, ErrCustomerNotFound
	}
	return customer, nil
}

func (s *service) UpdateCustomer(ctx context.Context, customer *models.Customer) error {
	if err := s.ValidateCustomer(ctx, customer, true); err != nil {
		return err
	}

	// Check if customer exists
	existingCustomer, err := s.customerRepo.GetByID(ctx, customer.ID)
	if err != nil {
		return ErrCustomerNotFound
	}

	// Check if customer code already exists (if changed)
	if customer.Code != existingCustomer.Code {
		codeExists, _ := s.customerRepo.GetByCode(ctx, customer.Code)
		if codeExists != nil && codeExists.ID != customer.ID {
			return ErrCustomerCodeExists
		}
	}

	// Check if customer email already exists (if changed and provided)
	if customer.Email != "" && customer.Email != existingCustomer.Email {
		emailExists, _ := s.customerRepo.GetByEmail(ctx, customer.Email)
		if emailExists != nil && emailExists.ID != customer.ID {
			return ErrCustomerExists
		}
	}

	if err := s.customerRepo.Update(ctx, customer); err != nil {
		return fmt.Errorf("failed to update customer: %w", err)
	}

	return nil
}

func (s *service) DeleteCustomer(ctx context.Context, id uuid.UUID) error {
	// Check if customer exists
	_, err := s.customerRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCustomerNotFound
	}

	if err := s.customerRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete customer: %w", err)
	}

	return nil
}

func (s *service) ListCustomers(ctx context.Context, limit, offset int) ([]*models.Customer, error) {
	return s.customerRepo.List(ctx, limit, offset)
}

func (s *service) GetActiveCustomers(ctx context.Context) ([]*models.Customer, error) {
	return s.customerRepo.GetActive(ctx)
}

func (s *service) SearchCustomers(ctx context.Context, query string, limit, offset int) ([]*models.Customer, error) {
	if query == "" {
		return s.customerRepo.List(ctx, limit, offset)
	}
	return s.customerRepo.Search(ctx, query, limit, offset)
}

func (s *service) CountCustomers(ctx context.Context) (int64, error) {
	return s.customerRepo.Count(ctx)
}

func (s *service) DeactivateCustomer(ctx context.Context, id uuid.UUID) error {
	customer, err := s.customerRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCustomerNotFound
	}

	customer.IsActive = false
	return s.customerRepo.Update(ctx, customer)
}

func (s *service) ActivateCustomer(ctx context.Context, id uuid.UUID) error {
	customer, err := s.customerRepo.GetByID(ctx, id)
	if err != nil {
		return ErrCustomerNotFound
	}

	customer.IsActive = true
	return s.customerRepo.Update(ctx, customer)
}

func (s *service) ValidateCustomer(ctx context.Context, customer *models.Customer, isUpdate bool) error {
	if customer == nil {
		return ErrInvalidInput
	}

	// Validate required fields
	if customer.Name == "" {
		return errors.New("customer name is required")
	}

	if len(customer.Name) > 100 {
		return errors.New("customer name must be less than 100 characters")
	}

	// Validate customer code
	if customer.Code != "" {
		if len(customer.Code) > 20 {
			return errors.New("customer code must be less than 20 characters")
		}
		
		// Customer code should be alphanumeric with hyphens/underscores
		if matched, _ := regexp.MatchString(`^[A-Za-z0-9_-]+$`, customer.Code); !matched {
			return errors.New("customer code can only contain alphanumeric characters, hyphens, and underscores")
		}
	}

	// Validate email format if provided
	if customer.Email != "" {
		if len(customer.Email) > 100 {
			return errors.New("email must be less than 100 characters")
		}
		
		emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
		if !emailRegex.MatchString(customer.Email) {
			return errors.New("invalid email format")
		}
	}

	// Validate other field lengths
	if len(customer.Phone) > 20 {
		return errors.New("phone number must be less than 20 characters")
	}

	if len(customer.Address) > 500 {
		return errors.New("address must be less than 500 characters")
	}

	if len(customer.City) > 100 {
		return errors.New("city must be less than 100 characters")
	}

	if len(customer.State) > 100 {
		return errors.New("state must be less than 100 characters")
	}

	if len(customer.PostalCode) > 20 {
		return errors.New("postal code must be less than 20 characters")
	}

	if len(customer.Country) > 100 {
		return errors.New("country must be less than 100 characters")
	}

	if len(customer.TaxNumber) > 50 {
		return errors.New("tax number must be less than 50 characters")
	}

	if len(customer.Notes) > 1000 {
		return errors.New("notes must be less than 1000 characters")
	}

	// Validate credit limit
	if customer.CreditLimit < 0 {
		return errors.New("credit limit cannot be negative")
	}

	return nil
}

func (s *service) GenerateCustomerCode(ctx context.Context, name string) (string, error) {
	if name == "" {
		return "", errors.New("customer name is required to generate code")
	}

	// Generate base code from name (first 3 characters, uppercase)
	baseCode := ""
	for _, r := range name {
		if len(baseCode) >= 3 {
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

	// Pad with 'X' if less than 3 characters
	for len(baseCode) < 3 {
		baseCode += "X"
	}

	// Try sequential numbers
	for i := 1; i <= 999; i++ {
		code := fmt.Sprintf("%s%03d", baseCode, i)
		
		// Check if code already exists
		_, err := s.customerRepo.GetByCode(ctx, code)
		if err != nil {
			// Code doesn't exist, we can use it
			return code, nil
		}
	}

	return "", errors.New("unable to generate unique customer code")
}