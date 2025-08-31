#!/bin/bash

# API Response Structure Testing Script
# Tests all standardized API endpoints for consistent response structures

set -e

API_BASE="http://localhost:9090/api/v1"
TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to increment test counters
increment_test() {
    ((TESTS_TOTAL++))
}

pass_test() {
    ((TESTS_PASSED++))
    print_status $GREEN "✅ PASS: $1"
}

fail_test() {
    ((TESTS_FAILED++))
    print_status $RED "❌ FAIL: $1"
}

# Function to test JSON structure
test_json_structure() {
    local response=$1
    local test_name=$2
    local endpoint=$3
    
    increment_test
    
    # Check if response is valid JSON
    if ! echo "$response" | jq empty > /dev/null 2>&1; then
        fail_test "$test_name - Invalid JSON response from $endpoint"
        return 1
    fi
    
    # Check for required fields in StandardResponse
    local has_success=$(echo "$response" | jq -r '.success // "missing"')
    local has_message=$(echo "$response" | jq -r '.message // "missing"')
    local has_timestamp=$(echo "$response" | jq -r '.timestamp // "missing"')
    
    if [[ "$has_success" == "missing" ]]; then
        fail_test "$test_name - Missing 'success' field in response from $endpoint"
        return 1
    fi
    
    if [[ "$has_message" == "missing" ]]; then
        fail_test "$test_name - Missing 'message' field in response from $endpoint"
        return 1
    fi
    
    if [[ "$has_timestamp" == "missing" ]]; then
        fail_test "$test_name - Missing 'timestamp' field in response from $endpoint"
        return 1
    fi
    
    pass_test "$test_name - Response structure valid for $endpoint"
    return 0
}

# Function to test pagination structure in list responses
test_pagination_structure() {
    local response=$1
    local test_name=$2
    local endpoint=$3
    
    increment_test
    
    # Check for pagination fields
    local has_pagination=$(echo "$response" | jq -r '.pagination // "missing"')
    
    if [[ "$has_pagination" == "missing" ]]; then
        fail_test "$test_name - Missing 'pagination' field in list response from $endpoint"
        return 1
    fi
    
    # Check pagination sub-fields
    local has_page=$(echo "$response" | jq -r '.pagination.page // "missing"')
    local has_limit=$(echo "$response" | jq -r '.pagination.limit // "missing"')
    local has_total=$(echo "$response" | jq -r '.pagination.total // "missing"')
    local has_total_pages=$(echo "$response" | jq -r '.pagination.total_pages // "missing"')
    
    local missing_fields=""
    [[ "$has_page" == "missing" ]] && missing_fields="$missing_fields page"
    [[ "$has_limit" == "missing" ]] && missing_fields="$missing_fields limit"
    [[ "$has_total" == "missing" ]] && missing_fields="$missing_fields total"
    [[ "$has_total_pages" == "missing" ]] && missing_fields="$missing_fields total_pages"
    
    if [[ -n "$missing_fields" ]]; then
        fail_test "$test_name - Missing pagination fields:$missing_fields in $endpoint"
        return 1
    fi
    
    pass_test "$test_name - Pagination structure valid for $endpoint"
    return 0
}

# Function to authenticate and get token
authenticate() {
    print_status $BLUE "🔐 Authenticating..."
    
    local auth_response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}')
    
    if ! echo "$auth_response" | jq empty > /dev/null 2>&1; then
        print_status $RED "❌ Authentication failed - Invalid JSON response"
        exit 1
    fi
    
    local success=$(echo "$auth_response" | jq -r '.success // false')
    if [[ "$success" != "true" ]]; then
        print_status $RED "❌ Authentication failed"
        echo "$auth_response" | jq .
        exit 1
    fi
    
    TOKEN=$(echo "$auth_response" | jq -r '.data.token')
    if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
        print_status $RED "❌ No token received"
        exit 1
    fi
    
    print_status $GREEN "✅ Authentication successful"
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local test_name=$3
    local data=$4
    local expect_list=${5:-false}
    
    print_status $YELLOW "🧪 Testing: $test_name"
    
    local curl_cmd="curl -s -X $method \"$API_BASE$endpoint\" -H \"Authorization: Bearer $TOKEN\""
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$data'"
    fi
    
    local response=$(eval $curl_cmd)
    
    # Test basic JSON structure
    test_json_structure "$response" "$test_name" "$endpoint"
    
    # Test pagination structure for list endpoints
    if [[ "$expect_list" == "true" ]]; then
        test_pagination_structure "$response" "$test_name" "$endpoint"
    fi
    
    # Check success status
    increment_test
    local success=$(echo "$response" | jq -r '.success // false')
    if [[ "$success" == "true" ]]; then
        pass_test "$test_name - Success status correct"
    else
        fail_test "$test_name - Success status incorrect or missing"
        echo "Response: $response" | head -c 200
    fi
    
    echo ""
}

# Function to test error responses
test_error_endpoint() {
    local method=$1
    local endpoint=$2
    local test_name=$3
    local data=$4
    
    print_status $YELLOW "🧪 Testing Error: $test_name"
    
    local curl_cmd="curl -s -X $method \"$API_BASE$endpoint\" -H \"Authorization: Bearer $TOKEN\""
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$data'"
    fi
    
    local response=$(eval $curl_cmd)
    
    # Test basic JSON structure for error responses
    test_json_structure "$response" "$test_name" "$endpoint"
    
    # Check error fields
    increment_test
    local success=$(echo "$response" | jq -r '.success // "missing"')
    local error=$(echo "$response" | jq -r '.error // "missing"')
    
    if [[ "$success" == "false" && "$error" != "missing" ]]; then
        pass_test "$test_name - Error response structure correct"
    else
        fail_test "$test_name - Error response structure incorrect"
        echo "Response: $response" | head -c 200
    fi
    
    echo ""
}

# Main testing function
run_tests() {
    print_status $BLUE "🚀 Starting API Response Structure Tests"
    print_status $BLUE "========================================"
    echo ""
    
    # Authenticate first
    authenticate
    echo ""
    
    # Test Products API
    print_status $BLUE "📦 Testing Products API"
    test_endpoint "GET" "/products" "Products List" "" true
    test_endpoint "GET" "/products?page=1&limit=5" "Products List with Pagination" "" true
    test_endpoint "GET" "/products/search?q=test" "Products Search" "" true
    
    # Test Suppliers API  
    print_status $BLUE "🏪 Testing Suppliers API"
    test_endpoint "GET" "/suppliers" "Suppliers List" "" true
    test_endpoint "GET" "/suppliers?page=1&limit=3" "Suppliers List with Pagination" "" true
    
    # Test Users API
    print_status $BLUE "👥 Testing Users API"
    test_endpoint "GET" "/users" "Users List" "" true
    test_endpoint "GET" "/users?page=1&limit=2" "Users List with Pagination" "" true
    
    # Test Categories API
    print_status $BLUE "📁 Testing Categories API"
    test_endpoint "GET" "/categories" "Categories List" "" true
    test_endpoint "GET" "/categories/search?q=auto" "Categories Search" "" true
    test_endpoint "GET" "/categories/hierarchy" "Categories Hierarchy" ""
    
    # Test Vehicle Brands API
    print_status $BLUE "🚗 Testing Vehicle Brands API"
    test_endpoint "GET" "/vehicle-brands" "Vehicle Brands List" "" true
    test_endpoint "GET" "/vehicle-brands/active" "Active Vehicle Brands" "" true
    test_endpoint "GET" "/vehicle-brands?page=1&limit=3" "Vehicle Brands with Pagination" "" true
    
    # Test Vehicle Models API
    print_status $BLUE "🚙 Testing Vehicle Models API"
    test_endpoint "GET" "/vehicle-models" "Vehicle Models List" "" true
    test_endpoint "GET" "/vehicle-models/active" "Active Vehicle Models" "" true
    test_endpoint "GET" "/vehicle-models?page=1&limit=4" "Vehicle Models with Pagination" "" true
    
    # Test Vehicle Compatibilities API
    print_status $BLUE "🔧 Testing Vehicle Compatibilities API"
    test_endpoint "GET" "/vehicle-compatibilities" "Vehicle Compatibilities List" "" true
    test_endpoint "GET" "/vehicle-compatibilities/active" "Active Compatibilities" "" true
    test_endpoint "GET" "/vehicle-compatibilities?page=1&limit=2" "Compatibilities with Pagination" "" true
    
    # Test Customers API
    print_status $BLUE "👤 Testing Customers API"
    test_endpoint "GET" "/customers" "Customers List" "" true
    test_endpoint "GET" "/customers/active" "Active Customers" "" true
    
    # Test Purchase Receipts API
    print_status $BLUE "🧾 Testing Purchase Receipts API"
    test_endpoint "GET" "/purchase-receipts" "Purchase Receipts List" "" true
    test_endpoint "GET" "/purchase-receipts/summary" "Purchase Receipts Summary" ""
    
    # Test Brands API (Part Brands)
    print_status $BLUE "🏷️ Testing Brands API"
    test_endpoint "GET" "/brands" "Brands List" "" true
    test_endpoint "GET" "/brands/active" "Active Brands" "" true
    
    # Test Inventory API
    print_status $BLUE "📊 Testing Inventory API"
    test_endpoint "GET" "/inventory" "Inventory List" "" true
    test_endpoint "GET" "/inventory/low-stock" "Low Stock Items" "" true
    
    # Test Audit Logs API
    print_status $BLUE "📋 Testing Audit Logs API"
    test_endpoint "GET" "/audit-logs" "Audit Logs List" "" true
    test_endpoint "GET" "/audit-logs/statistics" "Audit Statistics" ""
    
    # Test Error Responses
    print_status $BLUE "❌ Testing Error Responses"
    test_error_endpoint "GET" "/products/nonexistent-id" "Product Not Found Error"
    test_error_endpoint "GET" "/suppliers/invalid-uuid" "Invalid UUID Error"
    test_error_endpoint "POST" "/products" "Product Creation Validation Error" '{"name": ""}'
    
    echo ""
    print_status $BLUE "📊 Test Results Summary"
    print_status $BLUE "======================"
    print_status $BLUE "Total Tests: $TESTS_TOTAL"
    print_status $GREEN "Passed: $TESTS_PASSED"
    print_status $RED "Failed: $TESTS_FAILED"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        print_status $GREEN "🎉 All tests passed! API response standardization is successful."
        return 0
    else
        print_status $RED "⚠️  Some tests failed. Review the output above for details."
        return 1
    fi
}

# Run the tests
run_tests