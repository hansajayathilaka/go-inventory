package models

import (
	"github.com/google/uuid"
)

// Minimal Location model for single hardware store
// Only keeps essential fields for database compatibility
type Location struct {
	ID   uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name string    `gorm:"not null;size:100;default:'Hardware Store'" json:"name"`
}

func (Location) TableName() string {
	return "locations"
}

// GetDefaultLocation returns the default hardware store location
func GetDefaultLocation() *Location {
	return &Location{
		ID:   GetDefaultLocationID(),
		Name: "Hardware Store",
	}
}