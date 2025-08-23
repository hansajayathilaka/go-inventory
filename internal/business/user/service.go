package user

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"tui-inventory/internal/repository/interfaces"
	"tui-inventory/internal/repository/models"
)

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrInvalidPassword  = errors.New("invalid password")
	ErrUserExists       = errors.New("user already exists")
	ErrInvalidRole      = errors.New("invalid role")
	ErrUnauthorized     = errors.New("unauthorized access")
)

type Service interface {
	CreateUser(ctx context.Context, username, email, password string, role models.UserRole) (*models.User, error)
	AuthenticateUser(ctx context.Context, username, password string) (*models.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetUserByUsername(ctx context.Context, username string) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	UpdatePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error
	DeleteUser(ctx context.Context, id uuid.UUID) error
	ListUsers(ctx context.Context, limit, offset int) ([]*models.User, error)
	GetUsersByRole(ctx context.Context, role models.UserRole) ([]*models.User, error)
	UpdateLastLogin(ctx context.Context, id uuid.UUID) error
	CanPerformAction(ctx context.Context, userRole models.UserRole, action string) bool
}

type service struct {
	userRepo interfaces.UserRepository
}

func NewService(userRepo interfaces.UserRepository) Service {
	return &service{
		userRepo: userRepo,
	}
}

func (s *service) CreateUser(ctx context.Context, username, email, password string, role models.UserRole) (*models.User, error) {
	if !isValidRole(role) {
		return nil, ErrInvalidRole
	}

	existingUser, _ := s.userRepo.GetByUsername(ctx, username)
	if existingUser != nil {
		return nil, ErrUserExists
	}

	existingUser, _ = s.userRepo.GetByEmail(ctx, email)
	if existingUser != nil {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *service) AuthenticateUser(ctx context.Context, username, password string) (*models.User, error) {
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, ErrInvalidPassword
	}

	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *service) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	return s.userRepo.GetByID(ctx, id)
}

func (s *service) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	return s.userRepo.GetByUsername(ctx, username)
}

func (s *service) UpdateUser(ctx context.Context, user *models.User) error {
	if !isValidRole(user.Role) {
		return ErrInvalidRole
	}
	return s.userRepo.Update(ctx, user)
}

func (s *service) UpdatePassword(ctx context.Context, userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return ErrInvalidPassword
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.userRepo.Update(ctx, user)
}

func (s *service) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return s.userRepo.Delete(ctx, id)
}

func (s *service) ListUsers(ctx context.Context, limit, offset int) ([]*models.User, error) {
	return s.userRepo.List(ctx, limit, offset)
}

func (s *service) GetUsersByRole(ctx context.Context, role models.UserRole) ([]*models.User, error) {
	return s.userRepo.GetByRole(ctx, role)
}

func (s *service) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	return s.userRepo.UpdateLastLogin(ctx, id)
}

func (s *service) CanPerformAction(ctx context.Context, userRole models.UserRole, action string) bool {
	switch userRole {
	case models.RoleAdmin:
		return true
	case models.RoleManager:
		return action != "system_config" && action != "user_admin"
	case models.RoleStaff:
		return action != "system_config" && action != "user_admin" && action != "price_update" && action != "supplier_management"
	case models.RoleViewer:
		return action == "view" || action == "read"
	default:
		return false
	}
}

func isValidRole(role models.UserRole) bool {
	switch role {
	case models.RoleAdmin, models.RoleManager, models.RoleStaff, models.RoleViewer:
		return true
	default:
		return false
	}
}