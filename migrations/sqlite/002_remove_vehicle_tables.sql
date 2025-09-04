-- Migration: Remove Vehicle-related Tables
-- Phase 1, Task 1.3: Remove Vehicle Models
-- Date: 2025-01-04

-- Drop vehicle compatibility table first (has foreign keys)
DROP TABLE IF EXISTS `vehicle_compatibilities`;

-- Drop vehicle models table (has foreign key to vehicle brands)
DROP TABLE IF EXISTS `vehicle_models`;

-- Drop vehicle brands table
DROP TABLE IF EXISTS `vehicle_brands`;

-- Drop related indexes (if they exist)
DROP INDEX IF EXISTS `idx_vehicle_brands_code`;
DROP INDEX IF EXISTS `idx_vehicle_brands_deleted_at`;
DROP INDEX IF EXISTS `idx_vehicle_models_code`;
DROP INDEX IF EXISTS `idx_vehicle_models_deleted_at`;
DROP INDEX IF EXISTS `idx_vehicle_models_vehicle_brand_id`;
DROP INDEX IF EXISTS `idx_vehicle_compatibilities_deleted_at`;
DROP INDEX IF EXISTS `idx_vehicle_compatibilities_product_id`;
DROP INDEX IF EXISTS `idx_vehicle_compatibilities_vehicle_model_id`;