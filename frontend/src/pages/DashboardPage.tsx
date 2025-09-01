import React, { memo, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Activity, Plus, RefreshCw, FolderPlus, UserPlus } from 'lucide-react';
// import { api } from '../services/api'; // TODO: Use this when dashboard API is ready
import type { DashboardStats } from '../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingCard } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-boundary';
import { usePerformanceMonitor } from '@/components/ui/optimized';

// Memoized StatCard component for better performance
const StatCard = memo<{
  name: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  change: string;
  changeType: string;
}>(({ name, value, icon: Icon, color, bgColor, change, changeType }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <div className="text-sm font-medium text-muted-foreground truncate">
            {name}
          </div>
          <div className="flex items-baseline">
            <div className="text-2xl font-semibold text-foreground">
              {value}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Badge 
          variant={changeType === 'negative' ? 'destructive' : 
                  changeType === 'warning' ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {change}
        </Badge>
      </div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Memoized QuickAction component
const QuickAction = memo<{
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}>(({ name, icon: Icon, action }) => (
  <Button
    variant="outline"
    className="h-16 flex-col space-y-2 hover:bg-accent"
    onClick={action}
    aria-label={`Quick action: ${name}`}
  >
    <Icon className="h-5 w-5" aria-hidden="true" />
    <span className="text-sm font-medium">{name}</span>
  </Button>
));

QuickAction.displayName = 'QuickAction';

const DashboardPage: React.FC = () => {
  usePerformanceMonitor('DashboardPage');
  // For now, we'll use mock data since the API doesn't have a dashboard endpoint yet
  const mockStats: DashboardStats = {
    total_products: 156,
    in_stock_items: 134,
    low_stock_items: 18,
    out_of_stock_items: 4,
    total_categories: 12,
    total_suppliers: 8,
    recent_movements: []
  };

  const { data: stats = mockStats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Simulate network delay for better UX testing
      await new Promise(resolve => setTimeout(resolve, 300));
      // For now, return mock data
      // Later we'll implement: const response = await api.get<DashboardStats>('/dashboard/stats');
      // return response.data;
      return mockStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const statCards = useMemo(() => [
    {
      name: 'Total Products',
      value: stats.total_products,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: '+5 this week',
      changeType: 'positive'
    },
    {
      name: 'In Stock',
      value: stats.in_stock_items,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: '86% of total',
      changeType: 'neutral'
    },
    {
      name: 'Low Stock',
      value: stats.low_stock_items,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: 'Need reorder',
      changeType: 'warning'
    },
    {
      name: 'Out of Stock',
      value: stats.out_of_stock_items,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      change: 'Urgent',
      changeType: 'negative'
    }
  ], [stats]);

  const recentActivities = [
    { id: 1, action: 'Product added', item: 'Hammer - Claw 16oz', time: '2 hours ago' },
    { id: 2, action: 'Stock updated', item: 'Screwdriver Set', time: '4 hours ago' },
    { id: 3, action: 'Low stock alert', item: 'Wood Screws 2"', time: '6 hours ago' },
    { id: 4, action: 'Supplier updated', item: 'ABC Hardware Supply', time: '1 day ago' },
    { id: 5, action: 'Category created', item: 'Power Tools', time: '2 days ago' }
  ];

  // Memoized action handlers
  const handleAddProduct = useCallback(() => console.log('Navigate to products page'), []);
  const handleUpdateStock = useCallback(() => console.log('Navigate to inventory page'), []);
  const handleNewCategory = useCallback(() => console.log('Navigate to categories page'), []);
  const handleAddSupplier = useCallback(() => console.log('Navigate to suppliers page'), []);

  const quickActions = useMemo(() => [
    {
      name: 'Add Product',
      icon: Plus,
      action: handleAddProduct
    },
    {
      name: 'Update Stock',
      icon: RefreshCw,
      action: handleUpdateStock
    },
    {
      name: 'New Category',
      icon: FolderPlus,
      action: handleNewCategory
    },
    {
      name: 'Add Supplier',
      icon: UserPlus,
      action: handleAddSupplier
    }
  ], [handleAddProduct, handleUpdateStock, handleNewCategory, handleAddSupplier]);

  if (error) {
    return (
      <ErrorDisplay 
        error={error as Error}
        title="Failed to load dashboard"
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loading your inventory overview...
          </p>
        </div>
        <LoadingCard 
          title="Loading Dashboard"
          description="Fetching your latest inventory statistics and activity..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back! Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.name} {...card} />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <QuickAction key={action.name} {...action} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.action}:</span>{' '}
                      {activity.item}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Stock Health</span>
              <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/20">
                86% Good
              </Badge>
            </div>
            <Progress value={86} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-green-600">{stats.in_stock_items}</p>
              <p className="text-sm text-muted-foreground">In Stock</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-yellow-600">{stats.low_stock_items}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-red-600">{stats.out_of_stock_items}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;