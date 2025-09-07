package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"inventory-api/internal/repository/models"
)

func setupRepositoryTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate all tables for testing
	err = db.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Product{},
		&models.Category{},
		&models.Brand{},
		&models.Supplier{},
		&models.Inventory{},
		&models.PurchaseReceipt{},
		&models.PurchaseReceiptItem{},
		&models.StockBatch{},
		&models.StockMovement{},
		&models.Sale{},
		&models.SaleItem{},
		&models.Payment{},
	)
	return db, err
}

// Customer Repository Tests
func TestCustomerRepository_Create(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewCustomerRepository(db)
	ctx := context.Background()

	customer := &models.Customer{
		Name:     "Test Customer",
		Code:     "CUST001",
		Email:    "test@customer.com",
		Phone:    "1234567890",
		IsActive: true,
	}

	err = repo.Create(ctx, customer)
	if err != nil {
		t.Fatalf("Failed to create customer: %v", err)
	}

	if customer.ID == uuid.Nil {
		t.Error("Customer ID should be set after creation")
	}
}

func TestCustomerRepository_GetByID(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewCustomerRepository(db)
	ctx := context.Background()

	customer := &models.Customer{
		Name:     "Test Customer",
		Code:     "CUST001",
		Email:    "test@customer.com",
		IsActive: true,
	}

	err = repo.Create(ctx, customer)
	if err != nil {
		t.Fatalf("Failed to create customer: %v", err)
	}

	retrieved, err := repo.GetByID(ctx, customer.ID)
	if err != nil {
		t.Fatalf("Failed to get customer by ID: %v", err)
	}

	if retrieved.Name != customer.Name {
		t.Errorf("Expected customer name %s, got %s", customer.Name, retrieved.Name)
	}
}

func TestCustomerRepository_List(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewCustomerRepository(db)
	ctx := context.Background()

	// Create multiple customers
	for i := 1; i <= 3; i++ {
		customer := &models.Customer{
			Name:     "Test Customer " + string(rune('0'+i)),
			Code:     "CUST00" + string(rune('0'+i)),
			IsActive: true,
		}

		err = repo.Create(ctx, customer)
		if err != nil {
			t.Fatalf("Failed to create customer %d: %v", i, err)
		}
	}

	customers, err := repo.List(ctx, 10, 0)
	if err != nil {
		t.Fatalf("Failed to list customers: %v", err)
	}

	if len(customers) != 3 {
		t.Errorf("Expected 3 customers in result, got %d", len(customers))
	}
}

// Product Repository Tests  
func TestProductRepository_Create(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewProductRepository(db)
	ctx := context.Background()

	// Create category first
	category := &models.Category{
		Name: "Test Category",
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	product := &models.Product{
		Name:        "Test Product",
		SKU:         "TEST-001",
		CategoryID:  category.ID,
		CostPrice:   10.00,
		RetailPrice: 15.00,
		IsActive:    true,
	}

	err = repo.Create(ctx, product)
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	if product.ID == uuid.Nil {
		t.Error("Product ID should be set after creation")
	}
}

func TestProductRepository_GetByID(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewProductRepository(db)
	ctx := context.Background()

	// Create category first
	category := &models.Category{
		Name: "Test Category",
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	product := &models.Product{
		Name:        "Test Product",
		SKU:         "TEST-001",
		CategoryID:  category.ID,
		CostPrice:   10.00,
		RetailPrice: 15.00,
		IsActive:    true,
	}

	err = repo.Create(ctx, product)
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	retrieved, err := repo.GetByID(ctx, product.ID)
	if err != nil {
		t.Fatalf("Failed to get product by ID: %v", err)
	}

	if retrieved.SKU != product.SKU {
		t.Errorf("Expected product SKU %s, got %s", product.SKU, retrieved.SKU)
	}
}

func TestProductRepository_GetBySKU(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewProductRepository(db)
	ctx := context.Background()

	// Create category first
	category := &models.Category{
		Name: "Test Category",
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	sku := "TEST-001"
	product := &models.Product{
		Name:        "Test Product",
		SKU:         sku,
		CategoryID:  category.ID,
		CostPrice:   10.00,
		RetailPrice: 15.00,
		IsActive:    true,
	}

	err = repo.Create(ctx, product)
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	retrieved, err := repo.GetBySKU(ctx, sku)
	if err != nil {
		t.Fatalf("Failed to get product by SKU: %v", err)
	}

	if retrieved.ID != product.ID {
		t.Error("Retrieved product ID should match created product ID")
	}
}

// Stock Batch Repository Tests
func TestStockBatchRepository_Create(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewStockBatchRepository(db)
	ctx := context.Background()

	// Create category and product first
	category := &models.Category{
		Name: "Test Category",
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	product := &models.Product{
		Name:       "Test Product",
		SKU:        "TEST-001",
		CategoryID: category.ID,
	}
	err = db.Create(product).Error
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	batch := &models.StockBatch{
		ProductID:         product.ID,
		BatchNumber:       "BATCH-001",
		Quantity:          100,
		AvailableQuantity: 100,
		CostPrice:         15.00,
		IsActive:          true,
	}

	err = repo.Create(ctx, batch)
	if err != nil {
		t.Fatalf("Failed to create stock batch: %v", err)
	}

	if batch.ID == uuid.Nil {
		t.Error("Stock batch ID should be set after creation")
	}
}

func TestStockBatchRepository_GetByProductFIFO(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewStockBatchRepository(db)
	ctx := context.Background()

	// Create category and product first
	category := &models.Category{
		Name: "Test Category",
	}
	err = db.Create(category).Error
	if err != nil {
		t.Fatalf("Failed to create category: %v", err)
	}

	product := &models.Product{
		Name:       "Test Product",
		SKU:        "TEST-001",
		CategoryID: category.ID,
	}
	err = db.Create(product).Error
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	// Create multiple batches with different dates
	now := time.Now()
	batch1 := &models.StockBatch{
		ProductID:         product.ID,
		BatchNumber:       "BATCH-001",
		Quantity:          100,
		AvailableQuantity: 100,
		CostPrice:         15.00,
		IsActive:          true,
		CreatedAt:         now.Add(-2 * time.Hour),
	}
	err = repo.Create(ctx, batch1)
	if err != nil {
		t.Fatalf("Failed to create first batch: %v", err)
	}

	batch2 := &models.StockBatch{
		ProductID:         product.ID,
		BatchNumber:       "BATCH-002",
		Quantity:          50,
		AvailableQuantity: 50,
		CostPrice:         18.00,
		IsActive:          true,
		CreatedAt:         now.Add(-1 * time.Hour),
	}
	err = repo.Create(ctx, batch2)
	if err != nil {
		t.Fatalf("Failed to create second batch: %v", err)
	}

	// Test FIFO allocation using GetBatchesForSale
	batches, err := repo.GetBatchesForSale(ctx, product.ID, 75, "FIFO")
	if err != nil {
		t.Fatalf("Failed to get batches for sale FIFO: %v", err)
	}

	if len(batches) == 0 {
		t.Error("Should return at least one batch")
	}

	// First batch should be the oldest one
	if batches[0].BatchNumber != "BATCH-001" {
		t.Errorf("Expected first batch to be BATCH-001, got %s", batches[0].BatchNumber)
	}
}

// Purchase Receipt Repository Tests
func TestPurchaseReceiptRepository_Create(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewPurchaseReceiptRepository(db)
	ctx := context.Background()

	// Create user and supplier first
	user := &models.User{
		Username:     "test_user",
		Email:        "user@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	supplier := &models.Supplier{
		Name:        "Test Supplier",
		ContactName: "Contact Person",
		Email:       "supplier@test.com",
	}
	err = db.Create(supplier).Error
	if err != nil {
		t.Fatalf("Failed to create supplier: %v", err)
	}

	receipt := &models.PurchaseReceipt{
		ReceiptNumber:      "PR-001",
		SupplierID:         supplier.ID,
		CreatedByID:        user.ID,
		PurchaseDate:       time.Now(),
		TotalAmount:        1000.00,
		Status:             models.PurchaseReceiptStatusPending,
	}

	err = repo.Create(ctx, receipt)
	if err != nil {
		t.Fatalf("Failed to create purchase receipt: %v", err)
	}

	if receipt.ID == uuid.Nil {
		t.Error("Purchase receipt ID should be set after creation")
	}
}

func TestPurchaseReceiptRepository_GetByID(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewPurchaseReceiptRepository(db)
	ctx := context.Background()

	// Create user and supplier first
	user := &models.User{
		Username:     "test_user",
		Email:        "user@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	supplier := &models.Supplier{
		Name:        "Test Supplier",
		ContactName: "Contact Person",
		Email:       "supplier@test.com",
	}
	err = db.Create(supplier).Error
	if err != nil {
		t.Fatalf("Failed to create supplier: %v", err)
	}

	receipt := &models.PurchaseReceipt{
		ReceiptNumber:      "PR-001",
		SupplierID:         supplier.ID,
		CreatedByID:        user.ID,
		PurchaseDate:       time.Now(),
		TotalAmount:        1000.00,
		Status:             models.PurchaseReceiptStatusPending,
	}

	err = repo.Create(ctx, receipt)
	if err != nil {
		t.Fatalf("Failed to create purchase receipt: %v", err)
	}

	retrieved, err := repo.GetByID(ctx, receipt.ID)
	if err != nil {
		t.Fatalf("Failed to get purchase receipt by ID: %v", err)
	}

	if retrieved.ReceiptNumber != receipt.ReceiptNumber {
		t.Errorf("Expected receipt number %s, got %s", receipt.ReceiptNumber, retrieved.ReceiptNumber)
	}
}

func TestPurchaseReceiptRepository_UpdateStatus(t *testing.T) {
	db, err := setupRepositoryTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewPurchaseReceiptRepository(db)
	ctx := context.Background()

	// Create user and supplier first
	user := &models.User{
		Username:     "test_user",
		Email:        "user@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	supplier := &models.Supplier{
		Name:        "Test Supplier",
		ContactName: "Contact Person",
		Email:       "supplier@test.com",
	}
	err = db.Create(supplier).Error
	if err != nil {
		t.Fatalf("Failed to create supplier: %v", err)
	}

	receipt := &models.PurchaseReceipt{
		ReceiptNumber:      "PR-001",
		SupplierID:         supplier.ID,
		CreatedByID:        user.ID,
		PurchaseDate:       time.Now(),
		TotalAmount:        1000.00,
		Status:             models.PurchaseReceiptStatusPending,
	}

	err = repo.Create(ctx, receipt)
	if err != nil {
		t.Fatalf("Failed to create purchase receipt: %v", err)
	}

	// Update status (requires updatedByID parameter)
	newStatus := models.PurchaseReceiptStatusReceived
	err = repo.UpdateStatus(ctx, receipt.ID, newStatus, user.ID)
	if err != nil {
		t.Fatalf("Failed to update purchase receipt status: %v", err)
	}

	// Verify status was updated
	updated, err := repo.GetByID(ctx, receipt.ID)
	if err != nil {
		t.Fatalf("Failed to get updated purchase receipt: %v", err)
	}

	if updated.Status != newStatus {
		t.Errorf("Expected status %s, got %s", newStatus, updated.Status)
	}
}