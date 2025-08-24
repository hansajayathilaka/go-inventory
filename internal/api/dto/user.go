package dto

import (
	"time"

	"github.com/google/uuid"
	"inventory-api/internal/repository/models"
)

// UserResponse represents a user in API responses
type UserResponse struct {
	ID        uuid.UUID  `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Username  string     `json:"username" example:"john_doe"`
	Email     string     `json:"email" example:"john@example.com"`
	Role      string     `json:"role" example:"manager" enums:"admin,manager,staff,viewer"`
	CreatedAt time.Time  `json:"created_at" example:"2023-01-01T12:00:00Z"`
	UpdatedAt time.Time  `json:"updated_at" example:"2023-01-01T12:00:00Z"`
	LastLogin *time.Time `json:"last_login,omitempty" example:"2023-01-01T12:00:00Z"`
}

// CreateUserRequest represents a request to create a new user
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50" example:"john_doe"`
	Email    string `json:"email" binding:"required,email" example:"john@example.com"`
	Password string `json:"password" binding:"required,min=6" example:"password123"`
	Role     string `json:"role" binding:"required,oneof=admin manager staff viewer" example:"manager"`
}

// UpdateUserRequest represents a request to update an existing user
type UpdateUserRequest struct {
	Username string `json:"username,omitempty" binding:"omitempty,min=3,max=50" example:"john_doe_updated"`
	Email    string `json:"email,omitempty" binding:"omitempty,email" example:"john_updated@example.com"`
	Role     string `json:"role,omitempty" binding:"omitempty,oneof=admin manager staff viewer" example:"staff"`
}

// ChangePasswordRequest represents a request to change user password
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required" example:"oldpassword123"`
	NewPassword string `json:"new_password" binding:"required,min=6" example:"newpassword123"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username" binding:"required" example:"john_doe"`
	Password string `json:"password" binding:"required" example:"password123"`
}

// LoginResponse represents a successful login response
type LoginResponse struct {
	User        UserResponse `json:"user"`
	Token       string       `json:"token,omitempty" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	ExpiresAt   *time.Time   `json:"expires_at,omitempty" example:"2023-01-02T12:00:00Z"`
	RefreshToken string       `json:"refresh_token,omitempty" example:"refresh_token_here"`
}

// UserListRequest represents parameters for listing users
type UserListRequest struct {
	Page   int    `form:"page,default=1" binding:"min=1" example:"1"`
	Limit  int    `form:"limit,default=10" binding:"min=1,max=100" example:"10"`
	Role   string `form:"role,omitempty" binding:"omitempty,oneof=admin manager staff viewer" example:"manager"`
	Search string `form:"search,omitempty" example:"john"`
}

// ToUserResponse converts a user model to a user response DTO
func ToUserResponse(user *models.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		LastLogin: user.LastLogin,
	}
}

// ToUserResponseList converts a list of user models to user response DTOs
func ToUserResponseList(users []*models.User) []UserResponse {
	responses := make([]UserResponse, len(users))
	for i, user := range users {
		responses[i] = ToUserResponse(user)
	}
	return responses
}