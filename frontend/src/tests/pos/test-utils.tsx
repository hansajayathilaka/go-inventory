import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

// Mock Zustand stores
export const mockPOSSessionStore = {
  sessions: new Map(),
  activeSessionId: 'test-session-1',
  createSession: vi.fn(),
  switchSession: vi.fn(),
  closeSession: vi.fn(),
  updateSessionCart: vi.fn(),
  clearAllSessions: vi.fn(),
}

export const mockCartStore = {
  items: [],
  subtotal: 0,
  tax: 0,
  taxRate: 0.10,
  discount: 0,
  total: 0,
  itemCount: 0,
  sessionId: 'test-session-1',
  addItem: vi.fn().mockResolvedValue(true),
  removeItem: vi.fn(),
  updateQuantity: vi.fn().mockResolvedValue(true),
  applyDiscount: vi.fn(),
  removeDiscount: vi.fn(),
  clearCart: vi.fn(),
  validateStock: vi.fn().mockResolvedValue(true),
  calculateTotals: vi.fn(),
}

export const mockAuthStore = {
  user: {
    id: 1,
    username: 'testuser',
    role: 'staff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  token: 'test-token',
}

// Mock the stores at the module level
vi.mock('@/stores/posSessionStore', () => ({
  usePOSSessionStore: () => mockPOSSessionStore,
  initializePOSSession: vi.fn(),
}))

vi.mock('@/stores/posCartStore', () => ({
  usePOSCartStore: () => mockCartStore,
  useCartTotals: () => ({
    subtotal: mockCartStore.subtotal,
    tax: mockCartStore.tax,
    taxRate: mockCartStore.taxRate,
    discount: mockCartStore.discount,
    total: mockCartStore.total,
    itemCount: mockCartStore.itemCount,
  }),
  useCartActions: () => ({
    addItem: mockCartStore.addItem,
    removeItem: mockCartStore.removeItem,
    updateQuantity: mockCartStore.updateQuantity,
    applyDiscount: mockCartStore.applyDiscount,
    removeDiscount: mockCartStore.removeDiscount,
    clearCart: mockCartStore.clearCart,
    validateStock: mockCartStore.validateStock,
  }),
  useCartItems: () => mockCartStore.items,
  initializeCartSessionSync: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock keyboard shortcuts hook
vi.mock('@/hooks', () => ({
  useKeyboardShortcuts: vi.fn(),
  SHORTCUT_CONTEXTS: {
    GLOBAL: 'global',
    PRODUCT_SEARCH: 'product_search',
    CART: 'cart',
    PAYMENT: 'payment',
  },
  useScreenReaderAnnouncements: () => ({
    announceShortcut: vi.fn(),
    ScreenReaderComponent: null,
  }),
  AccessibilityUtils: {
    setupFocusIndicators: vi.fn(),
    announceFocusChange: vi.fn(),
  },
}))

// Mock screen reader announcements
vi.mock('@/components/ui/screen-reader-announcements', () => ({
  useScreenReaderAnnouncements: () => ({
    announceShortcut: vi.fn(),
    ScreenReaderComponent: null,
  }),
  AccessibilityUtils: {
    setupFocusIndicators: vi.fn(),
    announceFocusChange: vi.fn(),
  },
}))

// Mock floating shortcuts
vi.mock('@/components/ui/keyboard-shortcut-badge', () => ({
  FloatingShortcuts: ({ shortcuts }: any) => (
    <div data-testid="floating-shortcuts">
      {shortcuts.map((shortcut: any, index: number) => (
        <div key={index} data-testid={`shortcut-${shortcut.key}`}>
          {shortcut.key}: {shortcut.description}
        </div>
      ))}
    </div>
  ),
}))

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialEntries?: string[]
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    }),
    initialEntries = ['/'],
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    )
  }

  const user = userEvent.setup()

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Test data generators
export const createTestProduct = (overrides = {}) => ({
  id: '1',
  name: 'Test Product',
  description: 'Test product description',
  price: 29.99,
  stock_quantity: 100,
  is_active: true,
  category: 'Electronics',
  brand: 'Test Brand',
  sku: 'TEST-001',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createTestCustomer = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St, City, State 12345',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createTestCartItem = (overrides = {}) => ({
  product: createTestProduct(),
  quantity: 1,
  unitPrice: 29.99,
  totalPrice: 29.99,
  discount: 0,
  maxQuantity: 100,
  ...overrides,
})

export const createTestSession = (overrides = {}) => ({
  id: 'test-session-1',
  cashierId: 1,
  status: 'active' as const,
  cartItems: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  createdAt: new Date(),
  lastActivity: new Date(),
  ...overrides,
})

// Accessibility testing utilities
export const checkAccessibility = {
  hasAriaLabel: (element: Element) => element.hasAttribute('aria-label'),
  hasAriaDescribedBy: (element: Element) => element.hasAttribute('aria-describedby'),
  hasRole: (element: Element) => element.hasAttribute('role'),
  hasTabIndex: (element: Element) => element.hasAttribute('tabindex'),
  isFocusable: (element: Element) => {
    const tabIndex = element.getAttribute('tabindex')
    if (tabIndex === '-1') return false
    if (tabIndex && parseInt(tabIndex) >= 0) return true
    
    const focusableElements = [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ]
    
    return focusableElements.some(selector => element.matches(selector))
  },
}

// Performance testing utilities
export const performanceUtils = {
  measureRenderTime: async (renderFn: () => void) => {
    const start = performance.now()
    renderFn()
    const end = performance.now()
    return end - start
  },
  
  measureMemoryUsage: () => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return null
  },
  
  createLargeDataset: (size: number) => {
    return Array.from({ length: size }, (_, i) =>
      createTestProduct({ id: (i + 1).toString(), name: `Product ${i + 1}` })
    )
  },
}

// Error boundary for testing
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>
    }

    return this.props.children
  }
}

// Keyboard interaction utilities
export const keyboardUtils = {
  pressKey: async (user: ReturnType<typeof userEvent.setup>, key: string) => {
    await user.keyboard(`{${key}}`)
  },
  
  pressKeyCombo: async (user: ReturnType<typeof userEvent.setup>, combo: string) => {
    await user.keyboard(combo)
  },
  
  tabToNextElement: async (user: ReturnType<typeof userEvent.setup>) => {
    await user.keyboard('{Tab}')
  },
  
  tabToPreviousElement: async (user: ReturnType<typeof userEvent.setup>) => {
    await user.keyboard('{Shift>}{Tab}{/Shift}')
  },
}

// Reset all mocks before each test
export const resetMocks = () => {
  vi.clearAllMocks()
  
  // Reset store states
  mockCartStore.items = []
  mockCartStore.subtotal = 0
  mockCartStore.tax = 0
  mockCartStore.discount = 0
  mockCartStore.total = 0
  mockCartStore.itemCount = 0
  
  mockPOSSessionStore.sessions.clear()
  mockPOSSessionStore.activeSessionId = 'test-session-1'
}

// Custom matchers for better test assertions
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeAccessible(): boolean
      toHaveValidTabOrder(): boolean
      toSupportKeyboardNavigation(): boolean
    }
  }
}

// Export all utilities
export * from '@testing-library/react'
export { userEvent }