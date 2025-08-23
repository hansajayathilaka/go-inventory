# TUI Inventory System - Development Guide

## Project Overview
A comprehensive TUI-based inventory management system built with Go and Bubble Tea, designed for point of sale integration with proper architectural separation.

## Technology Stack
- **Language**: Go
- **TUI Framework**: Bubble Tea v2
- **ORM**: GORM
- **Database**: PostgreSQL
- **Configuration**: Viper
- **Architecture**: Clean Architecture with 3-layer separation

## Project Structure
```
tui-inventory/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── ui/                     # TUI layer (Bubble Tea)
│   │   ├── models/            # TUI models/pages
│   │   ├── components/        # Reusable UI components
│   │   └── styles/            # UI styling
│   ├── business/              # Business logic layer
│   │   ├── inventory/         # Inventory management
│   │   ├── user/              # User management
│   │   ├── audit/             # Audit logging
│   │   └── hierarchy/         # Item hierarchy
│   ├── repository/            # Data access layer
│   │   ├── models/            # GORM models
│   │   └── interfaces/        # Repository interfaces
│   └── config/                # Configuration management
├── migrations/                # Database migrations
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

## Development Status - COMPLETED ✅

1. ✅ Create CLAUDE.md with project plan and knowledge
2. ✅ Initialize Go module and project structure
3. ✅ Set up dependencies (Bubble Tea, GORM, PostgreSQL driver, Viper)
4. ✅ Create database models with GORM
5. ✅ Implement repository layer with interfaces
6. ✅ Create business logic layer for core operations
7. ✅ Build TUI components and models with Bubble Tea
8. ✅ Implement user management system (TUI integration complete)
9. ✅ Create product management with hierarchy (TUI integration complete)
10. ✅ Build stock management functionality (TUI integration complete)
11. ✅ Implement audit logging system (service layer complete)
12. ✅ Create main application entry point
13. ✅ Add configuration management
14. ✅ Test core functionality and create example data

## Implementation Summary (Latest Session)

### Completed TUI Integration Components:
- **User Management TUI** (`internal/ui/models/user_management.go`)
  - Full CRUD operations for user management
  - Role-based access control interface
  - Password management and user authentication

- **Product Management TUI** (`internal/ui/models/product_*.go`)
  - Product listing with detailed view
  - Product creation form with validation
  - Category management with hierarchy support
  - Supplier management interface

- **Inventory Management TUI** (`internal/ui/models/stock_*.go`)
  - Real-time stock levels display
  - Stock movement history tracking
  - Stock adjustment functionality
  - Low stock alerts and warnings

### Testing Results (2025-08-22):
- ✅ Database connection and seeding
- ✅ 4 test users created with different roles
- ✅ 4 test products with proper categorization
- ✅ 7-level category hierarchy functioning correctly
- ✅ 4 inventory records with stock tracking
- ✅ Stock adjustment business logic working
- ✅ All database operations and business services operational

## Architecture Principles

### Clean Architecture
- **Presentation Layer**: TUI components using Bubble Tea
- **Business Logic Layer**: Core domain logic, independent of UI and database
- **Data Access Layer**: Repository pattern with GORM

### Dependency Injection
- Use interfaces for all external dependencies
- Repository interfaces for data access
- Service interfaces for business logic

### Error Handling
- Structured error handling with custom error types
- Graceful error display in TUI
- Comprehensive logging for debugging

## TUI Design Patterns

### Bubble Tea Architecture
- Model: Application state and data
- Update: State transitions based on messages
- View: Rendering the current state

### Navigation
- Stack-based navigation for deep hierarchies
- Breadcrumb navigation for complex workflows
- Context-aware menu systems

### Components
- Reusable form components
- Table components with sorting/filtering
- Modal dialogs for confirmations
- Progress indicators for long operations

## Point of Sale Integration Requirements

### API Endpoints (Future)
- Product lookup by SKU/barcode
- Real-time stock checking
- Stock deduction on sale
- Returns and refunds handling

### Real-time Features
- Live inventory updates
- Stock alerts and notifications
- Multi-user concurrent access

## Development Environment Setup

### Dev Container Setup
1. Open project in VS Code
2. Run "Dev Containers: Reopen in Container" from Command Palette
3. Container will automatically set up Go 1.23 + PostgreSQL 16
4. Database credentials: `inventory_user:inventory_pass@localhost:5432/inventory_db`

### Manual Setup (Alternative)
```bash
go mod init tui-inventory
go get github.com/charmbracelet/bubbletea/v2
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/spf13/viper
go get github.com/google/uuid
```

### Database Setup
```bash
# Dev container automatically starts PostgreSQL
# Manual setup:
createdb inventory_db
psql inventory_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### Testing
```bash
go test ./...
go test -v ./internal/...
```

### Running
```bash
go run cmd/main.go
```

## Notes for Future Sessions

- Always maintain the 3-layer architecture separation
- Use repository pattern for all database operations
- Follow Go naming conventions and best practices
- Implement proper error handling and logging
- Ensure TUI is responsive and user-friendly
- Maintain audit trails for all data modifications
- Focus on performance for large inventory datasets

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

### Reporting
- Stock levels by location
- Movement history reports
- Audit trail exports
- Cost analysis reports