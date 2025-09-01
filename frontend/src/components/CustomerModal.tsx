import React, { useState, useEffect } from 'react';
import { X, Users, Building, Save, Loader2 } from 'lucide-react';
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../types/api';
import { api } from '../services/api';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  customer?: Customer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    customer_type: 'individual' as 'individual' | 'business',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    tax_number: '',
    credit_limit: '',
    notes: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isEditing = !!customer;

  // Reset form when modal opens/closes or customer changes
  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          name: customer.name || '',
          code: customer.code || '',
          customer_type: customer.customer_type || 'individual',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          postal_code: customer.postal_code || '',
          country: customer.country || '',
          tax_number: customer.tax_number || '',
          credit_limit: customer.credit_limit ? customer.credit_limit.toString() : '',
          notes: customer.notes || '',
          is_active: customer.is_active !== false,
        });
      } else {
        setFormData({
          name: '',
          code: '',
          customer_type: 'individual',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          tax_number: '',
          credit_limit: '',
          notes: '',
          is_active: true,
        });
      }
      setErrors({});
      setTouchedFields({});
    }
  }, [isOpen, customer]);

  // Validation
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return value.trim() ? '' : 'Customer name is required';
      case 'email':
        if (!value.trim()) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Invalid email format';
      case 'credit_limit':
        if (!value.trim()) return '';
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 ? '' : 'Credit limit must be a positive number';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        customer_type: formData.customer_type,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        country: formData.country.trim() || undefined,
        tax_number: formData.tax_number.trim() || undefined,
        credit_limit: formData.credit_limit.trim() ? parseFloat(formData.credit_limit) : undefined,
        notes: formData.notes.trim() || undefined,
        is_active: formData.is_active,
      };

      // Add code for new customers if provided
      if (!isEditing && formData.code.trim()) {
        (submitData as CreateCustomerRequest).code = formData.code.trim();
      }

      if (isEditing) {
        await api.customers.update(customer!.id, submitData as UpdateCustomerRequest);
      } else {
        await api.customers.create(submitData as CreateCustomerRequest);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      
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
          general: error.response?.data?.message || 'Failed to save customer. Please try again.' 
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
                {formData.customer_type === 'business' ? (
                  <Building className="h-6 w-6 text-muted-foreground mr-2" />
                ) : (
                  <Users className="h-6 w-6 text-muted-foreground mr-2" />
                )}
                <h3 className="text-lg font-medium text-foreground">
                  {isEditing ? 'Edit Customer' : 'Add New Customer'}
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
                  {/* Customer Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-foreground">
                      Customer Name *
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
                      placeholder="Enter customer name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Customer Code */}
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-foreground">
                      Customer Code
                    </label>
                    <input
                      type="text"
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleFieldChange('code', e.target.value)}
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

                  {/* Customer Type */}
                  <div>
                    <label htmlFor="customer_type" className="block text-sm font-medium text-foreground">
                      Customer Type *
                    </label>
                    <select
                      id="customer_type"
                      value={formData.customer_type}
                      onChange={(e) => handleFieldChange('customer_type', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    >
                      <option value="individual">Individual</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="customer@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      onBlur={() => handleFieldBlur('phone')}
                      className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Address Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-foreground">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* City */}
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-foreground">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-foreground">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleFieldChange('state', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="NY"
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label htmlFor="postal_code" className="block text-sm font-medium text-foreground">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => handleFieldChange('postal_code', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-foreground">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleFieldChange('country', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Business Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Tax Number */}
                  <div>
                    <label htmlFor="tax_number" className="block text-sm font-medium text-foreground">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      id="tax_number"
                      value={formData.tax_number}
                      onChange={(e) => handleFieldChange('tax_number', e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Tax ID or VAT number"
                    />
                  </div>

                  {/* Credit Limit */}
                  <div>
                    <label htmlFor="credit_limit" className="block text-sm font-medium text-foreground">
                      Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      id="credit_limit"
                      value={formData.credit_limit}
                      onChange={(e) => handleFieldChange('credit_limit', e.target.value)}
                      onBlur={() => handleFieldBlur('credit_limit')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                        errors.credit_limit ? 'border-red-300' : 'border-input'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.credit_limit && (
                      <p className="mt-1 text-sm text-red-600">{errors.credit_limit}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-foreground">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Additional notes about the customer..."
                />
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleFieldChange('is_active', e.target.checked ? 'true' : 'false')}
                  className="h-4 w-4 text-primary focus:ring-ring border-input rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-foreground">
                  Active customer
                </label>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-input shadow-sm px-4 py-2 bg-card text-base font-medium text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;