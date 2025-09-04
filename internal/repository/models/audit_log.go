package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditAction string

const (
	ActionCreate AuditAction = "CREATE"
	ActionUpdate AuditAction = "UPDATE"
	ActionDelete AuditAction = "DELETE"
	ActionLogin  AuditAction = "LOGIN"
	ActionLogout AuditAction = "LOGOUT"
)

type AuditLog struct {
	ID          uuid.UUID       `gorm:"type:text;primaryKey" json:"id"`
	AuditTable  string          `gorm:"not null;size:50;index" json:"table_name"`
	RecordID  string          `gorm:"not null;size:100;index" json:"record_id"`
	Action    AuditAction     `gorm:"not null;type:varchar(20);index" json:"action"`
	OldValues json.RawMessage `gorm:"type:text" json:"old_values,omitempty"`
	NewValues json.RawMessage `gorm:"type:text" json:"new_values,omitempty"`
	UserID    uuid.UUID       `gorm:"type:text;not null;index" json:"user_id"`
	User      User            `gorm:"foreignKey:UserID" json:"user"`
	IPAddress string          `gorm:"size:45" json:"ip_address"`
	UserAgent string          `gorm:"size:500" json:"user_agent"`
	Timestamp time.Time       `gorm:"not null;default:CURRENT_TIMESTAMP;index" json:"timestamp"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}

func (al *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}

func (al *AuditLog) SetOldValues(data interface{}) error {
	if data == nil {
		al.OldValues = nil
		return nil
	}
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	al.OldValues = jsonData
	return nil
}

func (al *AuditLog) SetNewValues(data interface{}) error {
	if data == nil {
		al.NewValues = nil
		return nil
	}
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	al.NewValues = jsonData
	return nil
}

func (al *AuditLog) GetOldValues(dest interface{}) error {
	if al.OldValues == nil {
		return nil
	}
	return json.Unmarshal(al.OldValues, dest)
}

func (al *AuditLog) GetNewValues(dest interface{}) error {
	if al.NewValues == nil {
		return nil
	}
	return json.Unmarshal(al.NewValues, dest)
}