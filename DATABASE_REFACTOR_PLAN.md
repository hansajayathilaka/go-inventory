# Database Refactor Implementation Plan

## Overview
Transform the current complex database schema to a minimal, efficient design based on the simplified ERD. Focus on essential functionality for a small shop operation with 2 users.

## Current State Analysis

### ✅ Existing Models (13 files)
1. **Keep As-Is**: `user.go`, `category.go`, `brand.go`, `supplier.go`, `customer.go`, `inventory.go`, `stock_movement.go`, `audit_log.go`
2. **Simplify**: `purchase_receipt.go` (remove approval workflow fields)
3. **Add Missing**: Sales tables, Stock Batches, Payments
4. **Remove**: `vehicle_*.go` files (3 files - can be added later)

### 🔴 Models Needing Changes
- `purchase_receipt.go` - Remove complex workflow fields, keep only essential
- `product.go` - Review for unnecessary complexity
- Missing: `sale.go`, `sale_item.go`, `payment.go`, `stock_batch.go`

## Implementation Phases

### Phase 0: PostgreSQL to SQLite Migration (Week 1 - CRITICAL PRIORITY)
**Goal**: Migrate from PostgreSQL to SQLite for simplified deployment and maintenance

#### Task 0.1: SQLite Configuration Setup
- Update database configuration to support SQLite
- Modify connection string and database driver
- Update Docker configuration to remove PostgreSQL dependency
- Configure SQLite file location and permissions

#### Task 0.2: GORM SQLite Migration
- Update GORM configuration for SQLite compatibility
- Modify UUID handling (SQLite doesn't have native UUID support)
- Update data types for SQLite compatibility:
  - `uuid` → `TEXT` with UUID string format
  - `decimal` → `REAL` for financial calculations
  - `timestamp` → `DATETIME`
  - `jsonb` → `TEXT` with JSON strings

#### Task 0.3: Update Database Models for SQLite
- Modify all GORM tags for SQLite compatibility
- Update primary key generation (remove `gen_random_uuid()`)
- Adjust constraints and indexes for SQLite syntax
- Test model validation and relationships

#### Task 0.4: Create SQLite Migration Scripts
- Generate SQLite schema from existing models
- Create data export scripts from PostgreSQL
- Create data import scripts for SQLite
- Validate data integrity after migration

#### Task 0.5: Update Application Configuration
- Modify database initialization code
- Update connection pooling for SQLite
- Remove PostgreSQL-specific configurations
- Update backup and maintenance scripts

**Deliverables**:
- [ ] SQLite database configuration working
- [ ] All models compatible with SQLite
- [ ] Migration scripts tested and validated
- [ ] Application starts and connects to SQLite
- [ ] All existing functionality preserved

### Phase 1: Model Refactoring (Week 2)
**Goal**: Update existing models to match minimal design

#### Task 1.1: Simplify Purchase Receipt Model
- Remove approval workflow fields: `ApprovedByID`, `ApprovedBy`, `ApprovedAt`, `ReceivedByID`, `ReceivedBy`, `VerifiedByID`, `VerifiedBy`, `VerifiedAt`
- Remove complex fields: `ExpectedDate`, `DeliveryDate`, `DeliveryNote`, `InvoiceNumber`, `InvoiceDate`, `VehicleNumber`, `DriverName`, `QualityCheck`, `QualityNotes`, `ReceiptNotes`, `Reference`, `Terms`, `OrderNotes`, `SubTotal`, `TaxAmount`, `TaxRate`, `ShippingCost`, `Currency`
- Keep essential: `ID`, `ReceiptNumber`, `SupplierID`, `PurchaseDate` (rename from OrderDate), `SupplierBillNumber` (new), `Status`, `BillDiscountAmount` (new), `BillDiscountPercentage` (new), `TotalAmount`, `Notes`, `CreatedByID`
- Update status enum to: "pending", "received", "completed", "cancelled"

#### Task 1.2: Simplify Purchase Receipt Item Model  
- Remove complex fields: `TotalPrice`, `TaxAmount`, `OrderNotes`, `ReceivedQuantity`, `AcceptedQuantity`, `RejectedQuantity`, `DamagedQuantity`, `ExpiryDate`, `BatchNumber`, `SerialNumbers`, `QualityStatus`, `QualityNotes`, `ReceiptNotes`, `StockUpdated`
- Rename: `UnitPrice` → `UnitCost`, `OrderedQuantity` → `Quantity`
- Keep/Add: `ID`, `PurchaseReceiptID`, `ProductID`, `UnitCost`, `Quantity`, `ItemDiscountAmount` (new), `ItemDiscountPercentage` (new), `LineTotal` (new)

#### Task 1.3: Remove Vehicle Models
- Delete: `vehicle_brand.go`, `vehicle_model.go`, `vehicle_compatibility.go`
- Remove corresponding repository files
- Update any references in business logic

#### Task 1.4: Create Missing Models
- `sale.go` - Minimal sales table
- `sale_item.go` - Minimal sale items
- `payment.go` - Payment tracking
- `stock_batch.go` - Batch/lot inventory tracking

**Deliverables**:
- [ ] Updated models with minimal fields
- [ ] Database migration files
- [ ] Unit tests for all models
- [ ] Updated repository interfaces

### Phase 2: Repository Layer Updates (Week 2-3)
**Goal**: Update repository layer to support new models (after SQLite migration)

#### Task 2.1: Update Purchase Receipt Repository
- Simplify CRUD operations
- Remove approval workflow methods
- Add discount calculation methods
- Update queries for new field structure

#### Task 2.2: Create Missing Repositories
- `sale_repository.go` with bill number lookup
- `sale_item_repository.go` with profit calculations
- `payment_repository.go` with payment method tracking
- `stock_batch_repository.go` with FIFO/LIFO support

#### Task 2.3: Update Existing Repositories
- Remove vehicle-related repositories
- Update references to simplified models
- Add batch tracking to stock movement repository

**Deliverables**:
- [ ] All repository interfaces updated
- [ ] Repository implementations completed
- [ ] Integration tests for repository layer
- [ ] Database migration scripts

### Phase 3: Business Logic Updates (Week 3)
**Goal**: Update business services to use new models

#### Task 3.1: Update Purchase Receipt Service
- Remove approval workflow
- Add discount calculation logic
- Simplify status transitions
- Update stock integration

#### Task 3.2: Create Sales Service
- Bill number generation
- Multi-level discount calculations
- Profit calculation per item
- Payment processing integration

#### Task 3.3: Update Inventory Service
- Add batch tracking support
- Implement FIFO/LIFO cost calculations
- Update stock movement tracking

**Deliverables**:
- [ ] All business services updated
- [ ] Unit tests for business logic
- [ ] Integration tests for workflows
- [ ] API documentation updates

### Phase 4: API Layer Updates (Week 3-4)
**Goal**: Update API endpoints to support new functionality

#### Task 4.1: Update Purchase Receipt APIs
- Simplify request/response DTOs
- Remove approval endpoints
- Add discount handling
- Update validation rules

#### Task 4.2: Create Sales APIs
- Sales CRUD operations
- Bill number lookup endpoint
- Payment processing endpoints
- Discount calculation endpoints

#### Task 4.3: Update Inventory APIs
- Add batch tracking endpoints
- Stock movement with batch support
- Inventory valuation endpoints

**Deliverables**:
- [ ] All API endpoints updated
- [ ] API integration tests
- [ ] Swagger documentation
- [ ] Postman collection

### Phase 5: Testing & Quality Assurance (Week 4)
**Goal**: Comprehensive testing of the refactored system

#### Task 5.1: Unit Testing
- Model validation tests
- Repository tests with test database
- Business logic tests with mocks
- API handler tests

#### Task 5.2: Integration Testing
- End-to-end purchase workflow
- End-to-end sales workflow
- Multi-user scenarios
- Data migration testing

#### Task 5.3: Performance Testing
- Database query optimization
- API response time validation
- Concurrent user testing
- Memory usage profiling

**Deliverables**:
- [ ] 90%+ test coverage
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Load testing results

### Phase 6: Data Migration & Deployment (Week 4-5)
**Goal**: Final data migration and deploy the system

#### Task 6.1: Data Migration Scripts
- Export existing data
- Transform to new schema
- Validate data integrity
- Rollback procedures

#### Task 6.2: Deployment Preparation
- Environment configuration
- Database backup procedures
- Monitoring setup
- Error handling improvements

#### Task 6.3: Production Deployment
- Schema migration execution
- Data migration execution
- System validation
- User acceptance testing

**Deliverables**:
- [ ] Production deployment successful
- [ ] All data migrated correctly
- [ ] System monitoring active
- [ ] User training completed

## Testing Strategy

### Unit Tests
- Model validation and business rules
- Repository CRUD operations
- Service layer business logic
- API request/response handling
- Target: 90% code coverage

### Integration Tests
- Database transactions
- API endpoint workflows
- Service integration
- Authentication/authorization
- Cross-component data flow

### End-to-End Tests
- Complete purchase workflow
- Complete sales workflow
- User management scenarios
- Error handling scenarios
- Performance under load

## Risk Mitigation

### High Risks
1. **Data Loss During Migration**
   - Mitigation: Complete backup, staged migration, validation scripts
2. **System Downtime**
   - Mitigation: Blue-green deployment, rollback procedures
3. **User Adoption Issues**
   - Mitigation: Training sessions, documentation, gradual rollout

### Medium Risks
1. **Performance Degradation**
   - Mitigation: Performance testing, query optimization, indexing
2. **Integration Issues**
   - Mitigation: Comprehensive testing, staging environment validation

## Success Criteria

### Functional Requirements
- [ ] All purchase operations work with simplified workflow
- [ ] Sales operations support bill numbers and discounts
- [ ] Inventory tracking with batch support
- [ ] User authentication and authorization
- [ ] Data integrity maintained

### Non-Functional Requirements
- [ ] API response times < 200ms for CRUD operations
- [ ] System supports 2 concurrent users without issues
- [ ] Database queries optimized (< 100ms for simple queries)
- [ ] Zero data loss during migration
- [ ] 99.9% system uptime after deployment

### Quality Requirements
- [ ] 90%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] All linting rules pass
- [ ] Code review approval for all changes
- [ ] Documentation updated and accurate

## Progress Tracking

Progress will be tracked in `DATABASE_REFACTOR_PROGRESS.md` with:
- Daily task updates
- Blockers and resolutions
- Test results and coverage metrics
- Performance benchmarks
- Deployment milestones

## Next Steps

1. **Immediate**: Create progress tracking file
2. **Immediate**: Set up Claude Code slash command
3. **Day 1**: Start Phase 1 - Model refactoring
4. **Day 2**: Create database migration scripts
5. **Day 3**: Update repository layer

The implementation will be incremental with continuous testing and validation at each step.