import React, { useState, useEffect } from 'react';
import SearchableTreeSelect from './SearchableTreeSelect';
import { api } from '../../services/api';
import type { Category } from '../../types/api';

/**
 * Demo component to showcase the enhanced category icon mapping system
 * This demonstrates the visual hierarchy and icon system in action
 */
const CategoryIconDemo: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ success: boolean; data?: Category[]; message?: string }>('/categories');
        const apiResponse = response.data as { success: boolean; data?: Category[]; message?: string };
        const categoriesData = apiResponse?.data || [];
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setError('');
      } catch (err) {
        setError('Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-muted rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400 mt-0.5 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Categories</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          🌳 Clean Category Selection Demo
        </h1>
        <p className="text-muted-foreground">
          Clean, icon-free category selection with visual hierarchy and enhanced UX
        </p>
      </div>

      <div className="space-y-6">
        {/* Demo SearchableTreeSelect */}
        <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            🌳 Category Tree Selector
          </h2>
          
          <SearchableTreeSelect
            categories={categories}
            selectedValue={selectedCategory}
            onChange={handleCategoryChange}
            placeholder="Select a category..."
            showProductCounts={true}
            showConnectionLines={true}
            searchable={true}
            searchPlaceholder="Search categories..."
            expandedByDefault={false}
            maxHeight={400}
            ariaLabel="Category selection demo"
          />
        </div>

        {/* Selected Category Info */}
        {selectedCategoryData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              ℹ️ Selected Category
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Name</label>
                <div className="text-blue-900 font-semibold">{selectedCategoryData.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Level</label>
                <div className="flex items-center">
                  <span className="text-blue-900 font-semibold mr-2">{selectedCategoryData.level}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedCategoryData.level === 0 
                      ? 'bg-blue-200 text-blue-800'
                      : selectedCategoryData.level === 1 
                        ? 'bg-green-200 text-green-800'
                        : 'bg-amber-200 text-amber-800'
                  }`}>
                    {selectedCategoryData.level === 0 ? 'Root' : selectedCategoryData.level === 1 ? 'Sub' : 'Leaf'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">ID</label>
                <div className="text-blue-900 font-mono text-sm">{selectedCategoryData.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Parent ID</label>
                <div className="text-blue-900 font-mono text-sm">
                  {selectedCategoryData.parent_id || 'None (Root)'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visual Hierarchy Legend */}
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            🎨 Visual Hierarchy Legend
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500 rounded">
              <div className="text-lg text-blue-600 mr-3">📁</div>
              <div>
                <div className="font-semibold text-blue-900">Level 0 (Root)</div>
                <div className="text-sm text-blue-700">Main categories with blue accent</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 border-l-2 border-green-500 rounded">
              <div className="text-base text-green-600 mr-3">📂</div>
              <div>
                <div className="font-semibold text-green-900">Level 1 (Sub)</div>
                <div className="text-sm text-green-700">Subcategories with green accent</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-amber-50 border-l-2 border-amber-500 rounded">
              <div className="text-sm text-amber-600 mr-3">📄</div>
              <div>
                <div className="font-semibold text-amber-900">Level 2+ (Leaf)</div>
                <div className="text-sm text-amber-700">Deep categories with amber accent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Statistics */}
        <div className="bg-card text-card-foreground border border-border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            📊 Category Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {categories.filter(c => c.level === 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Root Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {categories.filter(c => c.level === 1).length}
              </div>
              <div className="text-sm text-muted-foreground">Subcategories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {categories.filter(c => c.level >= 2).length}
              </div>
              <div className="text-sm text-muted-foreground">Deep Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {categories.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryIconDemo;