import React, { useState, useEffect, useCallback } from 'react';
import { X, Package, DollarSign, Loader } from 'lucide-react';
import type { Product, Category, Supplier, Brand, ApiResponse, CategoryListResponse, SupplierListResponse } from '../types/api';
import { api } from '../services/api';

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  supplier_id: string;
  brand_id: string;
  cost_price: number;
  retail_price: number;
  wholesale_price?: number;
  barcode?: string;
  weight?: number;
  dimensions?: string;
  is_active: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product?: Product | null;
  title?: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  title
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    brand_id: '',
    cost_price: 0,
    retail_price: 0,
    wholesale_price: 0,
    barcode: '',
    weight: 0,
    dimensions: '',
    is_active: true
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate SKU based on name
  const generateSKU = useCallback((name: string) => {
    if (!name.trim()) return '';
    
    // Extract first 3-4 meaningful words and create abbreviation
    const words = name.trim().toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 3);
    
    const abbreviation = words.map(word => word.substring(0, 3)).join('');
    const timestamp = Date.now().toString().slice(-3);
    
    return `${abbreviation}${timestamp}`;
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
        setSuppliers(response.data.data.suppliers.filter(s => s.is_active));
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await api.brands.getActive();
      if (response.data.success) {
        setBrands(response.data.data.data.filter((b: Brand) => b.is_active));
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchCategories(), fetchSuppliers(), fetchBrands()]).finally(() => {
        setLoading(false);
      });

      if (product) {
        // Edit mode
        setFormData({
          sku: product.sku,
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          supplier_id: product.supplier_id || '',
          brand_id: product.brand_id || '',
          cost_price: product.cost_price,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price || 0,
          barcode: product.barcode || '',
          weight: product.weight || 0,
          dimensions: product.dimensions || '',
          is_active: product.is_active
        });
      } else {
        // Add mode
        setFormData({
          sku: '',
          name: '',
          description: '',
          category_id: '',
          supplier_id: '',
          brand_id: '',
          cost_price: 0,
          retail_price: 0,
          wholesale_price: 0,
          barcode: '',
          weight: 0,
          dimensions: '',
          is_active: true
        });
      }
      setErrors({});
    }
  }, [isOpen, product, fetchCategories, fetchSuppliers, fetchBrands]);

  // Auto-generate SKU when name changes (only for new products)
  useEffect(() => {
    if (!product && formData.name && !formData.sku) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(formData.name)
      }));
    }
  }, [formData.name, product, generateSKU]);

  // Auto-calculate wholesale price (midpoint between cost and retail)
  useEffect(() => {
    if (formData.cost_price && formData.retail_price && formData.retail_price > formData.cost_price) {
      const calculatedWholesale = (formData.cost_price + formData.retail_price) / 2;
      setFormData(prev => ({
        ...prev,
        wholesale_price: Math.round(calculatedWholesale * 100) / 100
      }));
    }
  }, [formData.cost_price, formData.retail_price]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }

    if (formData.cost_price <= 0) {
      newErrors.cost_price = 'Cost price must be greater than 0';
    }

    if (formData.retail_price <= 0) {
      newErrors.retail_price = 'Retail price must be greater than 0';
    }

    if (formData.retail_price <= formData.cost_price) {
      newErrors.retail_price = 'Retail price must be greater than cost price';
    }

    if (formData.wholesale_price && formData.wholesale_price < formData.cost_price) {
      newErrors.wholesale_price = 'Wholesale price cannot be less than cost price';
    }

    if (formData.wholesale_price && formData.wholesale_price > formData.retail_price) {
      newErrors.wholesale_price = 'Wholesale price cannot be greater than retail price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Clean up form data
      const cleanData = {
        ...formData,
        cost_price: Number(formData.cost_price),
        retail_price: Number(formData.retail_price),
        wholesale_price: formData.wholesale_price ? Number(formData.wholesale_price) : undefined,
        weight: formData.weight || undefined,
        dimensions: formData.dimensions?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined
      };

      let response;
      if (product) {
        // Update existing product
        response = await api.put<ApiResponse<Product>>(`/products/${product.id}`, cleanData);
      } else {
        // Create new product
        response = await api.post<ApiResponse<Product>>('/products', cleanData);
      }

      if (response.data.success) {
        onSave(response.data.data);
        onClose();
      } else {
        setErrors({ submit: response.data.message || 'Failed to save product' });
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (err.response?.data?.message) {
        setErrors({ submit: err.response.data.message });
      } else if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ submit: 'Failed to save product. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof ProductFormData,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {title || (product ? 'Edit Product' : 'Add New Product')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            disabled={saving}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message */}
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{errors.submit}</div>
                </div>
              )}

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sku ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter or auto-generate SKU"
                      required
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Category, Supplier, and Brand */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Classification</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier *
                    </label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.supplier_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </option>
                      ))}
                    </select>
                    {errors.supplier_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => handleInputChange('brand_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.brand_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a brand (optional)</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name} ({brand.code})
                        </option>
                      ))}
                    </select>
                    {errors.brand_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.brand_id}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Select the manufacturer/brand (e.g., Bosch, NGK, Castrol)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price * ($)
                    </label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cost_price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    {errors.cost_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.cost_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Retail Price * ($)
                    </label>
                    <input
                      type="number"
                      value={formData.retail_price}
                      onChange={(e) => handleInputChange('retail_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.retail_price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    {errors.retail_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.retail_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wholesale Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.wholesale_price || ''}
                      onChange={(e) => handleInputChange('wholesale_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.wholesale_price ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Auto-calculated"
                      step="0.01"
                      min="0"
                    />
                    {errors.wholesale_price && (
                      <p className="mt-1 text-sm text-red-600">{errors.wholesale_price}</p>
                    )}
                  </div>
                </div>

                {/* Pricing Info */}
                {formData.cost_price > 0 && formData.retail_price > formData.cost_price && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <div className="flex items-center text-sm text-green-800">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>
                        Margin: ${(formData.retail_price - formData.cost_price).toFixed(2)} 
                        ({(((formData.retail_price - formData.cost_price) / formData.cost_price) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="L x W x H"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Product is active and available for sale
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-gray-50 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>Save Product</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;