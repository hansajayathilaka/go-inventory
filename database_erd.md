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
        uuid supplier_id FK
        uuid brand_id FK
        decimal cost_price
        decimal retail_price
        decimal wholesale_price
        string barcode
        decimal weight
        string dimensions
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% Inventory Management
    INVENTORY {
        uuid id PK
        uuid product_id UK,FK
        int quantity
        int reserved_quantity
        int reorder_level
        int max_level
        timestamp last_updated
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        enum movement_type "IN,OUT,ADJUSTMENT,SALE,RETURN,DAMAGE"
        int quantity
        string reference_id
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

    %% Vehicle Spare Parts Extension
    VEHICLE_BRANDS {
        uuid id PK
        string name
        string code UK
        string description
        string country_code
        string logo_url
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    VEHICLE_MODELS {
        uuid id PK
        string name
        string code UK
        uuid vehicle_brand_id FK
        string description
        int year_from
        int year_to
        string engine_size
        string fuel_type
        string transmission
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    VEHICLE_COMPATIBILITIES {
        uuid id PK
        uuid product_id FK
        uuid vehicle_model_id FK
        int year_from
        int year_to
        string notes
        boolean is_verified
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    %% Simplified Purchase Management
    PURCHASE_RECEIPTS {
        uuid id PK
        string receipt_number UK
        uuid supplier_id FK
        enum status "draft,ordered,received,completed,cancelled"
        timestamp order_date
        timestamp expected_date
        timestamp received_date
        string delivery_note
        string invoice_number
        timestamp invoice_date
        string vehicle_number
        string driver_name
        boolean quality_check
        string quality_notes
        decimal sub_total
        decimal tax_amount
        decimal tax_rate
        decimal shipping_cost
        decimal discount_amount
        decimal total_amount
        string currency
        string notes
        string terms
        string reference
        uuid created_by_id FK
        uuid approved_by_id FK
        timestamp approved_at
        uuid received_by_id FK
        uuid verified_by_id FK
        timestamp verified_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    PURCHASE_RECEIPT_ITEMS {
        uuid id PK
        uuid purchase_receipt_id FK
        uuid product_id FK
        int ordered_quantity
        int received_quantity
        int accepted_quantity
        int rejected_quantity
        int damaged_quantity
        decimal unit_price
        decimal total_price
        decimal discount_amount
        decimal tax_amount
        timestamp expiry_date
        string batch_number
        string serial_numbers
        string quality_status
        string quality_notes
        boolean stock_updated
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
    SUPPLIERS ||--o{ PRODUCTS : "supplies"
    BRANDS ||--o{ PRODUCTS : "manufactures"
    
    %% Inventory Relationships
    PRODUCTS ||--|| INVENTORY : "tracks"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moves"
    USERS ||--o{ STOCK_MOVEMENTS : "performs"
    
    %% Vehicle Compatibility
    VEHICLE_BRANDS ||--o{ VEHICLE_MODELS : "produces"
    PRODUCTS ||--o{ VEHICLE_COMPATIBILITIES : "compatible_with"
    VEHICLE_MODELS ||--o{ VEHICLE_COMPATIBILITIES : "fits"
    
    %% Simplified Purchase Management
    SUPPLIERS ||--o{ PURCHASE_RECEIPTS : "receives_orders"
    USERS ||--o{ PURCHASE_RECEIPTS : "creates"
    USERS ||--o{ PURCHASE_RECEIPTS : "approves"
    USERS ||--o{ PURCHASE_RECEIPTS : "receives"
    USERS ||--o{ PURCHASE_RECEIPTS : "verifies"
    PURCHASE_RECEIPTS ||--o{ PURCHASE_RECEIPT_ITEMS : "contains"
    PRODUCTS ||--o{ PURCHASE_RECEIPT_ITEMS : "ordered"
    
    %% Audit Trail
    USERS ||--o{ AUDIT_LOGS : "performs_actions"
```

## Key Relationships Summary

### **Core Product Management**
- Categories have hierarchical parent-child relationships
- Products belong to categories, suppliers, and brands
- Each product has exactly one inventory record

### **Simplified Stock Management** 
- Single-location inventory tracking per product
- Stock movements log all inventory changes with user attribution
- No location management complexity

### **Vehicle Compatibility**
- Vehicle brands contain multiple models
- Products can be compatible with multiple vehicle models
- Compatibility includes year ranges and verification status

### **Unified Purchase Workflow**
- **Purchase Receipts** combine ordering and receiving in one table
- Purchase Receipt Items track ordered vs received quantities
- Quality control and batch tracking at item level
- Single workflow from order to completion

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

### **Simplified Features**
- **Removed**: Multiple locations, separate PO/GRN tables, location-based stock tracking
- **Added**: Unified Purchase Receipts for simplified order-to-receipt workflow
- **Result**: Cleaner, single-location hardware store inventory system

This ERD represents a simplified hardware store inventory system perfect for single-location operations with vehicle spare parts specialization and streamlined purchase management.