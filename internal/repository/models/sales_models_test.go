package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate tables for testing
	err = db.AutoMigrate(
		&User{},
		&Customer{},
		&Product{},
		&Supplier{},
		&Sale{},
		&SaleItem{},
		&Payment{},
		&StockBatch{},
		&StockMovement{},
	)
	return db, err
}

func TestSaleModel(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create test user (cashier)
	cashier := &User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password",
		Role:         RoleStaff,
	}
	err = db.Create(cashier).Error
	if err != nil {
		t.Fatalf("Failed to create test cashier: %v", err)
	}

	// Test Sale creation
	sale := &Sale{
		BillNumber:             "BILL-001",
		CashierID:              cashier.ID,
		SaleDate:               time.Now(),
		BillDiscountAmount:     10.50,
		BillDiscountPercentage: 5.0,
		TotalAmount:            200.00,
		Notes:                  "Test sale",
	}

	err = db.Create(sale).Error
	if err != nil {
		t.Fatalf("Failed to create sale: %v", err)
	}

	// Verify sale was created with UUID
	if sale.ID == uuid.Nil {
		t.Error("Sale ID should be generated automatically")
	}

	// Test unique bill number constraint
	duplicateSale := &Sale{
		BillNumber: "BILL-001",
		CashierID:  cashier.ID,
		TotalAmount: 100.00,
	}

	err = db.Create(duplicateSale).Error
	if err == nil {
		t.Error("Should fail to create sale with duplicate bill number")
	}
}

func TestSaleItemModel(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create dependencies
	cashier := &User{
		Username:     "test_cashier",
		Email:        "cashier@test.com", 
		PasswordHash: "hashed_password",
		Role:         RoleStaff,
	}
	db.Create(cashier)

	product := &Product{
		Name: "Test Product",
		SKU:  "TEST-001",
	}
	db.Create(product)

	sale := &Sale{
		BillNumber:  "BILL-001",
		CashierID:   cashier.ID,
		TotalAmount: 100.00,
	}
	db.Create(sale)

	// Test SaleItem creation
	saleItem := &SaleItem{
		SaleID:                 sale.ID,
		ProductID:              product.ID,
		UnitPrice:              25.00,
		UnitCost:               15.00,
		Quantity:               2,
		ItemDiscountAmount:     2.50,
		ItemDiscountPercentage: 5.0,
		LineTotal:              47.50,
	}

	err = db.Create(saleItem).Error
	if err != nil {
		t.Fatalf("Failed to create sale item: %v", err)
	}

	// Verify sale item was created with UUID
	if saleItem.ID == uuid.Nil {
		t.Error("Sale item ID should be generated automatically")
	}
}

func TestPaymentModel(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create dependencies
	cashier := &User{
		Username:     "test_cashier",
		Email:        "cashier@test.com",
		PasswordHash: "hashed_password", 
		Role:         RoleStaff,
	}
	db.Create(cashier)

	sale := &Sale{
		BillNumber:  "BILL-001",
		CashierID:   cashier.ID,
		TotalAmount: 100.00,
	}
	db.Create(sale)

	// Test Payment creation
	payment := &Payment{
		SaleID:    sale.ID,
		Method:    PaymentMethodCash,
		Amount:    100.00,
		Reference: "CASH-001",
		Notes:     "Cash payment",
	}

	err = db.Create(payment).Error
	if err != nil {
		t.Fatalf("Failed to create payment: %v", err)
	}

	// Verify payment was created with UUID
	if payment.ID == uuid.Nil {
		t.Error("Payment ID should be generated automatically")
	}

	// Test payment method enum
	validMethods := []PaymentMethod{
		PaymentMethodCash,
		PaymentMethodCard,
		PaymentMethodBankTransfer,
		PaymentMethodEWallet,
		PaymentMethodCheck,
	}

	for _, method := range validMethods {
		testPayment := &Payment{
			SaleID: sale.ID,
			Method: method,
			Amount: 50.00,
		}
		err = db.Create(testPayment).Error
		if err != nil {
			t.Errorf("Failed to create payment with method %s: %v", method, err)
		}
	}
}

func TestStockBatchModel(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create dependencies
	product := &Product{
		Name: "Test Product",
		SKU:  "TEST-001", 
	}
	db.Create(product)

	supplier := &Supplier{
		Name: "Test Supplier",
	}
	db.Create(supplier)

	// Test StockBatch creation
	batch := &StockBatch{
		ProductID:         product.ID,
		BatchNumber:       "BATCH-001",
		LotNumber:         "LOT-001",
		SupplierID:        &supplier.ID,
		Quantity:          100,
		AvailableQuantity: 100,
		CostPrice:         15.00,
		ManufactureDate:   &time.Time{},
		ReceivedDate:      &time.Time{},
		Notes:             "Test batch",
		IsActive:          true,
	}

	err = db.Create(batch).Error
	if err != nil {
		t.Fatalf("Failed to create stock batch: %v", err)
	}

	// Verify stock batch was created with UUID
	if batch.ID == uuid.Nil {
		t.Error("Stock batch ID should be generated automatically")
	}

	// Verify default values
	if !batch.IsActive {
		t.Error("Stock batch should be active by default")
	}

	if batch.AvailableQuantity != batch.Quantity {
		t.Error("Available quantity should equal total quantity initially")
	}
}

func TestStockMovementBatchIntegration(t *testing.T) {
	db, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create dependencies
	user := &User{
		Username:     "test_user",
		Email:        "user@test.com",
		PasswordHash: "hashed_password",
		Role:         RoleStaff,
	}
	db.Create(user)

	product := &Product{
		Name: "Test Product",
		SKU:  "TEST-001",
	}
	db.Create(product)

	batch := &StockBatch{
		ProductID:         product.ID,
		BatchNumber:       "BATCH-001",
		Quantity:          100,
		AvailableQuantity: 100,
		CostPrice:         15.00,
		IsActive:          true,
	}
	db.Create(batch)

	// Test StockMovement with batch reference
	movement := &StockMovement{
		ProductID:     product.ID,
		BatchID:       &batch.ID,
		MovementType:  MovementOUT,
		Quantity:      10,
		ReferenceID:   "SALE-001",
		ReferenceType: "sale",
		UserID:        user.ID,
		UnitCost:      15.00,
		Notes:         "Sale movement with batch tracking",
	}

	err = db.Create(movement).Error
	if err != nil {
		t.Fatalf("Failed to create stock movement with batch: %v", err)
	}

	// Verify stock movement was created with UUID and total cost calculated
	if movement.ID == uuid.Nil {
		t.Error("Stock movement ID should be generated automatically")
	}

	expectedTotalCost := 15.00 * 10
	if movement.TotalCost != expectedTotalCost {
		t.Errorf("Expected total cost %f, got %f", expectedTotalCost, movement.TotalCost)
	}
}