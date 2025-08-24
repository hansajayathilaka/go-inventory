# TUI Inventory Management System

A comprehensive Terminal User Interface (TUI) based inventory management system built with Go and Bubble Tea, designed for point of sale integration.

## Quick Start with Dev Container

1. **Prerequisites**: VS Code with Dev Containers extension
2. **Setup**: 
   - Open this project in VS Code
   - Run "Dev Containers: Reopen in Container" from Command Palette
   - Wait for container to build (includes Go 1.23 + PostgreSQL 16)
3. **Verify Setup**:
   ```bash
   go version  # Should show Go 1.23+
   psql -h postgres -U inventory_user -d inventory_db -c "SELECT version();"
   ```

## For New Claude Sessions

**IMPORTANT**: Read `CLAUDE.md` first - it contains the complete project plan, architecture, and development roadmap.

### Current Status - PRODUCTION READY ✅
- ✅ Complete 3-layer architecture implemented
- ✅ Database models and repositories
- ✅ Business logic services
- ✅ TUI interface with Bubble Tea
- ✅ Configuration management
- ✅ Database seeding
- ✅ Full TUI integration with business logic
- ✅ User management system with RBAC
- ✅ Product management with hierarchy
- ✅ Stock management and tracking
- ✅ Comprehensive testing completed

### Running the Application

1. **Build the application**:
   ```bash
   go build -o tui-inventory ./cmd/main.go
   ```

2. **Seed the database** (first time only):
   ```bash
   ./tui-inventory --seed
   ```

3. **Run the application**:
   ```bash
   ./tui-inventory
   ```

### Default Credentials
After seeding, you can use these test accounts:
- Admin: `admin` / `admin123`
- Manager: `manager` / `manager123`
- Staff: `staff` / `staff123`
- Viewer: `viewer` / `viewer123`

### Architecture Overview
```
Presentation Layer (Bubble Tea TUI)
     ↓
Business Logic Layer (Core domain logic)
     ↓  
Data Access Layer (Repository pattern + GORM)
     ↓
Database Layer (PostgreSQL)
```

### Implemented Features ✅
- **User Management** - Complete RBAC with Admin, Manager, Staff, Viewer roles
- **Product Management** - Full CRUD with category hierarchy and supplier relationships
- **Stock Management** - Real-time tracking, adjustments, movement history, low stock alerts
- **Category Hierarchy** - Multi-level categories with proper parent-child relationships
- **Inventory Tracking** - Location-based inventory with reorder levels and stock movements
- **Audit Logging** - Comprehensive trail for all operations (service layer)
- **Point of Sale Integration** - Ready for future API integration

### Available TUI Interfaces
- **Main Menu** - Central navigation hub
- **User Management** - Create, list, and manage users with role-based access
- **Product Management** - Product listing, creation, category, and supplier management
- **Inventory Management** - Stock levels, movement history, and stock adjustments
- **Real-time Operations** - Live inventory tracking and business logic integration

### Database Connection
- Host: `postgres` (in dev container) or `localhost:5432` (manual)
- Database: `inventory_db`
- User: `inventory_user`
- Password: `inventory_pass`

### Development Commands
```bash
# Initialize project
go mod init tui-inventory

# Install dependencies
go get github.com/charmbracelet/bubbletea/v2
go get gorm.io/gorm
go get gorm.io/driver/postgres
go get github.com/spf13/viper
go get github.com/google/uuid

# Run application (when ready)
go run cmd/main.go

# Run tests
go test ./...
```

## Project Files Reference

- `CLAUDE.md` - Complete development guide and architecture
- `.devcontainer/` - Development environment configuration
- `cmd/` - Application entry points
- `internal/` - Private application code
  - `ui/` - TUI components (Bubble Tea)
  - `business/` - Business logic layer
  - `repository/` - Data access layer
- `migrations/` - Database migrations

## Technology Stack

- **Language**: Go 1.23+
- **TUI Framework**: Bubble Tea v2
- **ORM**: GORM
- **Database**: PostgreSQL 16
- **Configuration**: Viper
- **Development**: Dev Containers