import React, { useState, useEffect, useCallback } from 'react';
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
  Send,
  Package,
  FileCheck
} from 'lucide-react';
import type { PurchaseReceipt, PurchaseReceiptListResponse, PurchaseReceiptStatus } from '../types/api';
import { api } from '../services/api';

interface PurchaseReceiptListProps {
  onEditPurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onViewPurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onDeletePurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onApprovePurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onSendPurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onReceivePurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onCompletePurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
  onCancelPurchaseReceipt: (purchaseReceipt: PurchaseReceipt) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'partial' | 'completed' | 'cancelled';

const PurchaseReceiptList: React.FC<PurchaseReceiptListProps> = ({
  onEditPurchaseReceipt,
  onViewPurchaseReceipt,
  onDeletePurchaseReceipt,
  onApprovePurchaseReceipt,
  onSendPurchaseReceipt,
  onReceivePurchaseReceipt,
  onCompletePurchaseReceipt,
  onCancelPurchaseReceipt,
}) => {
  // State
  const [purchaseReceipts, setPurchaseReceipts] = useState<PurchaseReceipt[]>([]);
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

  // Load purchase receipts
  const loadPurchaseReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await api.purchaseReceipts.list(params);
      const data = response.data as PurchaseReceiptListResponse;
      
      setPurchaseReceipts(data.data || []);
      setTotalPages(Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      setTotalItems(data.pagination?.total || 0);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setError(apiError.response?.data?.message || 'Failed to load purchase receipts');
      console.error('Error loading purchase receipts:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, supplierFilter, startDate, endDate, itemsPerPage]);

  // Effect to load purchase receipts when filters change
  useEffect(() => {
    loadPurchaseReceipts();
  }, [loadPurchaseReceipts]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [currentPage, searchTerm, statusFilter, supplierFilter, startDate, endDate]);

  // Get status badge
  const getStatusBadge = (status: PurchaseReceiptStatus) => {
    const baseClass = 'px-2 py-1 text-xs font-medium rounded-full';
    
    switch (status) {
      case 'draft':
        return (
          <span className={`${baseClass} bg-secondary text-secondary-foreground flex items-center gap-1`}>
            <FileText size={12} />
            Draft
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClass} bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 flex items-center gap-1`}>
            <Clock size={12} />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className={`${baseClass} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center gap-1`}>
            <CheckCircle size={12} />
            Approved
          </span>
        );
      case 'ordered':
        return (
          <span className={`${baseClass} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center gap-1`}>
            <Send size={12} />
            Ordered
          </span>
        );
      case 'received':
        return (
          <span className={`${baseClass} bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 flex items-center gap-1`}>
            <Package size={12} />
            Received
          </span>
        );
      case 'partial':
        return (
          <span className={`${baseClass} bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 flex items-center gap-1`}>
            <AlertCircle size={12} />
            Partial
          </span>
        );
      case 'completed':
        return (
          <span className={`${baseClass} bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1`}>
            <FileCheck size={12} />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className={`${baseClass} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 flex items-center gap-1`}>
            <XCircle size={12} />
            Cancelled
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-secondary text-secondary-foreground`}>
            {status}
          </span>
        );
    }
  };

  // Get available actions for each status
  const getAvailableActions = (receipt: PurchaseReceipt) => {
    const actions = [];

    // View and Edit are always available (except for completed/cancelled in some cases)
    actions.push(
      <button
        key="view"
        onClick={() => onViewPurchaseReceipt(receipt)}
        className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
        title="View Details"
      >
        <Eye size={16} />
      </button>
    );

    if (receipt.status !== 'completed' && receipt.status !== 'cancelled') {
      actions.push(
        <button
          key="edit"
          onClick={() => onEditPurchaseReceipt(receipt)}
          className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
          title="Edit"
        >
          <Edit size={16} />
        </button>
      );
    }

    // Status-specific actions
    switch (receipt.status) {
      case 'draft':
      case 'pending':
        actions.push(
          <button
            key="approve"
            onClick={() => onApprovePurchaseReceipt(receipt)}
            className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
            title="Approve"
          >
            <CheckCircle size={16} />
          </button>
        );
        break;
      
      case 'approved':
        actions.push(
          <button
            key="send"
            onClick={() => onSendPurchaseReceipt(receipt)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
            title="Send to Supplier"
          >
            <Send size={16} />
          </button>
        );
        break;
      
      case 'ordered':
      case 'partial':
        actions.push(
          <button
            key="receive"
            onClick={() => onReceivePurchaseReceipt(receipt)}
            className="text-purple-600 hover:text-purple-800 p-1 rounded transition-colors"
            title="Process Receipt"
          >
            <Package size={16} />
          </button>
        );
        break;
      
      case 'received':
        actions.push(
          <button
            key="complete"
            onClick={() => onCompletePurchaseReceipt(receipt)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded transition-colors"
            title="Complete"
          >
            <FileCheck size={16} />
          </button>
        );
        break;
    }

    // Cancel action (not available for completed/cancelled)
    if (receipt.status !== 'completed' && receipt.status !== 'cancelled') {
      actions.push(
        <button
          key="cancel"
          onClick={() => onCancelPurchaseReceipt(receipt)}
          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
          title="Cancel"
        >
          <XCircle size={16} />
        </button>
      );
    }

    // Delete action (only for draft status)
    if (receipt.status === 'draft') {
      actions.push(
        <button
          key="delete"
          onClick={() => onDeletePurchaseReceipt(receipt)}
          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      );
    }

    return actions;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'MYR') => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading purchase receipts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
        <button 
          onClick={loadPurchaseReceipts}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Purchase Receipts</h2>
          <p className="text-sm text-gray-600">
            Manage your unified purchase orders and goods receipts
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListIcon size={16} />
            Table
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground p-4 rounded-lg border space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by receipt number, reference, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="partial">Partial</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter size={16} className="mr-2" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {purchaseReceipts.length} of {totalItems} purchase receipts
      </div>

      {/* Purchase Receipts Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {purchaseReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-card text-card-foreground rounded-lg border hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-card-foreground">{receipt.receipt_number}</h3>
                    <p className="text-sm text-muted-foreground">{receipt.supplier?.name}</p>
                  </div>
                  {getStatusBadge(receipt.status)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>Order: {formatDate(receipt.order_date)}</span>
                </div>
                
                {receipt.received_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck size={14} />
                    <span>Received: {formatDate(receipt.received_date)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign size={14} />
                  <span>{formatCurrency(receipt.total_amount, receipt.currency)}</span>
                </div>

                {receipt.reference && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Ref:</span> {receipt.reference}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 py-3 bg-muted rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {receipt.items?.length || 0} items
                  </div>
                  <div className="flex items-center gap-1">
                    {getAvailableActions(receipt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {purchaseReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{receipt.receipt_number}</div>
                      {receipt.reference && (
                        <div className="text-xs text-gray-500">Ref: {receipt.reference}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{receipt.supplier?.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(receipt.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(receipt.order_date)}
                      {receipt.received_date && (
                        <div className="text-xs text-gray-500">
                          Received: {formatDate(receipt.received_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(receipt.total_amount, receipt.currency)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {receipt.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getAvailableActions(receipt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {purchaseReceipts.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase receipts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' || supplierFilter || startDate || endDate
              ? 'No purchase receipts match your current filters.'
              : 'Get started by creating your first purchase receipt.'}
          </p>
          {(searchTerm || statusFilter !== 'all' || supplierFilter || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>
              Showing page {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReceiptList;