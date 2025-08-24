package app

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

var (
	ErrNotLoggedIn    = errors.New("user not logged in")
	ErrSessionExpired = errors.New("session expired")
)

type Session struct {
	UserID    uuid.UUID
	User      *models.User
	LoginTime time.Time
	LastSeen  time.Time
	IPAddress string
	UserAgent string
}

type SessionManager struct {
	sessions map[string]*Session
	timeout  time.Duration
	appCtx   *Context
}

func NewSessionManager(appCtx *Context) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		timeout:  time.Duration(appCtx.Config.Security.SessionTimeout) * time.Minute,
		appCtx:   appCtx,
	}
}

func (sm *SessionManager) Login(ctx context.Context, username, password, ipAddress, userAgent string) (*Session, error) {
	user, err := sm.appCtx.UserService.AuthenticateUser(ctx, username, password)
	if err != nil {
		if err := sm.logFailedLogin(ctx, username, ipAddress, userAgent); err != nil {
			// Log error but don't fail the request
		}
		return nil, err
	}

	sessionID := uuid.New().String()
	session := &Session{
		UserID:    user.ID,
		User:      user,
		LoginTime: time.Now(),
		LastSeen:  time.Now(),
		IPAddress: ipAddress,
		UserAgent: userAgent,
	}

	sm.sessions[sessionID] = session

	if err := sm.logSuccessfulLogin(ctx, user, ipAddress, userAgent); err != nil {
		// Log error but don't fail the request
	}

	return session, nil
}

func (sm *SessionManager) GetSession(sessionID string) (*Session, error) {
	session, exists := sm.sessions[sessionID]
	if !exists {
		return nil, ErrNotLoggedIn
	}

	if time.Since(session.LastSeen) > sm.timeout {
		delete(sm.sessions, sessionID)
		return nil, ErrSessionExpired
	}

	session.LastSeen = time.Now()
	return session, nil
}

func (sm *SessionManager) Logout(sessionID string) error {
	session, exists := sm.sessions[sessionID]
	if !exists {
		return ErrNotLoggedIn
	}

	delete(sm.sessions, sessionID)

	ctx := context.Background()
	if err := sm.logLogout(ctx, session.User, session.IPAddress, session.UserAgent); err != nil {
		// Log error but don't fail the request
	}

	return nil
}

func (sm *SessionManager) RefreshSession(sessionID string) error {
	session, exists := sm.sessions[sessionID]
	if !exists {
		return ErrNotLoggedIn
	}

	if time.Since(session.LastSeen) > sm.timeout {
		delete(sm.sessions, sessionID)
		return ErrSessionExpired
	}

	session.LastSeen = time.Now()
	return nil
}

func (sm *SessionManager) CleanupExpiredSessions() {
	now := time.Now()
	for sessionID, session := range sm.sessions {
		if now.Sub(session.LastSeen) > sm.timeout {
			delete(sm.sessions, sessionID)
		}
	}
}

func (sm *SessionManager) GetActiveSessionCount() int {
	sm.CleanupExpiredSessions()
	return len(sm.sessions)
}

func (sm *SessionManager) logSuccessfulLogin(ctx context.Context, user *models.User, ipAddress, userAgent string) error {
	return sm.appCtx.AuditService.LogAction(
		ctx,
		"users",
		user.ID.String(),
		models.ActionLogin,
		nil,
		map[string]interface{}{
			"username":   user.Username,
			"login_time": time.Now(),
		},
		user.ID,
		ipAddress,
		userAgent,
	)
}

func (sm *SessionManager) logFailedLogin(ctx context.Context, username, ipAddress, userAgent string) error {
	// For failed logins, we don't have a user ID, so we use a system user or nil UUID
	systemUserID := uuid.Nil
	return sm.appCtx.AuditService.LogAction(
		ctx,
		"users",
		"unknown",
		models.ActionLogin,
		nil,
		map[string]interface{}{
			"username": username,
			"failed":   true,
		},
		systemUserID,
		ipAddress,
		userAgent,
	)
}

func (sm *SessionManager) logLogout(ctx context.Context, user *models.User, ipAddress, userAgent string) error {
	return sm.appCtx.AuditService.LogAction(
		ctx,
		"users",
		user.ID.String(),
		models.ActionLogout,
		nil,
		map[string]interface{}{
			"username":    user.Username,
			"logout_time": time.Now(),
		},
		user.ID,
		ipAddress,
		userAgent,
	)
}