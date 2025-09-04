# SQLite Migration Information

## Generated Files

1. **001_initial_schema.sql** - Complete SQLite schema with all tables and indexes
2. **migration_info.md** - This information file

## Database Structure

The schema includes the following tables:
- users (User management with role-based access)
- categories (Product categories)
- suppliers (Supplier information)
- brands (Part brands)
- products (Product catalog)
- customers (Customer management)
- inventories (Stock levels)
- stock_movements (Stock transaction history)
- purchase_receipts (Purchase orders/receipts)
- purchase_receipt_items (Line items for purchase receipts)
- vehicle_brands (Vehicle manufacturer brands)
- vehicle_models (Specific vehicle models)
- vehicle_compatibilities (Product-vehicle compatibility mapping)
- audit_logs (System audit trail)

## Database File Location

Default SQLite database location: `./data/inventory.db`

You can change this in the config file or via environment variable:
```
TUI_INVENTORY_DATABASE_PATH=./custom/path/inventory.db
```

## Next Steps

1. Run the PostgreSQL export scripts (when created)
2. Import the exported data into SQLite
3. Validate data integrity
4. Switch application to use SQLite configuration

## Migration Commands

To migrate from PostgreSQL to SQLite:

1. Export PostgreSQL data:
   ```bash
   go run migrations/export_postgres_data.go
   ```

2. Import data to SQLite:
   ```bash
   go run migrations/import_sqlite_data.go
   ```

3. Validate migration:
   ```bash
   go run migrations/validate_migration.go
   ```
