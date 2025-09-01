import React, { useState, useEffect, useCallback } from 'react';
import { X, Package, DollarSign, Loader, Car, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { Product, Category, Supplier, Brand, VehicleCompatibilityWithDetails, VehicleModelWithBrand, VehicleBrand, CreateVehicleCompatibilityRequest, ApiResponse } from '../types/api';
import { api, extractListData } from '../services/api';
import { SearchableTreeSelect } from './SearchableTreeSelect';

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

  // Vehicle compatibility states
  const [compatibilities, setCompatibilities] = useState<VehicleCompatibilityWithDetails[]>([]);
  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWithBrand[]>([]);
  const [showCompatibilityForm, setShowCompatibilityForm] = useState(false);
  const [newCompatibility, setNewCompatibility] = useState<CreateVehicleCompatibilityRequest>({
    product_id: '',
    vehicle_model_id: '',
    year_from: new Date().getFullYear(),
    year_to: undefined,
    notes: ''
  });

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
      const response = await api.get('/categories');
      const data = extractListData<Category>(response);
      setCategories(data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await api.get('/suppliers');
      const data = extractListData<Supplier>(response);
      setSuppliers((data.data || []).filter(s => s.is_active));
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const brands = await api.brands.getActive();
      setBrands((brands as Brand[] || []).filter((b: Brand) => b.is_active));
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  const fetchVehicleBrands = useCallback(async () => {
    try {
      const vehicleBrands = await api.vehicleBrands.getActive();
      setVehicleBrands((vehicleBrands as VehicleBrand[] || []).filter((b: VehicleBrand) => b.is_active));
    } catch (err) {
      console.error('Error fetching vehicle brands:', err);
    }
  }, []);

  const fetchVehicleModels = useCallback(async () => {
    try {
      const vehicleModels = await api.vehicleModels.getActive();
      setVehicleModels((vehicleModels as VehicleModelWithBrand[] || []).filter((m: VehicleModelWithBrand) => m.is_active));
    } catch (err) {
      console.error('Error fetching vehicle models:', err);
    }
  }, []);

  const fetchCompatibilities = useCallback(async (productId: string) => {
    try {
      const response = await api.vehicleCompatibilities.list({ 
        product_id: productId,
        limit: 100 
      });
      if (response.data.success) {
        setCompatibilities(response.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching compatibilities:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        fetchCategories(), 
        fetchSuppliers(), 
        fetchBrands(),
        fetchVehicleBrands(),
        fetchVehicleModels()
      ]).finally(() => {
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
        // Load existing compatibilities
        fetchCompatibilities(product.id);
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
        setCompatibilities([]);
      }
      setErrors({});
      setShowCompatibilityForm(false);
      setNewCompatibility({
        product_id: product?.id || '',
        vehicle_model_id: '',
        year_from: new Date().getFullYear(),
        year_to: undefined,
        notes: ''
      });
    }
  }, [isOpen, product, fetchCategories, fetchSuppliers, fetchBrands, fetchVehicleBrands, fetchVehicleModels, fetchCompatibilities]);

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
    } else {
      // Validate that the selected category exists in the categories list
      const categoryExists = categories.some(cat => cat.id === formData.category_id);
      if (!categoryExists) {
        newErrors.category_id = 'Selected category is not valid';
      }
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

  // Vehicle compatibility management functions
  const handleAddCompatibility = async () => {
    if (!product?.id) return;

    try {
      const compatibilityData = {
        ...newCompatibility,
        product_id: product.id
      };

      const response = await api.vehicleCompatibilities.create(compatibilityData);
      if (response.data.success) {
        // Refresh compatibilities list
        await fetchCompatibilities(product.id);
        
        // Reset form
        setNewCompatibility({
          product_id: product.id,
          vehicle_model_id: '',
          year_from: new Date().getFullYear(),
          year_to: undefined,
          notes: ''
        });
        setShowCompatibilityForm(false);
      }
    } catch (err) {
      console.error('Error adding compatibility:', err);
    }
  };

  const handleDeleteCompatibility = async (compatibilityId: string) => {
    if (!product?.id) return;

    try {
      await api.vehicleCompatibilities.delete(compatibilityId);
      // Refresh compatibilities list
      await fetchCompatibilities(product.id);
    } catch (err) {
      console.error('Error deleting compatibility:', err);
    }
  };

  const handleCompatibilityChange = (
    field: keyof CreateVehicleCompatibilityRequest,
    value: string | number | undefined
  ) => {
    setNewCompatibility(prev => ({ ...prev, [field]: value }));
  };

  // Get filtered vehicle models by brand
  const getVehicleModelsByBrand = (brandId: string) => {
    return vehicleModels.filter(model => model.vehicle_brand_id === brandId);
  };

  // Format vehicle model display
  const formatVehicleModel = (model: VehicleModelWithBrand) => {
    const yearRange = model.year_to && model.year_to !== model.year_from 
      ? `${model.year_from}-${model.year_to}` 
      : `${model.year_from}+`;
    return `${model.vehicle_brand.name} ${model.name} (${yearRange})`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-muted/500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-foreground">
              {title || (product ? 'Edit Product' : 'Add New Product')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground focus:outline-none"
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
                <h3 className="text-lg font-medium text-foreground mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="Enter product name"
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sku ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="Enter or auto-generate SKU"
                      required
                    />
                    {errors.sku && (
                      <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product description"
                    />
                  </div>
                </div>
              </div>

              {/* Category, Supplier, and Brand */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Classification</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category *
                    </label>
                    <SearchableTreeSelect
                      categories={categories}
                      selectedValue={formData.category_id || null}
                      onChange={(categoryId: string | null) => handleInputChange('category_id', categoryId || '')}
                      placeholder="Select a category"
                      searchable={true}
                      searchPlaceholder="Search categories..."
                      showProductCounts={true}
                      showConnectionLines={true}
                      maxHeight={300}
                      allowClear={true}
                      error={errors.category_id}
                      disabled={loading}
                      className="w-full"
                      ariaLabel="Select product category"
                    />
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Supplier *
                    </label>
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.supplier_id ? 'border-red-300' : 'border-input'
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
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Brand
                    </label>
                    <select
                      value={formData.brand_id}
                      onChange={(e) => handleInputChange('brand_id', e.target.value)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.brand_id ? 'border-red-300' : 'border-input'
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select the manufacturer/brand (e.g., Bosch, NGK, Castrol)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Pricing</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost Price * ($)
                    </label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.cost_price ? 'border-red-300' : 'border-input'
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
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Retail Price * ($)
                    </label>
                    <input
                      type="number"
                      value={formData.retail_price}
                      onChange={(e) => handleInputChange('retail_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.retail_price ? 'border-red-300' : 'border-input'
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
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Wholesale Price ($)
                    </label>
                    <input
                      type="number"
                      value={formData.wholesale_price || ''}
                      onChange={(e) => handleInputChange('wholesale_price', parseFloat(e.target.value) || 0)}
                      className={`w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.wholesale_price ? 'border-red-300' : 'border-input'
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
                <h3 className="text-lg font-medium text-foreground mb-4">Additional Details</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Weight (lbs)
                    </label>
                    <input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                      className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.0"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Dimensions
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => handleInputChange('dimensions', e.target.value)}
                      className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="L x W x H"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Status</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-input rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-foreground">
                    Product is active and available for sale
                  </label>
                </div>
              </div>

              {/* Vehicle Compatibility - Only show for existing products */}
              {product && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground flex items-center">
                      <Car className="h-5 w-5 mr-2 text-blue-600" />
                      Vehicle Compatibility
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCompatibilityForm(true)}
                      className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Compatibility
                    </button>
                  </div>

                  {/* Existing Compatibilities */}
                  <div className="space-y-3">
                    {compatibilities.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                        No vehicle compatibilities defined yet. Click "Add Compatibility" to specify which vehicles this part fits.
                      </div>
                    ) : (
                      compatibilities.map((compatibility) => (
                        <div
                          key={compatibility.id}
                          className="flex items-center justify-between p-3 bg-card text-card-foreground border border-border rounded-md"
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="font-medium text-foreground">
                                {compatibility.vehicle_model && formatVehicleModel(compatibility.vehicle_model as VehicleModelWithBrand)}
                              </span>
                              <div className="ml-2" title={compatibility.is_verified ? "Verified compatibility" : "Unverified compatibility"}>
                                {compatibility.is_verified ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                            {compatibility.year_from && (
                              <div className="text-sm text-muted-foreground">
                                Years: {compatibility.year_from}{compatibility.year_to && compatibility.year_to !== compatibility.year_from ? `-${compatibility.year_to}` : '+'}
                              </div>
                            )}
                            {compatibility.notes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {compatibility.notes}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompatibility(compatibility.id)}
                            className="ml-4 text-red-600 hover:text-red-800 focus:outline-none"
                            title="Remove compatibility"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Compatibility Form */}
                  {showCompatibilityForm && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900 mb-3">Add New Vehicle Compatibility</h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Vehicle Model *
                          </label>
                          <select
                            value={newCompatibility.vehicle_model_id}
                            onChange={(e) => handleCompatibilityChange('vehicle_model_id', e.target.value)}
                            className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          >
                            <option value="">Select a vehicle model</option>
                            {vehicleBrands.map((brand) => {
                              const models = getVehicleModelsByBrand(brand.id);
                              return models.length > 0 ? (
                                <optgroup key={brand.id} label={brand.name}>
                                  {models.map((model) => (
                                    <option key={model.id} value={model.id}>
                                      {formatVehicleModel(model)}
                                    </option>
                                  ))}
                                </optgroup>
                              ) : null;
                            })}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Year From
                            </label>
                            <input
                              type="number"
                              value={newCompatibility.year_from || ''}
                              onChange={(e) => handleCompatibilityChange('year_from', parseInt(e.target.value) || undefined)}
                              className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2020"
                              min="1900"
                              max={new Date().getFullYear() + 5}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Year To
                            </label>
                            <input
                              type="number"
                              value={newCompatibility.year_to || ''}
                              onChange={(e) => handleCompatibilityChange('year_to', parseInt(e.target.value) || undefined)}
                              className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="2025 (optional)"
                              min="1900"
                              max={new Date().getFullYear() + 5}
                            />
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={newCompatibility.notes || ''}
                            onChange={(e) => handleCompatibilityChange('notes', e.target.value)}
                            className="w-full border border-input rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional notes about this compatibility"
                          />
                        </div>

                        <div className="lg:col-span-2 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowCompatibilityForm(false)}
                            className="px-3 py-1 text-sm font-medium text-foreground bg-card text-card-foreground border border-input rounded-md hover:bg-muted/50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddCompatibility}
                            disabled={!newCompatibility.vehicle_model_id}
                            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add Compatibility
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-muted/50 space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card text-card-foreground border border-input rounded-md hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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