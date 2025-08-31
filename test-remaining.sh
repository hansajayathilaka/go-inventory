#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST "http://localhost:9090/api/v1/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "=== Remaining Response Structure Tests ==="

echo "Vehicle Compatibilities:"
curl -s -X GET "http://localhost:9090/api/v1/vehicle-compatibilities?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '{success, message, timestamp, pagination}'

echo ""
echo "Customers:"
curl -s -X GET "http://localhost:9090/api/v1/customers?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '{success, message, timestamp, pagination}'

echo ""
echo "Purchase Receipts:"
curl -s -X GET "http://localhost:9090/api/v1/purchase-receipts?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '{success, message, timestamp, pagination}'

echo ""
echo "Brands (Part Brands):"
curl -s -X GET "http://localhost:9090/api/v1/brands?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '{success, message, timestamp, pagination}'

echo ""
echo "Audit Logs:"
curl -s -X GET "http://localhost:9090/api/v1/audit-logs?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq '{success, message, timestamp, pagination}'