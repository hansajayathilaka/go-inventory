package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) interfaces.ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *productRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("sku = ?", sku).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("barcode = ?", barcode).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetByName(ctx context.Context, name string) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("name ILIKE ?", "%"+name+"%").Find(&products).Error
	return products, err
}

func (r *productRepository) Update(ctx context.Context, product *models.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *productRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Product{}, id).Error
}

func (r *productRepository) List(ctx context.Context, limit, offset int) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Limit(limit).Offset(offset).Find(&products).Error
	return products, err
}

func (r *productRepository) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("category_id = ?", categoryID).Find(&products).Error
	return products, err
}

func (r *productRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("supplier_id = ?", supplierID).Find(&products).Error
	return products, err
}

func (r *productRepository) GetActive(ctx context.Context) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Where("is_active = ?", true).Find(&products).Error
	return products, err
}

func (r *productRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	var products []*models.Product
	searchQuery := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Supplier").
		Where("name ILIKE ? OR sku ILIKE ? OR barcode ILIKE ? OR description ILIKE ?", 
			searchQuery, searchQuery, searchQuery, searchQuery).
		Limit(limit).
		Offset(offset).
		Find(&products).Error
	return products, err
}

func (r *productRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Product{}).Count(&count).Error
	return count, err
}