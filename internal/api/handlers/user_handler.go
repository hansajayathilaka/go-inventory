package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"inventory-api/internal/api/dto"
	"inventory-api/internal/business/user"
	"inventory-api/internal/repository/models"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userService user.Service
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService user.Service) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetUsers godoc
// @Summary List users
// @Description Get a paginated list of users with optional filtering
// @Tags Users
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param role query string false "Filter by role" Enums(admin, manager, staff, viewer)
// @Param search query string false "Search by username or email"
// @Success 200 {object} dto.PaginatedResponse{data=[]dto.UserResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /users [get]
func (h *UserHandler) GetUsers(c *gin.Context) {
	var req dto.UserListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid query parameters", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Default values
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 10
	}

	// Get users from service using ListUsers method
	offset := (req.Page - 1) * req.Limit
	users, err := h.userService.ListUsers(c.Request.Context(), req.Limit, offset)
	if err != nil {
		response := dto.CreateErrorResponse("DATABASE_ERROR", "Failed to retrieve users", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	// Convert to response DTOs
	userResponses := dto.ToUserResponseList(users)

	// Create pagination info (simplified for now)
	pagination := &dto.PaginationInfo{
		Page:       req.Page,
		Limit:      req.Limit,
		Total:      int64(len(userResponses)),
		TotalPages: (len(userResponses) + req.Limit - 1) / req.Limit,
	}

	response := dto.CreatePaginatedResponse(userResponses, pagination, "Users retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// GetUser godoc
// @Summary Get user by ID
// @Description Get a specific user by their ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID" format(uuid)
// @Success 200 {object} dto.BaseResponse{data=dto.UserResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /users/{id} [get]
func (h *UserHandler) GetUser(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid user ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	user, err := h.userService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		response := dto.CreateErrorResponse("NOT_FOUND", "User not found", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	userResponse := dto.ToUserResponse(user)
	response := dto.CreateSuccessResponse(userResponse, "User retrieved successfully")
	c.JSON(http.StatusOK, response)
}

// CreateUser godoc
// @Summary Create a new user
// @Description Create a new user with the provided information
// @Tags Users
// @Accept json
// @Produce json
// @Param user body dto.CreateUserRequest true "User creation request"
// @Success 201 {object} dto.BaseResponse{data=dto.UserResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 409 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Create user via service (service handles password hashing)
	createdUser, err := h.userService.CreateUser(c.Request.Context(), req.Username, req.Email, req.Password, models.UserRole(req.Role))
	if err != nil {
		// Check if it's a conflict error (user already exists)
		response := dto.CreateErrorResponse("CONFLICT", "User already exists", err.Error())
		c.JSON(http.StatusConflict, response)
		return
	}

	userResponse := dto.ToUserResponse(createdUser)
	response := dto.CreateSuccessResponse(userResponse, "User created successfully")
	c.JSON(http.StatusCreated, response)
}

// UpdateUser godoc
// @Summary Update a user
// @Description Update an existing user's information
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID" format(uuid)
// @Param user body dto.UpdateUserRequest true "User update request"
// @Success 200 {object} dto.BaseResponse{data=dto.UserResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid user ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid request data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get existing user
	existingUser, err := h.userService.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		response := dto.CreateErrorResponse("NOT_FOUND", "User not found", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	// Update fields if provided
	if req.Username != "" {
		existingUser.Username = req.Username
	}
	if req.Email != "" {
		existingUser.Email = req.Email
	}
	if req.Role != "" {
		existingUser.Role = models.UserRole(req.Role)
	}

	// Update user via service
	err = h.userService.UpdateUser(c.Request.Context(), existingUser)
	if err != nil {
		response := dto.CreateErrorResponse("INTERNAL_ERROR", "Failed to update user", err.Error())
		c.JSON(http.StatusInternalServerError, response)
		return
	}

	userResponse := dto.ToUserResponse(existingUser)
	response := dto.CreateSuccessResponse(userResponse, "User updated successfully")
	c.JSON(http.StatusOK, response)
}

// DeleteUser godoc
// @Summary Delete a user
// @Description Delete a user by their ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID" format(uuid)
// @Success 200 {object} dto.BaseResponse
// @Failure 400 {object} dto.BaseResponse
// @Failure 404 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid user ID format", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	err = h.userService.DeleteUser(c.Request.Context(), userID)
	if err != nil {
		response := dto.CreateErrorResponse("NOT_FOUND", "User not found", err.Error())
		c.JSON(http.StatusNotFound, response)
		return
	}

	response := dto.CreateSuccessResponse(nil, "User deleted successfully")
	c.JSON(http.StatusOK, response)
}

// Login godoc
// @Summary User login
// @Description Authenticate user and return login information
// @Tags Authentication
// @Accept json
// @Produce json
// @Param credentials body dto.LoginRequest true "Login credentials"
// @Success 200 {object} dto.BaseResponse{data=dto.LoginResponse}
// @Failure 400 {object} dto.BaseResponse
// @Failure 401 {object} dto.BaseResponse
// @Failure 500 {object} dto.BaseResponse
// @Router /auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response := dto.CreateErrorResponse("VALIDATION_ERROR", "Invalid login data", err.Error())
		c.JSON(http.StatusBadRequest, response)
		return
	}

	// Get user by username
	user, err := h.userService.GetUserByUsername(c.Request.Context(), req.Username)
	if err != nil {
		response := dto.CreateErrorResponse("UNAUTHORIZED", "Invalid credentials", "Username or password is incorrect")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		response := dto.CreateErrorResponse("UNAUTHORIZED", "Invalid credentials", "Username or password is incorrect")
		c.JSON(http.StatusUnauthorized, response)
		return
	}

	// Update last login (simplified)
	// In a real app, you'd also generate JWT tokens here
	userResponse := dto.ToUserResponse(user)
	loginResponse := dto.LoginResponse{
		User:  userResponse,
		Token: "jwt_token_here", // TODO: Implement JWT token generation
	}

	response := dto.CreateSuccessResponse(loginResponse, "Login successful")
	c.JSON(http.StatusOK, response)
}

// Logout godoc
// @Summary User logout
// @Description Log out the current user
// @Tags Authentication
// @Accept json
// @Produce json
// @Success 200 {object} dto.BaseResponse
// @Router /auth/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	// In a real implementation, you'd invalidate the JWT token
	response := dto.CreateSuccessResponse(nil, "Logout successful")
	c.JSON(http.StatusOK, response)
}