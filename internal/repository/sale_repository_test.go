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

func setupSaleTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate tables for testing
	err = db.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Product{},
		&models.Category{},
		&models.Supplier{},
		&models.Sale{},
		&models.SaleItem{},
		&models.Payment{},
	)
	return db, err
}

func TestSaleRepository_Create(t *testing.T) {
	db, err := setupSaleTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewSaleRepository(db)
	ctx := context.Background()

	// Create test user (cashier)
	cashier := &models.User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(cashier).Error
	if err != nil {
		t.Fatalf("Failed to create test cashier: %v", err)
	}

	// Create test sale
	sale := &models.Sale{
		BillNumber:             "BILL-20240104-0001",
		CashierID:              cashier.ID,
		SaleDate:               time.Now(),
		BillDiscountAmount:     0,
		BillDiscountPercentage: 0,
		TotalAmount:            100.00,
		Notes:                  "Test sale",
	}

	err = repo.Create(ctx, sale)
	if err != nil {
		t.Fatalf("Failed to create sale: %v", err)
	}

	if sale.ID == uuid.Nil {
		t.Error("Sale ID should be set after creation")
	}
}

func TestSaleRepository_GetByBillNumber(t *testing.T) {
	db, err := setupSaleTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewSaleRepository(db)
	ctx := context.Background()

	// Create test user (cashier)
	cashier := &models.User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(cashier).Error
	if err != nil {
		t.Fatalf("Failed to create test cashier: %v", err)
	}

	// Create test sale
	billNumber := "BILL-20240104-0001"
	sale := &models.Sale{
		BillNumber:             billNumber,
		CashierID:              cashier.ID,
		SaleDate:               time.Now(),
		BillDiscountAmount:     0,
		BillDiscountPercentage: 0,
		TotalAmount:            100.00,
		Notes:                  "Test sale",
	}

	err = repo.Create(ctx, sale)
	if err != nil {
		t.Fatalf("Failed to create sale: %v", err)
	}

	// Test retrieval by bill number
	retrievedSale, err := repo.GetByBillNumber(ctx, billNumber)
	if err != nil {
		t.Fatalf("Failed to get sale by bill number: %v", err)
	}

	if retrievedSale.BillNumber != billNumber {
		t.Errorf("Expected bill number %s, got %s", billNumber, retrievedSale.BillNumber)
	}

	if retrievedSale.ID != sale.ID {
		t.Error("Retrieved sale ID should match created sale ID")
	}
}

func TestSaleRepository_GenerateBillNumber(t *testing.T) {
	db, err := setupSaleTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewSaleRepository(db)
	ctx := context.Background()

	billNumber, err := repo.GenerateBillNumber(ctx)
	if err != nil {
		t.Fatalf("Failed to generate bill number: %v", err)
	}

	if billNumber == "" {
		t.Error("Generated bill number should not be empty")
	}

	// Bill number should follow format: BILL-YYYYMMDD-NNNN
	today := time.Now()
	expectedPrefix := "BILL-" + today.Format("20060102")
	if len(billNumber) < len(expectedPrefix) || billNumber[:len(expectedPrefix)] != expectedPrefix {
		t.Errorf("Bill number should start with %s, got %s", expectedPrefix, billNumber)
	}
}

func TestSaleRepository_List(t *testing.T) {
	db, err := setupSaleTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewSaleRepository(db)
	ctx := context.Background()

	// Create test user (cashier)
	cashier := &models.User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(cashier).Error
	if err != nil {
		t.Fatalf("Failed to create test cashier: %v", err)
	}

	// Create multiple test sales
	for i := 1; i <= 3; i++ {
		sale := &models.Sale{
			BillNumber:             "BILL-20240104-000" + string(rune('0'+i)),
			CashierID:              cashier.ID,
			SaleDate:               time.Now(),
			BillDiscountAmount:     0,
			BillDiscountPercentage: 0,
			TotalAmount:            float64(100 * i),
			Notes:                  "Test sale",
		}

		err = repo.Create(ctx, sale)
		if err != nil {
			t.Fatalf("Failed to create test sale %d: %v", i, err)
		}
	}

	// Test list with pagination
	sales, total, err := repo.List(ctx, 0, 10)
	if err != nil {
		t.Fatalf("Failed to list sales: %v", err)
	}

	if total != 3 {
		t.Errorf("Expected total of 3 sales, got %d", total)
	}

	if len(sales) != 3 {
		t.Errorf("Expected 3 sales in result, got %d", len(sales))
	}
}

func TestSaleRepository_RecalculateTotal(t *testing.T) {
	db, err := setupSaleTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	repo := NewSaleRepository(db)
	ctx := context.Background()

	// Create test user (cashier)
	cashier := &models.User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password",
		Role:         models.RoleStaff,
	}
	err = db.Create(cashier).Error
	if err != nil {
		t.Fatalf("Failed to create test cashier: %v", err)
	}

	// Create test sale
	sale := &models.Sale{
		BillNumber:             "BILL-20240104-0001",
		CashierID:              cashier.ID,
		SaleDate:               time.Now(),
		BillDiscountAmount:     10.00,
		BillDiscountPercentage: 5.00,
		TotalAmount:            0.00, // Will be recalculated
		Notes:                  "Test sale",
	}

	err = repo.Create(ctx, sale)
	if err != nil {
		t.Fatalf("Failed to create sale: %v", err)
	}

	// Test recalculate total (without items, should be 0)
	err = repo.RecalculateTotal(ctx, sale.ID)
	if err != nil {
		t.Fatalf("Failed to recalculate total: %v", err)
	}

	// Verify the total is updated
	retrievedSale, err := repo.GetByID(ctx, sale.ID)
	if err != nil {
		t.Fatalf("Failed to retrieve sale after recalculation: %v", err)
	}

	if retrievedSale.TotalAmount != 0.00 {
		t.Errorf("Expected total amount to be 0.00 (no items), got %f", retrievedSale.TotalAmount)
	}
}