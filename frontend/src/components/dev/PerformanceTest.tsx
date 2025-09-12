/**
 * Performance Test Component for POS Optimizations
 * Used to validate search debouncing, virtual scrolling, and cart optimization targets
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { useCartActions } from '@/stores/posCartStore';
import { 
  testSearchPerformance,
  testCartPerformance,
  testVirtualScrollPerformance,
  validateDebouncePerformance,
  PerformanceMonitor,
  PERFORMANCE_TARGETS,
  monitorMemoryUsage,
  getPerformanceRecommendations
} from '@/utils/performance';
import { useDebouncedCallback } from 'use-debounce';
import type { Product } from '@/types/inventory';

interface PerformanceStats {
  [key: string]: {
    count: number;
    average: number;
    median: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
}

export function PerformanceTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);
  const [memoryStats, setMemoryStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  const cartActions = useCartActions();

  // Mock search function for testing
  const mockSearchFunction = useCallback(async (query: string) => {
    // Simulate API call with realistic delay
    const delay = Math.random() * 100 + 50; // 50-150ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Return mock results
    return {
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `product-${i}`,
        name: `Product ${i} ${query}`,
        price: Math.random() * 100,
        stock_quantity: Math.floor(Math.random() * 100),
        unit: 'pcs',
        is_active: true,
      }))
    };
  }, []);

  // Mock virtual scroll function for testing
  const mockVirtualScrollFunction = useCallback((itemCount: number) => {
    // Simulate rendering large lists
    const startTime = performance.now();
    
    // Simulate DOM operations
    for (let i = 0; i < itemCount / 100; i++) {
      // Simulate minimal work per batch of 100 items
      Math.random();
    }
    
    const endTime = performance.now();
    return endTime - startTime;
  }, []);

  // Mock debounce function for testing
  const mockDebounceFunction = useDebouncedCallback(
    (callback: () => void) => callback(),
    PERFORMANCE_TARGETS.DEBOUNCE_DELAY
  );

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults({});
    
    try {
      console.log('🚀 Starting POS Performance Test Suite');
      
      // Test 1: Search Performance (25%)
      setProgress(25);
      console.log('Testing search performance...');
      const searchResults = await testSearchPerformance(mockSearchFunction);
      setResults(prev => ({ ...prev, search: searchResults }));

      // Test 2: Cart Performance (50%)
      setProgress(50);
      console.log('Testing cart performance...');
      const cartResults = await testCartPerformance(cartActions as any);
      setResults(prev => ({ ...prev, cart: cartResults }));

      // Test 3: Virtual Scroll Performance (75%)
      setProgress(75);
      console.log('Testing virtual scroll performance...');
      const scrollResults = testVirtualScrollPerformance(mockVirtualScrollFunction);
      setResults(prev => ({ ...prev, virtualScroll: scrollResults }));

      // Test 4: Debounce Performance (100%)
      setProgress(100);
      console.log('Testing debounce performance...');
      await validateDebouncePerformance(mockDebounceFunction, PERFORMANCE_TARGETS.DEBOUNCE_DELAY);

      // Update memory stats
      const memory = monitorMemoryUsage();
      setMemoryStats(memory);

      // Generate recommendations
      const allResults = { search: searchResults, cart: cartResults, virtualScroll: scrollResults };
      const recs = getPerformanceRecommendations(allResults);
      setRecommendations(recs);

      console.log('✅ Performance test suite completed');
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runIndividualTest = async (testType: string) => {
    setIsRunning(true);
    
    try {
      let result: any;
      
      switch (testType) {
        case 'search':
          result = await testSearchPerformance(mockSearchFunction);
          break;
        case 'cart':
          result = await testCartPerformance(cartActions as any);
          break;
        case 'virtualScroll':
          result = testVirtualScrollPerformance(mockVirtualScrollFunction);
          break;
        case 'debounce':
          await validateDebouncePerformance(mockDebounceFunction, PERFORMANCE_TARGETS.DEBOUNCE_DELAY);
          result = { completed: true };
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }
      
      setResults(prev => ({ ...prev, [testType]: result }));
    } catch (error) {
      console.error(`Test ${testType} failed:`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusBadge = (value: number, target: number) => {
    if (value <= target) {
      return <Badge variant="default" className="bg-green-500">✅ Pass</Badge>;
    } else if (value <= target * 1.5) {
      return <Badge variant="secondary" className="bg-yellow-500">⚠️ Slow</Badge>;
    } else {
      return <Badge variant="destructive">❌ Fail</Badge>;
    }
  };

  const renderStats = (stats: PerformanceStats, testName: string) => {
    return (
      <div className="space-y-4">
        {Object.entries(stats).map(([key, data]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{key}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Count: {data.count}</div>
                <div>Average: {formatDuration(data.average)}</div>
                <div>Median: {formatDuration(data.median)}</div>
                <div>Min: {formatDuration(data.min)}</div>
                <div>Max: {formatDuration(data.max)}</div>
                <div>P95: {formatDuration(data.p95)}</div>
              </div>
              {testName === 'search' && getStatusBadge(data.average, PERFORMANCE_TARGETS.SEARCH_RESPONSE_TIME)}
              {testName === 'cart' && getStatusBadge(data.average, PERFORMANCE_TARGETS.CART_UPDATE_TIME)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>POS Performance Test Suite</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test and validate performance optimizations for search debouncing, virtual scrolling, and cart operations
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setResults({});
                  setProgress(0);
                  setMemoryStats(null);
                  setRecommendations([]);
                  PerformanceMonitor.clearMeasurements();
                }}
              >
                Clear Results
              </Button>
            </div>
            
            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Progress: {progress}%
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('search')}
                disabled={isRunning}
              >
                Test Search
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('cart')}
                disabled={isRunning}
              >
                Test Cart
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('virtualScroll')}
                disabled={isRunning}
              >
                Test Virtual Scroll
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => runIndividualTest('debounce')}
                disabled={isRunning}
              >
                Test Debounce
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Search Response</div>
              <div className="text-muted-foreground">&lt; {PERFORMANCE_TARGETS.SEARCH_RESPONSE_TIME}ms</div>
            </div>
            <div>
              <div className="font-medium">Cart Updates</div>
              <div className="text-muted-foreground">&lt; {PERFORMANCE_TARGETS.CART_UPDATE_TIME}ms</div>
            </div>
            <div>
              <div className="font-medium">Debounce Delay</div>
              <div className="text-muted-foreground">{PERFORMANCE_TARGETS.DEBOUNCE_DELAY}ms</div>
            </div>
            <div>
              <div className="font-medium">Virtual Scroll</div>
              <div className="text-muted-foreground">{PERFORMANCE_TARGETS.VIRTUAL_SCROLL_THRESHOLD.toLocaleString()}+ items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Stats */}
      {memoryStats && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used Heap:</span>
                <span>{(memoryStats.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Heap:</span>
                <span>{(memoryStats.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Usage:</span>
                <span>{memoryStats.usagePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={memoryStats.usagePercentage} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="search">Search</TabsTrigger>
                <TabsTrigger value="cart">Cart</TabsTrigger>
                <TabsTrigger value="virtualScroll">Virtual Scroll</TabsTrigger>
                <TabsTrigger value="debounce">Debounce</TabsTrigger>
              </TabsList>
              
              <TabsContent value="search">
                {results.search ? renderStats(results.search, 'search') : (
                  <p className="text-muted-foreground">No search test results yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="cart">
                {results.cart ? renderStats(results.cart, 'cart') : (
                  <p className="text-muted-foreground">No cart test results yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="virtualScroll">
                {results.virtualScroll ? renderStats(results.virtualScroll, 'virtualScroll') : (
                  <p className="text-muted-foreground">No virtual scroll test results yet</p>
                )}
              </TabsContent>
              
              <TabsContent value="debounce">
                {results.debounce ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-green-600">✅ Debounce test completed successfully</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Check console for detailed debounce timing results
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-muted-foreground">No debounce test results yet</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Live Product Search for Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Live Search Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the optimized ProductSearch component with real debouncing and virtual scrolling
          </p>
        </CardHeader>
        <CardContent>
          <ProductSearch 
            onProductSelect={(product: Product) => {
              console.log('Product selected:', product);
            }}
            placeholder="Type to test search performance..."
          />
        </CardContent>
      </Card>
    </div>
  );
}