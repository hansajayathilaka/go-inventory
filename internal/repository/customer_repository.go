package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) interfaces.CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) Create(ctx context.Context, customer *models.Customer) error {
	return r.db.WithContext(ctx).Create(customer).Error
}

func (r *customerRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).First(&customer, id).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) GetByCode(ctx context.Context, code string) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) GetByName(ctx context.Context, name string) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).Where("name ILIKE ?", "%"+name+"%").First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) GetByEmail(ctx context.Context, email string) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *customerRepository) Update(ctx context.Context, customer *models.Customer) error {
	return r.db.WithContext(ctx).Save(customer).Error
}

func (r *customerRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Customer{}, id).Error
}

func (r *customerRepository) List(ctx context.Context, limit, offset int) ([]*models.Customer, error) {
	var customers []*models.Customer
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&customers).Error
	return customers, err
}

func (r *customerRepository) GetActive(ctx context.Context) ([]*models.Customer, error) {
	var customers []*models.Customer
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Find(&customers).Error
	return customers, err
}

func (r *customerRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Customer{}).Count(&count).Error
	return count, err
}

func (r *customerRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Customer, error) {
	var customers []*models.Customer
	searchPattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR code ILIKE ?", 
			searchPattern, searchPattern, searchPattern, searchPattern).
		Limit(limit).Offset(offset).
		Find(&customers).Error
	return customers, err
}