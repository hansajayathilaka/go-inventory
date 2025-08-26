package performance

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// Simple benchmark test that doesn't require database connection
// This is useful for testing the script functionality without full setup

func setupSimpleRouter() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	
	// Simple health check endpoint
	r.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"service":   "inventory-api",
			"timestamp": "2024-01-01T00:00:00Z",
		})
	})
	
	return r
}

// BenchmarkSimpleHealthCheck tests a basic health check endpoint
func BenchmarkSimpleHealthCheck(b *testing.B) {
	router := setupSimpleRouter()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			req, _ := http.NewRequest("GET", "/api/v1/health", nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			
			if w.Code != http.StatusOK {
				b.Errorf("Expected status 200, got %d", w.Code)
			}
		}
	})
}

// BenchmarkJSONSerialization tests JSON response serialization
func BenchmarkJSONSerialization(b *testing.B) {
	router := setupSimpleRouter()
	
	b.ResetTimer()
	b.ReportAllocs()
	
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("GET", "/api/v1/health", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		
		if w.Code != http.StatusOK {
			b.Errorf("Expected status 200, got %d", w.Code)
		}
	}
}