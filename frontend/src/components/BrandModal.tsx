import React, { useState, useEffect } from 'react';
import { Tag, Save, Loader2, Globe, Image, ExternalLink } from 'lucide-react';
import type { Brand, CreateBrandRequest, UpdateBrandRequest } from '../types/api';
import { api } from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
    } catch (error: unknown) {
      console.error('Error saving brand:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response?: { data?: { errors?: Array<{ field?: string; message: string }>; message?: string } } };
        if (responseError.response?.data?.errors) {
          const apiErrors: Record<string, string> = {};
          responseError.response.data.errors.forEach((err) => {
          if (err.field) {
            apiErrors[err.field] = err.message;
          }
        });
        setErrors(apiErrors);
        } else {
          setErrors({ 
            general: responseError.response?.data?.message || 'Failed to save brand. Please try again.' 
          });
        }
      } else {
        setErrors({ 
          general: 'Failed to save brand. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <Tag className="h-6 w-6 text-muted-foreground mr-2" />
            <DialogTitle>
              {isEditing ? 'Edit Brand' : 'Add New Brand'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  {/* Brand Name */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="name">Brand Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onBlur={() => handleFieldBlur('name')}
                      placeholder="Enter brand name (e.g., Bosch, NGK, Denso)"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Brand Code */}
                  <div className="space-y-2">
                    <Label htmlFor="code">Brand Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                      onBlur={() => handleFieldBlur('code')}
                      disabled={isEditing}
                      placeholder="Auto-generated if empty"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && (
                      <p className="text-sm text-red-600">{errors.code}</p>
                    )}
                  </div>

                  {/* Country Code */}
                  <div className="space-y-2">
                    <Label htmlFor="country_code">Country Code</Label>
                    <div className="relative">
                      <Input
                        id="country_code"
                        value={formData.country_code}
                        onChange={(e) => handleFieldChange('country_code', e.target.value.toUpperCase())}
                        onBlur={() => handleFieldBlur('country_code')}
                        placeholder="US, DE, JP..."
                        maxLength={2}
                        className={errors.country_code ? 'border-red-500' : ''}
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
                      <p className="text-sm text-red-600">{errors.country_code}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  rows={3}
                  placeholder="Brief description of the brand..."
                />
              </div>

              {/* Website & Logo */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Web Presence</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Website */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="url"
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleFieldChange('website', e.target.value)}
                        onBlur={() => handleFieldBlur('website')}
                        placeholder="https://www.brand-website.com"
                        className={`pl-10 pr-10 ${errors.website ? 'border-red-500' : ''}`}
                      />
                      {formData.website && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <a
                            href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-blue-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                    </div>
                    {errors.website && (
                      <p className="text-sm text-red-600">{errors.website}</p>
                    )}
                  </div>

                  {/* Logo URL */}
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="url"
                        id="logo_url"
                        value={formData.logo_url}
                        onChange={(e) => handleFieldChange('logo_url', e.target.value)}
                        onBlur={() => handleFieldBlur('logo_url')}
                        placeholder="https://example.com/logo.png"
                        className={`pl-10 ${errors.logo_url ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.logo_url && (
                      <p className="text-sm text-red-600">{errors.logo_url}</p>
                    )}
                  </div>

                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Logo Preview
                      </label>
                      <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center border border-input">
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
                        <div className="text-muted-foreground text-xs hidden">
                          Failed to load image
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Status</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleFieldChange('is_active', checked.toString())}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal">
                    Active Brand
                  </Label>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inactive brands will not appear in product creation forms
                </p>
              </div>
            </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
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
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrandModal;