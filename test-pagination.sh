#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST "http://localhost:9090/api/v1/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "=== Pagination Functionality Tests ==="

# Test Products pagination
echo ""
echo "=== Products Pagination ==="
echo "Page 1, Limit 2:"
curl -s -X GET "http://localhost:9090/api/v1/products?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

echo "Page 2, Limit 2:"
curl -s -X GET "http://localhost:9090/api/v1/products?page=2&limit=2" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

# Test Vehicle Brands pagination  
echo ""
echo "=== Vehicle Brands Pagination ==="
echo "Page 1, Limit 3:"
curl -s -X GET "http://localhost:9090/api/v1/vehicle-brands?page=1&limit=3" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

echo "Page 2, Limit 3:"
curl -s -X GET "http://localhost:9090/api/v1/vehicle-brands?page=2&limit=3" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

# Test Vehicle Models pagination
echo ""
echo "=== Vehicle Models Pagination ==="
echo "Page 1, Limit 5:"
curl -s -X GET "http://localhost:9090/api/v1/vehicle-models?page=1&limit=5" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

echo "Page 3, Limit 5:"
curl -s -X GET "http://localhost:9090/api/v1/vehicle-models?page=3&limit=5" -H "Authorization: Bearer $TOKEN" | jq '.pagination'

# Test edge case - page beyond available data
echo ""
echo "=== Edge Case: Page Beyond Data ==="
curl -s -X GET "http://localhost:9090/api/v1/products?page=999&limit=10" -H "Authorization: Bearer $TOKEN" | jq '{pagination, data_count: (.data | length)}'