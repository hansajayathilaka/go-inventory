package handlers

import (
	"context"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/a-h/templ"

	"inventory-api/internal/web/layouts"
)

type WebDashboardHandler struct {
	// Will integrate with existing business services later
}

func NewWebDashboardHandler() *WebDashboardHandler {
	return &WebDashboardHandler{}
}

func (h *WebDashboardHandler) Dashboard(c *gin.Context) {
	// TODO: Get user from session/JWT token
	user := map[string]interface{}{
		"username": "admin",
		"role":     "admin",
	}
	
	// Create dashboard layout with content
	c.Header("Content-Type", "text/html")
	
	// Create composite component that renders dashboard layout with content
	compositeComponent := templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		// First render the dashboard layout wrapper
		return layouts.Dashboard("Dashboard", user).Render(ctx, w)
	})
	
	compositeComponent.Render(c.Request.Context(), c.Writer)
}