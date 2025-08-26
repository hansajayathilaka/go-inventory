package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter implements a simple token bucket rate limiter
type RateLimiter struct {
	clients     map[string]*ClientLimiter
	mutex       sync.RWMutex
	maxRequests int
	window      time.Duration
	cleanup     time.Duration
}

// ClientLimiter tracks rate limit data for individual clients
type ClientLimiter struct {
	requests    int
	lastRequest time.Time
	resetTime   time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(maxRequests int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		clients:     make(map[string]*ClientLimiter),
		maxRequests: maxRequests,
		window:      window,
		cleanup:     time.Minute * 10, // Clean up old clients every 10 minutes
	}

	// Start cleanup routine
	go rl.cleanupRoutine()

	return rl
}

// Allow checks if a request from clientID is allowed
func (rl *RateLimiter) Allow(clientID string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	client, exists := rl.clients[clientID]

	if !exists {
		// New client
		rl.clients[clientID] = &ClientLimiter{
			requests:    1,
			lastRequest: now,
			resetTime:   now.Add(rl.window),
		}
		return true
	}

	// Check if window has expired
	if now.After(client.resetTime) {
		client.requests = 1
		client.lastRequest = now
		client.resetTime = now.Add(rl.window)
		return true
	}

	// Check if limit exceeded
	if client.requests >= rl.maxRequests {
		return false
	}

	// Allow request
	client.requests++
	client.lastRequest = now
	return true
}

// GetClientInfo returns current rate limit info for a client
func (rl *RateLimiter) GetClientInfo(clientID string) (remaining int, resetTime time.Time) {
	rl.mutex.RLock()
	defer rl.mutex.RUnlock()

	client, exists := rl.clients[clientID]
	if !exists {
		return rl.maxRequests, time.Now().Add(rl.window)
	}

	remaining = rl.maxRequests - client.requests
	if remaining < 0 {
		remaining = 0
	}

	return remaining, client.resetTime
}

// cleanupRoutine removes old client data
func (rl *RateLimiter) cleanupRoutine() {
	ticker := time.NewTicker(rl.cleanup)
	defer ticker.Stop()

	for range ticker.C {
		rl.mutex.Lock()
		now := time.Now()
		for clientID, client := range rl.clients {
			if now.Sub(client.lastRequest) > rl.cleanup {
				delete(rl.clients, clientID)
			}
		}
		rl.mutex.Unlock()
	}
}

// RateLimitMiddleware creates rate limiting middleware
func RateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(maxRequests, window)

	return func(c *gin.Context) {
		// Use IP address as client identifier
		clientID := c.ClientIP()

		// Check if request is allowed
		if !limiter.Allow(clientID) {
			remaining, resetTime := limiter.GetClientInfo(clientID)
			
			c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
			c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
			c.Header("X-RateLimit-Reset", resetTime.Format(time.RFC3339))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":     "rate_limit_exceeded",
				"message":   "Too many requests",
				"limit":     maxRequests,
				"window":    window.String(),
				"reset_at":  resetTime.Format(time.RFC3339),
				"client_ip": clientID,
			})
			c.Abort()
			return
		}

		// Add rate limit headers
		remaining, resetTime := limiter.GetClientInfo(clientID)
		c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", resetTime.Format(time.RFC3339))

		c.Next()
	}
}

// UserBasedRateLimitMiddleware creates user-based rate limiting (requires auth)
func UserBasedRateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(maxRequests, window)

	return func(c *gin.Context) {
		// Use user ID as client identifier if available, fallback to IP
		clientID := c.ClientIP()
		if userID, exists := c.Get("user_id"); exists {
			clientID = fmt.Sprintf("user_%v", userID)
		}

		// Check if request is allowed
		if !limiter.Allow(clientID) {
			remaining, resetTime := limiter.GetClientInfo(clientID)
			
			c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
			c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
			c.Header("X-RateLimit-Reset", resetTime.Format(time.RFC3339))

			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":     "rate_limit_exceeded",
				"message":   "Too many requests",
				"limit":     maxRequests,
				"window":    window.String(),
				"reset_at":  resetTime.Format(time.RFC3339),
				"client_id": clientID,
			})
			c.Abort()
			return
		}

		// Add rate limit headers
		remaining, resetTime := limiter.GetClientInfo(clientID)
		c.Header("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		c.Header("X-RateLimit-Reset", resetTime.Format(time.RFC3339))

		c.Next()
	}
}