package interfaces

import (
	"context"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

type AuditLogRepository interface {
	Create(ctx context.Context, auditLog *models.AuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	List(ctx context.Context, limit, offset int) ([]*models.AuditLog, error)
	GetByTable(ctx context.Context, tableName string, limit, offset int) ([]*models.AuditLog, error)
	GetByRecord(ctx context.Context, tableName string, recordID string, limit, offset int) ([]*models.AuditLog, error)
	GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.AuditLog, error)
	GetByAction(ctx context.Context, action models.AuditAction, limit, offset int) ([]*models.AuditLog, error)
	GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.AuditLog, error)
	Count(ctx context.Context) (int64, error)
	DeleteOldLogs(ctx context.Context, olderThan time.Time) error
}