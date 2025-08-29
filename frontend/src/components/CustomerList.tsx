import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Mail, 
  Phone,
  MapPin,
  CreditCard,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Customer, CustomerListResponse } from '../types/api';
import { api } from '../services/api';

interface CustomerListProps {
  onEditCustomer: (customer: Customer) => void;
  onViewCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

type ViewMode = 'grid' | 'table';
type CustomerType = 'all' | 'individual' | 'business';
type StatusFilter = 'all' | 'active' | 'inactive';

const CustomerList: React.FC<CustomerListProps> = ({
  onEditCustomer,
  onViewCustomer,
  onDeleteCustomer,
}) => {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [customerType, setCustomerType] = useState<CustomerType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [cityFilter, setCityFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const itemsPerPage = 12;

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Apply filters
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (customerType !== 'all') {
        params.customer_type = customerType;
      }
      
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      
      if (cityFilter.trim()) {
        params.city = cityFilter.trim();
      }

      const response = await api.customers.list(params);
      const data = response.data as CustomerListResponse;
      
      setCustomers(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCustomers(data.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadCustomers();
  }, [currentPage, searchTerm, customerType, statusFilter, cityFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, customerType, statusFilter, cityFilter]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setCustomerType('all');
    setStatusFilter('active');
    setCityFilter('');
    setCurrentPage(1);
  };

  // Get customer type icon and label
  const getCustomerTypeIcon = (type: string) => {
    return type === 'business' ? <Building className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getCustomerTypeLabel = (type: string) => {
    return type === 'business' ? 'Business' : 'Individual';
  };

  // Render customer card for grid view
  const renderCustomerCard = (customer: Customer) => (
    <div key={customer.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 min-w-0 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              {getCustomerTypeIcon(customer.customer_type)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {customer.name}
              </h3>
              {customer.code && (
                <p className="text-xs text-gray-500">#{customer.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onViewCustomer(customer)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="View customer"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEditCustomer(customer)}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit customer"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteCustomer(customer)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete customer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs text-gray-600">
            <span className="px-2 py-0.5 bg-gray-100 rounded-full">
              {getCustomerTypeLabel(customer.customer_type)}
            </span>
            {!customer.is_active && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                Inactive
              </span>
            )}
          </div>
          
          {customer.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {customer.phone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{customer.phone}</span>
            </div>
          )}
          
          {customer.city && (
            <div className="flex items-center text-xs text-gray-600">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{customer.city}</span>
            </div>
          )}

          {customer.credit_limit && customer.credit_limit > 0 && (
            <div className="flex items-center text-xs text-gray-600">
              <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>${customer.credit_limit.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render customer row for table view
  const renderCustomerRow = (customer: Customer) => (
    <tr key={customer.id} className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {getCustomerTypeIcon(customer.customer_type)}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {customer.name}
            </div>
            {customer.code && (
              <div className="text-xs text-gray-500">#{customer.code}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {getCustomerTypeLabel(customer.customer_type)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {customer.email || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {customer.phone || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {customer.city || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {customer.credit_limit ? `$${customer.credit_limit.toLocaleString()}` : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          customer.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {customer.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewCustomer(customer)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="View customer"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditCustomer(customer)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit customer"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteCustomer(customer)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete customer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error</div>
            <p className="text-gray-500">{error}</p>
            <button
              onClick={loadCustomers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Type Filter */}
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* City Filter */}
            <input
              type="text"
              placeholder="Filter by city..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-40"
            />

            {/* Clear Filters */}
            {(searchTerm || customerType !== 'all' || statusFilter !== 'active' || cityFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Table view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {customers.length} of {totalCustomers} customers
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="p-12 text-center">
            <Users className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No customers found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || customerType !== 'all' || statusFilter !== 'active' || cityFilter
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first customer'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {customers.map(renderCustomerCard)}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Limit
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map(renderCustomerRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
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

export default CustomerList;