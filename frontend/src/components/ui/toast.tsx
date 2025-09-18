import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Define ToastNotification type locally for now
interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}

/**
 * Toast Notification System
 * 
 * Provides user-friendly error messages, network status updates,
 * and action buttons for error recovery in the POS system.
 */

// Toast context
interface ToastContextType {
  toasts: ToastNotification[]
  addToast: (toast: Omit<ToastNotification, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

// Toast item component
interface ToastItemProps {
  toast: ToastNotification
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // Auto-remove after duration
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove()
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration])

  // Animation effect
  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300) // Match animation duration
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg"
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400`
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-blue-400`
    }
  }

  return (
    <div
      className={cn(
        "relative max-w-sm w-full bg-white rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform",
        getStyles(),
        {
          "translate-x-0 opacity-100": isVisible && !isLeaving,
          "translate-x-full opacity-0": !isVisible || isLeaving,
        }
      )}
    >
      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {toast.message}
            </p>
            {toast.action && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.action!.handler()
                    handleRemove()
                  }}
                  className="text-sm"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleRemove}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Network status toast component
interface NetworkStatusToastProps {
  isOnline: boolean
  onRetry?: () => void
}

function NetworkStatusToast({ isOnline, onRetry }: NetworkStatusToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShow(true)
    } else {
      // Hide after a short delay when coming back online
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className={cn(
          "bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm transition-all duration-300",
          isOnline 
            ? "border-green-400 bg-green-50" 
            : "border-red-400 bg-red-50"
        )}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {isOnline ? 'Connection Restored' : 'Connection Lost'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isOnline 
                ? 'You are back online. Queued operations will be processed.'
                : 'You are offline. Some features may be limited.'
              }
            </p>
            {!isOnline && onRetry && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="text-sm"
                >
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
              onClick={() => setShow(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast container component
interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  maxToasts?: number
}

function ToastContainer({ 
  position = 'top-right', 
  maxToasts = 5 
}: ToastContainerProps) {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('ToastContainer must be used within a ToastProvider')
  }

  const { toasts, removeToast } = context

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-right':
      default:
        return 'top-4 right-4'
    }
  }

  // Limit the number of visible toasts
  const visibleToasts = toasts.slice(-maxToasts)

  return (
    <div className={cn('fixed z-50 space-y-2', getPositionStyles())}>
      {visibleToasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

// Toast provider component
interface ToastProviderProps {
  children: React.ReactNode
  showNetworkStatus?: boolean
}

export function ToastProvider({ children, showNetworkStatus = true }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastNotification = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAll
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
      {showNetworkStatus && (
        <NetworkStatusToast 
          isOnline={isOnline}
          onRetry={() => window.location.reload()}
        />
      )}
    </ToastContext.Provider>
  )
}

// Toast hook for components
function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast, removeToast, clearAll } = context

  const toast = React.useMemo(() => ({
    success: (title: string, message: string) => 
      addToast({ type: 'success', title, message, duration: 4000 }),
    
    error: (title: string, message: string, action?: ToastNotification['action']) => 
      addToast({ type: 'error', title, message, action, duration: 8000 }),
    
    warning: (title: string, message: string, action?: ToastNotification['action']) => 
      addToast({ type: 'warning', title, message, action, duration: 6000 }),
    
    info: (title: string, message: string) => 
      addToast({ type: 'info', title, message, duration: 5000 }),

    custom: (toast: Omit<ToastNotification, 'id'>) => addToast(toast),

    dismiss: removeToast,
    
    clear: clearAll
  }), [addToast, removeToast, clearAll])

  return toast
}

// POS-specific toast notifications
function usePOSToast() {
  const toast = useToast()

  return {
    ...toast,
    
    // Payment-specific toasts
    paymentSuccess: (amount: string, method: string) =>
      toast.success('Payment Processed', `${method} payment of ${amount} completed successfully`),
    
    paymentError: (error: string, retryFn?: () => void) =>
      toast.error('Payment Failed', error, retryFn ? { label: 'Retry Payment', handler: retryFn } : undefined),
    
    // Network-specific toasts
    networkError: (operation: string, retryFn?: () => void) =>
      toast.error('Network Error', `Failed to ${operation}. Please check your connection.`, 
        retryFn ? { label: 'Retry', handler: retryFn } : undefined),
    
    offline: (operation: string) =>
      toast.warning('Offline Mode', `${operation} will be processed when connection is restored.`),
    
    // Validation toasts
    validationError: (field: string, message: string) =>
      toast.warning('Validation Error', `${field}: ${message}`),
    
    // Stock-specific toasts
    stockWarning: (product: string, available: number) =>
      toast.warning('Low Stock', `Only ${available} units of ${product} available`),
    
    stockError: (product: string) =>
      toast.error('Out of Stock', `${product} is not available`),
    
    // Session toasts
    sessionExpired: () =>
      toast.error('Session Expired', 'Please log in again to continue', {
        label: 'Login',
        handler: () => window.location.href = '/login'
      }),
    
    sessionRecovered: () =>
      toast.success('Session Recovered', 'Your previous session has been restored'),
    
    // Transaction toasts
    transactionQueued: (description: string) =>
      toast.info('Transaction Queued', `${description} will be processed when connection is restored`),
    
    transactionCompleted: (receiptNumber: string) =>
      toast.success('Sale Completed', `Receipt #${receiptNumber} generated successfully`),
  }
}

// Export components and types
export { ToastContainer, NetworkStatusToast }
export { useToast, usePOSToast }
export type { ToastNotification }