-- Enable useful PostgreSQL extensions for inventory management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS inventory;
-- CREATE SCHEMA IF NOT EXISTS audit;