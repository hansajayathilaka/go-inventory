import React, { useState } from 'react';
import { Search, Scan, Package, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import type { POSProduct } from '../types/api';

interface POSLookupProps {
  onProductSelect?: (product: POSProduct) => void;
  className?: string;
}

const POSLookup: React.FC<POSLookupProps> = ({ onProductSelect, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine search type (barcode, SKU, or name)
      const isBarcode = /^\d+$/.test(term.trim()); // Simple barcode detection
      const isSKU = term.toUpperCase().includes('SKU') || /^[A-Z]+\d+$/i.test(term.trim());

      const searchParams: any = {};
      if (isBarcode) {
        searchParams.barcode = term.trim();
      } else if (isSKU) {
        searchParams.sku = term.trim().replace('SKU', '').trim();
      } else {
        searchParams.name = term.trim();
      }

      const response = await api.inventory.posLookup(searchParams);
      setSearchResults(response.data.data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timeoutId = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const handleProductClick = (product: POSProduct) => {
    onProductSelect?.(product);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search by barcode, SKU, or product name..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <Scan className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 z-10">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
          {searchResults.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>SKU: {product.sku}</span>
                        {product.barcode && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Barcode: {product.barcode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-right ml-4">
                  <div className="mr-3">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {product.retail_price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Stock: {product.quantity}
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.quantity > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchTerm && searchResults.length === 0 && !loading && !error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="text-center text-gray-500 text-sm">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No products found for "{searchTerm}"</p>
            <p className="text-xs mt-1">Try searching by barcode, SKU, or product name</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSLookup;