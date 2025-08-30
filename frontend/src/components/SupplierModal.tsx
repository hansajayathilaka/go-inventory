import React, { useState, useEffect } from 'react';
import { X, Truck, User, Mail, Phone, MapPin, Save, Loader2, Building } from 'lucide-react';
import type { Supplier } from '../types/api';
import { api } from '../services/api';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  supplier?: Supplier | null;
  mode?: 'create' | 'edit' | 'view';
}

interface SupplierFormData {
  name: string;
  code: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  supplier,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<SupplierFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when supplier prop changes
  useEffect(() => {
    if (supplier && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: supplier.name || '',
        code: supplier.code || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        is_active: supplier.is_active ?? true,
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        code: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [supplier, mode, isOpen]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<SupplierFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Supplier name must be at least 2 characters';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Supplier code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Supplier code must be at least 3 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        contact_person: formData.contact_person || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        is_active: formData.is_active,
      };

      if (mode === 'create') {
        const response = await api.post('/suppliers', payload);
        const data = response.data as any;
        if (data.success) {
          onSave();
          onClose();
        } else {
          setErrors({ name: 'Failed to create supplier. Please try again.' });
        }
      } else if (mode === 'edit' && supplier) {
        const response = await api.put(`/suppliers/${supplier.id}`, payload);
        const data = response.data as any;
        if (data.success) {
          onSave();
          onClose();
        } else {
          setErrors({ name: 'Failed to update supplier. Please try again.' });
        }
      }
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      if (error.response?.status === 409) {
        setErrors({ code: 'Supplier code already exists' });
      } else {
        setErrors({ name: 'Failed to save supplier. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const actualValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: actualValue }));
    
    // Clear error when user starts typing
    if (errors[name as keyof SupplierFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              {mode === 'create' ? 'Create New Supplier' : mode === 'edit' ? 'Edit Supplier' : 'View Supplier'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Supplier Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter supplier name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Supplier Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Code *
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="e.g., SUP001"
                />
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.contact_person ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter contact person name"
                />
              </div>
              {errors.contact_person && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  readOnly={isReadOnly}
                  rows={3}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  } ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter supplier address"
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isReadOnly}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active supplier
              </label>
            </div>

            {/* Additional Info for View Mode */}
            {mode === 'view' && supplier && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-600">
                      {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated:</span>
                    <p className="text-gray-600">
                      {supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {mode === 'create' ? 'Create Supplier' : 'Update Supplier'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;