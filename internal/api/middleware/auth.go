package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the JWT claims structure
type JWTClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware creates JWT authentication middleware
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip auth for health check, docs, and only the login endpoint
		if strings.HasPrefix(c.Request.URL.Path, "/api/v1/health") ||
			c.Request.URL.Path == "/api/v1/auth/login" ||
			strings.HasPrefix(c.Request.URL.Path, "/docs") {
			c.Next()
			return
		}

		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "missing_authorization_header",
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Check Bearer prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_authorization_format",
				"message": "Authorization header must start with 'Bearer '",
			})
			c.Abort()
			return
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": "Token validation failed: " + err.Error(),
			})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_token",
				"message": "Token is not valid",
			})
			c.Abort()
			return
		}

		// Extract claims
		claims, ok := token.Claims.(*JWTClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "invalid_claims",
				"message": "Could not parse token claims",
			})
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}

// GenerateToken creates a new JWT token for a user
func GenerateToken(userID uuid.UUID, username, role, jwtSecret string) (string, error) {
	claims := JWTClaims{
		UserID:   userID.String(),
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "inventory-api",
			Subject:   username,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// RequireRole creates middleware that requires specific role access
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "no_user_context",
				"message": "User role not found in context",
			})
			c.Abort()
			return
		}

		role := userRole.(string)
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":   "insufficient_permissions",
			"message": "User role '" + role + "' does not have access to this resource",
		})
		c.Abort()
	}
}

// RoleHierarchy defines the role hierarchy for access control
var RoleHierarchy = map[string]int{
	"viewer":  1,
	"staff":   2, 
	"manager": 3,
	"admin":   4,
}

// RequireMinimumRole creates middleware that requires minimum role level
func RequireMinimumRole(minimumRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "no_user_context", 
				"message": "User role not found in context",
			})
			c.Abort()
			return
		}

		role := userRole.(string)
		userLevel, userExists := RoleHierarchy[role]
		minLevel, minExists := RoleHierarchy[minimumRole]

		if !userExists || !minExists {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "invalid_role",
				"message": "Unknown role in hierarchy",
			})
			c.Abort()
			return
		}

		if userLevel < minLevel {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "insufficient_permissions",
				"message": "User role '" + role + "' requires minimum '" + minimumRole + "' access",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}