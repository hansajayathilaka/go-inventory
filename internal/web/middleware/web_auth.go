package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// WebAuthMiddleware checks for web session authentication
func WebAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check for session cookie
		session, err := c.Cookie("session")
		if err != nil || session != "authenticated" {
			// Redirect to login page
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}
		
		// TODO: Validate session token and get user info
		// For now, just continue with authenticated status
		c.Set("authenticated", true)
		c.Set("user", map[string]interface{}{
			"username": "admin",
			"role":     "admin",
		})
		
		c.Next()
	}
}