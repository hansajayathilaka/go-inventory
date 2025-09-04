# Minimal Database Design Specification

## Design Philosophy

This database design follows the **"Essential Fields Only"** principle for a small shop operation:
- **2-person team** - No complex approval workflows
- **Transaction-based** - All pricing/supplier data stored in transaction records  
- **Minimal maintenance** - Fewer tables and fields to manage
- **SQLite-based** - Single file database for easy deployment and backup
- **Immediate visibility** - Instant profit calculation and bill lookup

## Database Technology: SQLite

**Why SQLite?**
- **Single file** - Easy backup, deployment, and portability
- **No server required** - Embedded database, perfect for small applications
- **ACID compliant** - Full transaction support
- **Cross-platform** - Works on any operating system
- **Minimal maintenance** - No database administration needed
- **Perfect for 2-person shop** - Handles concurrent operations efficiently

**SQLite-Specific Considerations**:
- **UUIDs**: Stored as TEXT (36-character strings) instead of native UUID type
- **Financial decimals**: Stored as REAL with application-level precision handling
- **JSON data**: Stored as TEXT instead of JSONB
- **Timestamps**: Using DATETIME instead of TIMESTAMP WITH TIME ZONE
- **VARCHAR**: All text types use TEXT (SQLite stores all text as TEXT anyway)
- **Foreign keys**: Enabled by default with PRAGMA foreign_keys=ON
- **WAL mode**: Write-Ahead Logging for better concurrent performance

**SQLite Data Type Mapping**:
```
PostgreSQL → SQLite
UUID → TEXT
VARCHAR(n) → TEXT
DECIMAL(p,s) → REAL
TIMESTAMP → DATETIME
JSONB → TEXT
SERIAL → INTEGER PRIMARY KEY AUTOINCREMENT
```

## Core Tables

### 1. USERS (Keep Existing - SQLite Compatible)
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,  -- UUID as TEXT
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    last_login DATETIME
);
```
**Roles**: admin, manager, staff, viewer

### 2. CATEGORIES (SQLite Compatible)
```sql
CREATE TABLE categories (
    id TEXT PRIMARY KEY,  -- UUID as TEXT
    name TEXT NOT NULL,
    description TEXT,
    parent_id TEXT REFERENCES categories(id),
    level INTEGER NOT NULL DEFAULT 1,
    path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);
```

### 3. BRANDS (Keep Existing)
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    country_code VARCHAR(2),
    logo_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 4. SUPPLIERS (Keep Existing)
```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    contact_name VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 5. CUSTOMERS (Keep Existing)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_number VARCHAR(50),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 6. PRODUCTS (Simplified)
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    barcode VARCHAR(100),
    weight DECIMAL(10,3),
    dimensions VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 7. INVENTORY (Enhanced)
```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    max_level INTEGER DEFAULT 0,
    average_cost DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 8. STOCK_BATCHES (New)
```sql
CREATE TABLE stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    manufacture_date DATE,
    expiry_date DATE,
    received_date DATE,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 9. STOCK_MOVEMENTS (Enhanced)
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID REFERENCES stock_batches(id),
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id VARCHAR(100),
    reference_type VARCHAR(50),
    user_id UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```
**Movement Types**: IN, OUT, ADJUSTMENT, SALE, RETURN, DAMAGE, TRANSFER

### 10. PURCHASE_RECEIPTS (Simplified)
```sql
CREATE TABLE purchase_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    purchase_date TIMESTAMP NOT NULL,
    supplier_bill_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    bill_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    bill_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```
**Status Values**: pending, received, completed, cancelled

### 11. PURCHASE_RECEIPT_ITEMS (Simplified)
```sql
CREATE TABLE purchase_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_receipt_id UUID NOT NULL REFERENCES purchase_receipts(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL,
    item_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    item_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 12. SALES (New)
```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    cashier_id UUID NOT NULL REFERENCES users(id),
    sale_date TIMESTAMP NOT NULL,
    bill_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    bill_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 13. SALE_ITEMS (New)
```sql
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    product_id UUID NOT NULL REFERENCES products(id),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL,
    item_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    item_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    line_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### 14. PAYMENTS (New)
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id),
    method VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```
**Payment Methods**: cash, card, bank_transfer, ewallet, check

### 15. AUDIT_LOGS (Keep Existing)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_table VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Actions**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT

## Key Indexes

### Performance Indexes
```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Product searches
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category_id ON products(category_id);

-- Inventory tracking
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_batch_id ON stock_movements(batch_id);

-- Purchase management
CREATE INDEX idx_purchase_receipts_supplier_id ON purchase_receipts(supplier_id);
CREATE INDEX idx_purchase_receipts_purchase_date ON purchase_receipts(purchase_date);
CREATE INDEX idx_purchase_receipt_items_purchase_receipt_id ON purchase_receipt_items(purchase_receipt_id);

-- Sales management  
CREATE INDEX idx_sales_bill_number ON sales(bill_number);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_payments_sale_id ON payments(sale_id);

-- Audit tracking
CREATE INDEX idx_audit_logs_table_record ON audit_logs(audit_table, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

## Business Rules

### Data Validation Rules
1. **Unique Constraints**: SKU, receipt numbers, bill numbers, user emails
2. **Required Fields**: All non-nullable fields must have values
3. **Positive Values**: Quantities, prices, costs must be >= 0
4. **Date Constraints**: Purchase/sale dates cannot be in future
5. **Discount Limits**: Discount percentages must be 0-100%

### Business Logic Rules
1. **Stock Management**: Available quantity = Total quantity - Reserved quantity
2. **Profit Calculation**: Profit = (Unit price - Unit cost) × Quantity
3. **Discount Application**: Item discounts applied before bill discounts
4. **Batch Tracking**: FIFO cost calculation using batch cost prices
5. **Inventory Updates**: Stock movements automatically update inventory totals

### Security Rules
1. **Role-based Access**: Different permissions per user role
2. **Audit Logging**: All CUD operations logged with user attribution
3. **Soft Deletes**: Most tables use soft delete (deleted_at) for data preservation
4. **Password Security**: Passwords hashed using bcrypt with salt

## Data Relationships

### Primary Relationships
- Products → Categories (many-to-one)
- Products → Brands (many-to-one) 
- Inventory → Products (one-to-one)
- Stock Batches → Products (many-to-one)
- Purchase Receipts → Suppliers (many-to-one)
- Sales → Customers (many-to-one, optional)
- All transactions → Users (many-to-one for created_by/cashier)

### Transaction Relationships
- Purchase Receipts → Purchase Receipt Items (one-to-many)
- Sales → Sale Items (one-to-many)
- Sales → Payments (one-to-many)
- Stock Movements → Stock Batches (many-to-one, optional)

## Key Features Supported

### ✅ Essential Features
1. **Multiple pricing** - Stored per transaction in sale items
2. **Multi-supplier support** - Historical data in purchase receipts
3. **Batch tracking** - Stock batches with separate cost tracking
4. **Bill number lookup** - Unique bill numbers for instant sale retrieval
5. **Multi-level discounts** - Item-level and bill-level discounts
6. **Cost tracking** - Unit costs in sale items for profit calculation
7. **Simple P&L** - Revenue from sales, costs from purchase data

### 🎯 Business Operations
1. **Purchase Management**: Create receipts, track supplier bills, apply discounts
2. **Sales Management**: Process sales, apply discounts, track payments
3. **Inventory Control**: Batch tracking, FIFO/LIFO costing, movement history
4. **Financial Reporting**: Profit per item, revenue summaries, cost analysis
5. **User Management**: Role-based access, audit trails, secure authentication

This design provides **maximum functionality with minimum complexity** - perfect for a small shop operation that needs professional-grade inventory and POS capabilities.