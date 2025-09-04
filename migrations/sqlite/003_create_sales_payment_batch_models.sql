-- Migration: Create Sales, Payment, and Batch Tracking Models
-- Description: Creates the missing models for sales management and batch inventory tracking
-- Date: 2024-01-04
-- Author: Database Refactor Task 1.4

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    cashier_id TEXT NOT NULL REFERENCES users(id),
    sale_date TIMESTAMP NOT NULL,
    bill_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    bill_discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create sale_items table  
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id),
    product_id TEXT NOT NULL REFERENCES products(id),
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

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id),
    method VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create stock_batches table  
CREATE TABLE IF NOT EXISTS stock_batches (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    supplier_id TEXT REFERENCES suppliers(id),
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

-- Add batch tracking to stock_movements table
ALTER TABLE stock_movements ADD COLUMN batch_id TEXT REFERENCES stock_batches(id);
ALTER TABLE stock_movements ADD COLUMN reference_type VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_bill_number ON sales(bill_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_at ON sales(deleted_at);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_deleted_at ON sale_items(deleted_at);

CREATE INDEX IF NOT EXISTS idx_payments_sale_id ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_stock_batches_product_id ON stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_supplier_id ON stock_batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_batch_number ON stock_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_stock_batches_is_active ON stock_batches(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_batches_deleted_at ON stock_batches(deleted_at);

CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference_type ON stock_movements(reference_type);

-- Add constraints for data integrity
-- Payment methods validation (done at application level with enum)
-- Discount percentage constraints (0-100%)
-- Quantity must be positive for sales
-- Available quantity <= total quantity for batches

PRAGMA foreign_keys = ON;