package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// RequestLogger returns a gin.HandlerFunc for logging with logrus
func RequestLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Create structured log entry
		logrus.WithFields(logrus.Fields{
			"status_code":  param.StatusCode,
			"latency":      param.Latency,
			"client_ip":    param.ClientIP,
			"method":       param.Method,
			"path":         param.Path,
			"error":        param.ErrorMessage,
			"body_size":    param.BodySize,
			"user_agent":   param.Request.UserAgent(),
			"timestamp":    param.TimeStamp.Format(time.RFC3339),
		}).Info("API Request")

		return ""
	})
}