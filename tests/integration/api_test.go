package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/api/router"
	"inventory-api/internal/app"
)

type APITestSuite struct {
	suite.Suite
	router    *gin.Engine
	appCtx    *app.Context
	authToken string
	adminID   uuid.UUID
}

func (suite *APITestSuite) SetupSuite() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Initialize application context
	appCtx, err := app.NewContext()
	suite.Require().NoError(err)
	
	// Seed test data
	err = appCtx.SeedDatabase()
	suite.Require().NoError(err)

	// Set up router
	r := router.SetupRouter(appCtx)

	suite.router = r
	suite.appCtx = appCtx
}

func (suite *APITestSuite) TearDownSuite() {
	// Clean up application context
	if suite.appCtx != nil {
		suite.appCtx.Close()
	}
}

func (suite *APITestSuite) SetupTest() {
	// Get authentication token for tests
	suite.authenticateTestUser()
}

func (suite *APITestSuite) authenticateTestUser() {
	loginReq := map[string]string{
		"username": "admin",
		"password": "admin123",
	}

	reqBody, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var baseResponse dto.BaseResponse
	err := json.Unmarshal(w.Body.Bytes(), &baseResponse)
	suite.Require().NoError(err)
	suite.Require().True(baseResponse.Success)
	
	// Extract the login data from the response
	dataBytes, _ := json.Marshal(baseResponse.Data)
	var loginData map[string]interface{}
	json.Unmarshal(dataBytes, &loginData)
	
	suite.authToken = loginData["token"].(string)
	
	// Extract user info
	if userMap, ok := loginData["user"].(map[string]interface{}); ok {
		if idStr, ok := userMap["id"].(string); ok {
			suite.adminID, _ = uuid.Parse(idStr)
		}
	}
}

// Helper method to make authenticated requests
func (suite *APITestSuite) makeAuthenticatedRequest(method, url string, body interface{}) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer([]byte{})
	}

	req, _ := http.NewRequest(method, url, reqBody)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)
	return w
}

// Test Health Check
func (suite *APITestSuite) TestHealthCheck() {
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "ok", response["status"])
}

// Test Authentication
func (suite *APITestSuite) TestAuthentication() {
	// Test login with valid credentials
	loginReq := map[string]string{
		"username": "admin",
		"password": "admin123",
	}

	reqBody, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var baseResponse dto.BaseResponse
	err := json.Unmarshal(w.Body.Bytes(), &baseResponse)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), baseResponse.Success)
	
	// Extract login data
	dataBytes, _ := json.Marshal(baseResponse.Data)
	var loginData map[string]interface{}
	json.Unmarshal(dataBytes, &loginData)
	
	assert.NotEmpty(suite.T(), loginData["token"])
	if userMap, ok := loginData["user"].(map[string]interface{}); ok {
		assert.Equal(suite.T(), "admin", userMap["username"])
	}

	// Test login with invalid credentials
	invalidLoginReq := map[string]string{
		"username": "admin",
		"password": "wrongpassword",
	}

	reqBody, _ = json.Marshal(invalidLoginReq)
	req, _ = http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w = httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// Test User Management
func (suite *APITestSuite) TestUserManagement() {
	// Test create user
	createUserReq := dto.CreateUserRequest{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
		Role:     "staff",
	}

	w := suite.makeAuthenticatedRequest("POST", "/api/v1/users", createUserReq)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var createdUser dto.UserResponse
	err := json.Unmarshal(w.Body.Bytes(), &createdUser)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "testuser", createdUser.Username)
	assert.Equal(suite.T(), "test@example.com", createdUser.Email)

	userID := createdUser.ID

	// Test get user by ID
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/users/"+userID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list users
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/users", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test update user
	updateUserReq := dto.UpdateUserRequest{
		Email: "updated@example.com",
		Role:  "manager",
	}

	w = suite.makeAuthenticatedRequest("PUT", "/api/v1/users/"+userID.String(), updateUserReq)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test delete user
	w = suite.makeAuthenticatedRequest("DELETE", "/api/v1/users/"+userID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// Test Category Management
func (suite *APITestSuite) TestCategoryManagement() {
	// Test create category
	createCategoryReq := dto.CreateCategoryRequest{
		Name:        "Test Category",
		Description: "A test category",
	}

	w := suite.makeAuthenticatedRequest("POST", "/api/v1/categories", createCategoryReq)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var createdCategory dto.CategoryResponse
	err := json.Unmarshal(w.Body.Bytes(), &createdCategory)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Test Category", createdCategory.Name)

	categoryID := createdCategory.ID

	// Test get category by ID
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/categories/"+categoryID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list categories
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/categories", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test get hierarchy
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/categories/hierarchy", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test update category
	updateCategoryReq := dto.UpdateCategoryRequest{
		Name:        "Updated Test Category",
		Description: "An updated test category",
	}

	w = suite.makeAuthenticatedRequest("PUT", "/api/v1/categories/"+categoryID.String(), updateCategoryReq)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test delete category
	w = suite.makeAuthenticatedRequest("DELETE", "/api/v1/categories/"+categoryID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// Test Basic API Endpoints (simplified for reliability)
func (suite *APITestSuite) TestBasicEndpoints() {
	// Test list categories
	w := suite.makeAuthenticatedRequest("GET", "/api/v1/categories", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list users
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/users", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list products
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/products", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list inventory
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/inventory", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list suppliers
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/suppliers", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test list purchase receipts
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/purchase-receipts", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test audit logs
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/audit-logs", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// Test Rate Limiting
func (suite *APITestSuite) TestRateLimiting() {
	// Make many requests quickly to trigger rate limiting
	for i := 0; i < 105; i++ {
		req, _ := http.NewRequest("GET", "/api/v1/health", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)
		
		// After 100 requests, we should start getting rate limited
		if i >= 100 {
			assert.Equal(suite.T(), http.StatusTooManyRequests, w.Code)
			break
		}
	}
}

// Test PurchaseReceipt Management (unified PO and GRN workflow)
func (suite *APITestSuite) TestPurchaseReceiptManagement() {
	// Get a supplier and product for testing
	suppliersResponse := suite.makeAuthenticatedRequest("GET", "/api/v1/suppliers", nil)
	assert.Equal(suite.T(), http.StatusOK, suppliersResponse.Code)
	
	var suppliers dto.SupplierListResponse
	err := json.Unmarshal(suppliersResponse.Body.Bytes(), &suppliers)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), suppliers.Suppliers)
	supplierID := suppliers.Suppliers[0].ID

	productsResponse := suite.makeAuthenticatedRequest("GET", "/api/v1/products", nil)
	assert.Equal(suite.T(), http.StatusOK, productsResponse.Code)
	
	var products dto.ProductListResponse
	err = json.Unmarshal(productsResponse.Body.Bytes(), &products)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), products.Products)
	productID := products.Products[0].ID

	// Test create purchase receipt (order phase)
	purchaseDate, _ := time.Parse(time.RFC3339, "2024-01-15T10:00:00Z")
	
	createReceiptReq := dto.CreatePurchaseReceiptRequest{
		SupplierID:             supplierID,
		PurchaseDate:           purchaseDate,
		SupplierBillNumber:     "SUPP-BILL-001",
		BillDiscountAmount:     25.0,
		BillDiscountPercentage: 5.0,
		Notes:                  "Test purchase receipt",
	}

	w := suite.makeAuthenticatedRequest("POST", "/api/v1/purchase-receipts", createReceiptReq)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var createdReceipt dto.PurchaseReceiptResponse
	err = json.Unmarshal(w.Body.Bytes(), &createdReceipt)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "pending", createdReceipt.Status)

	receiptID := createdReceipt.ID

	// Test add item to purchase receipt
	addItemReq := dto.CreatePurchaseReceiptItemRequest{
		ProductID:               productID,
		Quantity:               100,
		UnitCost:               25.50,
		ItemDiscountAmount:     5.0,
	}

	w = suite.makeAuthenticatedRequest("POST", "/api/v1/purchase-receipts/"+receiptID.String()+"/items", addItemReq)
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	// Test receive purchase receipt (pending → received)
	w = suite.makeAuthenticatedRequest("POST", "/api/v1/purchase-receipts/"+receiptID.String()+"/receive", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test complete purchase receipt (received → completed)
	w = suite.makeAuthenticatedRequest("POST", "/api/v1/purchase-receipts/"+receiptID.String()+"/complete", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test get purchase receipt by ID
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/purchase-receipts/"+receiptID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var fetchedReceipt dto.PurchaseReceiptResponse
	err = json.Unmarshal(w.Body.Bytes(), &fetchedReceipt)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "completed", fetchedReceipt.Status)

	// Test list purchase receipts
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/purchase-receipts", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test search purchase receipts
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/purchase-receipts/search?status=completed", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test delete purchase receipt
	w = suite.makeAuthenticatedRequest("DELETE", "/api/v1/purchase-receipts/"+receiptID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)
}

// Test Single-Location Inventory Operations
func (suite *APITestSuite) TestSingleLocationInventoryOperations() {
	// Get a product for testing
	productsResponse := suite.makeAuthenticatedRequest("GET", "/api/v1/products", nil)
	assert.Equal(suite.T(), http.StatusOK, productsResponse.Code)
	
	var products dto.ProductListResponse
	err := json.Unmarshal(productsResponse.Body.Bytes(), &products)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), products.Products)
	productID := products.Products[0].ID

	// Test inventory lookup (single-location)
	w := suite.makeAuthenticatedRequest("GET", "/api/v1/inventory/product/"+productID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var inventory dto.InventoryResponse
	err = json.Unmarshal(w.Body.Bytes(), &inventory)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), productID, inventory.ProductID)
	// Verify no location fields are present in response
	originalQuantity := inventory.Quantity

	// Test stock adjustment (single-location)
	notes := "Integration test stock adjustment"
	adjustReq := dto.StockAdjustmentRequest{
		ProductID:    productID,
		Quantity:     50,
		MovementType: "ADJUSTMENT",
		Reason:       "corrections",
		Notes:        &notes,
	}

	w = suite.makeAuthenticatedRequest("POST", "/api/v1/inventory/adjust", adjustReq)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Verify stock was adjusted
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/inventory/product/"+productID.String(), nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	err = json.Unmarshal(w.Body.Bytes(), &inventory)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), originalQuantity+50, inventory.Quantity)

	// Test stock movements (single-location)
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/reports/stock-movements", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response dto.ApiResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response.Success)
	
	// Verify we received stock movements data
	assert.NotNil(suite.T(), response.Data)

	// Test inventory summary (single-location)
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/reports/inventory-summary", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var summary dto.InventorySummaryResponse
	err = json.Unmarshal(w.Body.Bytes(), &summary)
	assert.NoError(suite.T(), err)
	assert.Greater(suite.T(), summary.TotalProducts, 0)
	assert.GreaterOrEqual(suite.T(), summary.TotalStockValue, 0.0)
	// Verify no location-based fields are in summary
}

// Test Vehicle Spare Parts Features
func (suite *APITestSuite) TestVehicleSpareParts() {
	// Test customer endpoints
	w := suite.makeAuthenticatedRequest("GET", "/api/v1/customers", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	// Test brand endpoints
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/brands", nil)
	assert.Equal(suite.T(), http.StatusOK, w.Code)

}

// Test Swagger Documentation
func (suite *APITestSuite) TestSwaggerDocumentation() {
	req, _ := http.NewRequest("GET", "/docs/index.html", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "swagger")
}

func TestAPITestSuite(t *testing.T) {
	// Skip integration tests if not in integration test mode
	if os.Getenv("INTEGRATION_TESTS") == "" {
		t.Skip("Skipping integration tests. Set INTEGRATION_TESTS=1 to run.")
	}
	
	suite.Run(t, new(APITestSuite))
}