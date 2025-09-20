package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
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
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetBySKU(ctx context.Context, sku string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Where("sku = ?", sku).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	var product models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Where("barcode = ?", barcode).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetByName(ctx context.Context, name string) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Where("name LIKE ? COLLATE NOCASE", "%"+name+"%").Find(&products).Error
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
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Preload("Inventory").Limit(limit).Offset(offset).Find(&products).Error
	return products, err
}

func (r *productRepository) GetByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Preload("Inventory").Where("category_id = ?", categoryID).Find(&products).Error
	return products, err
}

func (r *productRepository) GetBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Preload("Inventory").Where("supplier_id = ?", supplierID).Find(&products).Error
	return products, err
}

func (r *productRepository) GetByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Preload("Inventory").Where("brand_id = ?", brandID).Find(&products).Error
	return products, err
}

func (r *productRepository) GetActive(ctx context.Context) ([]*models.Product, error) {
	var products []*models.Product
	err := r.db.WithContext(ctx).Preload("Category").Preload("Supplier").Preload("Brand").Preload("Inventory").Where("is_active = ?", true).Find(&products).Error
	return products, err
}

func (r *productRepository) Search(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	var products []*models.Product
	searchQuery := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("Category").
		Preload("Supplier").
		Preload("Brand").
		Preload("Inventory").
		Where("name LIKE ? COLLATE NOCASE OR sku LIKE ? COLLATE NOCASE OR barcode LIKE ? COLLATE NOCASE OR description LIKE ? COLLATE NOCASE",
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

func (r *productRepository) CountByCategory(ctx context.Context, categoryID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.Product{}).Where("category_id = ? AND is_active = true", categoryID).Count(&count).Error
	return count, err
}

func (r *productRepository) CountByCategoriesBulk(ctx context.Context, categoryIDs []uuid.UUID) (map[uuid.UUID]int64, error) {
	type CategoryCount struct {
		CategoryID uuid.UUID `json:"category_id"`
		Count      int64     `json:"count"`
	}

	var results []CategoryCount
	err := r.db.WithContext(ctx).
		Model(&models.Product{}).
		Select("category_id, COUNT(*) as count").
		Where("category_id IN ? AND is_active = true", categoryIDs).
		Group("category_id").
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	// Convert to map
	countMap := make(map[uuid.UUID]int64)
	for _, result := range results {
		countMap[result.CategoryID] = result.Count
	}

	// Fill in zero counts for categories not in results
	for _, categoryID := range categoryIDs {
		if _, exists := countMap[categoryID]; !exists {
			countMap[categoryID] = 0
		}
	}

	return countMap, nil
}