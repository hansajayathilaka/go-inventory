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
- Step 4.4: Create vehicle management UI
- Step 4.5: Create GRN processing UI
- Step 4.6: Performance optimization

The command will automatically determine which step to execute next based on the progress tracking file.