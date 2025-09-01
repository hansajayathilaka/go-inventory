import React, { useState, useEffect } from 'react';
import { X, Car, Save, Loader2, Image, Upload } from 'lucide-react';
import type { VehicleBrand, CreateVehicleBrandRequest, UpdateVehicleBrandRequest } from '../types/api';
import { api } from '../services/api';

interface VehicleBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  vehicleBrand?: VehicleBrand | null;
}

const VehicleBrandModal: React.FC<VehicleBrandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleBrand,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    country_code: '',
    logo_url: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');

  const isEditing = !!vehicleBrand;

  // Reset form when modal opens/closes or vehicle brand changes
  useEffect(() => {
    if (isOpen) {
      if (vehicleBrand) {
        setFormData({
          name: vehicleBrand.name || '',
          code: vehicleBrand.code || '',
          description: vehicleBrand.description || '',
          country_code: vehicleBrand.country_code || '',
          logo_url: vehicleBrand.logo_url || '',
          is_active: vehicleBrand.is_active !== false,
        });
        setLogoPreview(vehicleBrand.logo_url || '');
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          country_code: '',
          logo_url: '',
          is_active: true,
        });
        setLogoPreview('');
      }
      setErrors({});
      setTouchedFields({});
    }
  }, [isOpen, vehicleBrand]);

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Vehicle brand name is required';
      case 'country_code':
        if (!value.trim()) return '';
        return value.length === 2 ? '' : 'Country code must be 2 letters (e.g., JP, DE, US)';
      case 'logo_url':
        if (!value.trim()) return '';
        try {
          new URL(value);
          return '';
        } catch {
          return 'Invalid logo URL';
        }
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update logo preview
    if (field === 'logo_url') {
      setLogoPreview(value);
    }
    
    if (touchedFields[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData] as string);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouchedFields(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return Object.keys(newErrors).length === 0;
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return null;
    return String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country_code: formData.country_code.trim().toUpperCase() || undefined,
        logo_url: formData.logo_url.trim() || undefined,
        is_active: formData.is_active,
      };

      // Add code for new vehicle brands if provided
      if (!isEditing && formData.code.trim()) {
        (submitData as CreateVehicleBrandRequest).code = formData.code.trim();
      }

      if (isEditing) {
        await api.vehicleBrands.update(vehicleBrand!.id, submitData as UpdateVehicleBrandRequest);
      } else {
        await api.vehicleBrands.create(submitData as CreateVehicleBrandRequest);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving vehicle brand:', error);
      
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.field) {
            apiErrors[err.field] = err.message;
          }
        });
        setErrors(apiErrors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || 'Failed to save vehicle brand. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-card text-card-foreground rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Car className="h-6 w-6 text-muted-foreground mr-2" />
                <h3 className="text-lg font-medium text-foreground">
                  {isEditing ? 'Edit Vehicle Brand' : 'Add New Vehicle Brand'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card px-4 pt-5 pb-4 sm:p-6">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.general}
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Vehicle Brand Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-foreground">
                      Vehicle Brand Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="Enter vehicle brand name (e.g., Toyota, Honda, BMW)"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Vehicle Brand Code */}
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-foreground">
                      Vehicle Brand Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      onBlur={() => handleFieldBlur('code')}
                      disabled={isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        isEditing ? 'bg-gray-100' : 'border-input'
                      } ${errors.code ? 'border-red-300' : 'border-input'}`}
                      placeholder="Auto-generated if empty"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>

                  {/* Country Code */}
                  <div>
                    <label htmlFor="country_code" className="block text-sm font-medium text-foreground">
                      Country of Origin
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        id="country_code"
                        value={formData.country_code}
                        onChange={(e) => handleFieldChange('country_code', e.target.value.toUpperCase())}
                        onBlur={() => handleFieldBlur('country_code')}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                          errors.country_code ? 'border-red-300' : 'border-input'
                        }`}
                        placeholder="JP, DE, US..."
                        maxLength={2}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {formData.country_code && formData.country_code.length === 2 && (
                          <span className="text-sm">
                            {getCountryFlag(formData.country_code)}
                          </span>
                        )}
                      </div>
                    </div>
                    {errors.country_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.country_code}</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      Country where the vehicle manufacturer is headquartered
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Brief description of the vehicle manufacturer..."
                />
              </div>

              {/* Logo Section */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Brand Logo</h4>
                
                {/* Logo URL */}
                <div>
                  <label htmlFor="logo_url" className="block text-sm font-medium text-foreground">
                    Logo URL
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="url"
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => handleFieldChange('logo_url', e.target.value)}
                      onBlur={() => handleFieldBlur('logo_url')}
                      className={`block w-full pl-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.logo_url ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="https://example.com/toyota-logo.png"
                    />
                  </div>
                  {errors.logo_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    URL to the vehicle brand's logo image
                  </p>
                </div>

                {/* Logo Preview */}
                {logoPreview && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Logo Preview
                    </label>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-input">
                      <img
                        src={logoPreview}
                        alt="Vehicle brand logo preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          const sibling = target.nextElementSibling as HTMLElement;
                          target.style.display = 'none';
                          if (sibling) sibling.style.display = 'block';
                        }}
                      />
                      <div className="text-muted-foreground text-xs text-center hidden flex-col">
                        <Upload className="h-6 w-6 mb-1 mx-auto" />
                        <span>Failed to load image</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Status</h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked.toString())}
                    className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-foreground">
                    Active Vehicle Brand
                  </label>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inactive vehicle brands will not appear in vehicle model creation forms
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Vehicle Brand' : 'Create Vehicle Brand'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleBrandModal;