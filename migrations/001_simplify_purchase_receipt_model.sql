-- Migration: 001_simplify_purchase_receipt_model.sql
-- Date: 2024-01-05
-- Description: Simplify purchase receipt model by removing approval workflow and complex fields

-- =============================================
-- PURCHASE RECEIPTS TABLE MODIFICATIONS
-- =============================================

-- Drop foreign key constraints related to approval workflow
PRAGMA foreign_keys=off;

-- Create new simplified purchase_receipts table
CREATE TABLE purchase_receipts_new (
    id TEXT PRIMARY KEY,
    receipt_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    purchase_date DATETIME NOT NULL,
    supplier_bill_number TEXT,
    bill_discount_amount REAL NOT NULL DEFAULT 0.00,
    bill_discount_percentage REAL NOT NULL DEFAULT 0.00,
    total_amount REAL NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Create index on deleted_at for soft delete functionality
CREATE INDEX idx_purchase_receipts_new_deleted_at ON purchase_receipts_new(deleted_at);
CREATE INDEX idx_purchase_receipts_new_supplier_id ON purchase_receipts_new(supplier_id);
CREATE INDEX idx_purchase_receipts_new_created_by_id ON purchase_receipts_new(created_by_id);

-- Copy data from old table to new table with field mapping
INSERT INTO purchase_receipts_new (
    id,
    receipt_number,
    supplier_id,
    status,
    purchase_date,
    supplier_bill_number,
    bill_discount_amount,
    bill_discount_percentage,
    total_amount,
    notes,
    created_by_id,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    receipt_number,
    supplier_id,
    CASE 
        WHEN status IN ('draft', 'pending', 'approved', 'ordered') THEN 'pending'
        WHEN status = 'received' THEN 'received'
        WHEN status = 'partial' THEN 'received'
        WHEN status = 'completed' THEN 'completed'
        WHEN status = 'cancelled' THEN 'cancelled'
        ELSE 'pending'
    END,
    order_date,                    -- Renamed to purchase_date
    '',                            -- supplier_bill_number (new field, empty for now)
    COALESCE(discount_amount, 0),  -- bill_discount_amount (from discount_amount)
    0,                             -- bill_discount_percentage (new field)
    total_amount,
    order_notes,                   -- Use order_notes as general notes
    created_by_id,
    created_at,
    updated_at,
    deleted_at
FROM purchase_receipts
WHERE purchase_receipts.id IS NOT NULL;

-- Drop old table and rename new table
DROP TABLE purchase_receipts;
ALTER TABLE purchase_receipts_new RENAME TO purchase_receipts;

-- =============================================
-- PURCHASE RECEIPT ITEMS TABLE MODIFICATIONS
-- =============================================

-- Create new simplified purchase_receipt_items table
CREATE TABLE purchase_receipt_items_new (
    id TEXT PRIMARY KEY,
    purchase_receipt_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost REAL NOT NULL DEFAULT 0.00,
    item_discount_amount REAL NOT NULL DEFAULT 0.00,
    item_discount_percentage REAL NOT NULL DEFAULT 0.00,
    line_total REAL NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    FOREIGN KEY (purchase_receipt_id) REFERENCES purchase_receipts(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes
CREATE INDEX idx_purchase_receipt_items_new_deleted_at ON purchase_receipt_items_new(deleted_at);
CREATE INDEX idx_purchase_receipt_items_new_receipt_id ON purchase_receipt_items_new(purchase_receipt_id);
CREATE INDEX idx_purchase_receipt_items_new_product_id ON purchase_receipt_items_new(product_id);

-- Copy data from old table to new table with field mapping
INSERT INTO purchase_receipt_items_new (
    id,
    purchase_receipt_id,
    product_id,
    quantity,
    unit_cost,
    item_discount_amount,
    item_discount_percentage,
    line_total,
    created_at,
    updated_at,
    deleted_at
)
SELECT 
    id,
    purchase_receipt_id,
    product_id,
    ordered_quantity,                         -- Renamed to quantity
    unit_price,                              -- Renamed to unit_cost
    COALESCE(discount_amount, 0),            -- item_discount_amount (from discount_amount)
    0,                                       -- item_discount_percentage (new field)
    COALESCE(total_price, unit_price * ordered_quantity), -- Calculate line_total
    created_at,
    updated_at,
    deleted_at
FROM purchase_receipt_items
WHERE purchase_receipt_items.id IS NOT NULL;

-- Drop old table and rename new table
DROP TABLE purchase_receipt_items;
ALTER TABLE purchase_receipt_items_new RENAME TO purchase_receipt_items;

-- Turn foreign keys back on
PRAGMA foreign_keys=on;

-- =============================================
-- DATA VALIDATION
-- =============================================

-- Update any NULL values that might cause issues
UPDATE purchase_receipts SET 
    bill_discount_amount = 0 WHERE bill_discount_amount IS NULL;
UPDATE purchase_receipts SET 
    bill_discount_percentage = 0 WHERE bill_discount_percentage IS NULL;

UPDATE purchase_receipt_items SET 
    item_discount_amount = 0 WHERE item_discount_amount IS NULL;
UPDATE purchase_receipt_items SET 
    item_discount_percentage = 0 WHERE item_discount_percentage IS NULL;
UPDATE purchase_receipt_items SET 
    line_total = unit_cost * quantity WHERE line_total IS NULL OR line_total = 0;