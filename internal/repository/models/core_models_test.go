package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupCoreTestDB() (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto-migrate all tables for testing
	err = db.AutoMigrate(
		&User{},
		&Customer{},
		&Product{},
		&Category{},
		&Brand{},
		&Supplier{},
		&Inventory{},
		&PurchaseReceipt{},
		&PurchaseReceiptItem{},
		&AuditLog{},
	)
	return db, err
}

func TestUserModel(t *testing.T) {
	db, err := setupCoreTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Test User creation
	user := &User{
		Username:     "test_user",
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Role:         RoleAdmin,
	}

	err = db.Create(user).Error
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}

	// Verify user was created with UUID
	if user.ID == uuid.Nil {
		t.Error("User ID should be generated automatically")
	}

	// Test unique username constraint
	duplicateUser := &User{
		Username:     "test_user",
		Email:        "test2@example.com",
		PasswordHash: "hashed_password",
		Role:         RoleStaff,
	}

	err = db.Create(duplicateUser).Error
	if err == nil {
		t.Error("Should fail to create user with duplicate username")
	}

	// Test unique email constraint
	duplicateEmailUser := &User{
		Username:     "test_user2",
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Role:         RoleStaff,
	}

	err = db.Create(duplicateEmailUser).Error
	if err == nil {
		t.Error("Should fail to create user with duplicate email")
	}

	// Test all role values
	validRoles := []UserRole{RoleAdmin, RoleManager, RoleStaff, RoleViewer}
	for i, role := range validRoles {
		testUser := &User{
			Username:     "test_role_" + string(role),
			Email:        "role" + string(rune(i+48)) + "@example.com",
			PasswordHash: "hashed_password",
			Role:         role,
		}
		err = db.Create(testUser).Error
		if err != nil {
			t.Errorf("Failed to create user with role %s: %v", role, err)
		}
	}
}

func TestCustomerModel(t *testing.T) {
	db, err := setupCoreTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Test Customer creation
	customer := &Customer{
		Name:       "Test Customer",
		Code:       "CUST001",
		Email:      "customer@example.com",
		Phone:      "1234567890",
		Address:    "123 Test Street",
		City:       "Test City",
		State:      "Test State",
		PostalCode: "12345",
		Country:    "Test Country",
		Notes:      "Test customer notes",
		IsActive:   true,
	}

	err = db.Create(customer).Error
	if err != nil {
		t.Fatalf("Failed to create customer: %v", err)
	}

	// Verify customer was created with UUID
	if customer.ID == uuid.Nil {
		t.Error("Customer ID should be generated automatically")
	}

	// Test unique code constraint
	duplicateCustomer := &Customer{
		Name: "Test Customer 2",
		Code: "CUST001",
	}
	err = db.Create(duplicateCustomer).Error
	if err == nil {
		t.Error("Should fail to create customer with duplicate code")
	}
}

func TestProductModel(t *testing.T) {
	db, err := setupCoreTestDB()
	if err != nil {
		t.Fatalf("Failed to setup test database: %v", err)
	}

	// Create dependencies
	category := &Category{
		Name:        "Test Category",
		Description: "Test category description",
	}
	db.Create(category)

	brand := &Brand{
		Name:        "Test Brand",
		Description: "Test brand description",
	}
	db.Create(brand)

	supplier := &Supplier{
		Name:        "Test Supplier",
		ContactName: "Supplier Contact",
		Email:       "supplier@example.com",
	}
	db.Create(supplier)

	// Test Product creation
	product := &Product{
		Name:           "Test Product",
		Description:    "Test product description",
		SKU:            "TEST-SKU-001",
		CategoryID:     category.ID,
		BrandID:        &brand.ID,
		SupplierID:     &supplier.ID,
		RetailPrice:    25.99,
		CostPrice:      15.99,
		WholesalePrice: 20.99,
		Weight:         1.5,
		Dimensions:     "10x5x2 cm",
		IsActive:       true,
	}

	err = db.Create(product).Error
	if err != nil {
		t.Fatalf("Failed to create product: %v", err)
	}

	// Verify product was created with UUID
	if product.ID == uuid.Nil {
		t.Error("Product ID should be generated automatically")
	}

	// Test unique SKU constraint
	duplicateProduct := &Product{
		Name:       "Test Product 2",
		SKU:        "TEST-SKU-001",
		CategoryID: category.ID,
	}

	err = db.Create(duplicateProduct).Error
	if err == nil {
		t.Error("Should fail to create product with duplicate SKU")
	}

	// Verify default active status
	if !product.IsActive {
		t.Error("Product should be active by default")
	}
}

func TestPurchaseReceiptModel(t *testing.T) {
	db, err := setupCoreTestDB()
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

	supplier := &Supplier{
		Name:        "Test Supplier",
		ContactName: "Supplier Contact",
		Email:       "supplier@test.com",
	}
	db.Create(supplier)

	// Test PurchaseReceipt creation
	receipt := &PurchaseReceipt{
		ReceiptNumber:          "PR-001",
		SupplierBillNumber:     "SUPPLIER-BILL-001",
		SupplierID:             supplier.ID,
		CreatedByID:            user.ID,
		PurchaseDate:           time.Now(),
		TotalAmount:            1000.00,
		BillDiscountAmount:     50.00,
		BillDiscountPercentage: 5.0,
		Notes:                  "Test purchase receipt",
		Status:                 PurchaseReceiptStatusPending,
	}

	err = db.Create(receipt).Error
	if err != nil {
		t.Fatalf("Failed to create purchase receipt: %v", err)
	}

	// Verify purchase receipt was created with UUID
	if receipt.ID == uuid.Nil {
		t.Error("Purchase receipt ID should be generated automatically")
	}

	// Test status enum values
	validStatuses := []PurchaseReceiptStatus{
		PurchaseReceiptStatusPending,
		PurchaseReceiptStatusReceived,
		PurchaseReceiptStatusCompleted,
		PurchaseReceiptStatusCancelled,
	}
	for i, status := range validStatuses {
		testReceipt := &PurchaseReceipt{
			ReceiptNumber:      "PR-00" + string(rune(i+50)),
			SupplierBillNumber: "SUPPLIER-BILL-00" + string(rune(i+50)),
			SupplierID:         supplier.ID,
			CreatedByID:        user.ID,
			PurchaseDate:       time.Now(),
			TotalAmount:        100.00,
			Status:             status,
		}
		err = db.Create(testReceipt).Error
		if err != nil {
			t.Errorf("Failed to create purchase receipt with status %s: %v", status, err)
		}
	}

	// Test unique receipt number constraint
	duplicateReceipt := &PurchaseReceipt{
		ReceiptNumber:      "PR-001",
		SupplierBillNumber: "SUPPLIER-BILL-002",
		SupplierID:         supplier.ID,
		CreatedByID:        user.ID,
		PurchaseDate:       time.Now(),
		TotalAmount:        500.00,
		Status:             PurchaseReceiptStatusPending,
	}

	err = db.Create(duplicateReceipt).Error
	if err == nil {
		t.Error("Should fail to create purchase receipt with duplicate receipt number")
	}
}

func TestPurchaseReceiptItemModel(t *testing.T) {
	db, err := setupCoreTestDB()
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

	supplier := &Supplier{
		Name:        "Test Supplier",
		ContactName: "Supplier Contact",
		Email:       "supplier@test.com",
	}
	db.Create(supplier)

	category := &Category{
		Name: "Test Category",
	}
	db.Create(category)

	receipt := &PurchaseReceipt{
		ReceiptNumber:      "PR-001",
		SupplierBillNumber: "SUPPLIER-BILL-001",
		SupplierID:         supplier.ID,
		CreatedByID:        user.ID,
		PurchaseDate:       time.Now(),
		TotalAmount:        1000.00,
		Status:             PurchaseReceiptStatusPending,
	}
	db.Create(receipt)

	product := &Product{
		Name:       "Test Product",
		SKU:        "TEST-001",
		CategoryID: category.ID,
	}
	db.Create(product)

	// Test PurchaseReceiptItem creation
	item := &PurchaseReceiptItem{
		PurchaseReceiptID:      receipt.ID,
		ProductID:              product.ID,
		Quantity:               10,
		UnitCost:               15.99,
		ItemDiscountAmount:     5.00,
		ItemDiscountPercentage: 2.5,
		LineTotal:              154.90,
	}

	err = db.Create(item).Error
	if err != nil {
		t.Fatalf("Failed to create purchase receipt item: %v", err)
	}

	// Verify purchase receipt item was created with UUID
	if item.ID == uuid.Nil {
		t.Error("Purchase receipt item ID should be generated automatically")
	}

	// Verify calculations are reasonable (line total should be positive)
	if item.LineTotal < 0 {
		t.Error("Line total should not be negative")
	}
}

func TestPurchaseReceiptMethods(t *testing.T) {
	// Test CanReceiveGoods method
	receipt := &PurchaseReceipt{Status: PurchaseReceiptStatusPending}
	if !receipt.CanReceiveGoods() {
		t.Error("Pending receipt should be able to receive goods")
	}

	receipt.Status = PurchaseReceiptStatusReceived
	if !receipt.CanReceiveGoods() {
		t.Error("Received receipt should be able to receive goods")
	}

	receipt.Status = PurchaseReceiptStatusCompleted
	if receipt.CanReceiveGoods() {
		t.Error("Completed receipt should not be able to receive goods")
	}

	// Test CanBeCancelled method
	receipt.Status = PurchaseReceiptStatusPending
	if !receipt.CanBeCancelled() {
		t.Error("Pending receipt should be able to be cancelled")
	}

	receipt.Status = PurchaseReceiptStatusCompleted
	if receipt.CanBeCancelled() {
		t.Error("Completed receipt should not be able to be cancelled")
	}

	// Test IsCompleted method
	receipt.Status = PurchaseReceiptStatusCompleted
	if !receipt.IsCompleted() {
		t.Error("Completed receipt should return true for IsCompleted")
	}

	receipt.Status = PurchaseReceiptStatusPending
	if receipt.IsCompleted() {
		t.Error("Pending receipt should return false for IsCompleted")
	}

	// Test IsCancelled method
	receipt.Status = PurchaseReceiptStatusCancelled
	if !receipt.IsCancelled() {
		t.Error("Cancelled receipt should return true for IsCancelled")
	}

	receipt.Status = PurchaseReceiptStatusPending
	if receipt.IsCancelled() {
		t.Error("Pending receipt should return false for IsCancelled")
	}
}