import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Package,
  QrCode,
  ClipboardCheck
} from 'lucide-react';
import type { GRN, GRNListResponse, GRNStatus } from '../types/api';
import { api } from '../services/api';

interface GRNListProps {
  onEditGRN: (grn: GRN) => void;
  onViewGRN: (grn: GRN) => void;
  onDeleteGRN: (grn: GRN) => void;
  onProcessGRN: (grn: GRN, action: 'receipt' | 'verify' | 'complete') => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'draft' | 'received' | 'partial' | 'completed' | 'cancelled';

const GRNList: React.FC<GRNListProps> = ({
  onEditGRN,
  onViewGRN,
  onDeleteGRN,
  onProcessGRN,
}) => {
  // State
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [poFilter, setPOFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load GRNs
  const loadGRNs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.grn.list({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        supplier_id: supplierFilter || undefined,
        purchase_order_id: poFilter || undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined,
      });

      const data = response.data as GRNListResponse;
      setGRNs(data.data);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load GRNs');
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadGRNs();
  }, [currentPage, searchTerm, statusFilter, supplierFilter, poFilter, startDateFilter, endDateFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSupplierFilter('');
    setPOFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setCurrentPage(1);
  };

  // Get status badge
  const getStatusBadge = (status: GRNStatus) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      received: { color: 'bg-blue-100 text-blue-800', icon: Package, label: 'Received' },
      partial: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Partial' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  // Get status-based actions
  const getStatusActions = (grn: GRN) => {
    const actions = [];

    switch (grn.status) {
      case 'draft':
        actions.push(
          <button
            key="receipt"
            onClick={() => onProcessGRN(grn, 'receipt')}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Mark as Received"
          >
            <Package size={16} />
          </button>
        );
        break;
      case 'received':
        actions.push(
          <button
            key="verify"
            onClick={() => onProcessGRN(grn, 'verify')}
            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
            title="Verify Quality"
          >
            <QrCode size={16} />
          </button>
        );
        break;
      case 'partial':
        actions.push(
          <button
            key="complete"
            onClick={() => onProcessGRN(grn, 'complete')}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
            title="Complete GRN"
          >
            <ClipboardCheck size={16} />
          </button>
        );
        break;
    }

    return actions;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GRN Management</h2>
          <p className="text-gray-600">Manage goods received notes and quality control</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 border rounded-lg"
          >
            {viewMode === 'grid' ? <ListIcon size={20} /> : <Grid size={20} />}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search GRNs..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="received">Received</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => {
                  setStartDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => {
                  setEndDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* GRN List */}
      {grns.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No GRNs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating a new GRN'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {grns.map((grn) => (
            <div key={grn.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{grn.grn_number}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    PO: {grn.purchase_order_id?.substring(0, 8)}...
                  </p>
                </div>
                {getStatusBadge(grn.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(grn.total_amount, grn.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Received:</span>
                  <span className="text-gray-900">{formatDate(grn.received_date)}</span>
                </div>
                {grn.invoice_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Invoice:</span>
                    <span className="text-gray-900 truncate">{grn.invoice_number}</span>
                  </div>
                )}
                {grn.quality_check && (
                  <div className="flex items-center text-sm">
                    <CheckCircle size={14} className="text-green-500 mr-1" />
                    <span className="text-green-700">Quality Checked</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-1">
                  <button
                    onClick={() => onViewGRN(grn)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  {(grn.status === 'draft' || grn.status === 'received') && (
                    <button
                      onClick={() => onEditGRN(grn)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                      title="Edit GRN"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {grn.status === 'draft' && (
                    <button
                      onClick={() => onDeleteGRN(grn)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Delete GRN"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex space-x-1">
                  {getStatusActions(grn)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GRN Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Check
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {grns.map((grn) => (
                  <tr key={grn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{grn.grn_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grn.purchase_order_id?.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(grn.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(grn.received_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(grn.total_amount, grn.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {grn.invoice_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grn.quality_check ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckCircle size={16} className="mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onViewGRN(grn)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {(grn.status === 'draft' || grn.status === 'received') && (
                          <button
                            onClick={() => onEditGRN(grn)}
                            className="p-1 text-blue-500 hover:text-blue-700"
                            title="Edit GRN"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {grn.status === 'draft' && (
                          <button
                            onClick={() => onDeleteGRN(grn)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Delete GRN"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {getStatusActions(grn)}
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
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-medium">{totalItems}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GRNList;