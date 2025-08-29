import React, { useState, useEffect } from 'react';
import { X, Tag, Save, Loader2, Globe, Image, ExternalLink } from 'lucide-react';
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from '../types/api';
import { api } from '../services/api';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  brand?: Brand | null;
}

const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brand,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    website: '',
    country_code: '',
    logo_url: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');

  const isEditing = !!brand;

  // Reset form when modal opens/closes or brand changes
  useEffect(() => {
    if (isOpen) {
      if (brand) {
        setFormData({
          name: brand.name || '',
          code: brand.code || '',
          description: brand.description || '',
          website: brand.website || '',
          country_code: brand.country_code || '',
          logo_url: brand.logo_url || '',
          is_active: brand.is_active !== false,
        });
        setLogoPreview(brand.logo_url || '');
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          website: '',
          country_code: '',
          logo_url: '',
          is_active: true,
        });
        setLogoPreview('');
      }
      setErrors({});
      setTouchedFields({});
    }
  }, [isOpen, brand]);

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Brand name is required';
      case 'website':
        if (!value.trim()) return '';
        try {
          new URL(value.startsWith('http') ? value : `https://${value}`);
          return '';
        } catch {
          return 'Invalid website URL';
        }
      case 'country_code':
        if (!value.trim()) return '';
        return value.length === 2 ? '' : 'Country code must be 2 letters (e.g., US, DE)';
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
        website: formData.website.trim() || undefined,
        country_code: formData.country_code.trim().toUpperCase() || undefined,
        logo_url: formData.logo_url.trim() || undefined,
        is_active: formData.is_active,
      };

      // Add code for new brands if provided
      if (!isEditing && formData.code.trim()) {
        (submitData as CreateBrandRequest).code = formData.code.trim();
      }

      if (isEditing) {
        await api.brands.update(brand!.id, submitData as UpdateBrandRequest);
      } else {
        await api.brands.create(submitData as CreateBrandRequest);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      
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
          general: error.response?.data?.message || 'Failed to save brand. Please try again.' 
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Tag className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit Brand' : 'Add New Brand'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* General Error */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.general}
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Brand Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter brand name (e.g., Bosch, NGK, Denso)"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Brand Code */}
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                      Brand Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      onBlur={() => handleFieldBlur('code')}
                      disabled={isEditing}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        isEditing ? 'bg-gray-100' : 'border-gray-300'
                      } ${errors.code ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Auto-generated if empty"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>

                  {/* Country Code */}
                  <div>
                    <label htmlFor="country_code" className="block text-sm font-medium text-gray-700">
                      Country Code
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type="text"
                        id="country_code"
                        value={formData.country_code}
                        onChange={(e) => handleFieldChange('country_code', e.target.value.toUpperCase())}
                        onBlur={() => handleFieldBlur('country_code')}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors.country_code ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="US, DE, JP..."
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
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the brand..."
                />
              </div>

              {/* Website & Logo */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Web Presence</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Website */}
                  <div className="sm:col-span-2">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleFieldChange('website', e.target.value)}
                        onBlur={() => handleFieldBlur('website')}
                        className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors.website ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="https://www.brand-website.com"
                      />
                      {formData.website && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <a
                            href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                    )}
                  </div>

                  {/* Logo URL */}
                  <div className="sm:col-span-2">
                    <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
                      Logo URL
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Image className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => handleFieldChange('logo_url', e.target.value)}
                        onBlur={() => handleFieldBlur('logo_url')}
                        className={`block w-full pl-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                          errors.logo_url ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    {errors.logo_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.logo_url}</p>
                    )}
                  </div>

                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo Preview
                      </label>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                        <img
                          src={logoPreview}
                          alt="Brand logo preview"
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            const sibling = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (sibling) sibling.style.display = 'block';
                          }}
                        />
                        <div className="text-gray-400 text-xs hidden">
                          Failed to load image
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked.toString())}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active Brand
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Inactive brands will not appear in product creation forms
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
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Brand' : 'Create Brand'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;