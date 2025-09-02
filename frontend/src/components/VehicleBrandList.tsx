import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Car, 
  MapPin,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { VehicleBrand, VehicleBrandListResponse } from '../types/api';
import { api } from '../services/api';

interface VehicleBrandListProps {
  onEditVehicleBrand: (vehicleBrand: VehicleBrand) => void;
  onViewVehicleBrand: (vehicleBrand: VehicleBrand) => void;
  onDeleteVehicleBrand: (vehicleBrand: VehicleBrand) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

const VehicleBrandList: React.FC<VehicleBrandListProps> = ({
  onEditVehicleBrand,
  onViewVehicleBrand,
  onDeleteVehicleBrand,
}) => {
  // State
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [countryFilter, setCountryFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicleBrands, setTotalVehicleBrands] = useState(0);
  const itemsPerPage = 12;

  // Load vehicle brands
  const loadVehicleBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Apply filters
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      
      if (countryFilter.trim()) {
        params.country_code = countryFilter.trim();
      }

      const response = await api.vehicleBrands.list(params);
      const data = response.data as VehicleBrandListResponse;
      
      setVehicleBrands(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalVehicleBrands(data.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load vehicle brands');
      console.error('Error loading vehicle brands:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, countryFilter, itemsPerPage]);

  // Effects
  useEffect(() => {
    loadVehicleBrands();
  }, [loadVehicleBrands]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, searchTerm, statusFilter, countryFilter]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('active');
    setCountryFilter('');
    setCurrentPage(1);
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return null;
    return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  };

  // Render vehicle brand card for grid view
  const renderVehicleBrandCard = (vehicleBrand: VehicleBrand) => (
    <div key={vehicleBrand.id} className="bg-card text-card-foreground rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            {/* Vehicle Brand Logo or Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              {vehicleBrand.logo_url ? (
                <img 
                  src={vehicleBrand.logo_url} 
                  alt={vehicleBrand.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const sibling = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (sibling) sibling.style.display = 'block';
                  }}
                />
              ) : null}
              <Car className="h-4 w-4 text-muted-foreground" style={{ display: vehicleBrand.logo_url ? 'none' : 'block' }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground truncate">
                {vehicleBrand.name}
              </h3>
              {vehicleBrand.code && (
                <p className="text-xs text-muted-foreground">#{vehicleBrand.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onViewVehicleBrand(vehicleBrand)}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
              title="View vehicle brand"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEditVehicleBrand(vehicleBrand)}
              className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
              title="Edit vehicle brand"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteVehicleBrand(vehicleBrand)}
              className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
              title="Delete vehicle brand"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Vehicle Brand Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            {!vehicleBrand.is_active && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                Inactive
              </span>
            )}
            {vehicleBrand.country_code && (
              <span className="ml-2 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {getCountryFlag(vehicleBrand.country_code)} {vehicleBrand.country_code}
              </span>
            )}
          </div>
          
          {vehicleBrand.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {vehicleBrand.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Render vehicle brand row for table view
  const renderVehicleBrandRow = (vehicleBrand: VehicleBrand) => (
    <tr key={vehicleBrand.id} className="hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {vehicleBrand.logo_url ? (
              <img 
                src={vehicleBrand.logo_url} 
                alt={vehicleBrand.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const sibling = target.nextElementSibling as HTMLElement;
                  target.style.display = 'none';
                  if (sibling) sibling.style.display = 'block';
                }}
              />
            ) : null}
            <Car className="h-4 w-4 text-muted-foreground" style={{ display: vehicleBrand.logo_url ? 'none' : 'block' }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {vehicleBrand.name}
            </div>
            {vehicleBrand.code && (
              <div className="text-xs text-muted-foreground">#{vehicleBrand.code}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {vehicleBrand.description || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {vehicleBrand.country_code ? (
          <span className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {getCountryFlag(vehicleBrand.country_code)} {vehicleBrand.country_code}
          </span>
        ) : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          vehicleBrand.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {vehicleBrand.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewVehicleBrand(vehicleBrand)}
            className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
            title="View vehicle brand"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditVehicleBrand(vehicleBrand)}
            className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
            title="Edit vehicle brand"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteVehicleBrand(vehicleBrand)}
            className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
            title="Delete vehicle brand"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-card text-card-foreground shadow rounded-lg">
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
      <div className="bg-card text-card-foreground shadow rounded-lg">
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error</div>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={loadVehicleBrands}
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
      <div className="bg-card text-card-foreground shadow rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search vehicle brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Country Filter */}
            <input
              type="text"
              placeholder="Country code (e.g., JP, DE, US)..."
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value.toUpperCase())}
              maxLength={2}
              className="px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
            />

            {/* Clear Filters */}
            {(searchTerm || statusFilter !== 'active' || countryFilter) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted/50"
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
                  ? 'bg-card text-card-foreground text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-card-foreground text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {vehicleBrands.length} of {totalVehicleBrands} vehicle brands
      </div>

      {/* Vehicle Brand List */}
      {vehicleBrands.length === 0 ? (
        <div className="bg-card text-card-foreground shadow rounded-lg">
          <div className="p-12 text-center">
            <Car className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No vehicle brands found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'active' || countryFilter
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first vehicle brand'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicleBrands.map(renderVehicleBrandCard)}
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vehicle Brand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card text-card-foreground divide-y divide-border">
              {vehicleBrands.map(renderVehicleBrandRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card text-card-foreground px-4 py-3 border-t border-border sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card text-card-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card text-card-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-foreground">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-card text-card-foreground text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-card text-card-foreground text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default VehicleBrandList;