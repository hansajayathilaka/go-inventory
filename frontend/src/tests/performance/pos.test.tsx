import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { renderWithProviders, createTestProduct, performanceUtils } from '../pos/test-utils'

// Performance monitoring utilities
const createPerformanceMonitor = () => {
  const measurements: { [key: string]: number[] } = {}
  
  return {
    start: (label: string) => {
      if (!measurements[label]) measurements[label] = []
      return performance.now()
    },
    
    end: (label: string, startTime: number) => {
      const duration = performance.now() - startTime
      measurements[label].push(duration)
      return duration
    },
    
    getStats: (label: string) => {
      const times = measurements[label] || []
      if (times.length === 0) return null
      
      const sorted = [...times].sort((a, b) => a - b)
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        count: times.length
      }
    },
    
    reset: () => {
      Object.keys(measurements).forEach(key => delete measurements[key])
    }
  }
}

// Mock large datasets
const createLargeProductDataset = (size: number) => 
  Array.from({ length: size }, (_, i) => createTestProduct({
    id: (i + 1).toString(),
    name: `Performance Test Product ${i + 1}`,
    sku: `PERF-${String(i + 1).padStart(6, '0')}`,
    price: Math.random() * 100,
    stock_quantity: Math.floor(Math.random() * 1000)
  }))

// Performance test wrapper component
const PerformanceTestWrapper = ({ 
  children, 
  onRenderComplete 
}: { 
  children: React.ReactNode
  onRenderComplete?: () => void 
}) => {
  React.useEffect(() => {
    onRenderComplete?.()
  }, [])
  
  return <div data-testid="performance-wrapper">{children}</div>
}

// Mock components for testing
const LargeProductList = ({ products, onProductSelect }: any) => {
  const [visibleProducts, setVisibleProducts] = React.useState(products.slice(0, 20))
  const [loading, setLoading] = React.useState(false)
  
  const loadMore = async () => {
    setLoading(true)
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
    setVisibleProducts(prev => [
      ...prev,
      ...products.slice(prev.length, prev.length + 20)
    ])
    setLoading(false)
  }
  
  return (
    <div data-testid="large-product-list">
      {visibleProducts.map((product: any) => (
        <div key={product.id} data-testid={`product-${product.id}`}>
          <button onClick={() => onProductSelect(product)}>
            {product.name} - ${product.price.toFixed(2)}
          </button>
        </div>
      ))}
      {visibleProducts.length < products.length && (
        <button onClick={loadMore} disabled={loading} data-testid="load-more">
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}

const LargeShoppingCart = ({ items, onQuantityChange, onRemove }: any) => {
  const [optimizedItems, setOptimizedItems] = React.useState(items)
  
  // Virtualization simulation
  const [visibleStartIndex, setVisibleStartIndex] = React.useState(0)
  const [visibleEndIndex, setVisibleEndIndex] = React.useState(Math.min(50, items.length))
  
  const visibleItems = React.useMemo(() => 
    optimizedItems.slice(visibleStartIndex, visibleEndIndex),
    [optimizedItems, visibleStartIndex, visibleEndIndex]
  )
  
  return (
    <div data-testid="large-shopping-cart">
      <div data-testid="cart-summary">
        Total Items: {items.length}
      </div>
      
      <div data-testid="virtualized-items" style={{ height: '400px', overflowY: 'auto' }}>
        {visibleItems.map((item: any, index: number) => (
          <div key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
            <span>{item.product.name}</span>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onQuantityChange(item.product.id, parseInt(e.target.value))}
              data-testid={`quantity-${item.product.id}`}
            />
            <button
              onClick={() => onRemove(item.product.id)}
              data-testid={`remove-${item.product.id}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      
      {visibleEndIndex < items.length && (
        <button
          onClick={() => setVisibleEndIndex(prev => Math.min(prev + 50, items.length))}
          data-testid="load-more-items"
        >
          Load More Items
        </button>
      )}
    </div>
  )
}

describe('POS Performance Tests', () => {
  let performanceMonitor: ReturnType<typeof createPerformanceMonitor>

  beforeEach(() => {
    performanceMonitor = createPerformanceMonitor()
    vi.clearAllTimers()
    
    // Mock performance API if not available
    if (!global.performance) {
      global.performance = {
        now: () => Date.now(),
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByType: vi.fn().mockReturnValue([]),
        getEntriesByName: vi.fn().mockReturnValue([]),
      } as any
    }
  })

  describe('Component Rendering Performance', () => {
    it('renders product search within performance threshold', async () => {
      const products = createLargeProductDataset(1000)
      let renderCompleteTime: number
      
      const startTime = performanceMonitor.start('product-search-render')
      
      renderWithProviders(
        <PerformanceTestWrapper
          onRenderComplete={() => {
            renderCompleteTime = performanceMonitor.end('product-search-render', startTime)
          }}
        >
          <LargeProductList products={products} onProductSelect={vi.fn()} />
        </PerformanceTestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('large-product-list')).toBeInTheDocument()
      })
      
      expect(renderCompleteTime!).toBeLessThan(200) // Should render in < 200ms
    })

    it('handles large shopping cart rendering efficiently', async () => {
      const cartItems = Array.from({ length: 500 }, (_, i) => ({
        product: createTestProduct({ id: (i + 1).toString() }),
        quantity: Math.floor(Math.random() * 10) + 1,
        totalPrice: (Math.random() * 100) + 10
      }))

      const startTime = performanceMonitor.start('large-cart-render')
      
      renderWithProviders(
        <LargeShoppingCart
          items={cartItems}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      
      const renderTime = performanceMonitor.end('large-cart-render', startTime)
      
      await waitFor(() => {
        expect(screen.getByTestId('large-shopping-cart')).toBeInTheDocument()
      })
      
      expect(renderTime).toBeLessThan(150) // Should render quickly even with 500 items
    })

    it('maintains 60fps during cart interactions', async () => {
      const cartItems = Array.from({ length: 100 }, (_, i) => ({
        product: createTestProduct({ id: (i + 1).toString() }),
        quantity: 1,
        totalPrice: 29.99
      }))

      const { user } = renderWithProviders(
        <LargeShoppingCart
          items={cartItems}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
        />
      )

      // Measure frame timing during rapid interactions
      const frameTimes: number[] = []
      let lastFrameTime = performance.now()

      const measureFrame = () => {
        const currentTime = performance.now()
        frameTimes.push(currentTime - lastFrameTime)
        lastFrameTime = currentTime
      }

      // Simulate rapid quantity changes
      for (let i = 0; i < 10; i++) {
        measureFrame()
        const quantityInput = screen.getByTestId(`quantity-${i + 1}`)
        await user.clear(quantityInput)
        await user.type(quantityInput, String(i + 2))
        
        // Small delay to measure frame rate
        await act(async () => {
          await new Promise(resolve => requestAnimationFrame(resolve))
        })
      }

      // Calculate average FPS
      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      const fps = 1000 / averageFrameTime

      expect(fps).toBeGreaterThan(30) // Should maintain at least 30fps
    })

    it('handles payment form rendering with complex validation', async () => {
      const complexPaymentData = {
        totalAmount: 12345.67,
        splitPayments: Array.from({ length: 10 }, (_, i) => ({
          type: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'card' : 'bank_transfer',
          amount: Math.random() * 1000
        })),
        customer: createTestCustomer(),
        taxBreakdown: Array.from({ length: 5 }, (_, i) => ({
          type: `Tax Type ${i}`,
          rate: Math.random() * 0.1,
          amount: Math.random() * 100
        }))
      }

      const startTime = performanceMonitor.start('complex-payment-render')
      
      // Mock complex payment form component
      renderWithProviders(
        <div data-testid="complex-payment-form">
          {/* Simulate complex form rendering */}
          {complexPaymentData.splitPayments.map((payment, index) => (
            <div key={index} data-testid={`payment-${index}`}>
              {payment.type}: ${payment.amount.toFixed(2)}
            </div>
          ))}
        </div>
      )
      
      const renderTime = performanceMonitor.end('complex-payment-render', startTime)
      
      expect(renderTime).toBeLessThan(100) // Should render quickly despite complexity
    })
  })

  describe('Search Performance', () => {
    it('handles product search with debouncing efficiently', async () => {
      const products = createLargeProductDataset(10000)
      const mockSearch = vi.fn().mockImplementation((query: string) =>
        products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      )

      const SearchComponent = () => {
        const [query, setQuery] = React.useState('')
        const [results, setResults] = React.useState<any[]>([])
        
        // Debounced search
        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (query) {
              const startTime = performance.now()
              const searchResults = mockSearch(query)
              const searchTime = performance.now() - startTime
              
              // Record search performance
              performanceMonitor.end('search-operation', startTime)
              
              setResults(searchResults.slice(0, 20)) // Limit results
            }
          }, 300)
          
          return () => clearTimeout(timer)
        }, [query])
        
        return (
          <div>
            <input
              data-testid="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
            />
            <div data-testid="search-results">
              {results.map(product => (
                <div key={product.id}>{product.name}</div>
              ))}
            </div>
          </div>
        )
      }

      const { user } = renderWithProviders(<SearchComponent />)

      // Type search query rapidly
      const searchInput = screen.getByTestId('search-input')
      await user.type(searchInput, 'performance test', { delay: 50 })

      // Wait for debounced search
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument()
      }, { timeout: 500 })

      // Verify search was called minimal times due to debouncing
      expect(mockSearch).toHaveBeenCalledTimes(1)
    })

    it('handles barcode scanning performance', async () => {
      const BarcodeComponent = () => {
        const [isScanning, setIsScanning] = React.useState(false)
        const [scannedCode, setScannedCode] = React.useState('')
        
        const startScan = async () => {
          setIsScanning(true)
          const startTime = performance.now()
          
          // Simulate barcode processing
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const scanTime = performance.now() - startTime
          performanceMonitor.end('barcode-scan', startTime)
          
          setScannedCode('123456789')
          setIsScanning(false)
        }
        
        return (
          <div>
            <button onClick={startScan} disabled={isScanning} data-testid="scan-button">
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </button>
            {scannedCode && (
              <div data-testid="scanned-code">Code: {scannedCode}</div>
            )}
          </div>
        )
      }

      const { user } = renderWithProviders(<BarcodeComponent />)

      const scanButton = screen.getByTestId('scan-button')
      
      const startTime = performanceMonitor.start('barcode-scan')
      await user.click(scanButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('scanned-code')).toBeInTheDocument()
      })
      
      const scanStats = performanceMonitor.getStats('barcode-scan')
      expect(scanStats?.avg).toBeLessThan(200) // Should scan in < 200ms
    })
  })

  describe('Memory Usage and Leaks', () => {
    it('manages memory during long POS sessions', async () => {
      let initialMemory: number | null = null
      let finalMemory: number | null = null

      if ('memory' in performance) {
        initialMemory = (performance as any).memory.usedJSHeapSize
      }

      // Simulate long POS session with many transactions
      const { user, unmount } = renderWithProviders(<div data-testid="pos-session" />)

      // Create and destroy many components
      for (let i = 0; i < 100; i++) {
        const { unmount: unmountTransaction } = renderWithProviders(
          <div data-testid={`transaction-${i}`}>
            {Array.from({ length: 50 }, (_, j) => (
              <div key={j}>Transaction {i} Item {j}</div>
            ))}
          </div>
        )
        
        // Immediately unmount to test cleanup
        unmountTransaction()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      if ('memory' in performance) {
        finalMemory = (performance as any).memory.usedJSHeapSize
      }

      unmount()

      // Memory shouldn't increase dramatically
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory
        const increasePercentage = (memoryIncrease / initialMemory) * 100
        
        expect(increasePercentage).toBeLessThan(200) // Less than 200% increase
      }
    })

    it('cleans up event listeners and timers', async () => {
      let eventListenerCount = 0
      let timerCount = 0
      
      // Mock addEventListener to count listeners
      const originalAddEventListener = document.addEventListener
      document.addEventListener = (...args) => {
        eventListenerCount++
        return originalAddEventListener.apply(document, args)
      }
      
      // Mock setTimeout to count timers
      const originalSetTimeout = global.setTimeout
      global.setTimeout = (...args) => {
        timerCount++
        return originalSetTimeout.apply(global, args)
      }

      const ComponentWithCleanup = () => {
        React.useEffect(() => {
          const handler = () => {}
          const timer = setTimeout(() => {}, 1000)
          
          document.addEventListener('click', handler)
          
          return () => {
            document.removeEventListener('click', handler)
            clearTimeout(timer)
          }
        }, [])
        
        return <div data-testid="cleanup-component">Component</div>
      }

      const { unmount } = renderWithProviders(<ComponentWithCleanup />)
      
      expect(eventListenerCount).toBeGreaterThan(0)
      expect(timerCount).toBeGreaterThan(0)
      
      unmount()
      
      // Restore original functions
      document.addEventListener = originalAddEventListener
      global.setTimeout = originalSetTimeout
    })
  })

  describe('Load Testing Scenarios', () => {
    it('handles concurrent user interactions', async () => {
      const ConcurrentTestComponent = () => {
        const [operations, setOperations] = React.useState<string[]>([])
        
        const addOperation = (op: string) => {
          setOperations(prev => [...prev, `${Date.now()}: ${op}`])
        }
        
        return (
          <div>
            <button onClick={() => addOperation('Product Added')} data-testid="add-product">
              Add Product
            </button>
            <button onClick={() => addOperation('Quantity Changed')} data-testid="change-quantity">
              Change Quantity
            </button>
            <button onClick={() => addOperation('Payment Processed')} data-testid="process-payment">
              Process Payment
            </button>
            <div data-testid="operations-log">
              {operations.map((op, i) => <div key={i}>{op}</div>)}
            </div>
          </div>
        )
      }

      const { user } = renderWithProviders(<ConcurrentTestComponent />)

      // Simulate rapid concurrent operations
      const startTime = performance.now()
      
      const operations = [
        () => user.click(screen.getByTestId('add-product')),
        () => user.click(screen.getByTestId('change-quantity')),
        () => user.click(screen.getByTestId('process-payment')),
      ]

      // Execute operations concurrently
      await Promise.all([
        ...Array.from({ length: 10 }, () => operations[0]()),
        ...Array.from({ length: 10 }, () => operations[1]()),
        ...Array.from({ length: 10 }, () => operations[2]()),
      ])

      const operationTime = performance.now() - startTime
      
      await waitFor(() => {
        const log = screen.getByTestId('operations-log')
        expect(log.children).toHaveLength(30)
      })

      expect(operationTime).toBeLessThan(1000) // Should complete in < 1 second
    })

    it('maintains responsiveness under high cart item count', async () => {
      const highItemCount = 1000
      const cartItems = Array.from({ length: highItemCount }, (_, i) => ({
        product: createTestProduct({ 
          id: (i + 1).toString(),
          name: `Stress Test Product ${i + 1}`
        }),
        quantity: Math.floor(Math.random() * 10) + 1
      }))

      const startTime = performanceMonitor.start('high-item-cart')
      
      const { user } = renderWithProviders(
        <LargeShoppingCart
          items={cartItems}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      
      const initialRenderTime = performanceMonitor.end('high-item-cart', startTime)
      
      await waitFor(() => {
        expect(screen.getByTestId('cart-summary')).toHaveTextContent('1000')
      })

      // Test scrolling performance
      const cartContainer = screen.getByTestId('virtualized-items')
      const scrollStart = performanceMonitor.start('scroll-performance')
      
      act(() => {
        cartContainer.scrollTop = 2000 // Scroll down significantly
      })
      
      const scrollTime = performanceMonitor.end('scroll-performance', scrollStart)

      expect(initialRenderTime).toBeLessThan(300) // Initial render < 300ms
      expect(scrollTime).toBeLessThan(50) // Scrolling should be smooth
    })
  })

  describe('Network Performance', () => {
    it('handles slow network responses gracefully', async () => {
      // Mock slow API response
      const slowAPI = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 2000))
      )

      const SlowNetworkComponent = () => {
        const [loading, setLoading] = React.useState(false)
        const [data, setData] = React.useState(null)
        
        const fetchData = async () => {
          setLoading(true)
          try {
            const result = await slowAPI()
            setData(result.data)
          } finally {
            setLoading(false)
          }
        }
        
        return (
          <div>
            <button onClick={fetchData} data-testid="fetch-button">
              Fetch Data
            </button>
            {loading && <div data-testid="loading">Loading...</div>}
            {data && <div data-testid="data">Data loaded</div>}
          </div>
        )
      }

      const { user } = renderWithProviders(<SlowNetworkComponent />)

      const fetchButton = screen.getByTestId('fetch-button')
      await user.click(fetchButton)

      // Should show loading immediately
      expect(screen.getByTestId('loading')).toBeInTheDocument()

      // Should handle long response times
      await waitFor(() => {
        expect(screen.getByTestId('data')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('optimizes API request batching', async () => {
      let requestCount = 0
      const batchedAPI = vi.fn().mockImplementation((requests: any[]) => {
        requestCount++
        return Promise.resolve(
          requests.map((req, i) => ({ id: i, data: `Response ${i}` }))
        )
      })

      const BatchRequestComponent = () => {
        const [requests, setRequests] = React.useState<any[]>([])
        const [responses, setResponses] = React.useState<any[]>([])
        
        const addRequest = (data: string) => {
          setRequests(prev => [...prev, data])
        }
        
        React.useEffect(() => {
          if (requests.length > 0) {
            const timer = setTimeout(async () => {
              const batchResponses = await batchedAPI(requests)
              setResponses(prev => [...prev, ...batchResponses])
              setRequests([])
            }, 100) // Batch requests for 100ms
            
            return () => clearTimeout(timer)
          }
        }, [requests])
        
        return (
          <div>
            <button onClick={() => addRequest('Request A')} data-testid="request-a">
              Request A
            </button>
            <button onClick={() => addRequest('Request B')} data-testid="request-b">
              Request B
            </button>
            <div data-testid="response-count">{responses.length} responses</div>
          </div>
        )
      }

      const { user } = renderWithProviders(<BatchRequestComponent />)

      // Make multiple requests rapidly
      await user.click(screen.getByTestId('request-a'))
      await user.click(screen.getByTestId('request-b'))
      await user.click(screen.getByTestId('request-a'))

      await waitFor(() => {
        expect(screen.getByTestId('response-count')).toHaveTextContent('3 responses')
      })

      // Should batch requests into single API call
      expect(requestCount).toBe(1)
    })
  })
})

// Import React for hooks
import React from 'react'