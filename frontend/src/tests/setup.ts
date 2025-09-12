import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage and sessionStorage
const createStorage = () => {
  let store: { [key: string]: string } = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorage()
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorage()
})

// Mock fetch
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString()
  
  // Return appropriate mock responses based on URL
  if (url.includes('/api/v1/products')) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        products: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 }
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (url.includes('/api/v1/customers')) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        customers: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 }
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Default mock response
  return new Response(JSON.stringify({ success: true, data: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Mock console methods for cleaner test output
const originalConsole = { ...console }
beforeAll(() => {
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterAll(() => {
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

// Cleanup after each test
afterEach(() => {
  cleanup()
  // Clear all timers
  vi.clearAllTimers()
  // Clear all mocks
  vi.clearAllMocks()
  // Clear localStorage and sessionStorage
  window.localStorage.clear()
  window.sessionStorage.clear()
})

// Setup before each test
beforeEach(() => {
  // Mock current date for consistent testing
  vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
})

// Global test utilities
declare global {
  var testUtils: {
    createMockProduct: (overrides?: any) => any
    createMockCustomer: (overrides?: any) => any
    createMockUser: (overrides?: any) => any
    createMockSession: (overrides?: any) => any
    waitForElementToBeRemoved: typeof import('@testing-library/react').waitForElementToBeRemoved
  }
}

global.testUtils = {
  createMockProduct: (overrides = {}) => ({
    id: '1',
    name: 'Test Product',
    description: 'Test product description',
    price: 29.99,
    stock_quantity: 100,
    is_active: true,
    category: 'Test Category',
    brand: 'Test Brand',
    sku: 'TEST-001',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  createMockCustomer: (overrides = {}) => ({
    id: 1,
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '1234567890',
    address: '123 Test St',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    role: 'staff',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  }),
  
  createMockSession: (overrides = {}) => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    cashier_id: 1,
    status: 'active',
    cart_items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    ...overrides
  }),
  
  waitForElementToBeRemoved: (await import('@testing-library/react')).waitForElementToBeRemoved
}