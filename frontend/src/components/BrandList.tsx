import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Tag, 
  Globe, 
  MapPin,
  ExternalLink,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Brand, BrandListResponse } from '../types/api';
import { api } from '../services/api';

interface BrandListProps {
  onEditBrand: (brand: Brand) => void;
  onViewBrand: (brand: Brand) => void;
  onDeleteBrand: (brand: Brand) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

const BrandList: React.FC<BrandListProps> = ({
  onEditBrand,
  onViewBrand,
  onDeleteBrand,
}) => {
  // State
  const [brands, setBrands] = useState<Brand[]>([]);
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
  const [totalBrands, setTotalBrands] = useState(0);
  const itemsPerPage = 12;

  // Load brands
  const loadBrands = useCallback(async () => {
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

      const response = await api.brands.list(params);
      const data = response.data as BrandListResponse;
      
      setBrands(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalBrands(data.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load brands');
      console.error('Error loading brands:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, countryFilter]);

  // Effects
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

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

  // Render brand card for grid view
  const renderBrandCard = (brand: Brand) => (
    <div key={brand.id} className="bg-card text-card-foreground rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            {/* Brand Logo or Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              {brand.logo_url ? (
                <img 
                  src={brand.logo_url} 
                  alt={brand.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    const sibling = target.nextElementSibling as HTMLElement;
                    target.style.display = 'none';
                    if (sibling) sibling.style.display = 'block';
                  }}
                />
              ) : null}
              <Tag className="h-4 w-4 text-muted-foreground" style={{ display: brand.logo_url ? 'none' : 'block' }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground truncate">
                {brand.name}
              </h3>
              {brand.code && (
                <p className="text-xs text-muted-foreground">#{brand.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onViewBrand(brand)}
              className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
              title="View brand"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEditBrand(brand)}
              className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
              title="Edit brand"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteBrand(brand)}
              className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
              title="Delete brand"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Brand Info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs text-muted-foreground">
            {!brand.is_active && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                Inactive
              </span>
            )}
            {brand.country_code && (
              <span className="ml-2 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {getCountryFlag(brand.country_code)} {brand.country_code}
              </span>
            )}
          </div>
          
          {brand.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {brand.description}
            </p>
          )}
          
          {brand.website && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
              <a 
                href={brand.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="truncate hover:text-blue-600 transition-colors flex items-center"
              >
                <span className="truncate">{brand.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render brand row for table view
  const renderBrandRow = (brand: Brand) => (
    <tr key={brand.id} className="hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            {brand.logo_url ? (
              <img 
                src={brand.logo_url} 
                alt={brand.name}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  const sibling = target.nextElementSibling as HTMLElement;
                  target.style.display = 'none';
                  if (sibling) sibling.style.display = 'block';
                }}
              />
            ) : null}
            <Tag className="h-4 w-4 text-muted-foreground" style={{ display: brand.logo_url ? 'none' : 'block' }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {brand.name}
            </div>
            {brand.code && (
              <div className="text-xs text-muted-foreground">#{brand.code}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand.description || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand.country_code ? (
          <span className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {getCountryFlag(brand.country_code)} {brand.country_code}
          </span>
        ) : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {brand.website ? (
          <a 
            href={brand.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
          >
            <Globe className="h-3 w-3 mr-1" />
            <span className="truncate max-w-32">{brand.website.replace(/^https?:\/\//, '')}</span>
            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
          </a>
        ) : '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          brand.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {brand.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewBrand(brand)}
            className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
            title="View brand"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditBrand(brand)}
            className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors"
            title="Edit brand"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteBrand(brand)}
            className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors"
            title="Delete brand"
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
              onClick={loadBrands}
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
                placeholder="Search brands..."
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
              placeholder="Country code (e.g., US, DE)..."
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
        Showing {brands.length} of {totalBrands} brands
      </div>

      {/* Brand List */}
      {brands.length === 0 ? (
        <div className="bg-card text-card-foreground shadow rounded-lg">
          <div className="p-12 text-center">
            <Tag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No brands found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'active' || countryFilter
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first brand'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map(renderBrandCard)}
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Website
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
              {brands.map(renderBrandRow)}
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

export default BrandList;