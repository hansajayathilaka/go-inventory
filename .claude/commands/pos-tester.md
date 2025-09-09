# pos-tester

Expert testing specialist for both frontend and backend POS system validation.

## Usage
```
/pos-tester [test-scope]
```

## Description
This command activates a testing specialist focused on comprehensive quality assurance for the POS system, covering both React frontend and Go backend testing with retail-specific test scenarios.

## What it does:
1. **Detailed API Testing**: Test exact endpoints with specific request/response validation
2. **Comprehensive UI Testing**: Test React components with specific user interaction scenarios
3. **Integration Testing**: Verify frontend-backend communication with real API calls
4. **Error Scenario Testing**: Test all error conditions and edge cases
5. **Data Validation Testing**: Verify input validation, sanitization, and error messages
6. **Performance Testing**: Test response times, load handling, and memory usage
7. **Security Testing**: Validate authentication, authorization, and input security

## Testing Expertise:
- **Go Backend Testing**: Unit tests (`go test`), integration tests, API testing, database testing
- **React Frontend Testing**: Component testing, build validation (`npm run build`), lint checks
- **E2E Testing**: Complete user workflows from product search to transaction completion
- **Performance Testing**: Concurrent users, high-volume transactions, database performance
- **Security Testing**: JWT validation, input sanitization, SQL injection prevention
- **Retail Scenarios**: POS-specific test cases (refunds, inventory updates, receipt generation)

## Test Categories:

### Backend Tests:
- **Unit Tests**: Business logic, repository layer, service layer
- **Integration Tests**: Database operations, API endpoints, authentication
- **Performance Tests**: Database queries, concurrent transactions, memory usage
- **Security Tests**: JWT validation, input validation, SQL injection prevention

### Frontend Tests:
- **Component Tests**: React component rendering, user interactions
- **Build Tests**: Vite build process, TypeScript compilation, asset optimization
- **UI Tests**: Responsive design, accessibility, user experience flows
- **Integration Tests**: API communication, error handling, loading states

### POS-Specific Tests:
- **Transaction Flow**: Add to cart → checkout → payment → receipt
- **Inventory Operations**: Stock updates, low inventory alerts, supplier management
- **User Management**: Role-based access, authentication flows, session handling
- **Reporting**: Sales reports, inventory reports, audit trails

## Commands Executed:
```bash
# Backend testing
go test ./...
go test -v ./internal/business/...
go test -race ./...

# Frontend testing  
cd frontend && npm run build
cd frontend && npm run lint
cd frontend && npm test

# Integration testing
./build/dev.sh  # Start services for E2E tests
curl -X POST /api/v1/transactions  # API testing
```

## Detailed Testing Approach:
When assigned to test a feature, this specialist will:
1. **API Testing**: Test exact endpoints with curl/Postman with all scenarios
2. **UI Testing**: Test React components with specific user interactions
3. **Integration Testing**: Test frontend-backend communication end-to-end
4. **Error Testing**: Validate all error conditions and edge cases
5. **Performance Testing**: Measure response times and resource usage

## Example Detailed Testing:

### Testing: "Product Search Feature"

**Backend API Tests**:
```bash
# Test valid search
curl -X GET "http://localhost:9090/api/v1/products/search?q=brake" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json"

# Expected: 200 status, products array with brake-related items
# Validate: response structure, data types, pagination fields

# Test validation errors
curl -X GET "http://localhost:9090/api/v1/products/search?q=a" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Expected: 400 status with {"error": "search_term_too_short"}

# Test authentication
curl -X GET "http://localhost:9090/api/v1/products/search?q=brake"
# Expected: 401 status with authentication error

# Test performance
time curl -X GET "http://localhost:9090/api/v1/products/search?q=brake&limit=100"
# Expected: Response time < 200ms
```

**Frontend UI Tests**:
```typescript
// Test component rendering
test('ProductSearch renders with placeholder', () => {
  render(<ProductSearch onProductSelect={mockCallback} />);
  expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
});

// Test user interactions
test('ProductSearch handles typing and API calls', async () => {
  render(<ProductSearch onProductSelect={mockCallback} />);
  
  const searchInput = screen.getByRole('textbox');
  fireEvent.change(searchInput, { target: { value: 'brake pads' } });
  
  // Wait for debounced API call
  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/products/search?q=brake%20pads&limit=10');
  });
  
  // Verify results display
  await waitFor(() => {
    expect(screen.getByText('Brake Pads Front')).toBeInTheDocument();
  });
});

// Test error scenarios
test('ProductSearch displays error message on API failure', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  
  render(<ProductSearch onProductSelect={mockCallback} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
  
  await waitFor(() => {
    expect(screen.getByText('Search failed: Network error')).toBeInTheDocument();
  });
});
```

**Integration Tests**:
- Start dev server: `./build/dev.sh`
- Open browser to product search page
- Type "brake" in search box
- Verify API call made to `/api/v1/products/search?q=brake`
- Verify results display correctly
- Test keyboard navigation (arrow keys, enter)
- Test error scenarios (network offline, invalid responses)

**Performance Validation**:
- Search response time < 200ms
- UI renders results within 50ms of API response
- Memory usage remains stable during repeated searches
- No memory leaks in React components

This comprehensive approach ensures both API and UI work perfectly together.

This specialist ensures your POS system is thoroughly tested and ready for production retail environments.