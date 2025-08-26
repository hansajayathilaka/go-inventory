package handlers

import (
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/api/middleware"
	"inventory-api/internal/business/user"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	userService user.Service
	jwtSecret   string
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(userService user.Service) *AuthHandler {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key" // Default for development
	}
	
	return &AuthHandler{
		userService: userService,
		jwtSecret:   jwtSecret,
	}
}

// LoginRequest represents login request payload
type LoginRequest struct {
	Username string `json:"username" validate:"required" example:"admin"`
	Password string `json:"password" validate:"required" example:"password123"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token    string             `json:"token" example:"eyJhbGciOiJIUzI1NiIs..."`
	User     dto.UserResponse   `json:"user"`
	ExpiresIn int               `json:"expires_in" example:"86400"`
}

// Login godoc
// @Summary User login
// @Description Authenticate user and return JWT token
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login credentials"
// @Success 200 {object} dto.SuccessResponse{data=LoginResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid login request", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Find user by username
	user, err := h.userService.GetUserByUsername(context.Background(), req.Username)
	if err != nil {
		response := dto.CreateErrorResponse("AUTHENTICATION_FAILED", "Invalid credentials", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		response := dto.CreateErrorResponse("AUTHENTICATION_FAILED", "Invalid credentials", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role), h.jwtSecret)
	if err != nil {
		response := dto.CreateErrorResponse("TOKEN_GENERATION_ERROR", "Failed to generate authentication token", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Create response
	userResponse := dto.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		LastLogin: user.LastLogin,
	}

	loginResponse := LoginResponse{
		Token:     token,
		User:      userResponse,
		ExpiresIn: 86400, // 24 hours in seconds
	}

	// Update last login time
	h.userService.UpdateLastLogin(context.Background(), user.ID)

	response := dto.CreateSuccessResponse(loginResponse, "User authenticated successfully")
	c.JSON(http.StatusOK, response)
}

// Logout godoc
// @Summary User logout
// @Description Logout user (client should discard token)
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a more sophisticated system, you might:
	// 1. Add token to blacklist
	// 2. Store active tokens in Redis
	// 3. Invalidate refresh tokens
	
	// For now, we just return success (client discards token)
	response := dto.CreateSuccessResponse(nil, "User logged out successfully")
	c.JSON(http.StatusOK, response)
}

// RefreshToken godoc
// @Summary Refresh JWT token
// @Description Generate a new JWT token using current token
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} dto.SuccessResponse{data=LoginResponse}
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get user info from JWT context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		response := dto.CreateErrorResponse("UNAUTHORIZED", "User not authenticated", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	username, _ := c.Get("username")
	userRole, _ := c.Get("user_role")

	// Generate new token
	userUUIDForToken, _ := uuid.Parse(userID.(string))
	token, err := middleware.GenerateToken(userUUIDForToken, username.(string), userRole.(string), h.jwtSecret)
	if err != nil {
		response := dto.CreateErrorResponse("TOKEN_GENERATION_ERROR", "Failed to refresh authentication token", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Get updated user info  
	userUUID, _ := uuid.Parse(userID.(string))
	user, err := h.userService.GetUserByID(context.Background(), userUUID)
	if err != nil {
		response := dto.CreateErrorResponse("USER_NOT_FOUND", "User not found", err.Error())
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	userResponse := dto.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		LastLogin: user.LastLogin,
	}

	loginResponse := LoginResponse{
		Token:     token,
		User:      userResponse,
		ExpiresIn: 86400, // 24 hours in seconds
	}

	response := dto.CreateSuccessResponse(loginResponse, "Token refreshed successfully")
	c.JSON(http.StatusOK, response)
}

// Me godoc
// @Summary Get current user info
// @Description Get current authenticated user information
// @Tags Authentication
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} dto.SuccessResponse{data=dto.UserResponse}
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	// Get user info from JWT context
	userID, exists := c.Get("user_id")
	if !exists {
		response := dto.CreateErrorResponse("UNAUTHORIZED", "User not authenticated", "")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Get user from database
	userUUID, _ := uuid.Parse(userID.(string))
	user, err := h.userService.GetUserByID(context.Background(), userUUID)
	if err != nil {
		response := dto.CreateErrorResponse("USER_NOT_FOUND", "User not found", err.Error())
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	userResponse := dto.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		Role:      string(user.Role),
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		LastLogin: user.LastLogin,
	}

	response := dto.CreateSuccessResponse(userResponse, "User information retrieved")
	c.JSON(http.StatusOK, response)
}