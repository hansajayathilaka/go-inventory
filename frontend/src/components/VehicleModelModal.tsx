import React, { useState, useEffect } from 'react';
import { X, Car, Save, Loader2, Calendar, Settings } from 'lucide-react';
import type { VehicleModelWithBrand, CreateVehicleModelRequest, UpdateVehicleModelRequest, VehicleBrand } from '../types/api';
import { api } from '../services/api';

interface VehicleModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vehicleModel?: VehicleModelWithBrand | null;
}

const VehicleModelModal: React.FC<VehicleModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleModel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    vehicle_brand_id: '',
    year_from: '',
    year_to: '',
    fuel_type: '',
    transmission: '',
    engine_size: '',
    is_active: true,
  });

  const [vehicleBrands, setVehicleBrands] = useState<VehicleBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isEditing = !!vehicleModel;
  const currentYear = new Date().getFullYear();

  // Load vehicle brands for dropdown
  const loadVehicleBrands = async () => {
    try {
      setBrandsLoading(true);
      const response = await api.vehicleBrands.getActive();
      setVehicleBrands(response.data || []);
    } catch (err) {
      console.error('Error loading vehicle brands:', err);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Reset form when modal opens/closes or vehicle model changes
  useEffect(() => {
    if (isOpen) {
      loadVehicleBrands();
      
      if (vehicleModel) {
        setFormData({
          name: vehicleModel.name || '',
          code: vehicleModel.code || '',
          description: vehicleModel.description || '',
          vehicle_brand_id: vehicleModel.vehicle_brand_id || '',
          year_from: vehicleModel.year_from?.toString() || '',
          year_to: vehicleModel.year_to?.toString() || '',
          fuel_type: vehicleModel.fuel_type || '',
          transmission: vehicleModel.transmission || '',
          engine_size: vehicleModel.engine_size || '',
          is_active: vehicleModel.is_active !== false,
        });
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          vehicle_brand_id: '',
          year_from: '',
          year_to: '',
          fuel_type: '',
          transmission: '',
          engine_size: '',
          is_active: true,
        });
      }
      setErrors({});
      setTouchedFields({});
    }
  }, [isOpen, vehicleModel]);

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Vehicle model name is required';
      case 'vehicle_brand_id':
        return value ? '' : 'Vehicle brand is required';
      case 'year_from':
        if (!value) return 'Starting year is required';
        const yearFrom = parseInt(value, 10);
        if (isNaN(yearFrom) || yearFrom < 1900 || yearFrom > currentYear + 5) {
          return `Year must be between 1900 and ${currentYear + 5}`;
        }
        return '';
      case 'year_to':
        if (!value) return '';
        const yearTo = parseInt(value, 10);
        const yearFromNum = parseInt(formData.year_from, 10);
        if (isNaN(yearTo) || yearTo < 1900 || yearTo > currentYear + 5) {
          return `Year must be between 1900 and ${currentYear + 5}`;
        }
        if (yearFromNum && yearTo < yearFromNum) {
          return 'End year cannot be before start year';
        }
        return '';
      case 'engine_size':
        if (!value.trim()) return '';
        // Basic validation for engine size format (e.g., "2.0L", "1500cc", "3.5")
        if (!/^[\d.]+\s*(L|l|cc|CC|\s|$)/.test(value)) {
          return 'Engine size format: e.g., "2.0L", "1500cc", "3.5"';
        }
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touchedFields[field] || field === 'year_to') {
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
    const error = validateField(field, formData[field as keyof typeof formData]?.toString() || '');
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const value = formData[field as keyof typeof formData]?.toString() || '';
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

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
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined,
        vehicle_brand_id: formData.vehicle_brand_id,
        year_from: parseInt(formData.year_from, 10),
        year_to: formData.year_to ? parseInt(formData.year_to, 10) : undefined,
        fuel_type: formData.fuel_type.trim() || undefined,
        transmission: formData.transmission.trim() || undefined,
        engine_size: formData.engine_size.trim() || undefined,
      };

      if (isEditing && vehicleModel) {
        await api.vehicleModels.update(vehicleModel.id, requestData as UpdateVehicleModelRequest);
      } else {
        await api.vehicleModels.create(requestData as CreateVehicleModelRequest);
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving vehicle model:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Vehicle Model' : 'Add Vehicle Model'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Model Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    placeholder="e.g., Camry, Civic, Corolla"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleFieldChange('code', e.target.value)}
                    onBlur={() => handleFieldBlur('code')}
                    placeholder="e.g., XV70, FC1, ZRE210"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                  )}
                </div>

                {/* Vehicle Brand */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Brand <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vehicle_brand_id}
                    onChange={(e) => handleFieldChange('vehicle_brand_id', e.target.value)}
                    onBlur={() => handleFieldBlur('vehicle_brand_id')}
                    disabled={brandsLoading}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.vehicle_brand_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">
                      {brandsLoading ? 'Loading brands...' : 'Select a vehicle brand'}
                    </option>
                    {vehicleBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_brand_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.vehicle_brand_id}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Year Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Production Years
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Year From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={currentYear + 5}
                    value={formData.year_from}
                    onChange={(e) => handleFieldChange('year_from', e.target.value)}
                    onBlur={() => handleFieldBlur('year_from')}
                    placeholder={`e.g., ${currentYear - 5}`}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.year_from ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.year_from && (
                    <p className="mt-1 text-xs text-red-600">{errors.year_from}</p>
                  )}
                </div>

                {/* Year To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Year
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max={currentYear + 5}
                    value={formData.year_to}
                    onChange={(e) => handleFieldChange('year_to', e.target.value)}
                    onBlur={() => handleFieldBlur('year_to')}
                    placeholder="Leave empty for current production"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.year_to ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.year_to && (
                    <p className="mt-1 text-xs text-red-600">{errors.year_to}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Engine & Transmission */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Engine & Transmission
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => handleFieldChange('fuel_type', e.target.value)}
                    onBlur={() => handleFieldBlur('fuel_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select fuel type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                    <option value="LPG">LPG</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>

                {/* Transmission */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transmission
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => handleFieldChange('transmission', e.target.value)}
                    onBlur={() => handleFieldBlur('transmission')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select transmission</option>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
                    <option value="Semi-Automatic">Semi-Automatic</option>
                  </select>
                </div>

                {/* Engine Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engine Size
                  </label>
                  <input
                    type="text"
                    value={formData.engine_size}
                    onChange={(e) => handleFieldChange('engine_size', e.target.value)}
                    onBlur={() => handleFieldBlur('engine_size')}
                    placeholder="e.g., 2.0L, 1500cc"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.engine_size ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.engine_size && (
                    <p className="mt-1 text-xs text-red-600">{errors.engine_size}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={() => handleFieldBlur('description')}
                rows={3}
                placeholder="Additional model information, variants, or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleFieldChange('is_active', e.target.checked.toString())}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Active vehicle model
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEditing ? 'Update Model' : 'Create Model'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleModelModal;