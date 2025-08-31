#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST "http://localhost:9090/api/v1/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "=== Error Response Format Tests ==="

# Test 404 - Invalid ID
echo ""
echo "=== 1. Invalid Product ID (404) ==="
curl -s -X GET "http://localhost:9090/api/v1/products/invalid-uuid" -H "Authorization: Bearer $TOKEN" | jq '{success, message, error, timestamp}'

# Test 404 - Non-existent resource
echo ""
echo "=== 2. Non-existent Product (404) ==="
curl -s -X GET "http://localhost:9090/api/v1/products/00000000-0000-0000-0000-000000000000" -H "Authorization: Bearer $TOKEN" | jq '{success, message, error, timestamp}'

# Test 400 - Invalid request body
echo ""
echo "=== 3. Invalid Product Creation (400) ==="
curl -s -X POST "http://localhost:9090/api/v1/products" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": ""}' | jq '{success, message, error, timestamp}'

# Test 401 - Unauthorized (no token)
echo ""
echo "=== 4. Unauthorized Access (401) ==="
curl -s -X GET "http://localhost:9090/api/v1/products" | jq '{success, message, error, timestamp}'

# Test 401 - Invalid token
echo ""
echo "=== 5. Invalid Token (401) ==="
curl -s -X GET "http://localhost:9090/api/v1/products" -H "Authorization: Bearer invalid-token" | jq '{success, message, error, timestamp}'

# Test validation error on supplier creation
echo ""
echo "=== 6. Supplier Validation Error (400) ==="
curl -s -X POST "http://localhost:9090/api/v1/suppliers" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name": "", "email": "invalid-email"}' | jq '{success, message, error, timestamp}'