# Testing Guide

This guide covers how to run all types of tests for the Inventory Management API.

## Test Types

The project includes several types of tests:
- **Unit Tests**: Test individual components and business logic
- **Integration Tests**: Test complete API endpoints with database
- **Performance Tests**: Benchmark API performance and load testing
- **Load Tests**: Test system under sustained load

## Running Tests

### Unit Tests

Test business logic without external dependencies:

```bash
# Run all unit tests
go test -v ./internal/...

# Run unit tests with short flag (skip long-running tests)
go test -v ./internal/... -short

# Run specific package tests
go test -v ./internal/business/user/
go test -v ./internal/business/audit/
```

**Example Output:**
```
=== RUN   TestCreateUser
--- PASS: TestCreateUser (0.04s)
=== RUN   TestAuthenticateUser  
--- PASS: TestAuthenticateUser (0.11s)
PASS
ok      inventory-api/internal/business/user    0.726s
```

### Performance Tests

Benchmark API performance:

```bash
# Simple benchmarks (no database required)
go test -bench=BenchmarkSimple -benchmem ./tests/performance/

# All benchmarks (requires running API server + database)
go test -bench=. -benchtime=10s -benchmem ./tests/performance/

# Memory profiling
go test -bench=BenchmarkMemory -memprofile=mem.prof ./tests/performance/

# CPU profiling  
go test -bench=BenchmarkHealthCheck -cpuprofile=cpu.prof ./tests/performance/
```

**Example Output:**
```
BenchmarkSimpleHealthCheck-24    8538678    435.9 ns/op    2210 B/op    22 allocs/op
PASS
ok      inventory-api/tests/performance    4.166s
```

### Integration Tests

Test complete API workflows (requires database setup):

```bash
# Run integration tests
INTEGRATION_TESTS=1 go test -v ./tests/integration/

# Run with timeout for slower systems
INTEGRATION_TESTS=1 go test -v ./tests/integration/ -timeout=30m

# Run specific integration test
INTEGRATION_TESTS=1 go test -v ./tests/integration/ -run=TestAuthentication
```

### Load Tests

Test system under sustained load (requires running API server):

```bash
# Run load test
LOAD_TESTS=1 go test -v ./tests/performance/ -run=TestAPILoadTest

# Run with custom timeout
LOAD_TESTS=1 go test -v ./tests/performance/ -run=TestAPILoadTest -timeout=10m
```

## Test Requirements

### Unit Tests
- ✅ No external dependencies
- ✅ Fast execution
- ✅ Can run anywhere

### Performance Tests  
- ✅ Simple benchmarks: No requirements
- ⚠️ Full benchmarks: Requires running API server + database

### Integration Tests
- ⚠️ Requires PostgreSQL database
- ⚠️ Requires database user: `inventory_user`
- ⚠️ Requires database: `inventory_db`
- ⚠️ Requires seeded test data

### Load Tests
- ⚠️ Requires running API server on `localhost:8080`
- ⚠️ Requires database setup

## Database Setup for Integration/Load Tests

If you need to run integration or load tests, set up the database:

```bash
# Create database user and database
sudo -u postgres createuser -s inventory_user
sudo -u postgres createdb -O inventory_user inventory_db

# Set password (when prompted)
sudo -u postgres psql -c "ALTER USER inventory_user PASSWORD 'inventory_pass';"

# Start API server
go run cmd/main.go
```

## Test Output

### Successful Unit Test
```
=== RUN   TestCreateUser
--- PASS: TestCreateUser (0.04s)
PASS
ok      inventory-api/internal/business/user    0.726s
```

### Successful Performance Test
```
BenchmarkSimpleHealthCheck-24    8538678    435.9 ns/op    2210 B/op    22 allocs/op
PASS
ok      inventory-api/tests/performance    4.166s
```

### Failed Test (Database Required)
```
panic: failed to connect to database: FATAL: role "inventory_user" does not exist
```

## Continuous Testing

### Run All Available Tests
```bash
# Run all unit tests
go test -v ./internal/...

# Run simple performance tests  
go test -bench=BenchmarkSimple -benchmem ./tests/performance/
```

### Pre-Commit Testing
```bash
# Quick test before committing
go test -short ./...
```

### CI/CD Pipeline
```bash
# Comprehensive testing (with database setup)
INTEGRATION_TESTS=1 LOAD_TESTS=1 go test -v ./... -timeout=30m
```

## Troubleshooting

### Database Connection Error
```
FATAL: role "inventory_user" does not exist
```
**Solution**: Set up PostgreSQL database and user as shown above.

### Test Timeout
```
panic: test timed out after 10m0s
```
**Solution**: Increase timeout with `-timeout=30m` or fix slow tests.

### Port Already in Use
```
bind: address already in use
```
**Solution**: Stop other instances of the API server or use different port.

### Permission Denied
```
permission denied
```
**Solution**: Ensure database user has proper permissions or run with appropriate privileges.

## Best Practices

1. **Run unit tests frequently** during development
2. **Run integration tests** before major commits
3. **Run performance tests** when optimizing code
4. **Use short flag** for quick feedback during development
5. **Set appropriate timeouts** for slower systems
6. **Clean up test data** after integration tests
7. **Monitor performance trends** over time

## Test Coverage

To check test coverage:

```bash
# Generate coverage report
go test -coverprofile=coverage.out ./internal/...

# View coverage in browser
go tool cover -html=coverage.out

# View coverage summary
go tool cover -func=coverage.out
```

This testing approach ensures code quality while maintaining fast development cycles.