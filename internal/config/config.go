package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Database DatabaseConfig `mapstructure:"database"`
	Server   ServerConfig   `mapstructure:"server"`
	Security SecurityConfig `mapstructure:"security"`
	Logging  LoggingConfig  `mapstructure:"logging"`
}

type DatabaseConfig struct {
	Type         string `mapstructure:"type"`       // "postgres" or "sqlite"
	Host         string `mapstructure:"host"`       // For PostgreSQL
	Port         int    `mapstructure:"port"`       // For PostgreSQL
	User         string `mapstructure:"user"`       // For PostgreSQL
	Password     string `mapstructure:"password"`   // For PostgreSQL
	DBName       string `mapstructure:"dbname"`     // For PostgreSQL
	SSLMode      string `mapstructure:"sslmode"`    // For PostgreSQL
	Path         string `mapstructure:"path"`       // For SQLite - database file path
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
}

type ServerConfig struct {
	Host string `mapstructure:"host"`
	Port int    `mapstructure:"port"`
}

type SecurityConfig struct {
	JWTSecret        string `mapstructure:"jwt_secret"`
	PasswordMinLen   int    `mapstructure:"password_min_length"`
	SessionTimeout   int    `mapstructure:"session_timeout_minutes"`
	MaxLoginAttempts int    `mapstructure:"max_login_attempts"`
}

type LoggingConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	OutputPath string `mapstructure:"output_path"`
	MaxSize    int    `mapstructure:"max_size_mb"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age_days"`
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/etc/tui-inventory")

	viper.SetEnvPrefix("TUI_INVENTORY")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	setDefaults()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			fmt.Println("Warning: Config file not found, using defaults and environment variables")
		} else {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func setDefaults() {
	// Database defaults
	viper.SetDefault("database.type", "sqlite")
	viper.SetDefault("database.path", "./data/inventory.db")
	// PostgreSQL defaults (for backward compatibility)
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "inventory_user")
	viper.SetDefault("database.password", "inventory_pass")
	viper.SetDefault("database.dbname", "inventory_db")
	viper.SetDefault("database.sslmode", "disable")
	viper.SetDefault("database.max_idle_conns", 10)
	viper.SetDefault("database.max_open_conns", 100)

	// Server defaults
	viper.SetDefault("server.host", "localhost")
	viper.SetDefault("server.port", 9090)

	// Security defaults
	viper.SetDefault("security.jwt_secret", "your-secret-key-change-this")
	viper.SetDefault("security.password_min_length", 8)
	viper.SetDefault("security.session_timeout_minutes", 480)
	viper.SetDefault("security.max_login_attempts", 5)

	// Logging defaults
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.format", "json")
	viper.SetDefault("logging.output_path", "logs/app.log")
	viper.SetDefault("logging.max_size_mb", 100)
	viper.SetDefault("logging.max_backups", 5)
	viper.SetDefault("logging.max_age_days", 30)
}

func (c *Config) GetDSN() string {
	switch c.Database.Type {
	case "sqlite":
		return c.Database.Path
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s client_encoding=UTF8",
			c.Database.Host,
			c.Database.Port,
			c.Database.User,
			c.Database.Password,
			c.Database.DBName,
			c.Database.SSLMode,
		)
	default:
		// Default to SQLite for new installations
		return c.Database.Path
	}
}

func (c *Config) Validate() error {
	switch c.Database.Type {
	case "postgres":
		if c.Database.Host == "" {
			return fmt.Errorf("database host is required for PostgreSQL")
		}
		if c.Database.User == "" {
			return fmt.Errorf("database user is required for PostgreSQL")
		}
		if c.Database.DBName == "" {
			return fmt.Errorf("database name is required for PostgreSQL")
		}
	case "sqlite", "":
		if c.Database.Path == "" {
			return fmt.Errorf("database path is required for SQLite")
		}
	default:
		return fmt.Errorf("unsupported database type: %s. Supported types: postgres, sqlite", c.Database.Type)
	}

	if c.Security.PasswordMinLen < 4 {
		return fmt.Errorf("password minimum length must be at least 4")
	}
	return nil
}
