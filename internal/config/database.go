package config

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
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

	db, err := gorm.Open(postgres.Open(config.GetDSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(config.Database.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.Database.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return &Database{DB: db}, nil
}

func (db *Database) AutoMigrate() error {
	return db.DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Supplier{},
		&models.Location{},
		&models.Product{},
		&models.Inventory{},
		&models.StockMovement{},
		&models.AuditLog{},
	)
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