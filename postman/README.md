# Inventory API - Postman Collection

This directory contains Postman collection and environment files for comprehensive API testing of the Inventory Management System.

## Files

- **Inventory-API.postman_collection.json** - Complete API collection with all endpoints
- **Inventory-API.postman_environment.json** - Environment variables for local testing
- **README.md** - This documentation file

## Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import both files:
   - `Inventory-API.postman_collection.json`
   - `Inventory-API.postman_environment.json`

### 2. Setup Environment

1. Select the **"Inventory API - Local"** environment in Postman
2. Verify the `base_url` is set to `http://localhost:8080`
3. Make sure your API server is running

### 3. Start Testing

1. **First**: Run the "Login Admin" request in the 🔐 Authentication folder
   - This will automatically save the auth token for subsequent requests
2. **Then**: Test any other endpoints - they will use the saved auth token automatically

## Collection Structure

The collection is organized into logical groups with emojis for easy navigation:

### 🏥 Health & Status
- Basic health check endpoint
- No authentication required

### 🔐 Authentication
- **Login Admin** - Login as admin user (saves auth token automatically)
- **Login Manager** - Login as manager user
- **Logout** - End current session

### 👥 User Management
- List, create, read, update, and delete users
- Includes test scripts to save user IDs for subsequent operations

### 📁 Categories
- Full category CRUD operations
- Category hierarchy navigation
- Root categories listing

### 📦 Products
- Complete product management
- Product search functionality
- Product inventory lookup
- Links to categories and suppliers

### 📊 Inventory
- Inventory record management
- Stock adjustments and transfers
- Low stock and zero stock reports
- Reorder level management

### 🏢 Suppliers
- Supplier CRUD operations
- Supplier management functionality

### 📍 Locations
- Location management
- Location-specific inventory views

### 📋 Audit & Reporting
- Audit log access
- Stock movement reports
- Inventory summary reports
- Audit statistics

### 📚 Documentation
- Direct access to Swagger UI
- OpenAPI specification download

## Features

### Automatic Token Management
- Login requests automatically save auth tokens
- All authenticated requests use saved tokens
- No manual token copying required

### Variable Chaining
- Create operations save IDs for use in subsequent requests
- Update and delete operations use previously created resource IDs
- Seamless workflow for testing complete CRUD cycles

### Comprehensive Coverage
- All 48+ API endpoints included
- Complete request examples with realistic test data
- Response validation scripts where appropriate

## Authentication Flow

1. **Login**: Use any login endpoint to get a token
2. **Auto-Save**: Token is automatically saved to environment
3. **Auto-Use**: All subsequent requests use the saved token
4. **Logout**: Clear session when done (optional)

## Test Data Requirements

The API expects certain seed data to be present:
- Admin user: `username: admin, password: admin123`
- Manager user: `username: manager, password: manager123`
- Some initial categories, products, and locations

Make sure your database is seeded before testing.

## Common Workflows

### 1. Basic API Testing
```
1. Run "Login Admin"
2. Run "Health Check" 
3. Test any endpoint from any folder
```

### 2. Complete User Management Test
```
1. Run "Login Admin"
2. Run "List Users"
3. Run "Create User"
4. Run "Get User by ID" (uses created user ID)
5. Run "Update User" (uses created user ID)
6. Run "Delete User" (uses created user ID)
```

### 3. Product Management Workflow
```
1. Run "Login Admin"
2. Create Category first
3. Create Supplier (optional)
4. Create Product (uses category ID)
5. Test product operations
```

### 4. Inventory Operations
```
1. Run "Login Admin" 
2. Ensure products and locations exist
3. Create inventory record
4. Test stock adjustments
5. Test stock transfers
6. Check low stock reports
```

## Rate Limiting

The API has rate limiting enabled (100 requests/minute). If you hit rate limits:
- Wait a minute before continuing
- Use the "Health Check" endpoint to test rate limit headers
- Consider adding delays between requests in test scripts

## Environment Variables

The environment includes these variables:
- `base_url` - API server URL
- `auth_token` - Authentication token (auto-populated)
- `user_id` - Current user ID (auto-populated)
- `category_id` - Last created category ID
- `product_id` - Last created product ID
- `supplier_id` - Last created supplier ID
- `location_id` - Last created location ID
- `new_user_id` - Last created user ID

## Troubleshooting

### Authentication Issues
- Make sure to run a login request first
- Check that the auth token is saved in environment variables
- Verify your credentials match the seeded database

### 404 Errors
- Ensure the API server is running on port 8080
- Check that the base_url in environment is correct
- Verify database is seeded with required data

### Permission Errors (403)
- Make sure you're logged in as a user with sufficient privileges
- Admin users have all permissions
- Lower privilege users may not be able to perform all operations

### Rate Limit Errors (429)
- Wait 60 seconds before making more requests
- Consider the rate limit of 100 requests per minute

## Advanced Usage

### Running Collections with Newman
```bash
# Install Newman CLI
npm install -g newman

# Run entire collection
newman run Inventory-API.postman_collection.json -e Inventory-API.postman_environment.json

# Run specific folder
newman run Inventory-API.postman_collection.json -e Inventory-API.postman_environment.json --folder "User Management"
```

### Automated Testing
The collection includes test scripts that:
- Validate response status codes
- Check response structure
- Save important IDs for chaining requests
- Log important information to console

## Support

For issues with the API itself, refer to the Swagger documentation at:
`http://localhost:8080/docs/index.html`

For Postman-specific questions, consult the Postman documentation.