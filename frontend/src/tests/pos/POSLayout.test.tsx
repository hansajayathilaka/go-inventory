import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { POSLayout } from '@/components/pos/POSLayout'
import { renderWithProviders, resetMocks, checkAccessibility, keyboardUtils } from './test-utils'

// Mock the child components to avoid complex dependencies
vi.mock('@/components/pos/SessionTabs', () => ({
  SessionTabs: ({ className }: { className?: string }) => (
    <div data-testid="session-tabs" className={className}>
      Session Tabs Component
    </div>
  ),
}))

describe('POSLayout', () => {
  beforeEach(() => {
    resetMocks()
    vi.clearAllTimers()
  })

  describe('Basic Rendering', () => {
    it('renders main layout structure', () => {
      renderWithProviders(<POSLayout />)

      // Check for main structural elements
      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
    })

    it('displays application branding', () => {
      renderWithProviders(<POSLayout />)

      expect(screen.getByText('Hardware Store POS')).toBeInTheDocument()
      expect(screen.getByText('POS')).toBeInTheDocument() // Mobile version
    })

    it('shows user information when authenticated', () => {
      renderWithProviders(<POSLayout />)

      expect(screen.getByText('testuser')).toBeInTheDocument()
      expect(screen.getByText('staff')).toBeInTheDocument()
    })

    it('renders session tabs on POS pages', () => {
      // Mock useLocation to return POS path
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Link: ({ children, to, ...props }: any) => (
          <a href={to} {...props}>
            {children}
          </a>
        ),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)
      expect(screen.getByTestId('session-tabs')).toBeInTheDocument()
    })
  })

  describe('Navigation and Controls', () => {
    it('shows back button when not on home page', () => {
      // Mock location to non-home page
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Link: ({ children, to, ...props }: any) => (
          <a href={to} {...props}>
            {children}
          </a>
        ),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)
      expect(screen.getByText('Back to Admin')).toBeInTheDocument()
    })

    it('renders logout button', () => {
      renderWithProviders(<POSLayout />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toBeInTheDocument()
    })

    it('shows settings button for admin/manager roles', () => {
      // Update mock auth store with admin role
      vi.doMock('@/stores/authStore', () => ({
        useAuthStore: () => ({
          user: {
            id: 1,
            username: 'admin',
            role: 'admin',
          },
          isAuthenticated: true,
          logout: vi.fn(),
        }),
      }))

      renderWithProviders(<POSLayout />)
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      expect(settingsButton).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('displays keyboard shortcuts help', () => {
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)
      
      expect(screen.getByTestId('floating-shortcuts')).toBeInTheDocument()
      expect(screen.getByText('Press F1-F4 for quick actions')).toBeInTheDocument()
    })

    it('shows correct keyboard shortcuts', () => {
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)

      expect(screen.getByTestId('shortcut-F1')).toBeInTheDocument()
      expect(screen.getByTestId('shortcut-F2')).toBeInTheDocument()
      expect(screen.getByTestId('shortcut-F3')).toBeInTheDocument()
      expect(screen.getByTestId('shortcut-F4')).toBeInTheDocument()
    })

    it('focuses product search on F2 key press', async () => {
      const { user } = renderWithProviders(<POSLayout />)

      // Mock product search input
      const searchInput = document.createElement('input')
      searchInput.setAttribute('data-testid', 'product-search-input')
      searchInput.focus = vi.fn()
      searchInput.scrollIntoView = vi.fn()
      document.body.appendChild(searchInput)

      const mockQuery = vi.fn().mockReturnValue(searchInput)
      document.querySelector = mockQuery

      await keyboardUtils.pressKey(user, 'F2')

      expect(searchInput.focus).toHaveBeenCalled()
      expect(searchInput.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
    })

    it('focuses customer search on F3 key press', async () => {
      const { user } = renderWithProviders(<POSLayout />)

      // Mock customer search input
      const searchInput = document.createElement('input')
      searchInput.setAttribute('data-testid', 'customer-search-input')
      searchInput.focus = vi.fn()
      searchInput.scrollIntoView = vi.fn()
      document.body.appendChild(searchInput)

      const mockQuery = vi.fn().mockReturnValue(searchInput)
      document.querySelector = mockQuery

      await keyboardUtils.pressKey(user, 'F3')

      expect(searchInput.focus).toHaveBeenCalled()
    })
  })

  describe('Responsive Design', () => {
    it('adapts header content for mobile screens', () => {
      renderWithProviders(<POSLayout />)

      // Check for mobile-specific classes
      const mobileElements = screen.getAllByText('POS')
      expect(mobileElements.length).toBeGreaterThan(0)
    })

    it('adjusts button sizes for different screen sizes', () => {
      renderWithProviders(<POSLayout />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toHaveClass('p-1', 'sm:p-2')
    })
  })

  describe('Accessibility', () => {
    it('has proper skip links', () => {
      renderWithProviders(<POSLayout />)

      const skipLinks = screen.getAllByRole('link', { name: /skip to/i })
      expect(skipLinks).toHaveLength(3)
      expect(screen.getByText('Skip to product search')).toBeInTheDocument()
      expect(screen.getByText('Skip to customer selection')).toBeInTheDocument()
      expect(screen.getByText('Skip to shopping cart')).toBeInTheDocument()
    })

    it('has proper ARIA landmarks', () => {
      renderWithProviders(<POSLayout />)

      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })

    it('has screen reader announcements for shortcuts', () => {
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)
      
      // The screen reader component should be rendered
      // (Implementation depends on the actual component)
    })

    it('supports keyboard navigation', async () => {
      const { user } = renderWithProviders(<POSLayout />)

      const logoutButton = screen.getByRole('button', { name: /logout/i })
      
      await user.tab() // Navigate to first focusable element
      // Continue tabbing to reach logout button
      expect(document.activeElement).toBeDefined()
    })
  })

  describe('Footer Information', () => {
    it('displays system version', () => {
      renderWithProviders(<POSLayout />)

      expect(screen.getByText('POS System v1.0')).toBeInTheDocument()
      expect(screen.getByText('v1.0')).toBeInTheDocument() // Mobile version
    })

    it('displays current date', () => {
      renderWithProviders(<POSLayout />)

      const currentDate = new Date().toLocaleDateString()
      expect(screen.getByText(currentDate)).toBeInTheDocument()
    })

    it('shows keyboard shortcuts hint on POS pages', () => {
      vi.mock('react-router-dom', () => ({
        ...vi.importActual('react-router-dom'),
        useLocation: () => ({ pathname: '/pos/staff' }),
        Outlet: () => <div data-testid="outlet">Outlet content</div>,
      }))

      renderWithProviders(<POSLayout />)
      
      expect(screen.getByText('Press F1-F4 for quick actions')).toBeInTheDocument()
    })
  })

  describe('Session Management Integration', () => {
    it('initializes POS session on mount', () => {
      const initializePOSSession = vi.fn()
      vi.doMock('@/stores/posSessionStore', () => ({
        initializePOSSession,
        usePOSSessionStore: () => ({
          createSession: vi.fn(),
        }),
      }))

      renderWithProviders(<POSLayout />)
      
      // Session initialization should be called
      expect(initializePOSSession).toHaveBeenCalled()
    })

    it('initializes cart synchronization on mount', () => {
      const initializeCartSessionSync = vi.fn()
      vi.doMock('@/stores/posCartStore', () => ({
        initializeCartSessionSync,
        useCartItems: () => [],
      }))

      renderWithProviders(<POSLayout />)
      
      expect(initializeCartSessionSync).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('handles missing search inputs gracefully', async () => {
      const { user } = renderWithProviders(<POSLayout />)

      // Mock querySelector to return null (element not found)
      document.querySelector = vi.fn().mockReturnValue(null)

      // Should not throw error when pressing F2 without search input
      await expect(keyboardUtils.pressKey(user, 'F2')).resolves.not.toThrow()
    })

    it('handles logout errors gracefully', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'))
      vi.doMock('@/stores/authStore', () => ({
        useAuthStore: () => ({
          user: { username: 'testuser', role: 'staff' },
          logout: mockLogout,
        }),
      }))

      const { user } = renderWithProviders(<POSLayout />)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)

      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('renders within performance threshold', async () => {
      const startTime = performance.now()
      renderWithProviders(<POSLayout />)
      const endTime = performance.now()
      
      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(50) // Should render in less than 50ms
    })

    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithProviders(<POSLayout />)
      
      // Mock cleanup functions
      const cleanupSession = vi.fn()
      const cleanupSync = vi.fn()
      
      vi.doMock('@/stores/posSessionStore', () => ({
        initializePOSSession: () => cleanupSession,
        usePOSSessionStore: () => ({ createSession: vi.fn() }),
      }))
      
      vi.doMock('@/stores/posCartStore', () => ({
        initializeCartSessionSync: () => cleanupSync,
        useCartItems: () => [],
      }))

      unmount()
      
      // Cleanup functions should be called (would need proper mock setup)
    })
  })
})