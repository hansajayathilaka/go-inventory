import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Truck, 
  Mail, 
  Phone,
  MapPin,
  User,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { Supplier, SupplierListResponse } from '../types/api';
import { api } from '../services/api';

interface SupplierListProps {
  onEditSupplier: (supplier: Supplier) => void;
  onViewSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplier: Supplier) => void;
  refreshTrigger?: number;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

const SupplierList: React.FC<SupplierListProps> = ({
  onEditSupplier,
  onViewSupplier,
  onDeleteSupplier,
  refreshTrigger = 0,
}) => {
  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  
  const itemsPerPage = 12;

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: itemsPerPage.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('is_active', (statusFilter === 'active').toString());
      
      const response = await api.get<SupplierListResponse>(`/suppliers?${params}`);
      const data = response.data as SupplierListResponse;
      
      if (data.success && data.data) {
        const supplierData = data.data.suppliers || data.data || [];
        setSuppliers(Array.isArray(supplierData) ? supplierData : []);
        if (data.data.pagination) {
          setTotalPages(Math.ceil(data.data.pagination.total / itemsPerPage));
          setTotalSuppliers(data.data.pagination.total || 0);
        }
      } else {
        setError('Failed to fetch suppliers');
        setSuppliers([]);
      }
    } catch (err) {
      setError('Error loading suppliers. Please try again.');
      setSuppliers([]);
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, itemsPerPage]);

  // Effects
  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, searchTerm, statusFilter, refreshTrigger, fetchSuppliers]);

  // Handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as StatusFilter);
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-card text-card-foreground shadow rounded-lg">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-foreground">
              Suppliers ({totalSuppliers})
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your supplier relationships
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-muted-foreground hover:text-muted-foreground'
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-muted-foreground hover:text-muted-foreground'
              }`}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-muted/50 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Suppliers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Truck className="mx-auto h-12 w-12" />
            </div>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchSuppliers}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No suppliers found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No suppliers available.'}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {supplier.name}
                          </h4>
                          {supplier.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Code: {supplier.code}
                        </p>
                        {supplier.email && (
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 mr-1" />
                            <span className="truncate">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 mr-1" />
                            <span className="truncate">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.contact_person && (
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <User className="h-4 w-4 mr-1" />
                            <span className="truncate">{supplier.contact_person}</span>
                          </div>
                        )}
                        {supplier.address && (
                          <div className="mt-1 flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDate(supplier.created_at)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewSupplier(supplier)}
                          className="text-muted-foreground hover:text-blue-600 transition-colors"
                          title="View supplier"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditSupplier(supplier)}
                          className="text-muted-foreground hover:text-green-600 transition-colors"
                          title="Edit supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSupplier(supplier)}
                          className="text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card text-card-foreground divide-y divide-border">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Code: {supplier.code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {supplier.contact_person || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.email || supplier.phone || 'No contact info'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {supplier.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(supplier.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => onViewSupplier(supplier)}
                              className="text-muted-foreground hover:text-blue-600 transition-colors"
                              title="View supplier"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onEditSupplier(supplier)}
                              className="text-muted-foreground hover:text-green-600 transition-colors"
                              title="Edit supplier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteSupplier(supplier)}
                              className="text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete supplier"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-muted/50 border-t border-border rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-input rounded-md hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;