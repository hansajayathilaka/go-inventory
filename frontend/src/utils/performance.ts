/**
 * Performance monitoring and testing utilities for POS components
 * Validates optimization targets and provides performance metrics
 */

// Performance targets as specified in requirements
export const PERFORMANCE_TARGETS = {
  SEARCH_RESPONSE_TIME: 200, // ms
  CART_UPDATE_TIME: 50, // ms
  DEBOUNCE_DELAY: 300, // ms
  VIRTUAL_SCROLL_THRESHOLD: 10000, // items
} as const;

// Performance measurement utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();
  private static activeTimers = new Map<string, number>();

  static startTimer(label: string): void {
    this.activeTimers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const startTime = this.activeTimers.get(label);
    if (!startTime) {
      console.warn(`No active timer found for label: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.activeTimers.delete(label);

    // Store measurement
    const measurements = this.measurements.get(label) || [];
    measurements.push(duration);
    this.measurements.set(label, measurements);

    return duration;
  }

  static getStats(label: string) {
    const measurements = this.measurements.get(label) || [];
    if (measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      average: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  static getAllStats() {
    const allStats: Record<string, any> = {};
    for (const [label] of this.measurements) {
      allStats[label] = this.getStats(label);
    }
    return allStats;
  }

  static clearMeasurements(label?: string): void {
    if (label) {
      this.measurements.delete(label);
    } else {
      this.measurements.clear();
    }
  }

  static logStats(label?: string): void {
    if (label) {
      const stats = this.getStats(label);
      console.log(`Performance Stats for ${label}:`, stats);
    } else {
      console.log('All Performance Stats:', this.getAllStats());
    }
  }
}

// Search performance testing
export const testSearchPerformance = async (searchFn: (query: string) => Promise<any>) => {
  const testQueries = [
    'a', 'ab', 'abc', 'test', 'product', 'search term',
    'long search query with multiple words',
    'SKU123', 'BARCODE456'
  ];

  console.log('🔍 Starting search performance tests...');
  
  for (const query of testQueries) {
    if (query.length >= 2) { // Only test valid queries
      PerformanceMonitor.startTimer(`search-${query.length}`);
      try {
        await searchFn(query);
        const duration = PerformanceMonitor.endTimer(`search-${query.length}`);
        
        if (duration > PERFORMANCE_TARGETS.SEARCH_RESPONSE_TIME) {
          console.warn(`⚠️ Search for "${query}" took ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.SEARCH_RESPONSE_TIME}ms)`);
        } else {
          console.log(`✅ Search for "${query}" took ${duration.toFixed(2)}ms`);
        }
      } catch (error) {
        PerformanceMonitor.endTimer(`search-${query.length}`);
        console.error(`❌ Search failed for "${query}":`, error);
      }
    }
  }

  return PerformanceMonitor.getAllStats();
};

// Cart performance testing
export const testCartPerformance = async (cartActions: {
  addItem: (product: any, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}) => {
  console.log('🛒 Starting cart performance tests...');

  // Generate test products
  const generateTestProduct = (id: number) => ({
    id: `test-product-${id}`,
    name: `Test Product ${id}`,
    price: Math.random() * 100,
    stock_quantity: 100,
    unit: 'pcs',
    is_active: true,
  });

  const testProducts = Array.from({ length: 100 }, (_, i) => generateTestProduct(i));

  // Test adding multiple items
  console.log('Testing bulk add operations...');
  PerformanceMonitor.startTimer('cart-bulk-add');
  
  for (let i = 0; i < 50; i++) {
    PerformanceMonitor.startTimer('cart-add-single');
    await cartActions.addItem(testProducts[i], Math.floor(Math.random() * 10) + 1);
    const duration = PerformanceMonitor.endTimer('cart-add-single');
    
    if (duration > PERFORMANCE_TARGETS.CART_UPDATE_TIME) {
      console.warn(`⚠️ Cart add took ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.CART_UPDATE_TIME}ms)`);
    }
  }
  
  const bulkAddDuration = PerformanceMonitor.endTimer('cart-bulk-add');
  console.log(`Bulk add (50 items) took ${bulkAddDuration.toFixed(2)}ms`);

  // Test quantity updates
  console.log('Testing quantity updates...');
  for (let i = 0; i < 10; i++) {
    PerformanceMonitor.startTimer('cart-update-quantity');
    await cartActions.updateQuantity(`test-product-${i}`, Math.floor(Math.random() * 20) + 1);
    const duration = PerformanceMonitor.endTimer('cart-update-quantity');
    
    if (duration > PERFORMANCE_TARGETS.CART_UPDATE_TIME) {
      console.warn(`⚠️ Cart quantity update took ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.CART_UPDATE_TIME}ms)`);
    }
  }

  // Test item removal
  console.log('Testing item removal...');
  for (let i = 0; i < 10; i++) {
    PerformanceMonitor.startTimer('cart-remove-item');
    cartActions.removeItem(`test-product-${i}`);
    const duration = PerformanceMonitor.endTimer('cart-remove-item');
    
    if (duration > PERFORMANCE_TARGETS.CART_UPDATE_TIME) {
      console.warn(`⚠️ Cart remove took ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.CART_UPDATE_TIME}ms)`);
    }
  }

  // Clean up
  cartActions.clearCart();

  return PerformanceMonitor.getAllStats();
};

// Virtual scrolling performance test
export const testVirtualScrollPerformance = (renderFn: (itemCount: number) => void) => {
  console.log('📜 Starting virtual scroll performance tests...');

  const testSizes = [100, 1000, 5000, 10000, 50000];

  testSizes.forEach(size => {
    PerformanceMonitor.startTimer(`virtual-scroll-${size}`);
    
    try {
      renderFn(size);
      const duration = PerformanceMonitor.endTimer(`virtual-scroll-${size}`);
      
      if (size >= PERFORMANCE_TARGETS.VIRTUAL_SCROLL_THRESHOLD && duration > 100) {
        console.warn(`⚠️ Virtual scroll with ${size} items took ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ Virtual scroll with ${size} items took ${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      PerformanceMonitor.endTimer(`virtual-scroll-${size}`);
      console.error(`❌ Virtual scroll failed with ${size} items:`, error);
    }
  });

  return PerformanceMonitor.getAllStats();
};

// Debounce performance validation
export const validateDebouncePerformance = (debounceFn: Function, delay: number) => {
  console.log('⏱️ Validating debounce performance...');

  return new Promise<void>((resolve) => {
    const startTime = performance.now();
    let callCount = 0;
    let lastCallTime = 0;

    const wrappedFn = () => {
      callCount++;
      lastCallTime = performance.now();
    };

    // Simulate rapid calls
    const rapidCalls = 50;
    for (let i = 0; i < rapidCalls; i++) {
      setTimeout(() => debounceFn(wrappedFn), i * 10);
    }

    // Check results after delay + buffer
    setTimeout(() => {
      const totalTime = performance.now() - startTime;
      const actualDelay = lastCallTime - startTime;

      console.log(`Debounce test results:`);
      console.log(`- Rapid calls made: ${rapidCalls}`);
      console.log(`- Actual function calls: ${callCount}`);
      console.log(`- Expected delay: ${delay}ms`);
      console.log(`- Actual delay: ${actualDelay.toFixed(2)}ms`);
      console.log(`- Total test time: ${totalTime.toFixed(2)}ms`);

      if (callCount === 1) {
        console.log(`✅ Debounce working correctly - only 1 call made`);
      } else {
        console.warn(`⚠️ Debounce may not be working - ${callCount} calls made`);
      }

      if (Math.abs(actualDelay - delay) <= 50) { // 50ms tolerance
        console.log(`✅ Debounce timing correct`);
      } else {
        console.warn(`⚠️ Debounce timing off by ${Math.abs(actualDelay - delay).toFixed(2)}ms`);
      }

      resolve();
    }, delay + 200);
  });
};

// Comprehensive performance test suite
export const runPerformanceTestSuite = async (testConfig: {
  searchFn?: (query: string) => Promise<any>;
  cartActions?: any;
  virtualScrollFn?: (itemCount: number) => void;
  debounceFn?: Function;
}) => {
  console.log('🚀 Starting comprehensive POS performance test suite...');
  console.log('Performance targets:', PERFORMANCE_TARGETS);

  const results: Record<string, any> = {};

  // Clear previous measurements
  PerformanceMonitor.clearMeasurements();

  try {
    if (testConfig.searchFn) {
      console.log('\n--- Search Performance Tests ---');
      results.search = await testSearchPerformance(testConfig.searchFn);
    }

    if (testConfig.cartActions) {
      console.log('\n--- Cart Performance Tests ---');
      results.cart = await testCartPerformance(testConfig.cartActions);
    }

    if (testConfig.virtualScrollFn) {
      console.log('\n--- Virtual Scroll Performance Tests ---');
      results.virtualScroll = testVirtualScrollPerformance(testConfig.virtualScrollFn);
    }

    if (testConfig.debounceFn) {
      console.log('\n--- Debounce Performance Tests ---');
      await validateDebouncePerformance(testConfig.debounceFn, PERFORMANCE_TARGETS.DEBOUNCE_DELAY);
    }

    console.log('\n--- Test Suite Complete ---');
    console.log('Full results:', results);

    return results;
  } catch (error) {
    console.error('❌ Performance test suite failed:', error);
    throw error;
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

// Performance optimization tips
export const getPerformanceRecommendations = (stats: Record<string, any>) => {
  const recommendations: string[] = [];

  // Check search performance
  if (stats.search) {
    const searchStats = Object.values(stats.search) as any[];
    const slowSearches = searchStats.filter((s: any) => s?.average > PERFORMANCE_TARGETS.SEARCH_RESPONSE_TIME);
    
    if (slowSearches.length > 0) {
      recommendations.push('🔍 Consider implementing server-side caching for search results');
      recommendations.push('🔍 Optimize search query indexing on the backend');
    }
  }

  // Check cart performance
  if (stats.cart) {
    const cartStats = Object.values(stats.cart) as any[];
    const slowCartOps = cartStats.filter((s: any) => s?.average > PERFORMANCE_TARGETS.CART_UPDATE_TIME);
    
    if (slowCartOps.length > 0) {
      recommendations.push('🛒 Consider implementing more aggressive memoization');
      recommendations.push('🛒 Batch cart state updates more aggressively');
    }
  }

  // Memory recommendations
  const memoryStats = monitorMemoryUsage();
  if (memoryStats && memoryStats.usagePercentage > 80) {
    recommendations.push('💾 High memory usage detected - consider implementing cache cleanup');
  }

  return recommendations;
};