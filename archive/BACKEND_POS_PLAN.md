# Backend POS System Extension Plan

## Overview
The existing Go backend has comprehensive inventory management but lacks Point of Sale (POS) functionality. This plan outlines the backend extensions needed to support a complete POS system for the hardware store.

**Note**: Frontend-requested missing APIs are tracked in `REQUESTED_APIS.md` and should be prioritized during development.

## Current Backend Status
- ✅ Product management with categories, brands, and inventory
- ✅ Customer management with codes and credit limits
- ✅ User authentication and role-based access control
- ✅ Purchase receipts and supplier management
- ✅ Audit logging and reporting
- ❌ Sales transactions and POS functionality

## Required Backend Extensions

### Phase 1: Sales Transaction Models
**Duration**: Week 7
**Status**: PENDING

#### New Database Models Required:

```go
// Sale represents a sales transaction
type Sale struct {
    ID              uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    SaleNumber      string          `gorm:"uniqueIndex;not null;size:50"`
    CustomerID      *uuid.UUID      `gorm:"type:uuid;index"`
    Customer        *Customer       `gorm:"foreignKey:CustomerID"`
    CashierID       uuid.UUID       `gorm:"type:uuid;not null;index"`
    Cashier         User            `gorm:"foreignKey:CashierID"`
    SaleDate        time.Time       `gorm:"not null"`
    
    // Financial totals
    SubTotal        float64         `gorm:"type:decimal(15,2);not null"`
    TaxAmount       float64         `gorm:"type:decimal(15,2);not null;default:0.00"`
    TaxRate         float64         `gorm:"type:decimal(5,2);not null;default:0.00"`
    DiscountAmount  float64         `gorm:"type:decimal(10,2);not null;default:0.00"`
    TotalAmount     float64         `gorm:"type:decimal(15,2);not null"`
    
    // Payment status
    Status          SaleStatus      `gorm:"type:varchar(20);not null;default:'pending'"`
    PaymentStatus   PaymentStatus   `gorm:"type:varchar(20);not null;default:'pending'"`
    
    Notes           string          `gorm:"size:500"`
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       gorm.DeletedAt  `gorm:"index"`
    
    Items           []SaleItem      `gorm:"foreignKey:SaleID"`
    Payments        []Payment       `gorm:"foreignKey:SaleID"`
}

// SaleItem represents an item in a sale
type SaleItem struct {
    ID              uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    SaleID          uuid.UUID       `gorm:"type:uuid;not null;index"`
    Sale            Sale            `gorm:"foreignKey:SaleID"`
    ProductID       uuid.UUID       `gorm:"type:uuid;not null;index"`
    Product         Product         `gorm:"foreignKey:ProductID"`
    
    Quantity        int             `gorm:"not null"`
    UnitPrice       float64         `gorm:"type:decimal(10,2);not null"`
    DiscountAmount  float64         `gorm:"type:decimal(10,2);not null;default:0.00"`
    TaxAmount       float64         `gorm:"type:decimal(10,2);not null;default:0.00"`
    TotalPrice      float64         `gorm:"type:decimal(15,2);not null"`
    
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       gorm.DeletedAt  `gorm:"index"`
}

// Payment represents a payment for a sale
type Payment struct {
    ID              uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
    SaleID          uuid.UUID       `gorm:"type:uuid;not null;index"`
    Sale            Sale            `gorm:"foreignKey:SaleID"`
    
    Method          PaymentMethod   `gorm:"type:varchar(20);not null"`
    Amount          float64         `gorm:"type:decimal(15,2);not null"`
    Reference       string          `gorm:"size:100"`
    Notes           string          `gorm:"size:500"`
    
    CreatedAt       time.Time
    UpdatedAt       time.Time
    DeletedAt       gorm.DeletedAt  `gorm:"index"`
}
```

#### Enums and Constants:
```go
type SaleStatus string
const (
    SaleStatusPending   SaleStatus = "pending"
    SaleStatusCompleted SaleStatus = "completed" 
    SaleStatusCancelled SaleStatus = "cancelled"
    SaleStatusRefunded  SaleStatus = "refunded"
)

type PaymentStatus string
const (
    PaymentStatusPending   PaymentStatus = "pending"
    PaymentStatusPaid      PaymentStatus = "paid"
    PaymentStatusPartial   PaymentStatus = "partial"
    PaymentStatusRefunded  PaymentStatus = "refunded"
)

type PaymentMethod string
const (
    PaymentMethodCash       PaymentMethod = "cash"
    PaymentMethodCard       PaymentMethod = "card"
    PaymentMethodBank       PaymentMethod = "bank_transfer"
    PaymentMethodEWallet    PaymentMethod = "ewallet"
    PaymentMethodCheck      PaymentMethod = "check"
)
```

#### Tasks:
1. Create sale, sale_item, and payment models
2. Add database migrations for new tables
3. Update repository layer with new interfaces
4. Add model validation and relationships

---

### Phase 2: POS Business Logic Services
**Duration**: Week 7-8
**Status**: PENDING

#### New Services Required:

1. **SaleService** (`internal/business/sale/`)
   - CreateSale(items, customer, cashier) - Create new sale transaction
   - GetSales(filters) - List sales with pagination and filtering
   - GetSale(id) - Get sale details with items and payments
   - UpdateSale(id, updates) - Update sale information
   - CancelSale(id) - Cancel pending sale
   - ProcessRefund(id, items) - Process partial/full refunds

2. **PaymentService** (`internal/business/payment/`)
   - AddPayment(saleID, method, amount) - Add payment to sale
   - GetPayments(saleID) - Get all payments for a sale
   - ProcessRefund(paymentID, amount) - Refund payment

3. **POSService** (`internal/business/pos/`)
   - SearchProducts(query, barcode) - Product search for POS
   - ValidateStock(items) - Check stock availability
   - CalculatePrice(items, customer) - Calculate totals with discounts/tax
   - ProcessSale(cart, payments) - Complete sale transaction
   - GenerateReceipt(saleID) - Generate receipt data

#### Tasks:
1. Implement SaleService with full CRUD operations
2. Implement PaymentService for payment processing
3. Implement POSService for point-of-sale operations
4. Add inventory updates when sales are completed
5. Add audit logging for all sale operations

---

### Phase 3: POS API Endpoints
**Duration**: Week 8
**Status**: PENDING

#### New API Handler: `pos_handler.go`

**POS Operations:**
```
POST   /api/v1/pos/search-products     # Search products for POS
POST   /api/v1/pos/validate-cart       # Validate cart items and stock
POST   /api/v1/pos/calculate           # Calculate totals for cart
POST   /api/v1/pos/process-sale        # Process complete sale transaction
GET    /api/v1/pos/recent-sales        # Get recent sales for current user
```

**Sales Management:**
```
GET    /api/v1/sales                   # List sales with filtering
POST   /api/v1/sales                   # Create new sale
GET    /api/v1/sales/:id               # Get sale details
PUT    /api/v1/sales/:id               # Update sale
DELETE /api/v1/sales/:id               # Cancel sale
POST   /api/v1/sales/:id/refund        # Process refund
```

**Sale Items:**
```
GET    /api/v1/sales/:id/items         # Get sale items
POST   /api/v1/sales/:id/items         # Add item to sale
PUT    /api/v1/sales/:id/items/:item_id # Update sale item
DELETE /api/v1/sales/:id/items/:item_id # Remove sale item
```

**Payments:**
```
GET    /api/v1/sales/:id/payments      # Get sale payments
POST   /api/v1/sales/:id/payments      # Add payment
PUT    /api/v1/payments/:id            # Update payment
POST   /api/v1/payments/:id/refund     # Refund payment
```

#### Tasks:
1. Create POS handler with search and calculation endpoints
2. Create Sales handler with full CRUD operations
3. Create Payments handler for payment management
4. Add proper authentication and authorization
5. Add input validation and error handling

---

### Phase 4: POS Analytics & Reporting
**Duration**: Week 8-9
**Status**: PENDING

#### New Analytics Endpoints:

**Sales Reports:**
```
GET    /api/v1/reports/sales/daily      # Daily sales report
GET    /api/v1/reports/sales/monthly    # Monthly sales report
GET    /api/v1/reports/sales/period     # Custom period sales report
GET    /api/v1/reports/top-products     # Best selling products
GET    /api/v1/reports/customer-sales   # Customer purchase history
```

**POS Dashboard:**
```
GET    /api/v1/pos/dashboard            # POS dashboard data
GET    /api/v1/pos/daily-summary        # Today's sales summary
GET    /api/v1/pos/shift-summary        # Current user's shift summary
```

#### New Analytics Service:
1. **SalesAnalyticsService** (`internal/business/analytics/`)
   - GetDailySales(date) - Daily sales statistics
   - GetMonthlySales(month, year) - Monthly sales statistics
   - GetTopProducts(period) - Best selling products
   - GetCustomerSales(customerID, period) - Customer purchase history
   - GetCashierPerformance(cashierID, period) - Cashier sales performance

#### Tasks:
1. Implement SalesAnalyticsService
2. Create analytics API endpoints
3. Add caching for frequently accessed reports
4. Add export functionality for reports

---

### Phase 5: Integration & Testing
**Duration**: Week 9
**Status**: PENDING

#### Integration Tasks:
1. **Inventory Integration**
   - Update inventory when sales are completed
   - Reserve stock during sale creation
   - Release reserved stock on sale cancellation
   - Handle stock shortages gracefully

2. **Customer Integration**
   - Apply customer discounts automatically
   - Update customer credit limits
   - Track customer purchase history
   - Handle walk-in customers (no customer record)

3. **Audit Integration**
   - Log all sale operations
   - Track inventory changes from sales
   - Monitor payment processing
   - Generate audit trails for refunds

#### Testing Tasks:
1. Unit tests for all new services
2. Integration tests for POS workflows
3. API endpoint testing
4. Performance testing for high-volume sales
5. Concurrent transaction handling tests

---

### Phase 6: Advanced POS Features
**Duration**: Week 10 (Optional)
**Status**: PENDING

#### Advanced Features:
1. **Discounts & Promotions**
   - Percentage and fixed amount discounts
   - Buy X Get Y promotions
   - Customer-specific pricing
   - Bulk purchase discounts

2. **Receipt Management**
   - Thermal printer integration
   - PDF receipt generation
   - Email receipt sending
   - Receipt reprinting

3. **Shift Management**
   - Cashier shift tracking
   - Till reconciliation
   - Cash drawer management
   - End-of-day reporting

4. **Barcode Integration**
   - Barcode scanning support
   - Product lookup by barcode
   - Generate barcodes for products
   - Barcode printer integration

#### Tasks:
1. Implement discount calculation engine
2. Add receipt generation and printing
3. Create shift management system
4. Integrate barcode scanning functionality

---

## Database Migration Strategy

### Migration Files Required:
1. `001_add_sales_tables.up.sql` - Create sales, sale_items, payments tables
2. `002_add_sales_indexes.up.sql` - Add performance indexes
3. `003_add_sales_constraints.up.sql` - Add foreign key constraints
4. `004_add_sales_triggers.up.sql` - Add audit triggers

### Seed Data:
1. Sample payment methods configuration
2. Default tax rates
3. Sample sales transactions for testing

## Security Considerations

### Access Control:
- **Staff+**: Can process sales, view own sales
- **Manager+**: Can view all sales, process refunds
- **Admin**: Full access to all POS functions

### Data Protection:
- Encrypt payment references
- Log all sensitive operations
- Secure payment processing
- PCI compliance considerations

## Performance Considerations

### Optimization Strategies:
1. Index frequently queried fields (sale_date, customer_id, cashier_id)
2. Cache product prices and inventory levels
3. Batch inventory updates for performance
4. Implement connection pooling for high concurrency
5. Add database read replicas for reporting

### Monitoring:
1. Track sale processing times
2. Monitor inventory update performance
3. Alert on failed transactions
4. Monitor payment processing success rates

This plan provides a comprehensive roadmap for extending the existing backend to support full POS functionality while maintaining the current architecture and coding standards.