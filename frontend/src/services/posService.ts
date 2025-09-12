import { apiClient } from './api'
import { POSError, POSErrorType } from '@/components/pos/POSErrorBoundary'

/**
 * Enhanced POS Service with comprehensive network error handling
 * 
 * This service provides intelligent retry logic, offline mode detection,
 * transaction queuing, and contextual error messages for POS operations.
 */

// Network configuration
const NETWORK_CONFIG = {
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY: 1000, // 1 second
  MAX_RETRY_DELAY: 10000, // 10 seconds
  TIMEOUT: 30000, // 30 seconds
  OFFLINE_CHECK_INTERVAL: 5000, // 5 seconds
}

// Error types mapping
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request data. Please check your inputs and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'Conflict detected. The data may have been changed by another user.',
  422: 'Validation failed. Please check your data and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Please try again in a few moments.',
  502: 'Service temporarily unavailable. Please try again.',
  503: 'Service under maintenance. Please try again later.',
  504: 'Request timeout. Please check your connection and try again.'
}

// Network status tracking
class NetworkStatus {
  private static instance: NetworkStatus
  private isOnline: boolean = navigator.onLine
  private listeners: Set<(isOnline: boolean) => void> = new Set()
  private checkInterval?: number

  static getInstance(): NetworkStatus {
    if (!NetworkStatus.instance) {
      NetworkStatus.instance = new NetworkStatus()
    }
    return NetworkStatus.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
      this.startPeriodicCheck()
    }
  }

  private handleOnline = () => {
    if (!this.isOnline) {
      this.isOnline = true
      this.notifyListeners()
    }
  }

  private handleOffline = () => {
    if (this.isOnline) {
      this.isOnline = false
      this.notifyListeners()
    }
  }

  private startPeriodicCheck() {
    this.checkInterval = window.setInterval(async () => {
      try {
        // Try to fetch a small resource to test connectivity
        await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        })
        
        if (!this.isOnline) {
          this.handleOnline()
        }
      } catch {
        if (this.isOnline) {
          this.handleOffline()
        }
      }
    }, NETWORK_CONFIG.OFFLINE_CHECK_INTERVAL)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  get online(): boolean {
    return this.isOnline
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

// Transaction queue for retry when connection returns
interface QueuedTransaction {
  id: string
  operation: () => Promise<any>
  retries: number
  timestamp: Date
  description: string
}

class TransactionQueue {
  private static instance: TransactionQueue
  private queue: Map<string, QueuedTransaction> = new Map()
  private processing: boolean = false

  static getInstance(): TransactionQueue {
    if (!TransactionQueue.instance) {
      TransactionQueue.instance = new TransactionQueue()
    }
    return TransactionQueue.instance
  }

  add(transaction: Omit<QueuedTransaction, 'retries' | 'timestamp'>): string {
    const queuedTransaction: QueuedTransaction = {
      ...transaction,
      retries: 0,
      timestamp: new Date()
    }
    
    this.queue.set(transaction.id, queuedTransaction)
    return transaction.id
  }

  remove(id: string): boolean {
    return this.queue.delete(id)
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.size === 0) {
      return
    }

    this.processing = true

    try {
      const transactions = Array.from(this.queue.values())
      const processPromises = transactions.map(async (transaction) => {
        try {
          await transaction.operation()
          this.queue.delete(transaction.id)
          console.log(`Queued transaction completed: ${transaction.description}`)
        } catch (error) {
          transaction.retries++
          
          if (transaction.retries >= NETWORK_CONFIG.MAX_RETRIES) {
            this.queue.delete(transaction.id)
            console.error(`Queued transaction failed permanently: ${transaction.description}`, error)
          } else {
            console.warn(`Queued transaction retry ${transaction.retries}: ${transaction.description}`)
          }
        }
      })

      await Promise.allSettled(processPromises)
    } finally {
      this.processing = false
    }
  }

  get size(): number {
    return this.queue.size
  }

  clear(): void {
    this.queue.clear()
  }
}

// Enhanced retry logic with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = NETWORK_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain error types
      if (error.response?.status && [400, 401, 403, 404, 422].includes(error.response.status)) {
        break
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        NETWORK_CONFIG.BASE_RETRY_DELAY * Math.pow(2, attempt),
        NETWORK_CONFIG.MAX_RETRY_DELAY
      )
      const jitteredDelay = delay + Math.random() * 1000

      console.warn(`${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${jitteredDelay}ms:`, error.message)
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }

  throw lastError
}

// Enhanced error handling
function createPOSError(error: any, context: string): POSError {
  let message = `${context} failed`
  let type = POSErrorType.UNKNOWN
  let recoverable = true

  if (error.response) {
    // HTTP error response
    const status = error.response.status
    message = HTTP_ERROR_MESSAGES[status] || `HTTP ${status}: ${context} failed`
    
    if (status >= 500) {
      type = POSErrorType.NETWORK_FAILURE
      recoverable = true
    } else if (status === 401) {
      type = POSErrorType.VALIDATION_ERROR
      recoverable = false // Requires re-authentication
    } else if (status === 409) {
      type = POSErrorType.STATE_MANAGEMENT
      recoverable = true
    } else {
      type = POSErrorType.VALIDATION_ERROR
      recoverable = true
    }
  } else if (error.request) {
    // Network error
    message = 'Network connection failed. Please check your internet connection.'
    type = POSErrorType.NETWORK_FAILURE
    recoverable = true
  } else if (error.message?.includes('timeout')) {
    message = 'Request timed out. Please try again.'
    type = POSErrorType.NETWORK_FAILURE
    recoverable = true
  }

  return new POSError(message, type, recoverable, null, context)
}

// Toast notification interface
export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  action?: {
    label: string
    handler: () => void
  }
  duration?: number
}

// Toast notification manager
class ToastManager {
  private static instance: ToastManager
  private listeners: Set<(notification: ToastNotification) => void> = new Set()

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager()
    }
    return ToastManager.instance
  }

  subscribe(listener: (notification: ToastNotification) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  show(notification: Omit<ToastNotification, 'id'>): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fullNotification: ToastNotification = { ...notification, id }
    
    this.listeners.forEach(listener => listener(fullNotification))
    return id
  }

  showError(title: string, message: string, action?: ToastNotification['action']): string {
    return this.show({
      type: 'error',
      title,
      message,
      action,
      duration: 8000
    })
  }

  showWarning(title: string, message: string, action?: ToastNotification['action']): string {
    return this.show({
      type: 'warning',
      title,
      message,
      action,
      duration: 6000
    })
  }

  showSuccess(title: string, message: string): string {
    return this.show({
      type: 'success',
      title,
      message,
      duration: 4000
    })
  }

  showInfo(title: string, message: string): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration: 5000
    })
  }
}

// Main POS Service class
export class POSService {
  private networkStatus: NetworkStatus
  private transactionQueue: TransactionQueue
  private toastManager: ToastManager

  constructor() {
    this.networkStatus = NetworkStatus.getInstance()
    this.transactionQueue = TransactionQueue.getInstance()
    this.toastManager = ToastManager.getInstance()

    // Set up network status monitoring
    this.networkStatus.subscribe((isOnline) => {
      if (isOnline) {
        this.toastManager.showSuccess(
          'Connection Restored',
          'Processing queued transactions...'
        )
        this.transactionQueue.processQueue()
      } else {
        this.toastManager.showWarning(
          'Connection Lost',
          'Working offline. Transactions will be queued.',
          {
            label: 'Retry Connection',
            handler: () => window.location.reload()
          }
        )
      }
    })
  }

  // Network-aware API call wrapper
  async makeRequest<T>(
    operation: () => Promise<T>,
    context: string,
    options: {
      queueOnOffline?: boolean
      showToast?: boolean
      criticalOperation?: boolean
    } = {}
  ): Promise<T> {
    const { queueOnOffline = false, showToast = true, criticalOperation = false } = options

    // Check if we're offline
    if (!this.networkStatus.online) {
      if (queueOnOffline) {
        const queueId = this.transactionQueue.add({
          id: `${context}_${Date.now()}`,
          operation,
          description: context
        })

        if (showToast) {
          this.toastManager.showInfo(
            'Queued for Later',
            `${context} will be processed when connection is restored.`
          )
        }

        throw new POSError(
          'Operation queued due to offline status',
          POSErrorType.NETWORK_FAILURE,
          true,
          null,
          context
        )
      } else {
        const error = new POSError(
          'Cannot perform this operation while offline',
          POSErrorType.NETWORK_FAILURE,
          true,
          null,
          context
        )

        if (showToast) {
          this.toastManager.showError(
            'Offline Mode',
            error.message,
            {
              label: 'Retry',
              handler: () => this.makeRequest(operation, context, options)
            }
          )
        }

        throw error
      }
    }

    try {
      return await withRetry(operation, context)
    } catch (error: any) {
      const posError = createPOSError(error, context)

      if (showToast) {
        if (posError.recoverable) {
          this.toastManager.showError(
            'Operation Failed',
            posError.message,
            {
              label: 'Retry',
              handler: () => this.makeRequest(operation, context, options)
            }
          )
        } else {
          this.toastManager.showError(
            'Critical Error',
            posError.message
          )
        }
      }

      throw posError
    }
  }

  // Product search with error handling
  async searchProducts(query: string): Promise<any[]> {
    return this.makeRequest(
      () => apiClient.get(`/products/search?q=${encodeURIComponent(query)}`),
      'Product search',
      { showToast: false }
    )
  }

  // Customer search with error handling
  async searchCustomers(query: string): Promise<any[]> {
    return this.makeRequest(
      () => apiClient.get(`/customers/search?q=${encodeURIComponent(query)}`),
      'Customer search',
      { showToast: false }
    )
  }

  // Create customer with error handling and queueing
  async createCustomer(customerData: any): Promise<any> {
    return this.makeRequest(
      () => apiClient.post('/customers', customerData),
      'Create customer',
      { queueOnOffline: true, criticalOperation: true }
    )
  }

  // Complete sale with comprehensive error handling
  async completeSale(saleData: any): Promise<any> {
    return this.makeRequest(
      () => apiClient.post('/sales', saleData),
      'Complete sale',
      { queueOnOffline: true, criticalOperation: true }
    )
  }

  // Stock check with error handling
  async checkStock(productId: number): Promise<any> {
    return this.makeRequest(
      () => apiClient.get(`/products/${productId}/stock`),
      'Check stock',
      { showToast: false }
    )
  }

  // Session management
  async createSession(): Promise<any> {
    return this.makeRequest(
      () => apiClient.post('/pos/sessions'),
      'Create session'
    )
  }

  async updateSession(sessionId: string, data: any): Promise<any> {
    return this.makeRequest(
      () => apiClient.put(`/pos/sessions/${sessionId}`, data),
      'Update session',
      { queueOnOffline: true }
    )
  }

  async closeSession(sessionId: string): Promise<any> {
    return this.makeRequest(
      () => apiClient.delete(`/pos/sessions/${sessionId}`),
      'Close session',
      { queueOnOffline: true }
    )
  }

  // Utility methods
  get isOnline(): boolean {
    return this.networkStatus.online
  }

  get queueSize(): number {
    return this.transactionQueue.size
  }

  subscribeToNetworkStatus(callback: (isOnline: boolean) => void): () => void {
    return this.networkStatus.subscribe(callback)
  }

  subscribeToToasts(callback: (notification: ToastNotification) => void): () => void {
    return this.toastManager.subscribe(callback)
  }

  clearQueue(): void {
    this.transactionQueue.clear()
  }

  // Error boundary integration
  handleComponentError(error: Error, context: string): void {
    const posError = createPOSError(error, context)
    this.toastManager.showError(
      'Component Error',
      posError.message,
      {
        label: 'Refresh Page',
        handler: () => window.location.reload()
      }
    )
  }

  // Test connectivity
  async testConnectivity(): Promise<boolean> {
    try {
      await this.makeRequest(
        () => apiClient.get('/health'),
        'Connectivity test',
        { showToast: false }
      )
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const posService = new POSService()

// Export types and utilities
export { ToastManager, NetworkStatus, TransactionQueue }
export type { ToastNotification }