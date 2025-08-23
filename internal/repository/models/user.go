package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin   UserRole = "admin"
	RoleManager UserRole = "manager"
	RoleStaff   UserRole = "staff"
	RoleViewer  UserRole = "viewer"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Username     string         `gorm:"uniqueIndex;not null;size:50" json:"username"`
	Email        string         `gorm:"uniqueIndex;not null;size:100" json:"email"`
	PasswordHash string         `gorm:"not null;size:255" json:"-"`
	Role         UserRole       `gorm:"not null;type:varchar(20);default:'viewer'" json:"role"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	LastLogin    *time.Time     `json:"last_login,omitempty"`
}

func (User) TableName() string {
	return "users"
}