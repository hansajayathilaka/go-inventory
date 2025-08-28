import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Grid, List, Package, Tag, Building2, Eye, Edit, Trash2 } from 'lucide-react';
import type { Product, Category, Supplier, ProductFilters, ApiResponse, ProductListResponse, CategoryListResponse, SupplierListResponse } from '../types/api';
import { api } from '../services/api';

interface ProductListProps {
  onEditProduct?: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onEditProduct,
  onViewProduct,
  onDeleteProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Filters and search
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = useCallback(async (page = 1, search = '', productFilters: ProductFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(productFilters.category_id && { category_id: productFilters.category_id }),
        ...(productFilters.supplier_id && { supplier_id: productFilters.supplier_id }),
        ...(productFilters.status && { status: productFilters.status }),
        ...(productFilters.min_price && { min_price: productFilters.min_price.toString() }),
        ...(productFilters.max_price && { max_price: productFilters.max_price.toString() })
      });

      const response = await api.get<ApiResponse<ProductListResponse>>(`/products?${params}`);
      
      if (response.data.success) {
        const { products: fetchedProducts, total, total_pages } = response.data.data;
        setProducts(fetchedProducts);
        setTotalProducts(total);
        setTotalPages(total_pages);
        setCurrentPage(page);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<CategoryListResponse>>('/categories');
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<SupplierListResponse>>('/suppliers');
      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, [fetchProducts, fetchCategories, fetchSuppliers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, searchTerm, filters);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchProducts(1, value, filters);
  };

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchProducts(1, searchTerm, updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    fetchProducts(1, '', {});
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handlePageChange = (page: number) => {
    fetchProducts(page, searchTerm, filters);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-4">
            {/* Product Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Tag className="h-3 w-3 mr-1" />
                  <span>{product.sku}</span>
                </div>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                product.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>

            {/* Product Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>

            {/* Category and Supplier */}
            <div className="space-y-1 mb-3">
              {product.category && (
                <div className="flex items-center text-xs text-gray-500">
                  <Package className="h-3 w-3 mr-1" />
                  <span className="truncate">{product.category.name}</span>
                </div>
              )}
              {product.supplier && (
                <div className="flex items-center text-xs text-gray-500">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span className="truncate">{product.supplier.name}</span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="border-t border-gray-100 pt-3 mb-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Retail:</span>
                  <div className="font-semibold text-green-600">{formatCurrency(product.retail_price)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Cost:</span>
                  <div className="font-medium text-gray-900">{formatCurrency(product.cost_price)}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-1">
              {onViewProduct && (
                <button
                  onClick={() => onViewProduct(product)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="View Product"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              {onEditProduct && (
                <button
                  onClick={() => onEditProduct(product)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Edit Product"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {onDeleteProduct && (
                <button
                  onClick={() => onDeleteProduct(product)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete Product"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pricing
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sku}</div>
                  <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.category?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {product.supplier?.name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div className="text-green-600 font-semibold">{formatCurrency(product.retail_price)}</div>
                  <div className="text-gray-500 text-xs">Cost: {formatCurrency(product.cost_price)}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  product.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {onViewProduct && (
                    <button
                      onClick={() => onViewProduct(product)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Product"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {onEditProduct && (
                    <button
                      onClick={() => onEditProduct(product)}
                      className="text-green-600 hover:text-green-900"
                      title="Edit Product"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {onDeleteProduct && (
                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">{((currentPage - 1) * 20) + 1}</span>
              {' '}to{' '}
              <span className="font-medium">
                {Math.min(currentPage * 20, totalProducts)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{totalProducts}</span>
              {' '}results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + Math.max(1, currentPage - 2);
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* View Toggle and Filter Button */}
        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-700 border-r border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 border-r border-gray-300'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange({ category_id: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={filters.supplier_id || ''}
                onChange={(e) => handleFilterChange({ supplier_id: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Products */}
      {products.length === 0 && !loading ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first product'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ProductList;