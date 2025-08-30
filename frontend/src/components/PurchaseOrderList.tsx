import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Truck,
  Calendar,
  DollarSign,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Send
} from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderListResponse, PurchaseOrderStatus } from '../types/api';
import { api } from '../services/api';

interface PurchaseOrderListProps {
  onEditPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onViewPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onDeletePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onApprovePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onSendPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  onCancelPurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  onEditPurchaseOrder,
  onViewPurchaseOrder,
  onDeletePurchaseOrder,
  onApprovePurchaseOrder,
  onSendPurchaseOrder,
  onCancelPurchaseOrder,
}) => {
  // State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  // Load purchase orders
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.purchaseOrders.list(params);
      const data = response.data as PurchaseOrderListResponse;
      
      setPurchaseOrders(data.data || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      setTotalItems(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load purchase orders');
      console.error('Error loading purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to load purchase orders when filters change
  useEffect(() => {
    loadPurchaseOrders();
  }, [currentPage, searchTerm, statusFilter, supplierFilter, startDate, endDate]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      loadPurchaseOrders();
    }
  }, [searchTerm, statusFilter, supplierFilter, startDate, endDate]);

  // Helper functions
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const statusConfig = {
      draft: { icon: Edit, color: 'bg-gray-100 text-gray-700', label: 'Draft' },
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Approved' },
      ordered: { icon: Send, color: 'bg-green-100 text-green-700', label: 'Ordered' },
      received: { icon: Truck, color: 'bg-purple-100 text-purple-700', label: 'Received' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter purchase orders based on search term
  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      po.po_number.toLowerCase().includes(searchLower) ||
      (po.reference && po.reference.toLowerCase().includes(searchLower)) ||
      (po.notes && po.notes.toLowerCase().includes(searchLower))
    );
  });

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading purchase orders...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-red-700">
            <p className="font-medium">Error loading purchase orders</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render main component
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Purchase Orders</h2>
            <p className="text-sm text-gray-500">{totalItems} total orders</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              placeholder="Start Date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              placeholder="End Date"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Clear Filters */}
          {(searchTerm || statusFilter !== 'all' || supplierFilter || startDate || endDate) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSupplierFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Orders Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPurchaseOrders.map((po) => (
            <div
              key={po.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{po.po_number}</h3>
                    <p className="text-sm text-gray-500">{formatDate(po.order_date)}</p>
                  </div>
                  {getStatusBadge(po.status)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(po.total_amount, po.currency)}
                    </span>
                  </div>
                  
                  {po.expected_date && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span>Expected: {formatDate(po.expected_date)}</span>
                    </div>
                  )}

                  {po.reference && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="truncate">Ref: {po.reference}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewPurchaseOrder(po)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {po.status === 'draft' && (
                      <button
                        onClick={() => onEditPurchaseOrder(po)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    {(po.status === 'draft' || po.status === 'pending') && (
                      <button
                        onClick={() => onDeletePurchaseOrder(po)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Action buttons based on status */}
                  <div className="flex space-x-2">
                    {po.status === 'pending' && (
                      <button
                        onClick={() => onApprovePurchaseOrder(po)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    
                    {po.status === 'approved' && (
                      <button
                        onClick={() => onSendPurchaseOrder(po)}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Send
                      </button>
                    )}

                    {(po.status === 'draft' || po.status === 'pending' || po.status === 'approved') && (
                      <button
                        onClick={() => onCancelPurchaseOrder(po)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
                        {po.reference && (
                          <div className="text-sm text-gray-500">Ref: {po.reference}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(po.total_amount, po.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Items: {po.items?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Order: {formatDate(po.order_date)}
                      </div>
                      {po.expected_date && (
                        <div className="text-sm text-gray-500">
                          Expected: {formatDate(po.expected_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewPurchaseOrder(po)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {po.status === 'draft' && (
                          <button
                            onClick={() => onEditPurchaseOrder(po)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {(po.status === 'draft' || po.status === 'pending') && (
                          <button
                            onClick={() => onDeletePurchaseOrder(po)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {po.status === 'pending' && (
                          <button
                            onClick={() => onApprovePurchaseOrder(po)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        
                        {po.status === 'approved' && (
                          <button
                            onClick={() => onSendPurchaseOrder(po)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                          >
                            Send
                          </button>
                        )}

                        {(po.status === 'draft' || po.status === 'pending' || po.status === 'approved') && (
                          <button
                            onClick={() => onCancelPurchaseOrder(po)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
              {totalItems} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPurchaseOrders.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No purchase orders found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || supplierFilter || startDate || endDate
              ? 'Try adjusting your search criteria or filters.'
              : 'Get started by creating your first purchase order.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderList;