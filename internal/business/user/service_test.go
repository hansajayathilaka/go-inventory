package user

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"tui-inventory/internal/repository/models"
)

// Mock user repository for testing
type mockUserRepo struct {
	users map[uuid.UUID]*models.User
}

func (m *mockUserRepo) Create(ctx context.Context, user *models.User) error {
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	m.users[user.ID] = user
	return nil
}

func (m *mockUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	if user, exists := m.users[id]; exists {
		return user, nil
	}
	return nil, ErrUserNotFound
}

func (m *mockUserRepo) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	for _, user := range m.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	for _, user := range m.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (m *mockUserRepo) Update(ctx context.Context, user *models.User) error {
	if _, exists := m.users[user.ID]; !exists {
		return ErrUserNotFound
	}
	user.UpdatedAt = time.Now()
	m.users[user.ID] = user
	return nil
}

func (m *mockUserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if _, exists := m.users[id]; !exists {
		return ErrUserNotFound
	}
	delete(m.users, id)
	return nil
}

func (m *mockUserRepo) List(ctx context.Context, limit, offset int) ([]*models.User, error) {
	var result []*models.User
	count := 0
	for _, user := range m.users {
		if count >= offset {
			result = append(result, user)
			if len(result) >= limit {
				break
			}
		}
		count++
	}
	return result, nil
}

func (m *mockUserRepo) GetByRole(ctx context.Context, role models.UserRole) ([]*models.User, error) {
	var result []*models.User
	for _, user := range m.users {
		if user.Role == role {
			result = append(result, user)
		}
	}
	return result, nil
}

func (m *mockUserRepo) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	if user, exists := m.users[id]; exists {
		now := time.Now()
		user.LastLogin = &now
		return nil
	}
	return ErrUserNotFound
}

func (m *mockUserRepo) Count(ctx context.Context) (int64, error) {
	return int64(len(m.users)), nil
}

func setupUserService() Service {
	return NewService(&mockUserRepo{users: make(map[uuid.UUID]*models.User)})
}

func TestCreateUser(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Test successful user creation
	user, err := service.CreateUser(ctx, "testuser", "test@example.com", "password123", models.RoleStaff)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if user.Username != "testuser" {
		t.Errorf("Expected username 'testuser', got %s", user.Username)
	}
	
	if user.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got %s", user.Email)
	}
	
	if user.Role != models.RoleStaff {
		t.Errorf("Expected role Staff, got %v", user.Role)
	}

	// Password should be hashed
	if user.PasswordHash == "password123" {
		t.Error("Password should be hashed, not stored as plain text")
	}

	// Test invalid role
	_, err = service.CreateUser(ctx, "testuser2", "test2@example.com", "password123", models.UserRole("invalid"))
	if err != ErrInvalidRole {
		t.Errorf("Expected ErrInvalidRole, got %v", err)
	}

	// Test duplicate username
	_, err = service.CreateUser(ctx, "testuser", "another@example.com", "password123", models.RoleViewer)
	if err != ErrUserExists {
		t.Errorf("Expected ErrUserExists for duplicate username, got %v", err)
	}

	// Test duplicate email
	_, err = service.CreateUser(ctx, "testuser3", "test@example.com", "password123", models.RoleViewer)
	if err != ErrUserExists {
		t.Errorf("Expected ErrUserExists for duplicate email, got %v", err)
	}
}

func TestAuthenticateUser(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Create a test user
	_, err := service.CreateUser(ctx, "testuser", "test@example.com", "password123", models.RoleStaff)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Test successful authentication
	authenticatedUser, err := service.AuthenticateUser(ctx, "testuser", "password123")
	if err != nil {
		t.Errorf("Expected successful authentication, got %v", err)
	}

	if authenticatedUser.Username != "testuser" {
		t.Errorf("Expected authenticated user to be 'testuser', got %s", authenticatedUser.Username)
	}

	// Test wrong password
	_, err = service.AuthenticateUser(ctx, "testuser", "wrongpassword")
	if err != ErrInvalidPassword {
		t.Errorf("Expected ErrInvalidPassword, got %v", err)
	}

	// Test non-existent user
	_, err = service.AuthenticateUser(ctx, "nonexistent", "password123")
	if err != ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound, got %v", err)
	}
}

func TestUpdatePassword(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Create a test user
	user, err := service.CreateUser(ctx, "testuser", "test@example.com", "oldpassword", models.RoleStaff)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Test successful password update
	err = service.UpdatePassword(ctx, user.ID, "oldpassword", "newpassword")
	if err != nil {
		t.Errorf("Expected successful password update, got %v", err)
	}

	// Test authentication with new password
	_, err = service.AuthenticateUser(ctx, "testuser", "newpassword")
	if err != nil {
		t.Errorf("Expected authentication with new password to succeed, got %v", err)
	}

	// Test authentication with old password (should fail)
	_, err = service.AuthenticateUser(ctx, "testuser", "oldpassword")
	if err != ErrInvalidPassword {
		t.Errorf("Expected old password to be invalid after update, got %v", err)
	}

	// Test wrong old password
	err = service.UpdatePassword(ctx, user.ID, "wrongoldpassword", "anotherpassword")
	if err != ErrInvalidPassword {
		t.Errorf("Expected ErrInvalidPassword for wrong old password, got %v", err)
	}

	// Test non-existent user
	nonExistentID := uuid.New()
	err = service.UpdatePassword(ctx, nonExistentID, "oldpassword", "newpassword")
	if err != ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound for non-existent user, got %v", err)
	}
}

func TestCanPerformAction(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	tests := []struct {
		role     models.UserRole
		action   string
		expected bool
	}{
		// Admin can do everything
		{models.RoleAdmin, "system_config", true},
		{models.RoleAdmin, "user_admin", true},
		{models.RoleAdmin, "price_update", true},
		{models.RoleAdmin, "supplier_management", true},
		{models.RoleAdmin, "view", true},

		// Manager can do most things except system config and user admin
		{models.RoleManager, "system_config", false},
		{models.RoleManager, "user_admin", false},
		{models.RoleManager, "price_update", true},
		{models.RoleManager, "supplier_management", true},
		{models.RoleManager, "view", true},

		// Staff has limited permissions
		{models.RoleStaff, "system_config", false},
		{models.RoleStaff, "user_admin", false},
		{models.RoleStaff, "price_update", false},
		{models.RoleStaff, "supplier_management", false},
		{models.RoleStaff, "view", true},
		{models.RoleStaff, "inventory_update", true},

		// Viewer can only view/read
		{models.RoleViewer, "system_config", false},
		{models.RoleViewer, "user_admin", false},
		{models.RoleViewer, "price_update", false},
		{models.RoleViewer, "supplier_management", false},
		{models.RoleViewer, "inventory_update", false},
		{models.RoleViewer, "view", true},
		{models.RoleViewer, "read", true},
	}

	for _, test := range tests {
		result := service.CanPerformAction(ctx, test.role, test.action)
		if result != test.expected {
			t.Errorf("CanPerformAction(%v, %s) = %v, expected %v", test.role, test.action, result, test.expected)
		}
	}
}

func TestListUsers(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Create multiple test users
	users := []struct {
		username string
		email    string
		role     models.UserRole
	}{
		{"admin", "admin@example.com", models.RoleAdmin},
		{"manager", "manager@example.com", models.RoleManager},
		{"staff1", "staff1@example.com", models.RoleStaff},
		{"staff2", "staff2@example.com", models.RoleStaff},
		{"viewer", "viewer@example.com", models.RoleViewer},
	}

	for _, u := range users {
		_, err := service.CreateUser(ctx, u.username, u.email, "password123", u.role)
		if err != nil {
			t.Fatalf("Failed to create user %s: %v", u.username, err)
		}
	}

	// Test listing with limit
	userList, err := service.ListUsers(ctx, 3, 0)
	if err != nil {
		t.Errorf("Expected no error listing users, got %v", err)
	}

	if len(userList) != 3 {
		t.Errorf("Expected 3 users with limit 3, got %d", len(userList))
	}

	// Test listing with offset
	userList, err = service.ListUsers(ctx, 10, 2)
	if err != nil {
		t.Errorf("Expected no error listing users with offset, got %v", err)
	}

	if len(userList) != 3 { // 5 total users - 2 offset = 3 remaining
		t.Errorf("Expected 3 users with offset 2, got %d", len(userList))
	}
}

func TestGetUsersByRole(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Create users with different roles
	_, err := service.CreateUser(ctx, "admin", "admin@example.com", "password123", models.RoleAdmin)
	if err != nil {
		t.Fatalf("Failed to create admin user: %v", err)
	}

	_, err = service.CreateUser(ctx, "staff1", "staff1@example.com", "password123", models.RoleStaff)
	if err != nil {
		t.Fatalf("Failed to create staff1 user: %v", err)
	}

	_, err = service.CreateUser(ctx, "staff2", "staff2@example.com", "password123", models.RoleStaff)
	if err != nil {
		t.Fatalf("Failed to create staff2 user: %v", err)
	}

	// Test getting users by role
	staffUsers, err := service.GetUsersByRole(ctx, models.RoleStaff)
	if err != nil {
		t.Errorf("Expected no error getting staff users, got %v", err)
	}

	if len(staffUsers) != 2 {
		t.Errorf("Expected 2 staff users, got %d", len(staffUsers))
	}

	adminUsers, err := service.GetUsersByRole(ctx, models.RoleAdmin)
	if err != nil {
		t.Errorf("Expected no error getting admin users, got %v", err)
	}

	if len(adminUsers) != 1 {
		t.Errorf("Expected 1 admin user, got %d", len(adminUsers))
	}

	// Test getting users for role that doesn't exist
	managerUsers, err := service.GetUsersByRole(ctx, models.RoleManager)
	if err != nil {
		t.Errorf("Expected no error getting manager users, got %v", err)
	}

	if len(managerUsers) != 0 {
		t.Errorf("Expected 0 manager users, got %d", len(managerUsers))
	}
}

func TestDeleteUser(t *testing.T) {
	service := setupUserService()
	ctx := context.Background()

	// Create a test user
	user, err := service.CreateUser(ctx, "testuser", "test@example.com", "password123", models.RoleStaff)
	if err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}

	// Test successful deletion
	err = service.DeleteUser(ctx, user.ID)
	if err != nil {
		t.Errorf("Expected no error deleting user, got %v", err)
	}

	// Verify user is deleted
	_, err = service.GetUserByID(ctx, user.ID)
	if err != ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound after deletion, got %v", err)
	}

	// Test deleting non-existent user
	nonExistentID := uuid.New()
	err = service.DeleteUser(ctx, nonExistentID)
	if err != ErrUserNotFound {
		t.Errorf("Expected ErrUserNotFound for non-existent user, got %v", err)
	}
}