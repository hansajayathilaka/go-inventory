package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name        string         `gorm:"not null;size:100" json:"name"`
	Description string         `gorm:"size:500" json:"description"`
	ParentID    *uuid.UUID     `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	Parent      *Category      `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children    []Category     `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Level       int            `gorm:"not null;default:0" json:"level"`
	Path        string         `gorm:"not null;size:500" json:"path"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	Products []Product `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
}

func (Category) TableName() string {
	return "categories"
}

func (c *Category) BeforeSave(tx *gorm.DB) error {
	if c.ParentID != nil {
		var parent Category
		if err := tx.First(&parent, c.ParentID).Error; err != nil {
			return err
		}
		c.Level = parent.Level + 1
		c.Path = parent.Path + "/" + c.Name
	} else {
		c.Level = 0
		c.Path = c.Name
	}
	return nil
}