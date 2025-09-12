import { useEffect, useCallback } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { SessionTabs } from './SessionTabs'
import { initializePOSSession, usePOSSessionStore } from '@/stores/posSessionStore'
import { initializeCartSessionSync, useCartItems } from '@/stores/posCartStore'
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks'
import { FloatingShortcuts } from '@/components/ui/keyboard-shortcut-badge'
import { useScreenReaderAnnouncements, AccessibilityUtils } from '@/components/ui/screen-reader-announcements'
import { 
  Store,
  LogOut,
  User,
  Settings,
  ArrowLeft,
  Keyboard
} from 'lucide-react'

interface POSLayoutProps {
  children?: React.ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { createSession } = usePOSSessionStore()
  const cartItems = useCartItems()
  const { announceShortcut, ScreenReaderComponent } = useScreenReaderAnnouncements()

  // Initialize POS session system and cart synchronization
  useEffect(() => {
    const cleanupSession = initializePOSSession()
    const cleanupSync = initializeCartSessionSync()
    
    return () => {
      cleanupSession()
      cleanupSync()
    }
  }, [])

  // Initialize accessibility features
  useEffect(() => {
    AccessibilityUtils.setupFocusIndicators()
  }, [])

  // Keyboard shortcut handlers
  const shortcutHandlers: ShortcutHandlers = {
    onNewSession: useCallback(() => {
      createSession()
      announceShortcut('F1', 'New session created')
    }, [createSession, announceShortcut]),
    
    onFocusProductSearch: useCallback(() => {
      const searchInput = document.querySelector('[data-testid="product-search-input"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        announceShortcut('F2', 'Product search focused')
        AccessibilityUtils.announceFocusChange('product search field')
      }
    }, [announceShortcut]),
    
    onFocusCustomerSearch: useCallback(() => {
      const customerSearchInput = document.querySelector('[data-testid="customer-search-input"]') as HTMLInputElement
      if (customerSearchInput) {
        customerSearchInput.focus()
        customerSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
        announceShortcut('F3', 'Customer search focused')
        AccessibilityUtils.announceFocusChange('customer search field')
      }
    }, [announceShortcut]),
    
    onProcessPayment: useCallback(() => {
      if (cartItems.length > 0) {
        const checkoutButton = document.querySelector('[data-testid="checkout-button"]') as HTMLButtonElement
        if (checkoutButton && !checkoutButton.disabled) {
          checkoutButton.click()
          announceShortcut('F4', 'Processing payment')
        }
      } else {
        announceShortcut('F4', 'Cannot process payment - cart is empty')
      }
    }, [cartItems.length, announceShortcut])
  }

  // Initialize keyboard shortcuts for global POS layout
  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.GLOBAL,
    handlers: shortcutHandlers,
    enabled: location.pathname.startsWith('/pos')
  })

  // Get relevant shortcuts for display
  const displayShortcuts = [
    { key: 'F1', description: 'New session', enabled: true },
    { key: 'F2', description: 'Focus product search', enabled: true },
    { key: 'F3', description: 'Focus customer search', enabled: true },
    { key: 'F4', description: 'Process payment', enabled: cartItems.length > 0 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal Header Bar - Responsive */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-2 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
          {/* Left side - App branding and back button */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-semibold text-sm sm:text-lg hidden sm:block">Hardware Store POS</span>
              <span className="font-semibold text-sm sm:hidden">POS</span>
            </div>
            
            {location.pathname !== '/' && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Admin
                </Link>
              </Button>
            )}
            
            {/* Mobile back button */}
            {location.pathname !== '/' && (
              <Button variant="ghost" size="sm" asChild className="sm:hidden p-1">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* Right side - User info and controls - Responsive */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Current user info */}
            {user && (
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 bg-gray-100 rounded-md">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                <span className="text-xs sm:text-sm font-medium hidden sm:block">{user.username}</span>
                <span className="text-xs text-gray-500 bg-white px-1 sm:px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-1">
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 p-1 sm:p-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Session Tabs - Only show when on POS pages */}
      {location.pathname.startsWith('/pos') && (
        <SessionTabs className="sticky top-12 sm:top-14 z-40" />
      )}

      {/* Main Content Area - Full width, distraction-free */}
      <main className="flex-1 flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Optional Footer for system info - Responsive */}
      <footer className="bg-white border-t px-2 sm:px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="hidden sm:block">POS System v1.0</span>
            <span className="sm:hidden">v1.0</span>
            {location.pathname.startsWith('/pos') && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span className="hidden sm:inline">Press F1-F4 for quick actions</span>
                <span className="sm:hidden">F1-F4</span>
              </div>
            )}
          </div>
          <span className="text-xs">{new Date().toLocaleDateString()}</span>
        </div>
      </footer>

      {/* Floating keyboard shortcuts help - Only show on POS pages */}
      {location.pathname.startsWith('/pos') && (
        <FloatingShortcuts
          shortcuts={displayShortcuts}
          position="bottom-right"
          className="mb-16 mr-4"
        />
      )}

      {/* Screen reader announcements */}
      {ScreenReaderComponent}
      
      {/* Skip links for accessibility */}
      <div className="sr-only">
        <a href="#product-search" className="focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded">
          Skip to product search
        </a>
        <a href="#customer-select" className="focus:not-sr-only focus:absolute focus:top-4 focus:left-32 bg-primary text-primary-foreground px-4 py-2 rounded">
          Skip to customer selection
        </a>
        <a href="#shopping-cart" className="focus:not-sr-only focus:absolute focus:top-4 focus:left-64 bg-primary text-primary-foreground px-4 py-2 rounded">
          Skip to shopping cart
        </a>
      </div>
    </div>
  )
}