import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Category } from '../types/api';
import { api } from '../services/api';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Category) => void;
  category?: Category | null;
  parentId?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  parentId,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: '',
  });
  const [availableParents, setAvailableParents] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingParents, setLoadingParents] = useState(false);

  const isEditing = Boolean(category);

  // Load form data when category or parentId changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        parent_id: category.parent_id || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        parent_id: parentId || '',
      });
    }
    setErrors({});
  }, [category, parentId]);

  // Load available parent categories
  useEffect(() => {
    if (isOpen) {
      loadAvailableParents();
    }
  }, [isOpen, category]);

  const loadAvailableParents = async () => {
    try {
      setLoadingParents(true);
      // Get all categories for parent selection
      const response = await api.get<Category[]>('/categories');
      let parents = response.data;

      // If editing, exclude the current category and its descendants
      if (category) {
        parents = parents.filter(p => 
          p.id !== category.id && !p.path.includes(category.id)
        );
      }

      // Only show categories that can have children (level < 2)
      parents = parents.filter(p => p.level < 2);

      setAvailableParents(parents);
    } catch (error) {
      console.error('Error loading parent categories:', error);
    } finally {
      setLoadingParents(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parent_id: formData.parent_id || null,
      };

      let response;
      if (isEditing && category) {
        response = await api.put<Category>(`/categories/${category.id}`, payload);
      } else {
        response = await api.post<Category>('/categories', payload);
      }

      onSave(response.data);
      onClose();
    } catch (error: any) {
      console.error('Error saving category:', error);
      
      // Handle validation errors from server
      if (error.response?.status === 400 && error.response.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({
          submit: error.response?.data?.message || 'Failed to save category'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card text-card-foreground rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter category name"
              disabled={loading}
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-input'
              }`}
              placeholder="Enter category description"
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-foreground mb-1">
              Parent Category
            </label>
            <select
              id="parent_id"
              value={formData.parent_id}
              onChange={(e) => handleInputChange('parent_id', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={loading || loadingParents}
            >
              <option value="">Root Level Category</option>
              {availableParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {'—'.repeat(parent.level)} {parent.name}
                </option>
              ))}
            </select>
            {loadingParents && (
              <p className="mt-1 text-sm text-muted-foreground">Loading parent categories...</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-input rounded-md text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;