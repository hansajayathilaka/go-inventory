import React, { Component } from 'react'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import type { FallbackProps } from 'react-error-boundary'
import { 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Home, 
  Bug,
  Clock,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

/**
 * Error types that can occur in the POS system
 */
export const POSErrorType = {
  PAYMENT_PROCESSING: 'payment_processing',
  NETWORK_FAILURE: 'network_failure',
  COMPONENT_RENDER: 'component_render',
  STATE_MANAGEMENT: 'state_management',
  SESSION_CORRUPTION: 'session_corruption',
  VALIDATION_ERROR: 'validation_error',
  UNKNOWN: 'unknown'
} as const

export type POSErrorType = typeof POSErrorType[keyof typeof POSErrorType]

/**
 * Interface for POS-specific error information
 */
export interface POSErrorInfo {
  type: POSErrorType
  recoverable: boolean
  sessionData?: any
  componentStack?: string
  userAction?: string
  timestamp: Date
}

/**
 * Enhanced error class for POS operations
 */
export class POSError extends Error {
  public readonly type: POSErrorType
  public readonly recoverable: boolean
  public readonly sessionData?: any
  public readonly userAction?: string
  public readonly timestamp: Date

  constructor(
    message: string, 
    type: POSErrorType = POSErrorType.UNKNOWN,
    recoverable: boolean = true,
    sessionData?: any,
    userAction?: string
  ) {
    super(message)
    this.name = 'POSError'
    this.type = type
    this.recoverable = recoverable
    this.sessionData = sessionData
    this.userAction = userAction
    this.timestamp = new Date()
  }
}

/**
 * Session recovery utilities
 */
class SessionRecovery {
  private static readonly SESSION_STORAGE_KEY = 'pos_emergency_backup'
  private static readonly MAX_BACKUP_AGE = 30 * 60 * 1000 // 30 minutes

  static saveEmergencyBackup(sessionData: any) {
    try {
      const backup = {
        data: sessionData,
        timestamp: Date.now()
      }
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(backup))
    } catch (error) {
      console.error('Failed to save emergency backup:', error)
    }
  }

  static getEmergencyBackup(): any | null {
    try {
      const backupStr = localStorage.getItem(this.SESSION_STORAGE_KEY)
      if (!backupStr) return null

      const backup = JSON.parse(backupStr)
      const age = Date.now() - backup.timestamp

      // Return backup only if it's not too old
      if (age <= this.MAX_BACKUP_AGE) {
        return backup.data
      } else {
        this.clearEmergencyBackup()
        return null
      }
    } catch (error) {
      console.error('Failed to retrieve emergency backup:', error)
      return null
    }
  }

  static clearEmergencyBackup() {
    try {
      localStorage.removeItem(this.SESSION_STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear emergency backup:', error)
    }
  }

  static hasEmergencyBackup(): boolean {
    return this.getEmergencyBackup() !== null
  }
}

/**
 * Error logging and reporting utilities
 */
class ErrorLogger {
  static logError(error: Error, errorInfo: POSErrorInfo, userId?: number) {
    const logEntry = {
      message: error.message,
      stack: error.stack,
      type: errorInfo.type,
      recoverable: errorInfo.recoverable,
      componentStack: errorInfo.componentStack,
      userAction: errorInfo.userAction,
      userId,
      timestamp: errorInfo.timestamp.toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionData: errorInfo.sessionData ? {
        hasCart: !!errorInfo.sessionData.cart,
        itemCount: errorInfo.sessionData.cart?.items?.length || 0,
        sessionId: errorInfo.sessionData.sessionId
      } : null
    }

    // Log to console
    console.error('POS Error:', logEntry)

    // Log to local storage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('pos_error_logs') || '[]')
      logs.push(logEntry)
      
      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50)
      }
      
      localStorage.setItem('pos_error_logs', JSON.stringify(logs))
    } catch (e) {
      console.error('Failed to store error log:', e)
    }

    // TODO: Send to backend error reporting service
    // this.sendToBackend(logEntry)
  }
}

/**
 * Main POS Error Fallback component
 */
interface POSErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
  errorInfo?: POSErrorInfo
}

function POSErrorFallback({ error, resetErrorBoundary, errorInfo }: POSErrorFallbackProps) {
  const [isRecovering, setIsRecovering] = React.useState(false)
  const [hasBackup, setHasBackup] = React.useState(false)

  React.useEffect(() => {
    setHasBackup(SessionRecovery.hasEmergencyBackup())
  }, [])

  const getErrorIcon = (type: POSErrorType) => {
    switch (type) {
      case POSErrorType.PAYMENT_PROCESSING:
        return <Shield className="h-8 w-8 text-red-500" />
      case POSErrorType.NETWORK_FAILURE:
        return <RefreshCw className="h-8 w-8 text-orange-500" />
      case POSErrorType.SESSION_CORRUPTION:
        return <Clock className="h-8 w-8 text-purple-500" />
      default:
        return <AlertTriangle className="h-8 w-8 text-yellow-500" />
    }
  }

  const getErrorTitle = (type: POSErrorType) => {
    switch (type) {
      case POSErrorType.PAYMENT_PROCESSING:
        return 'Payment Processing Error'
      case POSErrorType.NETWORK_FAILURE:
        return 'Connection Problem'
      case POSErrorType.COMPONENT_RENDER:
        return 'Display Error'
      case POSErrorType.STATE_MANAGEMENT:
        return 'Session Error'
      case POSErrorType.SESSION_CORRUPTION:
        return 'Session Corrupted'
      case POSErrorType.VALIDATION_ERROR:
        return 'Data Validation Error'
      default:
        return 'Unexpected Error'
    }
  }

  const getErrorDescription = (type: POSErrorType) => {
    switch (type) {
      case POSErrorType.PAYMENT_PROCESSING:
        return 'There was an issue processing the payment. Your transaction data has been preserved.'
      case POSErrorType.NETWORK_FAILURE:
        return 'Unable to connect to the server. Please check your internet connection.'
      case POSErrorType.COMPONENT_RENDER:
        return 'There was an issue displaying this page. You can try refreshing or returning to the dashboard.'
      case POSErrorType.STATE_MANAGEMENT:
        return 'There was an issue with the session data. Your cart may have been automatically saved.'
      case POSErrorType.SESSION_CORRUPTION:
        return 'Your session has become corrupted. We can attempt to recover your data.'
      case POSErrorType.VALIDATION_ERROR:
        return 'The data validation failed. Please review your inputs and try again.'
      default:
        return 'An unexpected error occurred. Your session data may have been preserved.'
    }
  }

  const handleRetry = async () => {
    setIsRecovering(true)
    
    try {
      // Small delay to show recovery state
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Clear any corrupt session data if needed
      if (errorInfo?.type === POSErrorType.SESSION_CORRUPTION) {
        SessionRecovery.clearEmergencyBackup()
      }
      
      resetErrorBoundary()
    } catch (err) {
      console.error('Recovery failed:', err)
      setIsRecovering(false)
    }
  }

  const handleRecoverSession = async () => {
    setIsRecovering(true)
    
    try {
      const backupData = SessionRecovery.getEmergencyBackup()
      if (backupData) {
        // TODO: Restore session data to store
        // posStore.restoreFromBackup(backupData)
        console.log('Recovered session data:', backupData)
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      resetErrorBoundary()
    } catch (err) {
      console.error('Session recovery failed:', err)
      setIsRecovering(false)
    }
  }

  const handleReturnHome = () => {
    // Clear any problematic data
    SessionRecovery.clearEmergencyBackup()
    
    // Navigate to safe state
    window.location.href = '/'
  }

  const handleReportBug = () => {
    // Create bug report data
    const bugReport = {
      error: {
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.log('Bug report data:', bugReport)
    
    // TODO: Implement bug reporting mechanism
    alert('Bug report has been logged. Thank you for reporting this issue!')
  }

  const errorType = errorInfo?.type || POSErrorType.UNKNOWN
  const isRecoverable = errorInfo?.recoverable !== false

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getErrorIcon(errorType)}
          </div>
          <CardTitle className="text-2xl text-gray-900">
            {getErrorTitle(errorType)}
          </CardTitle>
          <CardDescription className="text-lg">
            {getErrorDescription(errorType)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertTitle>Technical Details</AlertTitle>
            <AlertDescription className="font-mono text-sm">
              {error.message}
            </AlertDescription>
          </Alert>

          {/* Session Recovery Notice */}
          {hasBackup && (
            <Alert className="border-blue-200 bg-blue-50">
              <Save className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Session Backup Available</AlertTitle>
              <AlertDescription className="text-blue-700">
                We found a recent backup of your session data that can be recovered.
              </AlertDescription>
            </Alert>
          )}

          {/* Recovery Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isRecoverable && (
              <Button
                onClick={handleRetry}
                disabled={isRecovering}
                className="h-12"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
            )}

            {hasBackup && (
              <Button
                onClick={handleRecoverSession}
                disabled={isRecovering}
                variant="outline"
                className="h-12"
              >
                {isRecovering ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Recover Session
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleReturnHome}
              variant="secondary"
              className="h-12"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Button>

            <Button
              onClick={handleReportBug}
              variant="outline"
              className="h-12"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </Button>
          </div>

          {/* Additional Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Time:</strong> {new Date().toLocaleString()}
            </p>
            {errorInfo?.userAction && (
              <p>
                <strong>Last Action:</strong> {errorInfo.userAction}
              </p>
            )}
            <p>
              <strong>Error ID:</strong> {Date.now().toString(36)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Enhanced Error Boundary component for POS operations
 */
interface POSErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<POSErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  sessionData?: any
}

class POSErrorBoundaryClass extends Component<
  POSErrorBoundaryProps,
  { hasError: boolean; error?: Error; errorInfo?: POSErrorInfo }
> {
  constructor(props: POSErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Determine error type
    let errorType: POSErrorType = POSErrorType.COMPONENT_RENDER
    let recoverable = true

    if (error.message.includes('payment')) {
      errorType = POSErrorType.PAYMENT_PROCESSING
      recoverable = true
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = POSErrorType.NETWORK_FAILURE
      recoverable = true
    } else if (error.message.includes('session') || error.message.includes('state')) {
      errorType = POSErrorType.STATE_MANAGEMENT
      recoverable = true
    } else if (error instanceof POSError) {
      errorType = error.type
      recoverable = error.recoverable
    }

    const posErrorInfo: POSErrorInfo = {
      type: errorType,
      recoverable,
      sessionData: this.props.sessionData ?? undefined,
      componentStack: errorInfo.componentStack || undefined,
      timestamp: new Date()
    }

    // Save emergency backup if we have session data
    if (this.props.sessionData && recoverable) {
      SessionRecovery.saveEmergencyBackup(this.props.sessionData)
    }

    // Log the error
    ErrorLogger.logError(error, posErrorInfo)

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({ errorInfo: posErrorInfo })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || POSErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Main POS Error Boundary wrapper component
 */
export function POSErrorBoundary({ 
  children, 
  fallback,
  onError,
  sessionData 
}: POSErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('POS Error Boundary caught an error:', error, errorInfo)
    
    if (onError) {
      onError(error, errorInfo)
    }
  }

  return (
    <ErrorBoundary
      FallbackComponent={(props: FallbackProps) => {
        const FallbackComp = fallback || POSErrorFallback
        return <FallbackComp {...props} />
      }}
      onError={handleError}
    >
      <POSErrorBoundaryClass
        fallback={fallback}
        onError={onError}
        sessionData={sessionData}
      >
        {children}
      </POSErrorBoundaryClass>
    </ErrorBoundary>
  )
}

// Export utilities for use in other components
export { SessionRecovery, ErrorLogger }

// Export error boundary hook for functional components
export function usePOSErrorHandler() {
  const handleError = React.useCallback((error: Error, userAction?: string) => {
    const posError = new POSError(
      error.message,
      POSErrorType.UNKNOWN,
      true,
      undefined,
      userAction
    )
    
    throw posError
  }, [])

  const saveEmergencyBackup = React.useCallback((sessionData: any) => {
    SessionRecovery.saveEmergencyBackup(sessionData)
  }, [])

  return {
    handleError,
    saveEmergencyBackup,
    hasBackup: SessionRecovery.hasEmergencyBackup(),
    getBackup: SessionRecovery.getEmergencyBackup,
    clearBackup: SessionRecovery.clearEmergencyBackup
  }
}