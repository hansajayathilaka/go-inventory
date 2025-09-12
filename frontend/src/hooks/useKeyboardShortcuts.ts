import { useEffect, useCallback, useRef, useState } from 'react'
import { usePOSSessionStore } from '@/stores/posSessionStore'
import { useCartItems } from '@/stores/posCartStore'

// Define the available keyboard shortcuts
export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: string
}

// Context-aware shortcut configuration
export interface ShortcutContext {
  name: string
  shortcuts: KeyboardShortcut[]
}

// Available shortcut contexts for different POS screens
export const SHORTCUT_CONTEXTS = {
  GLOBAL: 'global',
  PRODUCT_SEARCH: 'productSearch', 
  CUSTOMER_SELECT: 'customerSelect',
  SHOPPING_CART: 'shoppingCart',
  PAYMENT: 'payment',
  SESSION_MANAGEMENT: 'sessionManagement'
} as const

export type ShortcutContextType = typeof SHORTCUT_CONTEXTS[keyof typeof SHORTCUT_CONTEXTS]

// Define shortcuts for each context
export const KEYBOARD_SHORTCUTS: Record<ShortcutContextType, KeyboardShortcut[]> = {
  [SHORTCUT_CONTEXTS.GLOBAL]: [
    { key: 'F1', description: 'Create new session', action: 'NEW_SESSION' },
    { key: 'F2', description: 'Focus product search', action: 'FOCUS_PRODUCT_SEARCH' },
    { key: 'F3', description: 'Focus customer search', action: 'FOCUS_CUSTOMER_SEARCH' },
    { key: 'F4', description: 'Process payment (if cart has items)', action: 'PROCESS_PAYMENT' },
    { key: 'Escape', description: 'Cancel current action/close modals', action: 'CANCEL_CLOSE' },
    { key: 'Tab', description: 'Navigate to next section', action: 'NAVIGATE_NEXT' },
    { key: 'Tab', shiftKey: true, description: 'Navigate to previous section', action: 'NAVIGATE_PREV' }
  ],
  [SHORTCUT_CONTEXTS.PRODUCT_SEARCH]: [
    { key: 'ArrowDown', description: 'Navigate down in search results', action: 'NAVIGATE_DOWN' },
    { key: 'ArrowUp', description: 'Navigate up in search results', action: 'NAVIGATE_UP' },
    { key: 'Enter', description: 'Select highlighted product', action: 'SELECT_PRODUCT' },
    { key: 'Escape', description: 'Clear search and close results', action: 'CLEAR_SEARCH' }
  ],
  [SHORTCUT_CONTEXTS.CUSTOMER_SELECT]: [
    { key: 'ArrowDown', description: 'Navigate down in customer list', action: 'NAVIGATE_DOWN' },
    { key: 'ArrowUp', description: 'Navigate up in customer list', action: 'NAVIGATE_UP' },
    { key: 'Enter', description: 'Select highlighted customer', action: 'SELECT_CUSTOMER' },
    { key: 'Escape', description: 'Clear customer selection', action: 'CLEAR_CUSTOMER' }
  ],
  [SHORTCUT_CONTEXTS.SHOPPING_CART]: [
    { key: 'Delete', description: 'Remove selected item from cart', action: 'REMOVE_ITEM' },
    { key: 'Plus', description: 'Increase item quantity', action: 'INCREASE_QUANTITY' },
    { key: 'Minus', description: 'Decrease item quantity', action: 'DECREASE_QUANTITY' },
    { key: 'Enter', description: 'Proceed to checkout', action: 'PROCEED_CHECKOUT' }
  ],
  [SHORTCUT_CONTEXTS.PAYMENT]: [
    { key: 'Enter', description: 'Process payment', action: 'PROCESS_PAYMENT' },
    { key: 'Escape', description: 'Return to cart', action: 'RETURN_TO_CART' },
    { key: 'Tab', description: 'Navigate between payment fields', action: 'NAVIGATE_FIELDS' }
  ],
  [SHORTCUT_CONTEXTS.SESSION_MANAGEMENT]: [
    { key: '1', ctrlKey: true, description: 'Switch to session 1', action: 'SWITCH_SESSION_1' },
    { key: '2', ctrlKey: true, description: 'Switch to session 2', action: 'SWITCH_SESSION_2' },
    { key: '3', ctrlKey: true, description: 'Switch to session 3', action: 'SWITCH_SESSION_3' },
    { key: '4', ctrlKey: true, description: 'Switch to session 4', action: 'SWITCH_SESSION_4' },
    { key: '5', ctrlKey: true, description: 'Switch to session 5', action: 'SWITCH_SESSION_5' },
    { key: 'w', ctrlKey: true, description: 'Close current session', action: 'CLOSE_SESSION' }
  ]
}

// Action handlers interface
export interface ShortcutHandlers {
  // Global actions
  onNewSession?: () => void
  onFocusProductSearch?: () => void
  onFocusCustomerSearch?: () => void
  onProcessPayment?: () => void
  onCancel?: () => void
  onNavigateNext?: () => void
  onNavigatePrev?: () => void
  
  // Product search actions
  onNavigateDown?: () => void
  onNavigateUp?: () => void
  onSelectProduct?: () => void
  onClearSearch?: () => void
  
  // Customer select actions
  onSelectCustomer?: () => void
  onClearCustomer?: () => void
  
  // Shopping cart actions
  onRemoveItem?: () => void
  onIncreaseQuantity?: () => void
  onDecreaseQuantity?: () => void
  onProceedCheckout?: () => void
  
  // Payment actions
  onReturnToCart?: () => void
  onNavigateFields?: () => void
  
  // Session management actions
  onSwitchSession?: (sessionNumber: number) => void
  onCloseSession?: () => void
}

// Hook options
export interface UseKeyboardShortcutsOptions {
  context: ShortcutContextType
  handlers: ShortcutHandlers
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
}

// Main hook
export function useKeyboardShortcuts({
  context,
  handlers,
  enabled = true,
  preventDefault = true,
  stopPropagation = true
}: UseKeyboardShortcutsOptions) {
  const [activeShortcuts, setActiveShortcuts] = useState<KeyboardShortcut[]>([])
  const handlersRef = useRef(handlers)
  const { sessions, activeSessionId, createSession, switchToSession, closeSession } = usePOSSessionStore()
  const cartItems = useCartItems()

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  // Update active shortcuts based on context
  useEffect(() => {
    const globalShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.GLOBAL]
    const contextShortcuts = KEYBOARD_SHORTCUTS[context] || []
    const sessionShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.SESSION_MANAGEMENT]
    
    setActiveShortcuts([...globalShortcuts, ...contextShortcuts, ...sessionShortcuts])
  }, [context])

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const { key, ctrlKey, shiftKey, altKey } = event

    // Find matching shortcut
    const matchingShortcut = activeShortcuts.find(shortcut => 
      shortcut.key === key &&
      Boolean(shortcut.ctrlKey) === ctrlKey &&
      Boolean(shortcut.shiftKey) === shiftKey &&
      Boolean(shortcut.altKey) === altKey
    )

    if (!matchingShortcut) return

    // Prevent conflicts with browser shortcuts for function keys
    const preventDefaultKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F11', 'F12']
    if (preventDefaultKeys.includes(key) || preventDefault) {
      event.preventDefault()
    }
    
    if (stopPropagation) {
      event.stopPropagation()
    }

    // Execute action based on shortcut
    const currentHandlers = handlersRef.current
    
    switch (matchingShortcut.action) {
      // Global actions
      case 'NEW_SESSION':
        if (currentHandlers.onNewSession) {
          currentHandlers.onNewSession()
        } else {
          // Default session creation
          createSession()
        }
        break
        
      case 'FOCUS_PRODUCT_SEARCH':
        currentHandlers.onFocusProductSearch?.()
        break
        
      case 'FOCUS_CUSTOMER_SEARCH':
        currentHandlers.onFocusCustomerSearch?.()
        break
        
      case 'PROCESS_PAYMENT':
        // Only allow payment if cart has items
        if (cartItems.length > 0) {
          currentHandlers.onProcessPayment?.()
        }
        break
        
      case 'CANCEL_CLOSE':
        currentHandlers.onCancel?.()
        break
        
      case 'NAVIGATE_NEXT':
        currentHandlers.onNavigateNext?.()
        break
        
      case 'NAVIGATE_PREV':
        currentHandlers.onNavigatePrev?.()
        break

      // Product search actions
      case 'NAVIGATE_DOWN':
        currentHandlers.onNavigateDown?.()
        break
        
      case 'NAVIGATE_UP':
        currentHandlers.onNavigateUp?.()
        break
        
      case 'SELECT_PRODUCT':
        currentHandlers.onSelectProduct?.()
        break
        
      case 'CLEAR_SEARCH':
        currentHandlers.onClearSearch?.()
        break

      // Customer select actions
      case 'SELECT_CUSTOMER':
        currentHandlers.onSelectCustomer?.()
        break
        
      case 'CLEAR_CUSTOMER':
        currentHandlers.onClearCustomer?.()
        break

      // Shopping cart actions
      case 'REMOVE_ITEM':
        currentHandlers.onRemoveItem?.()
        break
        
      case 'INCREASE_QUANTITY':
        currentHandlers.onIncreaseQuantity?.()
        break
        
      case 'DECREASE_QUANTITY':
        currentHandlers.onDecreaseQuantity?.()
        break
        
      case 'PROCEED_CHECKOUT':
        if (cartItems.length > 0) {
          currentHandlers.onProceedCheckout?.()
        }
        break

      // Payment actions
      case 'RETURN_TO_CART':
        currentHandlers.onReturnToCart?.()
        break
        
      case 'NAVIGATE_FIELDS':
        currentHandlers.onNavigateFields?.()
        break

      // Session management actions
      case 'SWITCH_SESSION_1':
      case 'SWITCH_SESSION_2':
      case 'SWITCH_SESSION_3':
      case 'SWITCH_SESSION_4':
      case 'SWITCH_SESSION_5': {
        const sessionNumber = parseInt(matchingShortcut.key)
        if (currentHandlers.onSwitchSession) {
          currentHandlers.onSwitchSession(sessionNumber)
        } else if (sessions[sessionNumber - 1]) {
          // Default session switching
          switchToSession(sessions[sessionNumber - 1].id)
        }
        break
      }
        
      case 'CLOSE_SESSION':
        if (currentHandlers.onCloseSession) {
          currentHandlers.onCloseSession()
        } else if (sessions.length > 1) {
          // Default session closing
          if (activeSessionId) {
            closeSession(activeSessionId)
          }
        }
        break
    }
  }, [enabled, activeShortcuts, preventDefault, stopPropagation, sessions, activeSessionId, cartItems.length, createSession, switchToSession, closeSession])

  // Add global event listener
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown, { capture: true })
      return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true })
      }
    }
  }, [handleKeyDown, enabled])

  // Utility function to get shortcuts for current context
  const getShortcutsForContext = useCallback(() => {
    return activeShortcuts.filter(shortcut => {
      const contextShortcuts = KEYBOARD_SHORTCUTS[context] || []
      const globalShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.GLOBAL]
      const sessionShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.SESSION_MANAGEMENT]
      
      return contextShortcuts.includes(shortcut) || 
             globalShortcuts.includes(shortcut) || 
             sessionShortcuts.includes(shortcut)
    })
  }, [activeShortcuts, context])

  // Format shortcut key combination for display
  const formatShortcutKey = useCallback((shortcut: KeyboardShortcut) => {
    const parts: string[] = []
    
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    
    // Handle special keys
    let key = shortcut.key
    if (key === ' ') key = 'Space'
    if (key === 'ArrowUp') key = '↑'
    if (key === 'ArrowDown') key = '↓'
    if (key === 'ArrowLeft') key = '←'
    if (key === 'ArrowRight') key = '→'
    
    parts.push(key)
    
    return parts.join(' + ')
  }, [])

  return {
    activeShortcuts,
    getShortcutsForContext,
    formatShortcutKey,
    enabled
  }
}

// Hook for getting shortcut display information
export function useShortcutDisplay(context: ShortcutContextType) {
  const globalShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.GLOBAL]
  const contextShortcuts = KEYBOARD_SHORTCUTS[context] || []
  const sessionShortcuts = KEYBOARD_SHORTCUTS[SHORTCUT_CONTEXTS.SESSION_MANAGEMENT]
  
  const allShortcuts = [...globalShortcuts, ...contextShortcuts, ...sessionShortcuts]
  
  const formatShortcutKey = useCallback((shortcut: KeyboardShortcut) => {
    const parts: string[] = []
    
    if (shortcut.ctrlKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    
    let key = shortcut.key
    if (key === ' ') key = 'Space'
    if (key === 'ArrowUp') key = '↑'
    if (key === 'ArrowDown') key = '↓'
    if (key === 'ArrowLeft') key = '←'
    if (key === 'ArrowRight') key = '→'
    
    parts.push(key)
    
    return parts.join(' + ')
  }, [])

  return {
    shortcuts: allShortcuts,
    formatShortcutKey
  }
}

// Export shortcut-related utilities
export const ShortcutUtils = {
  isShortcutEnabled: (shortcut: KeyboardShortcut, cartHasItems: boolean = false) => {
    // Disable payment shortcuts if cart is empty
    if ((shortcut.action === 'PROCESS_PAYMENT' || shortcut.action === 'PROCEED_CHECKOUT') && !cartHasItems) {
      return false
    }
    return true
  },
  
  getShortcutsByAction: (action: string) => {
    const allShortcuts: KeyboardShortcut[] = []
    Object.values(KEYBOARD_SHORTCUTS).forEach(contextShortcuts => {
      allShortcuts.push(...contextShortcuts)
    })
    return allShortcuts.filter(shortcut => shortcut.action === action)
  }
}