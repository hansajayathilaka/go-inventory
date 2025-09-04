-- SQLite Schema Generated from GORM Models
-- Generated at: 

PRAGMA foreign_keys = ON;

CREATE TABLE `audit_logs` (`id` text,`audit_table` text NOT NULL,`record_id` text NOT NULL,`action` varchar(20) NOT NULL,`old_values` text,`new_values` text,`user_id` text NOT NULL,`ip_address` text,`user_agent` text,`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (`id`),CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`));

CREATE TABLE `brands` (`id` text,`name` text NOT NULL,`code` text NOT NULL,`description` text,`website` text,`country_code` text,`logo_url` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));

CREATE TABLE `categories` (`id` text,`name` text NOT NULL,`description` text,`parent_id` text,`level` integer NOT NULL DEFAULT 0,`path` text NOT NULL,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_categories_children` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`));

CREATE TABLE `customers` (`id` text,`name` text NOT NULL,`code` text NOT NULL,`email` text,`phone` text,`address` text,`city` text,`state` text,`postal_code` text,`country` text DEFAULT "Malaysia",`tax_number` text,`credit_limit` real DEFAULT 0,`notes` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));

CREATE TABLE `inventory` (`id` text,`product_id` text NOT NULL,`quantity` integer NOT NULL DEFAULT 0,`reserved_quantity` integer NOT NULL DEFAULT 0,`reorder_level` integer NOT NULL DEFAULT 0,`max_level` integer NOT NULL DEFAULT 0,`last_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_products_inventory` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`));

CREATE TABLE `products` (`id` text,`sku` text NOT NULL,`name` text NOT NULL,`description` text,`category_id` text NOT NULL,`supplier_id` text,`brand_id` text,`cost_price` real NOT NULL DEFAULT 0,`retail_price` real NOT NULL DEFAULT 0,`wholesale_price` real NOT NULL DEFAULT 0,`barcode` text,`weight` real,`dimensions` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`),CONSTRAINT `fk_categories_products` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),CONSTRAINT `fk_suppliers_products` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`));

CREATE TABLE `purchase_receipt_items` (`id` text,`purchase_receipt_id` text NOT NULL,`product_id` text NOT NULL,`ordered_quantity` integer NOT NULL DEFAULT 0,`unit_price` real NOT NULL DEFAULT 0,`total_price` real NOT NULL DEFAULT 0,`discount_amount` real NOT NULL DEFAULT 0,`tax_amount` real NOT NULL DEFAULT 0,`order_notes` text,`received_quantity` integer NOT NULL DEFAULT 0,`accepted_quantity` integer NOT NULL DEFAULT 0,`rejected_quantity` integer NOT NULL DEFAULT 0,`damaged_quantity` integer NOT NULL DEFAULT 0,`expiry_date` datetime,`batch_number` text,`serial_numbers` text,`quality_status` text NOT NULL DEFAULT "good",`quality_notes` text,`receipt_notes` text,`stock_updated` numeric NOT NULL DEFAULT false,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_purchase_receipt_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),CONSTRAINT `fk_purchase_receipts_items` FOREIGN KEY (`purchase_receipt_id`) REFERENCES `purchase_receipts`(`id`));

CREATE TABLE `purchase_receipts` (`id` text,`receipt_number` text NOT NULL,`supplier_id` text NOT NULL,`status` varchar(20) NOT NULL DEFAULT "draft",`order_date` datetime NOT NULL,`expected_date` datetime,`reference` text,`terms` text,`order_notes` text,`received_date` datetime,`delivery_date` datetime,`delivery_note` text,`invoice_number` text,`invoice_date` datetime,`vehicle_number` text,`driver_name` text,`quality_check` numeric NOT NULL DEFAULT false,`quality_notes` text,`receipt_notes` text,`sub_total` real NOT NULL DEFAULT 0,`tax_amount` real NOT NULL DEFAULT 0,`tax_rate` real NOT NULL DEFAULT 0,`shipping_cost` real NOT NULL DEFAULT 0,`discount_amount` real NOT NULL DEFAULT 0,`total_amount` real NOT NULL DEFAULT 0,`currency` text NOT NULL DEFAULT "MYR",`created_by_id` text NOT NULL,`approved_by_id` text,`approved_at` datetime,`received_by_id` text,`verified_by_id` text,`verified_at` datetime,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_purchase_receipts_approved_by` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_purchase_receipts_received_by` FOREIGN KEY (`received_by_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_purchase_receipts_verified_by` FOREIGN KEY (`verified_by_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_purchase_receipts_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),CONSTRAINT `fk_purchase_receipts_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`));

CREATE TABLE `stock_movements` (`id` text,`product_id` text NOT NULL,`movement_type` varchar(20) NOT NULL,`quantity` integer NOT NULL,`reference_id` text,`user_id` text NOT NULL,`notes` text,`unit_cost` real,`total_cost` real,`created_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_stock_movements_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),CONSTRAINT `fk_products_stock_movements` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`));

CREATE TABLE `suppliers` (`id` text,`name` text NOT NULL,`code` text NOT NULL,`email` text,`phone` text,`address` text,`contact_name` text,`notes` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));

CREATE TABLE `users` (`id` text,`username` text NOT NULL,`email` text NOT NULL,`password_hash` text NOT NULL,`role` varchar(20) NOT NULL DEFAULT "viewer",`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,`last_login` datetime,PRIMARY KEY (`id`));

CREATE TABLE `vehicle_brands` (`id` text,`name` text NOT NULL,`code` text NOT NULL,`description` text,`country_code` text,`logo_url` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`));

CREATE TABLE `vehicle_compatibilities` (`id` text,`product_id` text NOT NULL,`vehicle_model_id` text NOT NULL,`year_from` integer,`year_to` integer,`notes` text,`is_verified` numeric NOT NULL DEFAULT false,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_vehicle_compatibilities_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`),CONSTRAINT `fk_vehicle_compatibilities_vehicle_model` FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models`(`id`));

CREATE TABLE `vehicle_models` (`id` text,`name` text NOT NULL,`code` text NOT NULL,`vehicle_brand_id` text NOT NULL,`description` text,`year_from` integer NOT NULL,`year_to` integer,`engine_size` text,`fuel_type` text,`transmission` text,`is_active` numeric NOT NULL DEFAULT true,`created_at` datetime,`updated_at` datetime,`deleted_at` datetime,PRIMARY KEY (`id`),CONSTRAINT `fk_vehicle_brands_vehicle_models` FOREIGN KEY (`vehicle_brand_id`) REFERENCES `vehicle_brands`(`id`));

-- Indexes
CREATE INDEX `idx_audit_logs_action` ON `audit_logs`(`action`);

CREATE INDEX `idx_audit_logs_audit_table` ON `audit_logs`(`audit_table`);

CREATE INDEX `idx_audit_logs_record_id` ON `audit_logs`(`record_id`);

CREATE INDEX `idx_audit_logs_timestamp` ON `audit_logs`(`timestamp`);

CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs`(`user_id`);

CREATE UNIQUE INDEX `idx_brands_code` ON `brands`(`code`);

CREATE INDEX `idx_brands_deleted_at` ON `brands`(`deleted_at`);

CREATE INDEX `idx_categories_deleted_at` ON `categories`(`deleted_at`);

CREATE INDEX `idx_categories_parent_id` ON `categories`(`parent_id`);

CREATE UNIQUE INDEX `idx_customers_code` ON `customers`(`code`);

CREATE INDEX `idx_customers_deleted_at` ON `customers`(`deleted_at`);

CREATE INDEX `idx_inventory_deleted_at` ON `inventory`(`deleted_at`);

CREATE UNIQUE INDEX `idx_inventory_product_id` ON `inventory`(`product_id`);

CREATE INDEX `idx_products_brand_id` ON `products`(`brand_id`);

CREATE INDEX `idx_products_category_id` ON `products`(`category_id`);

CREATE INDEX `idx_products_deleted_at` ON `products`(`deleted_at`);

CREATE UNIQUE INDEX `idx_products_sku` ON `products`(`sku`);

CREATE INDEX `idx_products_supplier_id` ON `products`(`supplier_id`);

CREATE INDEX `idx_purchase_receipt_items_deleted_at` ON `purchase_receipt_items`(`deleted_at`);

CREATE INDEX `idx_purchase_receipt_items_product_id` ON `purchase_receipt_items`(`product_id`);

CREATE INDEX `idx_purchase_receipt_items_purchase_receipt_id` ON `purchase_receipt_items`(`purchase_receipt_id`);

CREATE INDEX `idx_purchase_receipts_approved_by_id` ON `purchase_receipts`(`approved_by_id`);

CREATE INDEX `idx_purchase_receipts_created_by_id` ON `purchase_receipts`(`created_by_id`);

CREATE INDEX `idx_purchase_receipts_deleted_at` ON `purchase_receipts`(`deleted_at`);

CREATE UNIQUE INDEX `idx_purchase_receipts_receipt_number` ON `purchase_receipts`(`receipt_number`);

CREATE INDEX `idx_purchase_receipts_received_by_id` ON `purchase_receipts`(`received_by_id`);

CREATE INDEX `idx_purchase_receipts_supplier_id` ON `purchase_receipts`(`supplier_id`);

CREATE INDEX `idx_purchase_receipts_verified_by_id` ON `purchase_receipts`(`verified_by_id`);

CREATE INDEX `idx_stock_movements_deleted_at` ON `stock_movements`(`deleted_at`);

CREATE INDEX `idx_stock_movements_product_id` ON `stock_movements`(`product_id`);

CREATE INDEX `idx_stock_movements_user_id` ON `stock_movements`(`user_id`);

CREATE UNIQUE INDEX `idx_suppliers_code` ON `suppliers`(`code`);

CREATE INDEX `idx_suppliers_deleted_at` ON `suppliers`(`deleted_at`);

CREATE INDEX `idx_users_deleted_at` ON `users`(`deleted_at`);

CREATE UNIQUE INDEX `idx_users_email` ON `users`(`email`);

CREATE UNIQUE INDEX `idx_users_username` ON `users`(`username`);

CREATE UNIQUE INDEX `idx_vehicle_brands_code` ON `vehicle_brands`(`code`);

CREATE INDEX `idx_vehicle_brands_deleted_at` ON `vehicle_brands`(`deleted_at`);

CREATE INDEX `idx_vehicle_compatibilities_deleted_at` ON `vehicle_compatibilities`(`deleted_at`);

CREATE INDEX `idx_vehicle_compatibilities_product_id` ON `vehicle_compatibilities`(`product_id`);

CREATE INDEX `idx_vehicle_compatibilities_vehicle_model_id` ON `vehicle_compatibilities`(`vehicle_model_id`);

CREATE UNIQUE INDEX `idx_vehicle_models_code` ON `vehicle_models`(`code`);

CREATE INDEX `idx_vehicle_models_deleted_at` ON `vehicle_models`(`deleted_at`);

