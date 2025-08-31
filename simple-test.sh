#!/bin/bash

echo "=== API Response Structure Tests ==="

# Get token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST "http://localhost:9090/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Auth token obtained"

# Test 1: Products API
echo ""
echo "=== 1. Products API ==="
curl -s -X GET "http://localhost:9090/api/v1/products?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 2: Suppliers API  
echo ""
echo "=== 2. Suppliers API ==="
curl -s -X GET "http://localhost:9090/api/v1/suppliers?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 3: Users API
echo ""
echo "=== 3. Users API ==="
curl -s -X GET "http://localhost:9090/api/v1/users?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 4: Vehicle Brands API
echo ""
echo "=== 4. Vehicle Brands API ==="
curl -s -X GET "http://localhost:9090/api/v1/vehicle-brands?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 5: Vehicle Models API
echo ""
echo "=== 5. Vehicle Models API ==="
curl -s -X GET "http://localhost:9090/api/v1/vehicle-models?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 6: Categories API
echo ""
echo "=== 6. Categories API ==="
curl -s -X GET "http://localhost:9090/api/v1/categories?page=1&limit=2" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, timestamp, pagination, data_count: (.data | length)}'

# Test 7: Error Response
echo ""
echo "=== 7. Error Response Test ==="
curl -s -X GET "http://localhost:9090/api/v1/products/invalid-uuid" \
    -H "Authorization: Bearer $TOKEN" | \
    jq '{success, message, error, timestamp}'

echo ""
echo "✅ All tests completed!"