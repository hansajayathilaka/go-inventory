import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
// import { api } from '../services/api'; // TODO: Use this when dashboard API is ready
import type { DashboardStats } from '../types/api';

const DashboardPage: React.FC = () => {
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

  const { data: stats = mockStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // For now, return mock data
      // Later we'll implement: const response = await api.get<DashboardStats>('/dashboard/stats');
      // return response.data;
      return mockStats;
    }
  });

  const statCards = [
    {
      name: 'Total Products',
      value: stats.total_products,
      icon: Package,
      color: 'bg-blue-500',
      change: '+5 this week'
    },
    {
      name: 'In Stock',
      value: stats.in_stock_items,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '86% of total'
    },
    {
      name: 'Low Stock',
      value: stats.low_stock_items,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: 'Need reorder'
    },
    {
      name: 'Out of Stock',
      value: stats.out_of_stock_items,
      icon: TrendingUp,
      color: 'bg-red-500',
      change: 'Urgent'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'Product added', item: 'Hammer - Claw 16oz', time: '2 hours ago' },
    { id: 2, action: 'Stock updated', item: 'Screwdriver Set', time: '4 hours ago' },
    { id: 3, action: 'Low stock alert', item: 'Wood Screws 2"', time: '6 hours ago' },
    { id: 4, action: 'Supplier updated', item: 'ABC Hardware Supply', time: '1 day ago' },
    { id: 5, action: 'Category created', item: 'Power Tools', time: '2 days ago' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-xs text-gray-500">{card.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors">
                Add Product
              </button>
              <button className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors">
                Update Stock
              </button>
              <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg transition-colors">
                New Category
              </button>
              <button className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-3 px-4 rounded-lg transition-colors">
                Add Supplier
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}:</span>{' '}
                      {activity.item}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Inventory Status
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Overall Stock Health</span>
                <span className="text-sm text-green-600 font-semibold">86% Good</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '86%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-green-600">{stats.in_stock_items}</p>
                <p className="text-sm text-gray-500">In Stock</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-yellow-600">{stats.low_stock_items}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-600">{stats.out_of_stock_items}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;