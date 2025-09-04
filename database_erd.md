# Hardware Store Inventory Management System - Entity Relationship Diagram

```mermaid
erDiagram
    %% Core User Management
    USERS {
        uuid id PK
        string username UK
        string email UK
        string password_hash
        enum role "admin,manager,staff,viewer"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
        timestamp last_login
    }

    %% Product Hierarchy
    CATEGORIES {
        uuid id PK
        string name
        string description
        uuid parent_id FK
        int level
        string path
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    BRANDS {
        uuid id PK
        string name
        string code UK
        string description
        string website
        string country_code
        string logo_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    SUPPLIERS {
        uuid id PK
        string name
        string code UK
        string email
        string phone
        string address
        string contact_name
        string notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    PRODUCTS {
        uuid id PK
        string sku UK
        string name
        string description
        uuid category_id FK
        uuid brand_id FK
        string barcode
        decimal weight
        string dimensions
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }


    %% Advanced Inventory Management
    INVENTORY {
        uuid id PK
        uuid product_id UK,FK
        int total_quantity
        int available_quantity
        int reserved_quantity
        int reorder_level
        int max_level
        decimal average_cost
        timestamp last_updated
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% Stock Batch/Lot Tracking
    STOCK_BATCHES {
        uuid id PK
        uuid product_id FK
        string batch_number
        string lot_number
        uuid supplier_id FK
        int quantity
        int available_quantity
        decimal cost_price
        timestamp manufacture_date
        timestamp expiry_date
        timestamp received_date
        string notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        uuid batch_id FK
        enum movement_type "IN,OUT,ADJUSTMENT,SALE,RETURN,DAMAGE,TRANSFER"
        int quantity
        string reference_id
        string reference_type
        uuid user_id FK
        string notes
        decimal unit_cost
        decimal total_cost
        timestamp created_at
        timestamp deleted_at
    }

    %% Audit System
    AUDIT_LOGS {
        uuid id PK
        string audit_table
        string record_id
        enum action "CREATE,UPDATE,DELETE,LOGIN,LOGOUT"
        jsonb old_values
        jsonb new_values
        uuid user_id FK
        string ip_address
        string user_agent
        timestamp timestamp
    }

    %% Customer Management
    CUSTOMERS {
        uuid id PK
        string name
        string code UK
        string email
        string phone
        string address
        string city
        string state
        string postal_code
        string country
        string tax_number
        decimal credit_limit
        string notes
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }


    %% Minimal Purchase Management
    PURCHASE_RECEIPTS {
        uuid id PK
        string receipt_number UK
        uuid supplier_id FK
        timestamp purchase_date
        string supplier_bill_number
        enum status "pending,received,completed,cancelled"
        decimal bill_discount_amount
        decimal bill_discount_percentage
        decimal total_amount
        string notes
        uuid created_by_id FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    PURCHASE_RECEIPT_ITEMS {
        uuid id PK
        uuid purchase_receipt_id FK
        uuid product_id FK
        decimal unit_cost
        int quantity
        decimal item_discount_amount
        decimal item_discount_percentage
        decimal line_total
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% Minimal Point of Sale System
    SALES {
        uuid id PK
        string bill_number UK
        uuid customer_id FK
        uuid cashier_id FK
        timestamp sale_date
        decimal bill_discount_amount
        decimal bill_discount_percentage
        decimal total_amount
        string notes
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    SALE_ITEMS {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        decimal unit_price
        decimal unit_cost
        int quantity
        decimal item_discount_amount
        decimal item_discount_percentage
        decimal line_total
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    PAYMENTS {
        uuid id PK
        uuid sale_id FK
        enum method "cash,card,bank_transfer,ewallet,check"
        decimal amount
        string reference
        string notes
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }


    %% Relationships
    
    %% Category Hierarchy (Self-referencing)
    CATEGORIES ||--o{ CATEGORIES : "parent-child"
    
    %% Product Relationships
    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    
    %% Advanced Inventory Relationships
    PRODUCTS ||--|| INVENTORY : "tracks"
    PRODUCTS ||--o{ STOCK_BATCHES : "batched_in"
    SUPPLIERS ||--o{ STOCK_BATCHES : "supplied_batches"
    STOCK_BATCHES ||--o{ STOCK_MOVEMENTS : "batch_movements"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moves"
    USERS ||--o{ STOCK_MOVEMENTS : "performs"
    
    %% Simplified Purchase Management
    SUPPLIERS ||--o{ PURCHASE_RECEIPTS : "supplies_to"
    USERS ||--o{ PURCHASE_RECEIPTS : "creates"
    PURCHASE_RECEIPTS ||--o{ PURCHASE_RECEIPT_ITEMS : "contains"
    PRODUCTS ||--o{ PURCHASE_RECEIPT_ITEMS : "ordered"
    
    %% Enhanced Point of Sale System
    CUSTOMERS ||--o{ SALES : "purchases"
    USERS ||--o{ SALES : "processes"
    SALES ||--o{ SALE_ITEMS : "contains"
    PRODUCTS ||--o{ SALE_ITEMS : "sold"
    STOCK_BATCHES ||--o{ SALE_ITEMS : "sold_from_batch"
    SALES ||--o{ PAYMENTS : "paid_by"
    
    %% Audit Trail
    USERS ||--o{ AUDIT_LOGS : "performs_actions"
```

## Key Relationships Summary

### **Simplified Product Management**
- Categories have hierarchical parent-child relationships
- Products belong to categories and brands
- Each product has exactly one inventory record with average cost tracking

### **Batch-Level Stock Management** 
- **Stock Batches** track individual lots with expiry dates and cost prices
- **Stock Movements** link to specific batches for granular tracking
- Inventory maintains totals while batches track individual stock lots
- FIFO/LIFO cost calculation supported through batch tracking

### **Transaction-Based Pricing System**
- **Purchase Receipt Items** store supplier-specific data (SKU, cost, pricing suggestions)
- **Sale Items** store all pricing data (retail/wholesale/custom prices) 
- Historical pricing automatically preserved in transaction records
- No separate pricing tables - everything in transaction context

### **Minimal Purchase Workflow**
- **Purchase Receipts** with essential fields only:
  - Purchase date, supplier, and supplier bill number
  - Status tracking (pending, received, completed, cancelled)
  - Bill discount (amount or percentage) for the entire purchase
  - Total amount and notes
- **Purchase Receipt Items** with minimal data:
  - Product, unit cost, quantity
  - Item-specific discount (amount or percentage)
  - Line total

### **Minimal Point of Sale System**
- **Sales** with essential fields only:
  - Unique bill numbers for easy lookup
  - Sale date, customer, and cashier
  - Bill discount (amount or percentage) for the entire sale
  - Total amount and notes
- **Sale Items** with minimal data:
  - Product, unit price, unit cost, quantity
  - Item-specific discount (amount or percentage)
  - Line total for immediate profit calculation

### **Audit & Security**
- All user actions are logged in audit_logs
- Role-based access control through user roles
- Soft deletes preserve data history

### **Business Logic Constraints**
- UUID primary keys throughout for distributed systems
- Unique constraints on codes/SKUs for business identification  
- Decimal precision for financial calculations
- Timestamps for audit trails and soft deletes
- Boolean flags for active/inactive states

### **Core Features Implemented**
- ✅ **Purchase management** - Date, supplier, supplier bill number, status tracking
- ✅ **Sale management** - Bill numbers for instant lookup, customer tracking
- ✅ **Multi-level discounts** - Both item-level and bill-level discounts (amount or percentage)
- ✅ **Cost tracking** - Unit costs in sale items for immediate profit calculation
- ✅ **Batch tracking** - Stock batches for separate inventory management
- ✅ **Simple P&L calculation** - Revenue from sales, costs from purchase/sale data

### **Minimal Design Benefits**
- **Ultra-simple structure** - Only essential fields, no unnecessary complexity
- **Flexible discounts** - Both item and bill level, amount or percentage
- **Instant profit** - Cost vs price visible in every sale item
- **Easy queries** - Minimal joins, straightforward data access
- **Quick implementation** - Fewer fields to validate and manage

### **Supported Business Operations**
- Purchase tracking with supplier bill references
- Sale tracking with unique bill numbers for instant lookup
- Flexible discount application (per item or entire bill)
- Immediate profit calculation (unit_price - unit_cost) × quantity
- Batch-level inventory management
- Simple P&L: Sum(sale_line_totals) - Sum(purchase_line_totals)

This ERD represents a **minimal but complete inventory and POS system** that:
- Contains only the essential fields you actually need
- Supports flexible discount strategies
- Provides immediate profit visibility
- Requires minimal setup and maintenance