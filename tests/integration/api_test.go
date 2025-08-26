package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

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
	loginReq := dto.LoginRequest{
		Username: "admin",
		Password: "admin123",
	}

	reqBody, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	var response dto.LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.Require().NoError(err)
	
	suite.authToken = response.Token
	suite.adminID = response.User.ID
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
	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "healthy", response["status"])
}

// Test Authentication
func (suite *APITestSuite) TestAuthentication() {
	// Test login with valid credentials
	loginReq := dto.LoginRequest{
		Username: "admin",
		Password: "admin123",
	}

	reqBody, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response dto.LoginResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), response.Token)
	assert.Equal(suite.T(), "admin", response.User.Username)

	// Test login with invalid credentials
	invalidLoginReq := dto.LoginRequest{
		Username: "admin",
		Password: "wrongpassword",
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

	// Test list locations
	w = suite.makeAuthenticatedRequest("GET", "/api/v1/locations", nil)
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