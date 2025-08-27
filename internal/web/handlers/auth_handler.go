package handlers

import (
	"context"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/a-h/templ"

	"inventory-api/internal/web/layouts"
)

type WebAuthHandler struct {
	// Will integrate with existing auth service later
}

func NewWebAuthHandler() *WebAuthHandler {
	return &WebAuthHandler{}
}

func (h *WebAuthHandler) LoginPage(c *gin.Context) {
	c.Header("Content-Type", "text/html")
	
	// Create composite component that renders auth layout with login form
	compositeComponent := templ.ComponentFunc(func(ctx context.Context, w io.Writer) error {
		return layouts.Auth("Sign in to your account").Render(ctx, w)
	})
	
	compositeComponent.Render(c.Request.Context(), c.Writer)
}

func (h *WebAuthHandler) Login(c *gin.Context) {
	username := c.PostForm("username")
	password := c.PostForm("password")
	
	// TODO: Integrate with existing JWT auth from API handlers
	// For now, simple validation
	if username == "admin" && password == "admin123" {
		// Set session cookie (temporary implementation)
		c.SetCookie("session", "authenticated", 3600, "/", "", false, true)
		
		// Return success and redirect
		c.Header("HX-Redirect", "/dashboard")
		c.Status(http.StatusOK)
		return
	}
	
	// Return error form
	c.HTML(http.StatusBadRequest, "", `
		<div class="space-y-4">
			<div class="bg-red-50 border border-red-200 rounded-md p-4">
				<p class="text-red-600 text-sm">Invalid username or password</p>
			</div>
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700">Username</label>
				<input
					id="username"
					name="username"
					type="text"
					required
					class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
					placeholder="Enter your username"
					value="`+username+`"
				/>
			</div>
			
			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
					placeholder="Enter your password"
				/>
			</div>
		</div>
		
		<div class="mt-6">
			<button
				type="submit"
				class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				<span class="htmx-indicator">
					<div class="spinner"></div>
				</span>
				Sign In
			</button>
		</div>
	`)
}

func (h *WebAuthHandler) Logout(c *gin.Context) {
	// Clear session cookie
	c.SetCookie("session", "", -1, "/", "", false, true)
	c.Redirect(http.StatusFound, "/login")
}