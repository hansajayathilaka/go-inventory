package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"inventory-api/internal/repository/interfaces"
	"inventory-api/internal/repository/models"
)

type auditLogRepository struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) interfaces.AuditLogRepository {
	return &auditLogRepository{db: db}
}

func (r *auditLogRepository) Create(ctx context.Context, auditLog *models.AuditLog) error {
	return r.db.WithContext(ctx).Create(auditLog).Error
}

func (r *auditLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	var auditLog models.AuditLog
	err := r.db.WithContext(ctx).Preload("User").First(&auditLog, id).Error
	if err != nil {
		return nil, err
	}
	return &auditLog, nil
}

func (r *auditLogRepository) List(ctx context.Context, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) GetByTable(ctx context.Context, tableName string, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("audit_table = ?", tableName).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) GetByRecord(ctx context.Context, tableName string, recordID string, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("audit_table = ? AND record_id = ?", tableName, recordID).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) GetByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) GetByAction(ctx context.Context, action models.AuditAction, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("action = ?", action).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) GetByDateRange(ctx context.Context, start, end time.Time, limit, offset int) ([]*models.AuditLog, error) {
	var auditLogs []*models.AuditLog
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("timestamp BETWEEN ? AND ?", start, end).
		Order("timestamp DESC").
		Limit(limit).
		Offset(offset).
		Find(&auditLogs).Error
	return auditLogs, err
}

func (r *auditLogRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Count(&count).Error
	return count, err
}

func (r *auditLogRepository) DeleteOldLogs(ctx context.Context, olderThan time.Time) error {
	return r.db.WithContext(ctx).Where("timestamp < ?", olderThan).Delete(&models.AuditLog{}).Error
}