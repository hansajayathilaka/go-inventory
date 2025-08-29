package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// PerformanceMetrics represents performance statistics
type PerformanceMetrics struct {
	Endpoint        string        `json:"endpoint"`
	Method          string        `json:"method"`
	TotalRequests   int           `json:"total_requests"`
	SuccessRequests int           `json:"success_requests"`
	FailedRequests  int           `json:"failed_requests"`
	AvgResponseTime time.Duration `json:"avg_response_time"`
	MinResponseTime time.Duration `json:"min_response_time"`
	MaxResponseTime time.Duration `json:"max_response_time"`
	RequestsPerSec  float64       `json:"requests_per_sec"`
	ErrorRate       float64       `json:"error_rate"`
}

// PerformanceMonitor tracks API performance
type PerformanceMonitor struct {
	baseURL    string
	endpoints  []string
	metrics    map[string]*PerformanceMetrics
	mu         sync.RWMutex
	authToken  string
	duration   time.Duration
	concurrent int
}

// NewPerformanceMonitor creates a new performance monitor
func NewPerformanceMonitor(baseURL string, duration time.Duration, concurrent int) *PerformanceMonitor {
	return &PerformanceMonitor{
		baseURL:    baseURL,
		metrics:    make(map[string]*PerformanceMetrics),
		duration:   duration,
		concurrent: concurrent,
		endpoints: []string{
			"GET:/api/v1/health",
			"GET:/api/v1/users",
			"GET:/api/v1/categories",
			"GET:/api/v1/products",
			"GET:/api/v1/inventory",
			"GET:/api/v1/suppliers",
			"GET:/api/v1/locations",
			"GET:/api/v1/audit-logs",
		},
	}
}

// authenticate gets an auth token
func (pm *PerformanceMonitor) authenticate() error {
	loginData := map[string]string{
		"username": "admin",
		"password": "admin123",
	}

	jsonData, _ := json.Marshal(loginData)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(pm.baseURL+"/api/v1/auth/login", "application/json",
		strings.NewReader(string(jsonData)))

	if err != nil {
		return fmt.Errorf("authentication failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("authentication failed with status: %d", resp.StatusCode)
	}

	var authResp struct {
		Token string `json:"token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return fmt.Errorf("failed to decode auth response: %v", err)
	}

	pm.authToken = authResp.Token
	return nil
}

// makeRequest makes an HTTP request and measures performance
func (pm *PerformanceMonitor) makeRequest(method, endpoint string) (time.Duration, bool) {
	start := time.Now()

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest(method, pm.baseURL+endpoint, nil)
	if err != nil {
		return 0, false
	}

	// Add auth header if not health endpoint
	if endpoint != "/api/v1/health" && pm.authToken != "" {
		req.Header.Set("Authorization", "Bearer "+pm.authToken)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	duration := time.Since(start)

	if err != nil {
		return duration, false
	}
	defer resp.Body.Close()

	success := resp.StatusCode >= 200 && resp.StatusCode < 400
	return duration, success
}

// runTest runs performance tests for a specific endpoint
func (pm *PerformanceMonitor) runTest(method, endpoint string, results chan<- time.Duration, errors chan<- bool) {
	endTime := time.Now().Add(pm.duration)

	for time.Now().Before(endTime) {
		duration, success := pm.makeRequest(method, endpoint)
		results <- duration
		errors <- !success

		// Small delay to prevent overwhelming the server
		time.Sleep(10 * time.Millisecond)
	}
}

// Run executes the performance monitoring
func (pm *PerformanceMonitor) Run() error {
	fmt.Printf("🚀 Starting Performance Monitor\n")
	fmt.Printf("📊 Base URL: %s\n", pm.baseURL)
	fmt.Printf("⏱️  Duration: %v\n", pm.duration)
	fmt.Printf("🔄 Concurrent workers: %d\n", pm.concurrent)
	fmt.Printf("🎯 Endpoints: %d\n\n", len(pm.endpoints))

	// Authenticate first
	if err := pm.authenticate(); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}
	fmt.Printf("🔑 Authentication successful\n\n")

	var wg sync.WaitGroup

	for _, endpointSpec := range pm.endpoints {
		parts := strings.SplitN(endpointSpec, ":", 2)
		if len(parts) != 2 {
			continue
		}

		method, endpoint := parts[0], parts[1]
		key := fmt.Sprintf("%s %s", method, endpoint)

		pm.mu.Lock()
		pm.metrics[key] = &PerformanceMetrics{
			Endpoint:        endpoint,
			Method:          method,
			MinResponseTime: time.Hour, // Initialize to large value
		}
		pm.mu.Unlock()

		fmt.Printf("🧪 Testing %s %s\n", method, endpoint)

		results := make(chan time.Duration, 1000)
		errors := make(chan bool, 1000)

		// Start concurrent workers for this endpoint
		for i := 0; i < pm.concurrent; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				pm.runTest(method, endpoint, results, errors)
			}()
		}

		// Collect results for this endpoint
		go func(key string) {
			var totalDuration time.Duration
			var requestCount int
			var errorCount int

			// Collect results for the duration of the test
			timeout := time.After(pm.duration + time.Second)

		collectLoop:
			for {
				select {
				case duration := <-results:
					pm.mu.Lock()
					metric := pm.metrics[key]
					metric.TotalRequests++
					totalDuration += duration

					if duration < metric.MinResponseTime {
						metric.MinResponseTime = duration
					}
					if duration > metric.MaxResponseTime {
						metric.MaxResponseTime = duration
					}

					requestCount++
					pm.mu.Unlock()

				case isError := <-errors:
					if isError {
						pm.mu.Lock()
						pm.metrics[key].FailedRequests++
						errorCount++
						pm.mu.Unlock()
					} else {
						pm.mu.Lock()
						pm.metrics[key].SuccessRequests++
						pm.mu.Unlock()
					}

				case <-timeout:
					break collectLoop
				}
			}

			// Calculate final metrics
			pm.mu.Lock()
			metric := pm.metrics[key]
			if requestCount > 0 {
				metric.AvgResponseTime = totalDuration / time.Duration(requestCount)
				metric.RequestsPerSec = float64(requestCount) / pm.duration.Seconds()
				if metric.TotalRequests > 0 {
					metric.ErrorRate = float64(metric.FailedRequests) / float64(metric.TotalRequests) * 100
				}
			}
			pm.mu.Unlock()
		}(key)
	}

	// Wait for all workers to complete
	wg.Wait()

	// Give collectors time to finish
	time.Sleep(2 * time.Second)

	return nil
}

// PrintResults displays the performance results
func (pm *PerformanceMonitor) PrintResults() {
	fmt.Printf("\n📊 Performance Test Results\n")
	fmt.Printf("═══════════════════════════════════════════════════════════════════════\n\n")

	pm.mu.RLock()
	defer pm.mu.RUnlock()

	for _, metric := range pm.metrics {
		fmt.Printf("🎯 %s %s\n", metric.Method, metric.Endpoint)
		fmt.Printf("   Total Requests: %d\n", metric.TotalRequests)
		fmt.Printf("   Success: %d | Failed: %d\n", metric.SuccessRequests, metric.FailedRequests)
		fmt.Printf("   Error Rate: %.2f%%\n", metric.ErrorRate)
		fmt.Printf("   Avg Response Time: %v\n", metric.AvgResponseTime)
		fmt.Printf("   Min Response Time: %v\n", metric.MinResponseTime)
		fmt.Printf("   Max Response Time: %v\n", metric.MaxResponseTime)
		fmt.Printf("   Requests/sec: %.2f\n", metric.RequestsPerSec)
		fmt.Printf("   ───────────────────────────────────────────────────\n")
	}
}

// SaveResults saves results to a JSON file
func (pm *PerformanceMonitor) SaveResults(filename string) error {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")

	results := struct {
		Timestamp time.Time                      `json:"timestamp"`
		Duration  time.Duration                  `json:"test_duration"`
		BaseURL   string                         `json:"base_url"`
		Metrics   map[string]*PerformanceMetrics `json:"metrics"`
	}{
		Timestamp: time.Now(),
		Duration:  pm.duration,
		BaseURL:   pm.baseURL,
		Metrics:   pm.metrics,
	}

	return encoder.Encode(results)
}

func main() {
	// Default values
	baseURL := "http://localhost:9090"
	duration := 30 * time.Second
	concurrent := 5

	// Parse command line arguments
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "--help", "-h":
			fmt.Println("Performance Monitor for Inventory API")
			fmt.Println("")
			fmt.Println("Usage: go run tools/performance_monitor.go [options]")
			fmt.Println("")
			fmt.Println("Options:")
			fmt.Println("  --quick     Quick test (10 seconds)")
			fmt.Println("  --extended  Extended test (60 seconds)")
			fmt.Println("  --stress    Stress test (5 minutes, 20 workers)")
			fmt.Println("  --help      Show this help")
			return
		case "--quick":
			duration = 10 * time.Second
			concurrent = 3
		case "--extended":
			duration = 60 * time.Second
			concurrent = 8
		case "--stress":
			duration = 5 * time.Minute
			concurrent = 20
		}
	}

	monitor := NewPerformanceMonitor(baseURL, duration, concurrent)

	if err := monitor.Run(); err != nil {
		log.Fatalf("Performance monitoring failed: %v", err)
	}

	monitor.PrintResults()

	// Save results to file
	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("performance_results_%s.json", timestamp)

	if err := monitor.SaveResults(filename); err != nil {
		log.Printf("Failed to save results: %v", err)
	} else {
		fmt.Printf("\n💾 Results saved to: %s\n", filename)
	}
}
