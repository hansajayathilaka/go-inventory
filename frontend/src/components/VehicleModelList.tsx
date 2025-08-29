import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Car, 
  Calendar,
  Zap,
  Settings,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { VehicleModelWithBrand, VehicleModelListResponse, VehicleBrand } from '../types/api';
import { api } from '../services/api';

interface VehicleModelListProps {
  onEditVehicleModel: (vehicleModel: VehicleModelWithBrand) => void;
  onViewVehicleModel: (vehicleModel: VehicleModelWithBrand) => void;
  onDeleteVehicleModel: (vehicleModel: VehicleModelWithBrand) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';

const VehicleModelList: React.FC<VehicleModelListProps> = ({
  onEditVehicleModel,
  onViewVehicleModel,
  onDeleteVehicleModel,
}) => {
  // State
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWithBrand[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [brandFilter, setBrandFilter] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [yearFromFilter, setYearFromFilter] = useState('');
  const [yearToFilter, setYearToFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicleModels, setTotalVehicleModels] = useState(0);
  const itemsPerPage = 12;

  // Load vehicle brands for filter dropdown
  const loadVehicleBrands = async () => {
    try {
      const response = await api.vehicleBrands.list({ is_active: true, limit: 100 });
      setVehicleBrands(response.data?.data || []);
    } catch (err) {
      console.error('Error loading vehicle brands:', err);
    }
  };

  // Load vehicle models
  const loadVehicleModels = async () => {
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
      
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      
      if (brandFilter) {
        params.vehicle_brand_id = brandFilter;
      }
      
      if (fuelTypeFilter.trim()) {
        params.fuel_type = fuelTypeFilter.trim();
      }
      
      if (yearFromFilter) {
        params.year_from = parseInt(yearFromFilter, 10);
      }
      
      if (yearToFilter) {
        params.year_to = parseInt(yearToFilter, 10);
      }

      const response = await api.vehicleModels.list(params);
      const data = response.data as VehicleModelListResponse;
      
      setVehicleModels(data.data || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalVehicleModels(data.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load vehicle models');
      console.error('Error loading vehicle models:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    loadVehicleBrands();
  }, []);

  useEffect(() => {
    loadVehicleModels();
  }, [currentPage, searchTerm, statusFilter, brandFilter, fuelTypeFilter, yearFromFilter, yearToFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter, brandFilter, fuelTypeFilter, yearFromFilter, yearToFilter]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('active');
    setBrandFilter('');
    setFuelTypeFilter('');
    setYearFromFilter('');
    setYearToFilter('');
    setCurrentPage(1);
  };

  // Format year range
  const formatYearRange = (yearFrom: number, yearTo?: number) => {
    if (yearTo && yearTo !== yearFrom) {
      return `${yearFrom}-${yearTo}`;
    }
    return `${yearFrom}+`;
  };

  // Render vehicle model card for grid view
  const renderVehicleModelCard = (vehicleModel: VehicleModelWithBrand) => (
    <div key={vehicleModel.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 min-w-0 flex-1">
            {/* Vehicle Model Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Car className="h-4 w-4 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {vehicleModel.name}
              </h3>
              <p className="text-xs text-gray-500">{vehicleModel.vehicle_brand.name}</p>
              {vehicleModel.code && (
                <p className="text-xs text-gray-500">#{vehicleModel.code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => onViewVehicleModel(vehicleModel)}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="View vehicle model"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEditVehicleModel(vehicleModel)}
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit vehicle model"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDeleteVehicleModel(vehicleModel)}
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete vehicle model"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Vehicle Model Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="h-3 w-3 mr-1" />
              {formatYearRange(vehicleModel.year_from, vehicleModel.year_to)}
            </div>
            {!vehicleModel.is_active && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                Inactive
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            {vehicleModel.fuel_type && (
              <div className="flex items-center">
                <Zap className="h-3 w-3 mr-1" />
                {vehicleModel.fuel_type}
              </div>
            )}
            {vehicleModel.transmission && (
              <div className="flex items-center">
                <Settings className="h-3 w-3 mr-1" />
                {vehicleModel.transmission}
              </div>
            )}
          </div>

          {vehicleModel.engine_size && (
            <div className="text-xs text-gray-600">
              Engine: {vehicleModel.engine_size}
            </div>
          )}
          
          {vehicleModel.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {vehicleModel.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // Render vehicle model row for table view
  const renderVehicleModelRow = (vehicleModel: VehicleModelWithBrand) => (
    <tr key={vehicleModel.id} className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Car className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {vehicleModel.name}
            </div>
            {vehicleModel.code && (
              <div className="text-xs text-gray-500">#{vehicleModel.code}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {vehicleModel.vehicle_brand.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatYearRange(vehicleModel.year_from, vehicleModel.year_to)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {vehicleModel.fuel_type || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {vehicleModel.transmission || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {vehicleModel.engine_size || '-'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          vehicleModel.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {vehicleModel.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewVehicleModel(vehicleModel)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="View vehicle model"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditVehicleModel(vehicleModel)}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit vehicle model"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteVehicleModel(vehicleModel)}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete vehicle model"
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
              onClick={loadVehicleModels}
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
          <div className="flex flex-col gap-3 flex-1">
            {/* First Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search vehicle models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>

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

              {/* Brand Filter */}
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
              >
                <option value="">All Brands</option>
                {vehicleBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>

              {/* Fuel Type Filter */}
              <input
                type="text"
                placeholder="Fuel type (e.g., Petrol, Diesel)..."
                value={fuelTypeFilter}
                onChange={(e) => setFuelTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-48"
              />
            </div>

            {/* Second Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Year From Filter */}
              <input
                type="number"
                placeholder="Year from..."
                value={yearFromFilter}
                onChange={(e) => setYearFromFilter(e.target.value)}
                min="1900"
                max="2030"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-32"
              />

              {/* Year To Filter */}
              <input
                type="number"
                placeholder="Year to..."
                value={yearToFilter}
                onChange={(e) => setYearToFilter(e.target.value)}
                min="1900"
                max="2030"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-32"
              />

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'active' || brandFilter || fuelTypeFilter || yearFromFilter || yearToFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
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
        Showing {vehicleModels.length} of {totalVehicleModels} vehicle models
      </div>

      {/* Vehicle Model List */}
      {vehicleModels.length === 0 ? (
        <div className="bg-white shadow rounded-lg">
          <div className="p-12 text-center">
            <Car className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No vehicle models found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'active' || brandFilter || fuelTypeFilter || yearFromFilter || yearToFilter
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first vehicle model'
              }
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicleModels.map(renderVehicleModelCard)}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year Range
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transmission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engine Size
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
              {vehicleModels.map(renderVehicleModelRow)}
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

export default VehicleModelList;