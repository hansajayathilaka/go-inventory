package audit

import (
	"context"
	"time"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

type Service interface {
	LogAction(ctx context.Context, tableName, recordID string, action models.AuditAction, oldValues, newValues interface{}, userID uuid.UUID, ipAddress, userAgent string) error
	GetAuditLogs(ctx context.Context, limit, offset int) ([]*models.AuditLog, error)
	GetAuditLogsByTable(ctx context.Context, tableName string, limit, offset int) ([]*models.AuditLog, error)
	GetAuditLogsByRecord(ctx context.Context, tableName, recordID string, limit, offset int) ([]*models.AuditLog, error)
	GetAuditLogsByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.AuditLog, error)
	GetAuditLogsByAction(ctx context.Context, action models.AuditAction, limit, offset int) ([]*models.AuditLog, error)
	GetAuditLogsByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.AuditLog, error)
	CleanupOldLogs(ctx context.Context, olderThan time.Time) error
	GetAuditStatistics(ctx context.Context) (*AuditStatistics, error)
}

type AuditStatistics struct {
	TotalLogs       int64                       `json:"total_logs"`
	LogsByAction    map[models.AuditAction]int64 `json:"logs_by_action"`
	LogsByTable     map[string]int64            `json:"logs_by_table"`
	TopUsers        []UserActivity              `json:"top_users"`
	RecentActivity  []*models.AuditLog          `json:"recent_activity"`
}

type UserActivity struct {
	UserID    uuid.UUID `json:"user_id"`
	Username  string    `json:"username"`
	LogCount  int64     `json:"log_count"`
}

type service struct {
	auditRepo interfaces.AuditLogRepository
	userRepo  interfaces.UserRepository
}

func NewService(auditRepo interfaces.AuditLogRepository, userRepo interfaces.UserRepository) Service {
	return &service{
		auditRepo: auditRepo,
		userRepo:  userRepo,
	}
}

func (s *service) LogAction(ctx context.Context, tableName, recordID string, action models.AuditAction, oldValues, newValues interface{}, userID uuid.UUID, ipAddress, userAgent string) error {
	auditLog := &models.AuditLog{
		AuditTable: tableName,
		RecordID:   recordID,
		Action:     action,
		UserID:     userID,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		Timestamp:  time.Now(),
	}

	if err := auditLog.SetOldValues(oldValues); err != nil {
		return err
	}

	if err := auditLog.SetNewValues(newValues); err != nil {
		return err
	}

	return s.auditRepo.Create(ctx, auditLog)
}

func (s *service) GetAuditLogs(ctx context.Context, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.List(ctx, limit, offset)
}

func (s *service) GetAuditLogsByTable(ctx context.Context, tableName string, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.GetByTable(ctx, tableName, limit, offset)
}

func (s *service) GetAuditLogsByRecord(ctx context.Context, tableName, recordID string, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.GetByRecord(ctx, tableName, recordID, limit, offset)
}

func (s *service) GetAuditLogsByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.GetByUser(ctx, userID, limit, offset)
}

func (s *service) GetAuditLogsByAction(ctx context.Context, action models.AuditAction, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.GetByAction(ctx, action, limit, offset)
}

func (s *service) GetAuditLogsByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.AuditLog, error) {
	return s.auditRepo.GetByDateRange(ctx, start, end, limit, offset)
}

func (s *service) CleanupOldLogs(ctx context.Context, olderThan time.Time) error {
	return s.auditRepo.DeleteOldLogs(ctx, olderThan)
}

func (s *service) GetAuditStatistics(ctx context.Context) (*AuditStatistics, error) {
	totalLogs, err := s.auditRepo.Count(ctx)
	if err != nil {
		return nil, err
	}

	stats := &AuditStatistics{
		TotalLogs:      totalLogs,
		LogsByAction:   make(map[models.AuditAction]int64),
		LogsByTable:    make(map[string]int64),
		TopUsers:       []UserActivity{},
		RecentActivity: []*models.AuditLog{},
	}

	actions := []models.AuditAction{
		models.ActionCreate,
		models.ActionUpdate,
		models.ActionDelete,
		models.ActionLogin,
		models.ActionLogout,
	}

	for _, action := range actions {
		logs, err := s.auditRepo.GetByAction(ctx, action, 1, 0)
		if err == nil && len(logs) > 0 {
			count, err := s.auditRepo.Count(ctx)
			if err == nil {
				stats.LogsByAction[action] = count
			}
		}
	}

	tables := []string{"users", "products", "categories", "inventory", "stock_movements", "suppliers", "locations"}
	for _, table := range tables {
		logs, err := s.auditRepo.GetByTable(ctx, table, 1, 0)
		if err == nil && len(logs) > 0 {
			count, err := s.auditRepo.Count(ctx)
			if err == nil {
				stats.LogsByTable[table] = count
			}
		}
	}

	recentLogs, err := s.auditRepo.List(ctx, 10, 0)
	if err == nil {
		stats.RecentActivity = recentLogs
	}

	return stats, nil
}