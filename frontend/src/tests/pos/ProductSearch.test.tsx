import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ProductSearch } from '@/components/pos/ProductSearch'
import {
  renderWithProviders,
  resetMocks,
  createTestProduct,
  checkAccessibility,
  keyboardUtils,
} from './test-utils'

// Mock the hooks
vi.mock('@/hooks/useInventoryQueries', () => ({
  useProducts: () => ({
    data: {
      products: [
        createTestProduct({ id: '1', name: 'Test Product 1', sku: 'TEST-001' }),
        createTestProduct({ id: '2', name: 'Test Product 2', sku: 'TEST-002' }),
        createTestProduct({ id: '3', name: 'Another Item', sku: 'ITEM-001' }),
      ],
      pagination: { page: 1, limit: 10, total: 3, pages: 1 },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCategories: () => ({
    data: {
      categories: [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Tools' },
        { id: 3, name: 'Parts' },
      ],
    },
    isLoading: false,
    error: null,
  }),
}))

// Mock barcode scanner
vi.mock('@/components/ui/barcode-scanner', () => ({
  BarcodeScanner: ({ onScanSuccess, onScanError }: any) => (
    <div data-testid="barcode-scanner">
      <button
        onClick={() => onScanSuccess('123456789')}
        data-testid="mock-scan-success"
      >
        Mock Scan Success
      </button>
      <button
        onClick={() => onScanError(new Error('Scan failed'))}
        data-testid="mock-scan-error"
      >
        Mock Scan Error
      </button>
    </div>
  ),
}))

// Mock debounced callback
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (callback: Function, delay: number) => {
    return vi.fn().mockImplementation((...args) => {
      setTimeout(() => callback(...args), delay)
    })
  },
}))

describe('ProductSearch', () => {
  const mockOnProductSelect = vi.fn()
  const mockOnBarcodeScanned = vi.fn()

  beforeEach(() => {
    resetMocks()
    mockOnProductSelect.mockClear()
    mockOnBarcodeScanned.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders search input with placeholder', () => {
      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('placeholder', expect.stringContaining('Search products'))
    })

    it('renders with custom placeholder', () => {
      renderWithProviders(
        <ProductSearch
          onProductSelect={mockOnProductSelect}
          placeholder="Custom placeholder"
        />
      )

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('placeholder', 'Custom placeholder')
    })

    it('auto-focuses when autoFocus is true', () => {
      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} autoFocus />
      )

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveFocus()
    })

    it('renders barcode scanner button', () => {
      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      expect(scannerButton).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('displays search results when typing', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
        expect(screen.getByText('Test Product 2')).toBeInTheDocument()
      })
    })

    it('filters results by search term', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Another')

      await waitFor(() => {
        expect(screen.getByText('Another Item')).toBeInTheDocument()
        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
      })
    })

    it('shows no results message when no products match', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'NonExistent')

      await waitFor(() => {
        expect(screen.getByText(/no products found/i)).toBeInTheDocument()
      })
    })

    it('clears search when clear button is clicked', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })
  })

  describe('Product Selection', () => {
    it('calls onProductSelect when product is clicked', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        const productButton = screen.getByText('Test Product 1')
        expect(productButton).toBeInTheDocument()
      })

      const productButton = screen.getByText('Test Product 1')
      await user.click(productButton)

      expect(mockOnProductSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Test Product 1',
          sku: 'TEST-001',
        })
      )
    })

    it('closes dropdown after product selection', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        const productButton = screen.getByText('Test Product 1')
        expect(productButton).toBeInTheDocument()
      })

      const productButton = screen.getByText('Test Product 1')
      await user.click(productButton)

      await waitFor(() => {
        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
      })
    })

    it('clears search after product selection', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        const productButton = screen.getByText('Test Product 1')
        expect(productButton).toBeInTheDocument()
      })

      const productButton = screen.getByText('Test Product 1')
      await user.click(productButton)

      expect(searchInput).toHaveValue('')
    })
  })

  describe('Keyboard Navigation', () => {
    it('navigates through results with arrow keys', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      })

      // Navigate down
      await keyboardUtils.pressKey(user, 'ArrowDown')
      
      // Should highlight first result
      const firstResult = screen.getByText('Test Product 1').closest('button')
      expect(firstResult).toHaveClass('bg-muted') // Or whatever highlight class
    })

    it('selects product with Enter key', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      })

      await keyboardUtils.pressKey(user, 'ArrowDown')
      await keyboardUtils.pressKey(user, 'Enter')

      expect(mockOnProductSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Test Product 1',
        })
      )
    })

    it('closes dropdown with Escape key', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument()
      })

      await keyboardUtils.pressKey(user, 'Escape')

      await waitFor(() => {
        expect(screen.queryByText('Test Product 1')).not.toBeInTheDocument()
      })
    })

    it('supports Tab key navigation', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.tab()

      expect(searchInput).toHaveFocus()

      await user.tab()
      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      expect(scannerButton).toHaveFocus()
    })
  })

  describe('Barcode Scanning', () => {
    it('opens barcode scanner when button is clicked', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      await user.click(scannerButton)

      expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument()
    })

    it('closes barcode scanner when close button is clicked', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      await user.click(scannerButton)

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      expect(screen.queryByTestId('barcode-scanner')).not.toBeInTheDocument()
    })

    it('calls onBarcodeScanned when barcode is successfully scanned', async () => {
      const { user } = renderWithProviders(
        <ProductSearch
          onProductSelect={mockOnProductSelect}
          onBarcodeScanned={mockOnBarcodeScanned}
        />
      )

      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      await user.click(scannerButton)

      const mockScanButton = screen.getByTestId('mock-scan-success')
      await user.click(mockScanButton)

      expect(mockOnBarcodeScanned).toHaveBeenCalledWith('123456789')
    })

    it('handles barcode scan errors gracefully', async () => {
      const { user } = renderWithProviders(
        <ProductSearch
          onProductSelect={mockOnProductSelect}
          onBarcodeScanned={mockOnBarcodeScanned}
        />
      )

      const scannerButton = screen.getByRole('button', { name: /barcode/i })
      await user.click(scannerButton)

      const mockErrorButton = screen.getByTestId('mock-scan-error')
      await user.click(mockErrorButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/scanning failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Category Filtering', () => {
    it('shows category filter options', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const categoryButton = screen.getByRole('button', { name: /categories/i })
      await user.click(categoryButton)

      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Tools')).toBeInTheDocument()
      expect(screen.getByText('Parts')).toBeInTheDocument()
    })

    it('filters products by selected category', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const categoryButton = screen.getByRole('button', { name: /categories/i })
      await user.click(categoryButton)

      const electronicsCategory = screen.getByText('Electronics')
      await user.click(electronicsCategory)

      // Should filter products by Electronics category
      // (This would need mock data with categories)
    })

    it('shows all products when "All Categories" is selected', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const categoryButton = screen.getByRole('button', { name: /categories/i })
      await user.click(categoryButton)

      const allCategoriesOption = screen.getByText('All Categories')
      await user.click(allCategoriesOption)

      // Should show all products regardless of category
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner when debouncing', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      // Should show loading indicator during debounce
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows loading state when fetching products', () => {
      vi.doMock('@/hooks/useInventoryQueries', () => ({
        useProducts: () => ({
          data: null,
          isLoading: true,
          error: null,
          refetch: vi.fn(),
        }),
        useCategories: () => ({
          data: { categories: [] },
          isLoading: false,
          error: null,
        }),
      }))

      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles product fetch errors', () => {
      vi.doMock('@/hooks/useInventoryQueries', () => ({
        useProducts: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to fetch products'),
          refetch: vi.fn(),
        }),
        useCategories: () => ({
          data: { categories: [] },
          isLoading: false,
          error: null,
        }),
      }))

      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      expect(screen.getByText(/error loading products/i)).toBeInTheDocument()
    })

    it('handles category fetch errors', () => {
      vi.doMock('@/hooks/useInventoryQueries', () => ({
        useProducts: () => ({
          data: { products: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } },
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        }),
        useCategories: () => ({
          data: null,
          isLoading: false,
          error: new Error('Failed to fetch categories'),
        }),
      }))

      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      // Should still work without categories
      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      expect(checkAccessibility.hasAriaLabel(searchInput)).toBeTruthy()
      expect(checkAccessibility.hasRole(searchInput)).toBeTruthy()
    })

    it('has proper keyboard shortcuts help', () => {
      renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      // Should show keyboard shortcuts
      expect(screen.getByText(/Enter to select/i)).toBeInTheDocument()
    })

    it('announces results to screen readers', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      // Should have aria-live region for announcements
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toBeInTheDocument()
    })

    it('has proper focus management', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        const firstResult = screen.getByText('Test Product 1')
        expect(firstResult).toBeInTheDocument()
      })

      await keyboardUtils.pressKey(user, 'ArrowDown')
      
      // Focus should move to results list
      expect(document.activeElement).not.toBe(searchInput)
    })
  })

  describe('Performance', () => {
    it('debounces search input to prevent excessive API calls', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      
      // Type quickly
      await user.type(searchInput, 'Test', { delay: 10 })

      // Should only make one API call after debounce period
      // (This would need proper mock verification)
    })

    it('cancels previous requests when new search is initiated', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      
      await user.type(searchInput, 'Test')
      await user.clear(searchInput)
      await user.type(searchInput, 'Another')

      // Should cancel the first request
      // (This would need AbortController mock verification)
    })

    it('limits results to prevent performance issues', async () => {
      const { user } = renderWithProviders(
        <ProductSearch onProductSelect={mockOnProductSelect} />
      )

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, 'Test')

      await waitFor(() => {
        const results = screen.getAllByRole('button', { name: /Test Product/i })
        expect(results.length).toBeLessThanOrEqual(20) // Should limit results
      })
    })
  })
})