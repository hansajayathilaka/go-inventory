package performance

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/api/router"
	"inventory-api/internal/app"
)

type PerformanceTestSuite struct {
	router    *gin.Engine
	appCtx    *app.Context
	authToken string
	adminID   uuid.UUID
}

var suite *PerformanceTestSuite
var once sync.Once

func setupPerformanceTestSuite() *PerformanceTestSuite {
	once.Do(func() {
		gin.SetMode(gin.ReleaseMode) // Use release mode for performance testing

		// Initialize application context
		appCtx, err := app.NewContext()
		if err != nil {
			panic(err)
		}

		// Seed test data
		err = appCtx.SeedDatabase()
		if err != nil {
			panic(err)
		}

		// Set up router
		r := router.SetupRouter(appCtx)

		suite = &PerformanceTestSuite{
			router: r,
			appCtx: appCtx,
		}

		// Get authentication token
		suite.authenticateTestUser()
	})

	return suite
}

func (s *PerformanceTestSuite) authenticateTestUser() {
	loginReq := dto.LoginRequest{
		Username: "admin",
		Password: "admin123",
	}

	reqBody, _ := json.Marshal(loginReq)
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)

	var response dto.LoginResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	s.authToken = response.Token
	s.adminID = response.User.ID
}

func (s *PerformanceTestSuite) makeAuthenticatedRequest(method, url string, body interface{}) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer
	if body != nil {
		jsonBody, _ := json.Marshal(body)
		reqBody = bytes.NewBuffer(jsonBody)
	} else {
		reqBody = bytes.NewBuffer([]byte{})
	}

	req, _ := http.NewRequest(method, url, reqBody)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.authToken)

	w := httptest.NewRecorder()
	s.router.ServeHTTP(w, req)
	return w
}

// Benchmark Health Check endpoint
func BenchmarkHealthCheck(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/health", nil)
			w := httptest.NewRecorder()
			suite.router.ServeHTTP(w, req)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark Authentication
func BenchmarkLogin(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	loginReq := dto.LoginRequest{
		Username: "admin",
		Password: "admin123",
	}
	
	reqBody, _ := json.Marshal(loginReq)
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			b.Errorf("Expected status 200, got %d", w.Code)
		}
	}
}

// Benchmark User List endpoint
func BenchmarkUserList(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/users", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark Category List endpoint
func BenchmarkCategoryList(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/categories", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark Product List endpoint
func BenchmarkProductList(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/products", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark Inventory List endpoint
func BenchmarkInventoryList(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/inventory", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark User Create endpoint
func BenchmarkUserCreate(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		createUserReq := dto.CreateUserRequest{
			Username: fmt.Sprintf("testuser%d", i),
			Email:    fmt.Sprintf("test%d@example.com", i),
			Password: "password123",
			Role:     "staff",
		}
		
		w := suite.makeAuthenticatedRequest("POST", "/api/v1/users", createUserReq)
		
		if w.Code != http.StatusCreated {
			b.Errorf("Expected status 201, got %d", w.Code)
		}
	}
}

// Benchmark Category Create endpoint
func BenchmarkCategoryCreate(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		createCategoryReq := dto.CreateCategoryRequest{
			Name:        fmt.Sprintf("Test Category %d", i),
			Description: fmt.Sprintf("Performance test category %d", i),
		}
		
		w := suite.makeAuthenticatedRequest("POST", "/api/v1/categories", createCategoryReq)
		
		if w.Code != http.StatusCreated {
			b.Errorf("Expected status 201, got %d", w.Code)
		}
	}
}

// Benchmark Product Search endpoint
func BenchmarkProductSearch(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	searchTerms := []string{"test", "product", "sample", "demo", "item"}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			term := searchTerms[i%len(searchTerms)]
			url := fmt.Sprintf("/api/v1/products/search?q=%s", term)
			w := suite.makeAuthenticatedRequest("GET", url, nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
			i++
		}
	})
}

// Benchmark Audit Logs endpoint
func BenchmarkAuditLogs(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/audit-logs?page=1&limit=10", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark PurchaseReceipt List endpoint
func BenchmarkPurchaseReceiptList(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/purchase-receipts", nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark PurchaseReceipt Create endpoint
func BenchmarkPurchaseReceiptCreate(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	// Get supplier for testing
	suppliersResponse := suite.makeAuthenticatedRequest("GET", "/api/v1/suppliers", nil)
	if suppliersResponse.Code != http.StatusOK {
		b.Fatal("Failed to get suppliers")
	}
	
	var suppliers dto.SupplierListResponse
	json.Unmarshal(suppliersResponse.Body.Bytes(), &suppliers)
	if len(suppliers.Suppliers) == 0 {
		b.Fatal("No suppliers found")
	}
	supplierID := suppliers.Suppliers[0].ID
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		orderDate, _ := time.Parse(time.RFC3339, "2024-01-15T10:00:00Z")
		expectedDate, _ := time.Parse(time.RFC3339, "2024-01-20T10:00:00Z")
		
		createReceiptReq := dto.CreatePurchaseReceiptRequest{
			SupplierID:   supplierID,
			OrderDate:    orderDate,
			ExpectedDate: &expectedDate,
			TaxRate:      10.0,
			ShippingCost: 50.0,
			Currency:     "USD",
			OrderNotes:   fmt.Sprintf("Benchmark purchase receipt %d", i),
			Terms:        "Net 30",
		}
		
		w := suite.makeAuthenticatedRequest("POST", "/api/v1/purchase-receipts", createReceiptReq)
		
		if w.Code != http.StatusCreated {
			b.Errorf("Expected status 201, got %d", w.Code)
		}
	}
}

// Benchmark Single-Location Inventory Operations
func BenchmarkSingleLocationInventory(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	// Get product for testing
	productsResponse := suite.makeAuthenticatedRequest("GET", "/api/v1/products", nil)
	if productsResponse.Code != http.StatusOK {
		b.Fatal("Failed to get products")
	}
	
	var products dto.ProductListResponse
	json.Unmarshal(productsResponse.Body.Bytes(), &products)
	if len(products.Products) == 0 {
		b.Fatal("No products found")
	}
	productID := products.Products[0].ID
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			// Test inventory lookup without location context
			w := suite.makeAuthenticatedRequest("GET", "/api/v1/inventory/product/"+productID.String(), nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// Benchmark Vehicle Spare Parts endpoints
func BenchmarkVehicleSpareParts(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	endpoints := []string{
		"/api/v1/customers",
		"/api/v1/brands",
		"/api/v1/vehicle-brands",
		"/api/v1/vehicle-models",
		"/api/v1/vehicle-compatibility",
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			endpoint := endpoints[i%len(endpoints)]
			w := suite.makeAuthenticatedRequest("GET", endpoint, nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200 for %s, got %d", endpoint, w.Code)
			}
			i++
		}
	})
}

// Load test with concurrent requests
func BenchmarkConcurrentMixedRequests(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	endpoints := []string{
		"/api/v1/users",
		"/api/v1/categories", 
		"/api/v1/products",
		"/api/v1/inventory",
		"/api/v1/suppliers",
		"/api/v1/purchase-receipts",
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			endpoint := endpoints[i%len(endpoints)]
			w := suite.makeAuthenticatedRequest("GET", endpoint, nil)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200 for %s, got %d", endpoint, w.Code)
			}
			i++
		}
	})
}

// Test memory usage and allocations
func BenchmarkMemoryUsage(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		// Simulate a complex workflow
		w1 := suite.makeAuthenticatedRequest("GET", "/api/v1/categories/hierarchy", nil)
		w2 := suite.makeAuthenticatedRequest("GET", "/api/v1/products?page=1&per_page=50", nil)
		w3 := suite.makeAuthenticatedRequest("GET", "/api/v1/inventory/low-stock", nil)
		w4 := suite.makeAuthenticatedRequest("GET", "/api/v1/audit-logs?page=1&limit=20", nil)
		
		if w1.Code != http.StatusOK || w2.Code != http.StatusOK || 
		   w3.Code != http.StatusOK || w4.Code != http.StatusOK {
			b.Error("One or more requests failed")
		}
	}
}

// Test database query performance
func BenchmarkDatabaseQueries(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	// Test complex queries with joins and filtering
	complexEndpoints := []string{
		"/api/v1/products?category_id=1&page=1&per_page=20",
		"/api/v1/inventory?page=1&limit=20", 
		"/api/v1/reports/inventory-summary",
		"/api/v1/categories/hierarchy",
		"/api/v1/audit-logs?table_name=products&limit=10",
		"/api/v1/purchase-receipts?status=completed&limit=10",
	}
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		endpoint := complexEndpoints[i%len(complexEndpoints)]
		w := suite.makeAuthenticatedRequest("GET", endpoint, nil)
		
		if w.Code != http.StatusOK {
			b.Errorf("Expected status 200 for %s, got %d", endpoint, w.Code)
		}
	}
}

// Benchmark with rate limiting enabled
func BenchmarkWithRateLimit(b *testing.B) {
	suite := setupPerformanceTestSuite()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	// Test rate limiting behavior
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/health", nil)
		w := httptest.NewRecorder()
		suite.router.ServeHTTP(w, req)
		
		// We expect either 200 (success) or 429 (rate limited)
		if w.Code != http.StatusOK && w.Code != http.StatusTooManyRequests {
			b.Errorf("Expected status 200 or 429, got %d", w.Code)
		}
		
		// Small delay to prevent overwhelming the rate limiter in benchmarks
		if i%50 == 0 {
			time.Sleep(time.Millisecond)
		}
	}
}

// Custom load test function (not a benchmark)
func TestAPILoadTest(t *testing.T) {
	if os.Getenv("LOAD_TESTS") == "" {
		t.Skip("Skipping load tests. Set LOAD_TESTS=1 to run.")
	}
	
	suite := setupPerformanceTestSuite()
	
	// Test configuration
	const (
		numWorkers     = 10
		requestsPerWorker = 100
		testDuration   = 30 * time.Second
	)
	
	endpoints := []string{
		"/health",
		"/api/v1/users",
		"/api/v1/categories",
		"/api/v1/products",
		"/api/v1/inventory",
		"/api/v1/purchase-receipts",
	}
	
	var wg sync.WaitGroup
	results := make(chan time.Duration, numWorkers*requestsPerWorker)
	errors := make(chan error, numWorkers*requestsPerWorker)
	
	startTime := time.Now()
	
	// Launch workers
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			
			for j := 0; j < requestsPerWorker; j++ {
				if time.Since(startTime) > testDuration {
					return
				}
				
				reqStart := time.Now()
				endpoint := endpoints[j%len(endpoints)]
				
				var w *httptest.ResponseRecorder
				if endpoint == "/health" {
					req, _ := http.NewRequest("GET", endpoint, nil)
					w = httptest.NewRecorder()
					suite.router.ServeHTTP(w, req)
				} else {
					w = suite.makeAuthenticatedRequest("GET", endpoint, nil)
				}
				
				reqDuration := time.Since(reqStart)
				results <- reqDuration
				
				if w.Code >= 400 {
					errors <- fmt.Errorf("worker %d: %s returned %d", workerID, endpoint, w.Code)
				}
			}
		}(i)
	}
	
	wg.Wait()
	close(results)
	close(errors)
	
	// Analyze results
	var totalRequests int
	var totalDuration time.Duration
	var maxDuration time.Duration
	var minDuration = time.Hour // Initialize to large value
	
	for duration := range results {
		totalRequests++
		totalDuration += duration
		
		if duration > maxDuration {
			maxDuration = duration
		}
		if duration < minDuration {
			minDuration = duration
		}
	}
	
	errorCount := len(errors)
	for err := range errors {
		t.Log("Error:", err)
	}
	
	if totalRequests > 0 {
		avgDuration := totalDuration / time.Duration(totalRequests)
		
		t.Logf("Load Test Results:")
		t.Logf("  Total requests: %d", totalRequests)
		t.Logf("  Error count: %d", errorCount)
		t.Logf("  Success rate: %.2f%%", float64(totalRequests-errorCount)/float64(totalRequests)*100)
		t.Logf("  Average response time: %v", avgDuration)
		t.Logf("  Min response time: %v", minDuration)
		t.Logf("  Max response time: %v", maxDuration)
		t.Logf("  Requests per second: %.2f", float64(totalRequests)/testDuration.Seconds())
		
		// Fail if error rate is too high
		errorRate := float64(errorCount) / float64(totalRequests)
		if errorRate > 0.05 { // 5% error threshold
			t.Errorf("Error rate too high: %.2f%%", errorRate*100)
		}
		
		// Fail if average response time is too slow
		if avgDuration > 100*time.Millisecond {
			t.Errorf("Average response time too slow: %v", avgDuration)
		}
	}
}