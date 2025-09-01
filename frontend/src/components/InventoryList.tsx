import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Search, RefreshCw, Plus, Eye, Scan, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';
import type { 
  InventoryRecord, 
  LowStockItem, 
  ZeroStockItem 
} from '../types/api';

interface InventoryListProps {
  onStockAdjust?: (record: InventoryRecord) => void;
  onViewDetails?: (record: InventoryRecord) => void;
  onPOSLookup?: (record: InventoryRecord) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ 
  onStockAdjust, 
  onViewDetails,
  onPOSLookup 
}) => {
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [zeroStockItems, setZeroStockItems] = useState<ZeroStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and pagination for single hardware store
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [showPOSReady, setShowPOSReady] = useState(false);

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await api.inventory.list(params);
      const data = response.data;

      if (data.success !== false) {
        setInventoryRecords(data.data || []);
        setTotalPages(data.pagination?.total_pages || 1);
      } else {
        setError(data.message || 'Failed to load inventory');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const [lowStockResponse, zeroStockResponse] = await Promise.all([
        api.inventory.getLowStock(),
        api.inventory.getZeroStock()
      ]);
      
      setLowStockItems(lowStockResponse.data.data || []);
      setZeroStockItems(zeroStockResponse.data.data || []);
    } catch (err) {
      console.error('Failed to load stock alerts:', err);
    }
  };

  useEffect(() => {
    loadInventory();
    loadAlerts();
  }, [currentPage]);

  const getStockStatus = (record: InventoryRecord) => {
    const availableQuantity = record.quantity - record.reserved_quantity;
    
    if (availableQuantity === 0) {
      return { status: 'out-of-stock', color: 'text-red-600 bg-red-50', label: 'Out of Stock' };
    } else if (availableQuantity <= record.reorder_level) {
      return { status: 'low-stock', color: 'text-yellow-600 bg-yellow-50', label: 'Low Stock' };
    } else {
      return { status: 'in-stock', color: 'text-green-600 bg-green-50', label: 'In Stock' };
    }
  };

  const filteredRecords = inventoryRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.product?.barcode && record.product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (showLowStock) {
      const availableQuantity = record.quantity - record.reserved_quantity;
      return matchesSearch && availableQuantity <= record.reorder_level && availableQuantity > 0;
    }
    
    if (showZeroStock) {
      const availableQuantity = record.quantity - record.reserved_quantity;
      return matchesSearch && availableQuantity === 0;
    }

    if (showPOSReady) {
      const availableQuantity = record.quantity - record.reserved_quantity;
      return matchesSearch && availableQuantity > 0 && record.product?.is_active && record.product?.barcode;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-card text-card-foreground shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Inventory Overview</h2>
          <button
            onClick={() => { loadInventory(); loadAlerts(); }}
            className="inline-flex items-center px-3 py-2 border border-input rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted/50"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                setShowLowStock(!showLowStock);
                setShowZeroStock(false);
                setShowPOSReady(false);
              }}
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md ${
                showLowStock
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-background text-foreground border border-input hover:bg-muted/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Low Stock ({lowStockItems.length})
            </button>
            
            <button
              onClick={() => {
                setShowZeroStock(!showZeroStock);
                setShowLowStock(false);
                setShowPOSReady(false);
              }}
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md ${
                showZeroStock
                  ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-300'
                  : 'bg-background text-foreground border border-input hover:bg-muted/50'
              }`}
            >
              <Package className="w-4 h-4 mr-1" />
              Out of Stock ({zeroStockItems.length})
            </button>

            <button
              onClick={() => {
                setShowPOSReady(!showPOSReady);
                setShowLowStock(false);
                setShowZeroStock(false);
              }}
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md ${
                showPOSReady
                  ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-300'
                  : 'bg-background text-foreground border border-input hover:bg-muted/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              POS Ready
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading inventory...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No inventory records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stock Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredRecords.map((record) => {
                  const stockStatus = getStockStatus(record);
                  const availableQuantity = record.quantity - record.reserved_quantity;
                  
                  return (
                    <tr key={record.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {record.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {record.product?.sku || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Scan className="w-4 h-4 text-muted-foreground mr-2" />
                          <span className="text-sm text-foreground">
                            {record.product?.barcode || 'No barcode'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">
                          <div>Available: <span className="font-semibold">{availableQuantity}</span></div>
                          <div>Reserved: <span className="text-muted-foreground">{record.reserved_quantity}</span></div>
                          <div>Reorder Level: <span className="text-muted-foreground">{record.reorder_level}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(record.last_updated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(record)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onStockAdjust && (
                            <button
                              onClick={() => onStockAdjust(record)}
                              className="text-green-600 hover:text-green-900"
                              title="Adjust Stock"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                          {onPOSLookup && record.product?.barcode && availableQuantity > 0 && (
                            <button
                              onClick={() => onPOSLookup(record)}
                              className="text-purple-600 hover:text-purple-900"
                              title="POS Lookup"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;