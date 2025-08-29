# Performance Testing Guide

This document describes the comprehensive performance testing setup for the Inventory Management API.

## Overview

The performance testing suite includes:
- **Benchmark Tests**: Go-based benchmarks for measuring endpoint performance
- **Load Tests**: Multi-worker concurrent testing with realistic traffic patterns  
- **Performance Monitor**: Real-time API monitoring tool
- **Profiling**: CPU and memory profiling for bottleneck identification

## Quick Start

### 1. Run Basic Performance Tests

```bash
# Quick benchmark tests (10 seconds)
./scripts/run-performance-tests.sh

# Full performance test suite with profiling  
./scripts/run-performance-tests.sh --full
```

### 2. Run Performance Monitor

```bash
# Quick monitoring (10 seconds)
go run tools/performance_monitor.go --quick

# Extended monitoring (60 seconds)
go run tools/performance_monitor.go --extended

# Stress test (5 minutes, 20 workers)
go run tools/performance_monitor.go --stress
```

### 3. Run Integration Tests

```bash
# Set environment variable and run
INTEGRATION_TESTS=1 go test -v ./tests/integration/...

# Or use the provided script
./scripts/run-integration-tests.sh
```

## Test Types

### Benchmark Tests (`tests/performance/benchmark_test.go`)

Go benchmarks that measure:
- **Individual endpoint performance**
- **Authentication overhead**
- **Database query performance** 
- **Memory allocation patterns**
- **Concurrent request handling**

Key benchmarks:
- `BenchmarkHealthCheck` - Basic endpoint performance
- `BenchmarkLogin` - Authentication performance
- `BenchmarkUserList` - List endpoint performance
- `BenchmarkConcurrentMixedRequests` - Mixed workload simulation
- `BenchmarkMemoryUsage` - Memory allocation tracking

### Load Tests

Simulates realistic traffic with:
- **Multiple concurrent workers**
- **Mixed endpoint requests**
- **Sustained load over time**
- **Error rate analysis**
- **Response time distribution**

### Performance Monitor (`tools/performance_monitor.go`)

Real-time monitoring tool that:
- **Tracks all major endpoints**
- **Measures response times**
- **Calculates throughput**  
- **Reports error rates**
- **Saves results to JSON**

## Performance Targets

### Response Time Targets
- **Health check**: < 1ms
- **Authentication**: < 50ms
- **List endpoints**: < 100ms
- **Create operations**: < 200ms
- **Complex queries**: < 500ms

### Throughput Targets  
- **Simple endpoints**: > 1,000 req/sec
- **Complex endpoints**: > 500 req/sec
- **Authentication**: > 200 req/sec

### Error Rate Targets
- **Normal load**: < 1% error rate
- **Stress load**: < 5% error rate

### Memory Targets
- **Read operations**: Minimal allocations
- **Write operations**: Reasonable allocations
- **No memory leaks**: Stable over time

## Running Tests

### Prerequisites

1. **API Server Running**: `go run cmd/main.go`
2. **Database Setup**: PostgreSQL running with inventory_user and inventory_db
3. **Database Seeded**: Ensure test data exists
4. **Go Environment**: Go 1.21+ installed

**Note**: Performance tests require a fully configured database. For testing without database dependency, use:
```bash
go test -bench=BenchmarkSimple ./tests/performance/ -run='^$'
```

### Benchmark Tests

```bash
# Run all benchmarks
go test -bench=. -benchmem ./tests/performance/

# Run specific benchmark
go test -bench=BenchmarkHealthCheck -benchmem ./tests/performance/

# Extended benchmark run
go test -bench=. -benchtime=60s -benchmem ./tests/performance/

# With CPU profiling
go test -bench=BenchmarkConcurrentMixedRequests -cpuprofile=cpu.prof ./tests/performance/

# With memory profiling  
go test -bench=BenchmarkMemoryUsage -memprofile=mem.prof ./tests/performance/
```

### Load Tests

```bash
# Run load test
LOAD_TESTS=1 go test -v ./tests/performance/ -run=TestAPILoadTest

# Custom load test duration
LOAD_TESTS=1 go test -v ./tests/performance/ -run=TestAPILoadTest -timeout=10m
```

### Integration Tests

```bash
# Run integration tests
INTEGRATION_TESTS=1 go test -v ./tests/integration/

# With custom timeout
INTEGRATION_TESTS=1 go test -v -timeout=30m ./tests/integration/
```

## Analyzing Results

### Benchmark Results

Benchmark output format:
```
BenchmarkHealthCheck-8     1000000    1.234 ns/op    64 B/op    2 allocs/op
```

- **1000000**: Number of iterations
- **1.234 ns/op**: Average time per operation
- **64 B/op**: Bytes allocated per operation
- **2 allocs/op**: Number of allocations per operation

### Profiling Analysis

#### CPU Profile
```bash
go tool pprof cpu.prof
(pprof) top10      # Top 10 CPU consumers
(pprof) list main  # Show main function details
(pprof) web        # Generate web interface
```

#### Memory Profile
```bash
go tool pprof mem.prof
(pprof) top10           # Top 10 memory allocators
(pprof) list function   # Show function details
(pprof) png > mem.png   # Generate visual diagram
```

### Performance Monitor Results

Monitor generates JSON output with:
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "test_duration": "30s",
  "base_url": "http://localhost:9090",
  "metrics": {
    "GET /api/v1/health": {
      "total_requests": 1000,
      "success_requests": 1000,
      "failed_requests": 0,
      "avg_response_time": "1ms",
      "requests_per_sec": 33.33,
      "error_rate": 0.0
    }
  }
}
```

## Report Generation

### Automated Reports

The `run-performance-tests.sh` script generates:
- **Benchmark results**: `reports/performance/{timestamp}/`
- **CPU profiles**: `cpu_profile.prof`
- **Memory profiles**: `memory_profile.prof`
- **Summary report**: `performance_summary.md`

### Manual Report Generation

```bash
# Create reports directory
mkdir -p reports/performance/$(date +%Y%m%d_%H%M%S)

# Run benchmarks with output
go test -bench=. -benchmem ./tests/performance/ > benchmark_results.txt

# Run performance monitor
go run tools/performance_monitor.go --extended > monitor_results.txt

# Generate CPU profile
go test -bench=BenchmarkConcurrentMixedRequests -cpuprofile=cpu.prof ./tests/performance/
```

## Optimization Strategies

### Database Optimization
- **Proper indexing** on frequently queried columns
- **Connection pooling** configuration
- **Query optimization** for complex operations
- **Pagination** for large result sets

### Application Optimization  
- **Caching** for read-heavy operations
- **Connection reuse** for HTTP clients
- **Memory pooling** for frequently allocated objects
- **Goroutine management** to prevent leaks

### Infrastructure Optimization
- **Load balancing** for horizontal scaling
- **CDN** for static assets
- **Database read replicas** for read scaling
- **Monitoring** and alerting setup

## Continuous Performance Testing

### CI/CD Integration

Add performance tests to your CI pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: |
    go run cmd/main.go &
    SERVER_PID=$!
    sleep 5
    ./scripts/run-performance-tests.sh
    kill $SERVER_PID
```

### Performance Regression Detection

Compare benchmark results between releases:

```bash
# Save baseline
go test -bench=. ./tests/performance/ > baseline.txt

# Compare against baseline  
go test -bench=. ./tests/performance/ > current.txt
benchcmp baseline.txt current.txt
```

### Monitoring in Production

Deploy performance monitoring:

```bash
# Monitor production API
go run tools/performance_monitor.go --extended \
  --url=https://api.production.com
```

## Troubleshooting

### Common Issues

1. **Server not running**
   ```bash
   curl http://localhost:9090/api/v1/health
   ```

2. **Authentication failures**
   - Check seeded users exist
   - Verify credentials in tests

3. **Database connection issues**
   - Ensure PostgreSQL is running
   - Check connection settings

4. **Rate limiting affecting tests**
   - Reduce concurrent workers
   - Add delays between requests

5. **Memory leaks in tests**
   - Check for unclosed connections
   - Review goroutine usage

### Performance Issues

1. **Slow response times**
   - Run CPU profiling
   - Check database query performance
   - Review algorithm complexity

2. **High memory usage**
   - Run memory profiling
   - Check for memory leaks
   - Review object lifecycle

3. **Low throughput**
   - Check database connection pool
   - Review middleware overhead
   - Optimize critical paths

## Best Practices

### Test Design
- **Realistic workloads** that match production usage
- **Proper cleanup** to prevent interference
- **Consistent test environment** for reliable results
- **Progressive testing** from simple to complex

### Performance Analysis
- **Baseline establishment** before optimization
- **Single variable changes** to isolate improvements  
- **Statistical significance** in measurements
- **Production correlation** of test results

### Optimization Process
1. **Measure first** - establish current performance
2. **Identify bottlenecks** using profiling
3. **Optimize systematically** one area at a time
4. **Validate improvements** with tests
5. **Monitor continuously** for regressions

## Resources

- [Go Testing Package](https://golang.org/pkg/testing/)
- [pprof Profiling](https://golang.org/pkg/net/http/pprof/)
- [Benchmark Comparison](https://godoc.org/golang.org/x/tools/cmd/benchcmp)
- [Performance Best Practices](https://golang.org/doc/effective_go.html)