import React, { useState, useEffect } from 'react';
import { X, Link, Save, Loader2, Package, Calendar, FileText } from 'lucide-react';
import type { 
  VehicleCompatibilityWithDetails, 
  CreateVehicleCompatibilityRequest, 
  UpdateVehicleCompatibilityRequest,
  Product,
  VehicleModelWithBrand 
} from '../types/api';
import { api } from '../services/api';

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  compatibility?: VehicleCompatibilityWithDetails | null;
}

const CompatibilityModal: React.FC<CompatibilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  compatibility,
}) => {
  const [formData, setFormData] = useState({
    product_id: '',
    vehicle_model_id: '',
    year_from: '',
    year_to: '',
    notes: '',
    is_verified: false,
    is_active: true,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModelWithBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isEditing = !!compatibility;
  const currentYear = new Date().getFullYear();

  // Load products for dropdown
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const products = await api.products.getActive();
      setProducts(products as Product[] || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load vehicle models for dropdown
  const loadVehicleModels = async () => {
    try {
      setModelsLoading(true);
      const vehicleModels = await api.vehicleModels.getActive();
      setVehicleModels(vehicleModels as VehicleModelWithBrand[] || []);
    } catch (err) {
      console.error('Error loading vehicle models:', err);
    } finally {
      setModelsLoading(false);
    }
  };

  // Reset form when modal opens/closes or compatibility changes
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadVehicleModels();
      
      if (compatibility) {
        setFormData({
          product_id: compatibility.product_id || '',
          vehicle_model_id: compatibility.vehicle_model_id || '',
          year_from: compatibility.year_from?.toString() || '',
          year_to: compatibility.year_to?.toString() || '',
          notes: compatibility.notes || '',
          is_verified: compatibility.is_verified || false,
          is_active: compatibility.is_active !== false,
        });
      } else {
        setFormData({
          product_id: '',
          vehicle_model_id: '',
          year_from: '',
          year_to: '',
          notes: '',
          is_verified: false,
          is_active: true,
        });
      }
      setErrors({});
      setTouchedFields({});
    }
  }, [isOpen, compatibility]);

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'product_id':
        return value ? '' : 'Product is required';
      case 'vehicle_model_id':
        return value ? '' : 'Vehicle model is required';
      case 'year_from': {
        if (!value) return '';
        const yearFrom = parseInt(value, 10);
        if (isNaN(yearFrom) || yearFrom < 1900 || yearFrom > currentYear + 10) {
          return `Year must be between 1900 and ${currentYear + 10}`;
        }
        return '';
      }
      case 'year_to': {
        if (!value) return '';
        const yearTo = parseInt(value, 10);
        const yearFromNum = parseInt(formData.year_from, 10);
        if (isNaN(yearTo) || yearTo < 1900 || yearTo > currentYear + 10) {
          return `Year must be between 1900 and ${currentYear + 10}`;
        }
        if (yearFromNum && yearTo < yearFromNum) {
          return 'End year cannot be before start year';
        }
        return '';
      }
      case 'notes':
        if (value.length > 500) {
          return 'Notes cannot exceed 500 characters';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (typeof value === 'string' && (touchedFields[field] || field === 'year_to')) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
      
      // Also validate year_to if year_from changes
      if (field === 'year_from' && formData.year_to) {
        const yearToError = validateField('year_to', formData.year_to);
        setErrors(prev => ({ ...prev, year_to: yearToError }));
      }
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof typeof formData];
    if (typeof value === 'string') {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string') {
        const error = validateField(field, value);
        if (error) newErrors[field] = error;
      }
    });

    // Validate required fields
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.vehicle_model_id) newErrors.vehicle_model_id = 'Vehicle model is required';

    setErrors(newErrors);
    setTouchedFields(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const requestData = {
        product_id: formData.product_id,
        vehicle_model_id: formData.vehicle_model_id,
        year_from: formData.year_from ? parseInt(formData.year_from, 10) : undefined,
        year_to: formData.year_to ? parseInt(formData.year_to, 10) : undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (isEditing && compatibility) {
        const updateData = {
          ...requestData,
          is_verified: formData.is_verified,
          is_active: formData.is_active,
        };
        await api.vehicleCompatibilities.update(compatibility.id, updateData as UpdateVehicleCompatibilityRequest);
      } else {
        await api.vehicleCompatibilities.create(requestData as CreateVehicleCompatibilityRequest);
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving compatibility:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({
          general: err.response?.data?.message || 'Failed to save compatibility'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get selected product and vehicle model for display
  const selectedProduct = products.find(p => p.id === formData.product_id);
  const selectedVehicleModel = vehicleModels.find(vm => vm.id === formData.vehicle_model_id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isEditing ? 'Edit Vehicle Compatibility' : 'Add Vehicle Compatibility'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {errors.general}
            </div>
          )}

          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => handleFieldChange('product_id', e.target.value)}
                    onBlur={() => handleFieldBlur('product_id')}
                    disabled={productsLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent ${
                      errors.product_id ? 'border-red-500' : 'border-input'
                    }`}
                  >
                    <option value="">
                      {productsLoading ? 'Loading products...' : 'Select a product'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                  {errors.product_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.product_id}</p>
                  )}
                  {selectedProduct && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedProduct.description && selectedProduct.description.length > 60
                        ? `${selectedProduct.description.substring(0, 60)}...`
                        : selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Vehicle Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vehicle_model_id}
                    onChange={(e) => handleFieldChange('vehicle_model_id', e.target.value)}
                    onBlur={() => handleFieldBlur('vehicle_model_id')}
                    disabled={modelsLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent ${
                      errors.vehicle_model_id ? 'border-red-500' : 'border-input'
                    }`}
                  >
                    <option value="">
                      {modelsLoading ? 'Loading vehicle models...' : 'Select a vehicle model'}
                    </option>
                    {vehicleModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.vehicle_brand.name} {model.name} ({model.year_from}-{model.year_to || 'Present'})
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_model_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.vehicle_model_id}</p>
                  )}
                  {selectedVehicleModel && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedVehicleModel.fuel_type && `Fuel: ${selectedVehicleModel.fuel_type}`}
                      {selectedVehicleModel.transmission && `, ${selectedVehicleModel.transmission}`}
                      {selectedVehicleModel.engine_size && `, ${selectedVehicleModel.engine_size}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Year Range */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Year Range (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Year From */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    From Year
                  </label>
                  <input
                    type="number"
                    value={formData.year_from}
                    onChange={(e) => handleFieldChange('year_from', e.target.value)}
                    onBlur={() => handleFieldBlur('year_from')}
                    placeholder="e.g., 2018"
                    min="1900"
                    max={currentYear + 10}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent ${
                      errors.year_from ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.year_from && (
                    <p className="mt-1 text-xs text-red-600">{errors.year_from}</p>
                  )}
                </div>

                {/* Year To */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    To Year
                  </label>
                  <input
                    type="number"
                    value={formData.year_to}
                    onChange={(e) => handleFieldChange('year_to', e.target.value)}
                    onBlur={() => handleFieldBlur('year_to')}
                    placeholder="e.g., 2023 (leave empty for current)"
                    min="1900"
                    max={currentYear + 10}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent ${
                      errors.year_to ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.year_to && (
                    <p className="mt-1 text-xs text-red-600">{errors.year_to}</p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                If no years are specified, the compatibility applies to all years of the vehicle model.
              </p>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Additional Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  onBlur={() => handleFieldBlur('notes')}
                  placeholder="e.g., Compatible with all trim levels, requires adapter for premium models..."
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-ring focus:border-transparent resize-none ${
                    errors.notes ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.notes && (
                  <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.notes.length}/500 characters
                </p>
              </div>
            </div>

            {/* Status Settings (only for editing) */}
            {isEditing && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Status Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_verified}
                      onChange={(e) => handleFieldChange('is_verified', e.target.checked)}
                      className="mr-2 rounded border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-foreground">Verified compatibility</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                      className="mr-2 rounded border-input text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-foreground border border-input rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update' : 'Create'} Compatibility
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityModal;