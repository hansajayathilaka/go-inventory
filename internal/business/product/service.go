package product

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

var (
	ErrProductNotFound      = errors.New("product not found")
	ErrProductExists        = errors.New("product already exists")
	ErrInvalidProduct       = errors.New("invalid product data")
	ErrSKUExists           = errors.New("SKU already exists")
	ErrBarcodeExists       = errors.New("barcode already exists")
	ErrCategoryNotFound    = errors.New("category not found")
	ErrSupplierNotFound    = errors.New("supplier not found")
	ErrBrandNotFound       = errors.New("brand not found")
)

type Service interface {
	CreateProduct(ctx context.Context, product *models.Product) error
	GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*models.Product, error)
	GetProductByBarcode(ctx context.Context, barcode string) (*models.Product, error)
	UpdateProduct(ctx context.Context, product *models.Product) error
	DeleteProduct(ctx context.Context, id uuid.UUID) error
	ListProducts(ctx context.Context, limit, offset int) ([]*models.Product, error)
	GetProductsByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error)
	GetProductsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error)
	GetProductsByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error)
	SearchProducts(ctx context.Context, query string, limit, offset int) ([]*models.Product, error)
	GetActiveProducts(ctx context.Context) ([]*models.Product, error)
	CountProducts(ctx context.Context) (int64, error)
	
	// Brand integration methods
	SetProductBrand(ctx context.Context, productID, brandID uuid.UUID) error
	RemoveProductBrand(ctx context.Context, productID uuid.UUID) error
	GetProductsWithoutBrand(ctx context.Context) ([]*models.Product, error)
	CountProductsByBrand(ctx context.Context, brandID uuid.UUID) (int64, error)
}

type service struct {
	productRepo  interfaces.ProductRepository
	categoryRepo interfaces.CategoryRepository
	supplierRepo interfaces.SupplierRepository
	brandRepo    interfaces.BrandRepository
}

func NewService(
	productRepo interfaces.ProductRepository,
	categoryRepo interfaces.CategoryRepository,
	supplierRepo interfaces.SupplierRepository,
	brandRepo interfaces.BrandRepository,
) Service {
	return &service{
		productRepo:  productRepo,
		categoryRepo: categoryRepo,
		supplierRepo: supplierRepo,
		brandRepo:    brandRepo,
	}
}

func (s *service) CreateProduct(ctx context.Context, product *models.Product) error {
	if err := s.validateProduct(ctx, product, false); err != nil {
		return err
	}

	// Check if SKU already exists
	if existing, _ := s.productRepo.GetBySKU(ctx, product.SKU); existing != nil {
		return ErrSKUExists
	}

	// Check if barcode already exists (if provided)
	if product.Barcode != "" {
		if existing, _ := s.productRepo.GetByBarcode(ctx, product.Barcode); existing != nil {
			return ErrBarcodeExists
		}
	}

	return s.productRepo.Create(ctx, product)
}

func (s *service) GetProduct(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	return s.productRepo.GetByID(ctx, id)
}

func (s *service) GetProductBySKU(ctx context.Context, sku string) (*models.Product, error) {
	if strings.TrimSpace(sku) == "" {
		return nil, ErrInvalidProduct
	}
	return s.productRepo.GetBySKU(ctx, sku)
}

func (s *service) GetProductByBarcode(ctx context.Context, barcode string) (*models.Product, error) {
	if strings.TrimSpace(barcode) == "" {
		return nil, ErrInvalidProduct
	}
	return s.productRepo.GetByBarcode(ctx, barcode)
}

func (s *service) UpdateProduct(ctx context.Context, product *models.Product) error {
	if err := s.validateProduct(ctx, product, true); err != nil {
		return err
	}

	// Check if another product has this SKU
	if existing, _ := s.productRepo.GetBySKU(ctx, product.SKU); existing != nil && existing.ID != product.ID {
		return ErrSKUExists
	}

	// Check if another product has this barcode
	if product.Barcode != "" {
		if existing, _ := s.productRepo.GetByBarcode(ctx, product.Barcode); existing != nil && existing.ID != product.ID {
			return ErrBarcodeExists
		}
	}

	return s.productRepo.Update(ctx, product)
}

func (s *service) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	// Check if product exists
	_, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return ErrProductNotFound
	}

	return s.productRepo.Delete(ctx, id)
}

func (s *service) ListProducts(ctx context.Context, limit, offset int) ([]*models.Product, error) {
	if limit <= 0 {
		limit = 50 // Default limit
	}
	if offset < 0 {
		offset = 0
	}
	return s.productRepo.List(ctx, limit, offset)
}

func (s *service) GetProductsByCategory(ctx context.Context, categoryID uuid.UUID) ([]*models.Product, error) {
	// Verify category exists
	_, err := s.categoryRepo.GetByID(ctx, categoryID)
	if err != nil {
		return nil, ErrCategoryNotFound
	}

	return s.productRepo.GetByCategory(ctx, categoryID)
}

func (s *service) GetProductsBySupplier(ctx context.Context, supplierID uuid.UUID) ([]*models.Product, error) {
	// Verify supplier exists
	_, err := s.supplierRepo.GetByID(ctx, supplierID)
	if err != nil {
		return nil, ErrSupplierNotFound
	}

	return s.productRepo.GetBySupplier(ctx, supplierID)
}

func (s *service) GetProductsByBrand(ctx context.Context, brandID uuid.UUID) ([]*models.Product, error) {
	// Verify brand exists
	_, err := s.brandRepo.GetByID(ctx, brandID)
	if err != nil {
		return nil, ErrBrandNotFound
	}

	return s.productRepo.GetByBrand(ctx, brandID)
}

func (s *service) SearchProducts(ctx context.Context, query string, limit, offset int) ([]*models.Product, error) {
	if strings.TrimSpace(query) == "" {
		return []*models.Product{}, nil
	}

	if limit <= 0 {
		limit = 50 // Default limit
	}
	if offset < 0 {
		offset = 0
	}

	return s.productRepo.Search(ctx, query, limit, offset)
}

func (s *service) GetActiveProducts(ctx context.Context) ([]*models.Product, error) {
	return s.productRepo.GetActive(ctx)
}

func (s *service) CountProducts(ctx context.Context) (int64, error) {
	return s.productRepo.Count(ctx)
}

func (s *service) validateProduct(ctx context.Context, product *models.Product, isUpdate bool) error {
	if product == nil {
		return ErrInvalidProduct
	}

	// Validate required fields
	if strings.TrimSpace(product.SKU) == "" {
		return ErrInvalidProduct
	}
	if strings.TrimSpace(product.Name) == "" {
		return ErrInvalidProduct
	}
	if product.CategoryID == uuid.Nil {
		return ErrInvalidProduct
	}

	// Validate prices
	if product.CostPrice < 0 || product.RetailPrice < 0 || product.WholesalePrice < 0 {
		return ErrInvalidProduct
	}

	// Verify category exists
	_, err := s.categoryRepo.GetByID(ctx, product.CategoryID)
	if err != nil {
		return ErrCategoryNotFound
	}

	// Verify supplier exists (if provided)
	if product.SupplierID != nil && *product.SupplierID != uuid.Nil {
		_, err := s.supplierRepo.GetByID(ctx, *product.SupplierID)
		if err != nil {
			return ErrSupplierNotFound
		}
	}

	// Verify brand exists (if provided)
	if product.BrandID != nil && *product.BrandID != uuid.Nil {
		_, err := s.brandRepo.GetByID(ctx, *product.BrandID)
		if err != nil {
			return ErrBrandNotFound
		}
	}

	return nil
}

// Brand integration methods
func (s *service) SetProductBrand(ctx context.Context, productID, brandID uuid.UUID) error {
	// Verify product exists
	product, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return ErrProductNotFound
	}

	// Verify brand exists
	_, err = s.brandRepo.GetByID(ctx, brandID)
	if err != nil {
		return ErrBrandNotFound
	}

	// Update product with brand
	product.BrandID = &brandID
	return s.productRepo.Update(ctx, product)
}

func (s *service) RemoveProductBrand(ctx context.Context, productID uuid.UUID) error {
	// Verify product exists
	product, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return ErrProductNotFound
	}

	// Remove brand from product
	product.BrandID = nil
	return s.productRepo.Update(ctx, product)
}

func (s *service) GetProductsWithoutBrand(ctx context.Context) ([]*models.Product, error) {
	// Get all products and filter those without brands
	allProducts, err := s.productRepo.GetActive(ctx)
	if err != nil {
		return nil, err
	}

	var productsWithoutBrand []*models.Product
	for _, product := range allProducts {
		if product.BrandID == nil || *product.BrandID == uuid.Nil {
			productsWithoutBrand = append(productsWithoutBrand, product)
		}
	}

	return productsWithoutBrand, nil
}

func (s *service) CountProductsByBrand(ctx context.Context, brandID uuid.UUID) (int64, error) {
	// Verify brand exists
	_, err := s.brandRepo.GetByID(ctx, brandID)
	if err != nil {
		return 0, ErrBrandNotFound
	}

	// Get products by brand and count them
	products, err := s.productRepo.GetByBrand(ctx, brandID)
	if err != nil {
		return 0, err
	}

	return int64(len(products)), nil
}