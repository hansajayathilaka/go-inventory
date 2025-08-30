# Vehicle Spare Parts Shop Revamp - Next Step

Execute the next step in the vehicle spare parts shop backend revamp process.

## Usage
```
/next-step
```

## What it does
1. Reads the current progress from `REVAMP_PROGRESS.md`
2. Identifies the next pending step
3. Implements the step following existing code patterns
4. Updates the progress file with completion status
5. Commits the changes with descriptive commit message

## Implementation Steps Tracked

### Phase 1: Database Models & Repository Layer
- Step 1.1: Create Customer model and repository
- Step 1.2: Create Brand model and repository  
- Step 1.3: Create VehicleBrand model and repository
- Step 1.4: Create VehicleModel model and repository
- Step 1.5: Create PurchaseOrder model and repository
- Step 1.6: Create GRN model and repository
- Step 1.7: Create VehicleCompatibility model and repository
- Step 1.8: Extend Product model with brand_id field
- Step 1.9: Update database migration/seeding

### Phase 2: Business Logic Layer
- Step 2.1: Create CustomerService
- Step 2.2: Create BrandService
- Step 2.3: Create VehicleService (brands and models)
- Step 2.4: Create PurchaseService (PO and GRN)
- Step 2.5: Create CompatibilityService
- Step 2.6: Update ProductService for brand integration
- Step 2.7: Update InventoryService for GRN integration

### Phase 3: API Layer
- Step 3.1: Create Customer API endpoints and handlers
- Step 3.2: Create Brand API endpoints and handlers
- Step 3.3: Create VehicleBrand API endpoints and handlers
- Step 3.4: Create VehicleModel API endpoints and handlers
- Step 3.5: Create PurchaseOrder API endpoints and handlers
- Step 3.6: Create GRN API endpoints and handlers
- Step 3.7: Create VehicleCompatibility API endpoints and handlers
- Step 3.8: Update Product API with brand filtering
- Step 3.9: Update router with new endpoints
- Step 3.10: Update Swagger documentation

### Phase 4: Integration & Frontend Updates
- Step 4.1: Update React frontend types
- Step 4.2: Update product forms with brand selection
- Step 4.3: Create customer management UI
- Step 4.4: Create part brands management UI (CRUD)
- Step 4.5: Create vehicle brands management UI (CRUD)
- Step 4.6: Create vehicle models management UI (CRUD)
- Step 4.7: Create vehicle compatibility management UI
- Step 4.8: Create purchase order management UI
- Step 4.9: Create GRN processing UI
- Step 4.10: Performance optimization and testing

### Phase 5: Database Structure Simplification
- Step 5.1: Database Model Updates (Backend)
  - Step 5.1.1: Remove Location model and dependencies
  - Step 5.1.2: Update Inventory model to remove location_id field
  - Step 5.1.3: Update StockMovement model to remove location_id field
  - Step 5.1.4: Create unified PurchaseReceipt model
  - Step 5.1.5: Update database migration scripts
- Step 5.2: Backend API Updates
  - Step 5.2.1: Remove location-based API endpoints
  - Step 5.2.2: Create PurchaseReceipt API endpoints
  - Step 5.2.3: Update business logic layer
  - Step 5.2.4: Update Swagger documentation
- Step 5.3: Frontend Updates
  - Step 5.3.1: Remove location management UI
  - Step 5.3.2: Create PurchaseReceipt management UI
  - Step 5.3.3: Update inventory and stock management UI
  - Step 5.3.4: Update API service calls
- Step 5.4: Testing & Validation
  - Step 5.4.1: Update integration tests
  - Step 5.4.2: End-to-end testing

### Phase 6: Frontend Navigation & UI Optimization
- Step 6.1: Navigation & UI Analysis
  - Step 6.1.1: Analyze current navigation issues
  - Step 6.1.2: Document navigation restructure plan
- Step 6.2: Fix Broken Functionality
  - Step 6.2.1: Fix Purchase Receipts system
  - Step 6.2.2: Fix Admin (Users) management
  - Step 6.2.3: Fix Suppliers management
- Step 6.3: Navigation Restructuring
  - Step 6.3.1: Create unified Vehicle Management page
  - Step 6.3.2: Integrate compatibility as product attributes
- Step 6.4: UI/UX Improvements
  - Step 6.4.1: Simplify navigation menu structure
  - Step 6.4.2: Improve overall user experience
- Step 6.5: Testing & Documentation
  - Step 6.5.1: Comprehensive end-to-end testing
  - Step 6.5.2: Update documentation and commands

The command will automatically determine which step to execute next based on the progress tracking file.