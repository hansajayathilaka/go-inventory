package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"inventory-api/internal/repository/models"
)

type Database struct {
	*gorm.DB
}

func NewDatabase(config *Config) (*Database, error) {
	var gormLogger logger.Interface
	switch config.Logging.Level {
	case "debug":
		gormLogger = logger.Default.LogMode(logger.Info)
	case "warn":
		gormLogger = logger.Default.LogMode(logger.Warn)
	case "error":
		gormLogger = logger.Default.LogMode(logger.Error)
	default:
		gormLogger = logger.Default.LogMode(logger.Silent)
	}

	var db *gorm.DB
	var err error

	switch config.Database.Type {
	case "sqlite", "":
		// Create directory if it doesn't exist
		if err := ensureDir(config.Database.Path); err != nil {
			return nil, fmt.Errorf("failed to create database directory: %w", err)
		}

		db, err = gorm.Open(sqlite.Open(config.GetDSN()), &gorm.Config{
			Logger: gormLogger,
		})
	case "postgres":
		db, err = gorm.Open(postgres.Open(config.GetDSN()), &gorm.Config{
			Logger: gormLogger,
		})
	default:
		return nil, fmt.Errorf("unsupported database type: %s", config.Database.Type)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	// Apply connection pool settings (less aggressive for SQLite)
	if config.Database.Type == "sqlite" {
		// SQLite doesn't benefit from connection pooling like PostgreSQL
		sqlDB.SetMaxIdleConns(1)
		sqlDB.SetMaxOpenConns(1)
	} else {
		sqlDB.SetMaxIdleConns(config.Database.MaxIdleConns)
		sqlDB.SetMaxOpenConns(config.Database.MaxOpenConns)
	}
	sqlDB.SetConnMaxLifetime(time.Hour)

	return &Database{DB: db}, nil
}

func (db *Database) AutoMigrate() error {
	// First migrate the new simplified structure
	err := db.DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Supplier{},
		&models.Product{},
		&models.Inventory{},
		&models.StockMovement{},
		&models.AuditLog{},
		&models.Customer{},
		&models.Brand{},
		&models.PurchaseReceipt{},
		&models.PurchaseReceiptItem{},
		&models.Sale{},
		&models.SaleItem{},
		&models.Payment{},
	)
	if err != nil {
		return err
	}

	// Clean up obsolete tables and columns
	return db.cleanupObsoleteStructures()
}

// cleanupObsoleteStructures removes old tables and columns that are no longer needed
func (db *Database) cleanupObsoleteStructures() error {
	// Drop old purchase/GRN tables if they exist
	oldTables := []string{
		"purchase_orders",
		"purchase_order_items", 
		"grns",
		"grn_items",
		"locations", // Remove location table if it exists
	}

	for _, tableName := range oldTables {
		if db.DB.Migrator().HasTable(tableName) {
			if err := db.DB.Migrator().DropTable(tableName); err != nil {
				// Log warning but don't fail - table might have constraints
				fmt.Printf("Warning: Could not drop table %s: %v\n", tableName, err)
			}
		}
	}

	// Remove location_id columns from tables if they exist
	columnsToRemove := map[string][]string{
		"inventories":     {"location_id"},
		"stock_movements": {"location_id"},
	}

	for tableName, columns := range columnsToRemove {
		if db.DB.Migrator().HasTable(tableName) {
			for _, columnName := range columns {
				if db.DB.Migrator().HasColumn(tableName, columnName) {
					if err := db.DB.Migrator().DropColumn(tableName, columnName); err != nil {
						// Log warning but don't fail
						fmt.Printf("Warning: Could not drop column %s.%s: %v\n", tableName, columnName, err)
					}
				}
			}
		}
	}

	return nil
}

// ensureDir creates the directory for the database file if it doesn't exist
func ensureDir(dbPath string) error {
	dir := filepath.Dir(dbPath)
	if dir == "." {
		return nil // Current directory already exists
	}
	return os.MkdirAll(dir, 0755)
}

func (db *Database) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func (db *Database) Ping() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}