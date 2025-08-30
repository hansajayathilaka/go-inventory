import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Link, 
  ShieldCheck,
  ShieldX,
  Power,
  PowerOff,
  Calendar,
  Package,
  Car,
  Grid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { 
  VehicleCompatibilityWithDetails, 
  Product,
  VehicleModelWithBrand
} from '../types/api';
import { api } from '../services/api';

interface CompatibilityListProps {
  onEditCompatibility: (compatibility: VehicleCompatibilityWithDetails) => void;
  onViewCompatibility: (compatibility: VehicleCompatibilityWithDetails) => void;
  onDeleteCompatibility: (compatibility: VehicleCompatibilityWithDetails) => void;
}

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';
type VerificationFilter = 'all' | 'verified' | 'unverified';

const CompatibilityList: React.FC<CompatibilityListProps> = ({
  onEditCompatibility,
  onViewCompatibility,
  onDeleteCompatibility,
}) => {
  // State
  const [compatibilities, setCompatibilities] = useState<VehicleCompatibilityWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [productFilter, setProductFilter] = useState('');
  const [vehicleModelFilter, setVehicleModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompatibilities, setTotalCompatibilities] = useState(0);
  const itemsPerPage = 12;

  // Load products for filter dropdown
  const loadProducts = async () => {
    try {
      const response = await api.get<{data: {products: Product[]}}>('/products?is_active=true&limit=500');
      const products = response.data?.data?.products;
      setProducts(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    }
  };

  // Load vehicle models for filter dropdown  
  const loadVehicleModels = async () => {
    try {
      const response = await api.get<{data: VehicleModelWithBrand[]}>('/vehicle-models?is_active=true&limit=500');
      setVehicleModels(response.data?.data || []);
    } catch (err) {
      console.error('Error loading vehicle models:', err);
    }
  };

  // Load compatibilities
  const loadCompatibilities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Apply filters
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      
      if (verificationFilter !== 'all') {
        params.is_verified = verificationFilter === 'verified';
      }
      
      if (productFilter) {
        params.product_id = productFilter;
      }
      
      if (vehicleModelFilter) {
        params.vehicle_model_id = vehicleModelFilter;
      }
      
      if (yearFilter) {
        params.year = parseInt(yearFilter, 10);
      }

      const response = await api.vehicleCompatibilities.list(params);
      
      if (response.status === 200) {
        const data = response.data?.data;
        setCompatibilities(Array.isArray(data) ? data : []);
        setTotalPages(response.data?.pagination?.total_pages || 1);
        setTotalCompatibilities(response.data?.pagination?.total || 0);
      } else {
        setError('Failed to load compatibilities');
        setCompatibilities([]);
      }
    } catch (err: any) {
      console.error('Error loading compatibilities:', err);
      setError(err.response?.data?.message || 'Failed to load compatibilities');
      setCompatibilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter compatibilities by search term (client-side)
  const filteredCompatibilities = Array.isArray(compatibilities) ? compatibilities.filter((compatibility) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const productName = compatibility.product?.name?.toLowerCase() || '';
    const productSku = compatibility.product?.sku?.toLowerCase() || '';
    const vehicleModelName = compatibility.vehicle_model?.name?.toLowerCase() || '';
    const vehicleBrandName = (compatibility.vehicle_model as VehicleModelWithBrand)?.vehicle_brand?.name?.toLowerCase() || '';
    const notes = compatibility.notes?.toLowerCase() || '';
    
    return productName.includes(searchLower) ||
           productSku.includes(searchLower) ||
           vehicleModelName.includes(searchLower) ||
           vehicleBrandName.includes(searchLower) ||
           notes.includes(searchLower);
  }) : [];

  // Bulk actions
  const [selectedCompatibilities, setSelectedCompatibilities] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedCompatibilities.length === filteredCompatibilities.length) {
      setSelectedCompatibilities([]);
    } else {
      setSelectedCompatibilities(filteredCompatibilities.map(c => c.id));
    }
  };

  const handleSelectCompatibility = (id: string) => {
    setSelectedCompatibilities(prev => 
      prev.includes(id) 
        ? prev.filter(compId => compId !== id)
        : [...prev, id]
    );
  };

  const handleBulkVerify = async () => {
    if (selectedCompatibilities.length === 0) return;
    
    try {
      await api.vehicleCompatibilities.bulkVerify({ ids: selectedCompatibilities });
      setSelectedCompatibilities([]);
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify compatibilities');
    }
  };

  const handleBulkUnverify = async () => {
    if (selectedCompatibilities.length === 0) return;
    
    try {
      await api.vehicleCompatibilities.bulkUnverify({ ids: selectedCompatibilities });
      setSelectedCompatibilities([]);
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unverify compatibilities');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedCompatibilities.length === 0) return;
    
    try {
      await api.vehicleCompatibilities.bulkActivate({ ids: selectedCompatibilities });
      setSelectedCompatibilities([]);
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate compatibilities');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCompatibilities.length === 0) return;
    
    try {
      await api.vehicleCompatibilities.bulkDeactivate({ ids: selectedCompatibilities });
      setSelectedCompatibilities([]);
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate compatibilities');
    }
  };

  // Individual actions
  const handleToggleVerification = async (compatibility: VehicleCompatibilityWithDetails) => {
    try {
      if (compatibility.is_verified) {
        await api.vehicleCompatibilities.unverify(compatibility.id);
      } else {
        await api.vehicleCompatibilities.verify(compatibility.id);
      }
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const handleToggleStatus = async (compatibility: VehicleCompatibilityWithDetails) => {
    try {
      if (compatibility.is_active) {
        await api.vehicleCompatibilities.deactivate(compatibility.id);
      } else {
        await api.vehicleCompatibilities.activate(compatibility.id);
      }
      loadCompatibilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Effects
  useEffect(() => {
    loadProducts();
    loadVehicleModels();
  }, []);

  useEffect(() => {
    loadCompatibilities();
  }, [currentPage, statusFilter, verificationFilter, productFilter, vehicleModelFilter, yearFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, verificationFilter, productFilter, vehicleModelFilter, yearFilter]);

  // Pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Vehicle Compatibilities</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search compatibilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Verification Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as VerificationFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>

          {/* Vehicle Model Filter */}
          <select
            value={vehicleModelFilter}
            onChange={(e) => setVehicleModelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Vehicle Models</option>
            {vehicleModels.map((model) => (
              <option key={model.id} value={model.id}>
                {(model as VehicleModelWithBrand).vehicle_brand.name} {model.name}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <input
            type="number"
            placeholder="Filter by year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            min="1980"
            max="2030"
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCompatibilities.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedCompatibilities.length} compatibility(ies) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBulkVerify}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Verify
              </button>
              <button
                onClick={handleBulkUnverify}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
              >
                Unverify
              </button>
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Activate
              </button>
              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Content */}
      {filteredCompatibilities.length === 0 ? (
        <div className="text-center py-12">
          <Link className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No compatibilities found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || verificationFilter !== 'all' || productFilter || vehicleModelFilter || yearFilter
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first vehicle compatibility.'}
          </p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCompatibilities.map((compatibility) => (
                <div key={compatibility.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedCompatibilities.includes(compatibility.id)}
                      onChange={() => handleSelectCompatibility(compatibility.id)}
                      className="mt-1"
                    />
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        compatibility.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {compatibility.is_verified ? 'Verified' : 'Unverified'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        compatibility.is_active 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {compatibility.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Package className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">
                        {compatibility.product?.name || 'Unknown Product'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="h-4 w-4 mr-2 text-green-500" />
                      <span>
                        {(compatibility.vehicle_model as VehicleModelWithBrand)?.vehicle_brand?.name} {compatibility.vehicle_model?.name}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                      <span>
                        {compatibility.year_from}-{compatibility.year_to || 'Present'}
                      </span>
                    </div>
                    {compatibility.notes && (
                      <p className="text-sm text-gray-500 truncate" title={compatibility.notes}>
                        {compatibility.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleToggleVerification(compatibility)}
                        className={`p-1 rounded ${
                          compatibility.is_verified
                            ? 'text-yellow-600 hover:bg-yellow-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={compatibility.is_verified ? 'Unverify' : 'Verify'}
                      >
                        {compatibility.is_verified ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(compatibility)}
                        className={`p-1 rounded ${
                          compatibility.is_active
                            ? 'text-gray-600 hover:bg-gray-100'
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        title={compatibility.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {compatibility.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onViewCompatibility(compatibility)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditCompatibility(compatibility)}
                        className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCompatibility(compatibility)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedCompatibilities.length === filteredCompatibilities.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompatibilities.map((compatibility) => (
                      <tr key={compatibility.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedCompatibilities.includes(compatibility.id)}
                            onChange={() => handleSelectCompatibility(compatibility.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {compatibility.product?.name || 'Unknown Product'}
                          </div>
                          <div className="text-sm text-gray-500">
                            SKU: {compatibility.product?.sku || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {(compatibility.vehicle_model as VehicleModelWithBrand)?.vehicle_brand?.name} {compatibility.vehicle_model?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {compatibility.year_from}-{compatibility.year_to || 'Present'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            compatibility.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {compatibility.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            compatibility.is_verified
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {compatibility.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onViewCompatibility(compatibility)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onEditCompatibility(compatibility)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleVerification(compatibility)}
                              className={compatibility.is_verified ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                              title={compatibility.is_verified ? 'Unverify' : 'Verify'}
                            >
                              {compatibility.is_verified ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(compatibility)}
                              className={compatibility.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-blue-600 hover:text-blue-900'}
                              title={compatibility.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {compatibility.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => onDeleteCompatibility(compatibility)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
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
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-md">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCompatibilities)} of {totalCompatibilities} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (page > totalPages) return null;
                  
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompatibilityList;