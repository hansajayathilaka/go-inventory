# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hardware Store Inventory Management System - Development Guide

## Project Overview
A **single-user hardware store inventory management system** designed for deployment as a **single executable**. Features a Go API backend with embedded React frontend, SQLite database, and offline operation capabilities.

## NEW ARCHITECTURE (2025-08-27) 🚀
**MAJOR CHANGE**: Migrated from Go + Templ + HTMX to **Go + Embedded React** architecture.

### Technology Stack
- **Backend**: Go 1.23+ with Gin framework (existing API - no changes)
- **Frontend**: React + TypeScript + TailwindCSS (new)
- **Database**: SQLite (single file, perfect for hardware store)
- **Deployment**: Single executable with embedded React build
- **Target User**: Single hardware store owner using old computer
- **Operation**: Offline capable, no external dependencies

### Architecture Benefits
- **Single File Deployment** - Copy one executable, run anywhere
- **Hardware Store Perfect** - Works offline, old computers, simple setup
- **Developer Experience** - Modern React tooling and components
- **Maintenance** - Easier UI development and feature additions

## NEW Project Structure
```
hardware-store-inventory/
├── cmd/
│   └── main.go                 # Single executable entry point
├── frontend/                   # React frontend (NEW)
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Main React app
│   ├── public/                # Static assets
│   ├── package.json           # NPM dependencies
│   └── vite.config.ts         # Vite build configuration
├── internal/
│   ├── api/                   # REST API layer (KEEP - no changes)
│   │   ├── handlers/          # HTTP request handlers
│   │   ├── middleware/        # Authentication, CORS, validation
│   │   ├── router/            # Route definitions
│   │   └── dto/               # Data Transfer Objects
│   ├── business/              # Business logic layer (KEEP - no changes)
│   │   ├── inventory/         # Inventory management services
│   │   ├── user/              # User management services
│   │   ├── product/           # Product management services
│   │   ├── supplier/          # Supplier management services
│   │   ├── location/          # Location management services
│   │   ├── audit/             # Audit logging services
│   │   └── hierarchy/         # Category hierarchy services
│   ├── repository/            # Data access layer (KEEP - no changes)
│   │   ├── models/            # GORM models
│   │   └── interfaces/        # Repository interfaces
│   ├── app/                   # Application context and initialization
│   ├── config/                # Configuration management
│   └── embed/                 # React build embedding (NEW)
├── internal/web/              # OLD - TO BE REMOVED
│   ├── components/            # Templ components (DELETE)
│   ├── handlers/              # Web handlers (DELETE)
│   ├── layouts/               # Templ layouts (DELETE)
│   └── types/                 # Web types (DELETE)
├── docs/                      # Swagger documentation (auto-generated)
├── tests/                     # Test suites
│   ├── integration/           # API integration tests
│   └── performance/           # Benchmarks and load tests
├── build/                     # Build scripts (NEW)
│   ├── build.sh               # Single executable build script
│   └── dev.sh                 # Development script
├── go.mod
└── go.sum
```

## Core Features

### 1. User Management System
- Authentication and authorization
- Role-based access control (Admin, Manager, Staff, Viewer)
- User sessions and permissions
- Password management and security

### 2. Product Management
- Product catalog with SKU generation
- Product categories and attributes
- Pricing management (cost, retail, wholesale)
- Supplier information and relationships
- Product images and descriptions

### 3. Item Hierarchy System
- Multi-level category structure (Category → Subcategory → Product → Variant)
- Hierarchical navigation in TUI
- Bulk operations on category levels
- Property inheritance down the hierarchy

### 4. Stock Management
- Real-time inventory tracking
- Stock movements (IN/OUT/TRANSFER/ADJUSTMENT)
- Multi-location inventory support
- Low stock alerts and reorder points
- Batch/lot tracking for expirable items

### 5. Audit Logging
- Comprehensive audit trail for all operations
- User action logging with timestamps
- Stock movement history
- Data change tracking
- Export capabilities for compliance

## Database Schema Design

### Users Table
- id, username, email, password_hash, role, created_at, updated_at, last_login

### Categories Table (Hierarchical)
- id, name, description, parent_id, level, path, created_at, updated_at

### Products Table
- id, sku, name, description, category_id, supplier_id, cost_price, retail_price, wholesale_price, created_at, updated_at

### Inventory Table
- id, product_id, location_id, quantity, reserved_quantity, reorder_level, last_updated

### Stock Movements Table
- id, product_id, movement_type, quantity, reference_id, user_id, notes, created_at

### Audit Logs Table
- id, table_name, record_id, action, old_values, new_values, user_id, timestamp

## NEW Development Commands

### React + Go Development
```bash
# Development Mode (Run both simultaneously)
# Terminal 1: Start Go API server
go run cmd/main.go

# Terminal 2: Start React development server
cd frontend
npm run dev
# React: http://localhost:9000 -> Go API: http://localhost:9090

# OR use development script:
./build/dev.sh
```

### Building Single Executable
```bash
# Build React for production
cd frontend
npm run build

# Build Go with embedded React
go build -o hardware-store-inventory ./cmd/main.go

# OR use build script:
./build/build.sh

# Deploy single executable
./hardware-store-inventory --seed  # First run with sample data
./hardware-store-inventory          # Normal operation
```

### Legacy Commands (Still Available)
```bash
# Generate Swagger documentation
swag init -g cmd/main.go -o ./docs

# Run API-only mode (development)
go run cmd/main.go
```

### Testing
```bash
# Run all tests
go test ./...

# Run business logic tests
go test -v ./internal/business/...

# Run integration tests (requires running server)
INTEGRATION_TESTS=1 go test -v ./tests/integration/ -timeout=30m

# Run performance benchmarks
go test -bench=. ./tests/performance/
```

### Database Operations
```bash
# Test database connection
go run cmd/main.go --seed

# Access PostgreSQL (dev container)
psql -h postgres -U inventory_user -d inventory_db
```

## API Development Status - COMPLETED ✅

### Migration from TUI to REST API (2025-08-26)
- ✅ Complete TUI to REST API migration
- ✅ 48+ REST API endpoints implemented
- ✅ Full Swagger/OpenAPI documentation
- ✅ JWT authentication with role-based access control
- ✅ Comprehensive middleware (CORS, rate limiting, validation)
- ✅ Integration test suite
- ✅ Performance testing and monitoring

## Architecture Principles

### Clean Architecture
- **API Layer**: REST endpoints, middleware, DTOs (internal/api/)
- **Business Logic Layer**: Core domain services, independent of HTTP and database (internal/business/)
- **Data Access Layer**: Repository pattern with GORM (internal/repository/)

### Dependency Injection
- Use interfaces for all external dependencies
- Repository interfaces for data access
- Service interfaces for business logic

### API Architecture Patterns
- RESTful resource-based URLs (/api/v1/{resource})
- Consistent HTTP status codes and error responses
- JWT bearer token authentication
- Role-based access control with hierarchical permissions
- Request validation with structured error messages
- Rate limiting with response headers
- CORS enabled for cross-origin requests

## Key API Endpoints

### Authentication & Authorization
- `POST /api/v1/auth/login` - JWT login
- `POST /api/v1/auth/logout` - Token invalidation
- Middleware enforces role hierarchy: viewer < staff < manager < admin

### Core Resources (Full CRUD)
- `/api/v1/users` - User management with RBAC
- `/api/v1/categories` - Category hierarchy with tree operations
- `/api/v1/products` - Product catalog with search/filtering
- `/api/v1/inventory` - Stock management and adjustments
- `/api/v1/suppliers` - Supplier information
- `/api/v1/locations` - Storage locations
- `/api/v1/audit-logs` - Audit trail and reporting

### API Documentation
- **Swagger UI**: `http://localhost:9090/docs/index.html`
- **Health Check**: `GET /api/v1/health`
- **Base URL**: `http://localhost:9090/api/v1`

## Development Environment Setup

### Dev Container Setup
1. Open project in VS Code
2. Run "Dev Containers: Reopen in Container" from Command Palette
3. Container will automatically set up Go 1.23 + PostgreSQL 16
4. Database credentials: `inventory_user:inventory_pass@localhost:5432/inventory_db`

### Manual Setup (Alternative)
```bash
go mod init inventory-api
go get github.com/gin-gonic/gin
go get github.com/swaggo/gin-swagger
go get github.com/swaggo/files
go get github.com/swaggo/swag/cmd/swag
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/spf13/viper
go get github.com/google/uuid
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto
```

### Database Setup
```bash
# Dev container automatically starts PostgreSQL
# Manual setup:
createdb inventory_db
psql inventory_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Default Test Credentials (After Seeding)
- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`  
- **Staff**: `staff` / `staff123`
- **Viewer**: `viewer` / `viewer123`

## Development Guidelines

### Architecture Principles
- Maintain clean 3-layer separation (API → Business → Repository)
- Use dependency injection with interfaces
- Follow Go naming conventions and best practices
- Implement proper HTTP status codes and error handling
- Maintain comprehensive audit trails for all data modifications
- Use JWT authentication with role-based access control

### API Development Patterns
- Generate Swagger documentation for all new endpoints
- Implement request validation with structured error responses
- Follow RESTful resource naming conventions
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Implement pagination for list endpoints
- Add rate limiting for production endpoints

### Testing Requirements
- Write unit tests for business logic (internal/business/)
- Create integration tests for API endpoints (tests/integration/)
- Run performance benchmarks for critical operations
- Test role-based access control for all protected endpoints

## Business Logic Requirements

### Stock Valuation
- FIFO (First In, First Out)
- LIFO (Last In, First Out)
- Average Cost Method

### Automated Features
- Reorder suggestions based on sales velocity
- Low stock alerts
- Supplier performance tracking
- Inventory turnover analysis

### Reporting APIs
- GET /api/v1/reports/inventory-summary - Stock levels by location
- GET /api/v1/reports/stock-movements - Movement history reports  
- GET /api/v1/audit-logs - Audit trail exports with filtering
- Performance monitoring endpoints for system health

## Migration Notes
This project was successfully migrated from a TUI-based application to a REST API while preserving all business logic and database operations. The migration details are documented in `TUI_TO_API_MIGRATION.md`.