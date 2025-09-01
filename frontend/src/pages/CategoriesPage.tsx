import React, { useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import type { Category } from '../types/api';
import CategoryTree from '../components/CategoryTree';
import CategoryModal from '../components/CategoryModal';
import { api } from '../services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const CategoriesPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleAddCategory = (parentId?: string) => {
    setEditingCategory(null);
    setParentIdForNew(parentId || '');
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setParentIdForNew('');
    setIsModalOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleCategorySave = (savedCategory: Category) => {
    // Refresh the tree by incrementing the refresh key
    setRefreshKey(prev => prev + 1);
    setSelectedCategory(savedCategory);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    try {
      await api.delete(`/categories/${selectedCategory.id}`);
      setRefreshKey(prev => prev + 1);
      setSelectedCategory(null);
      setIsDeleteModalOpen(false);
      toast({
        title: "Category deleted",
        description: `${selectedCategory.name} has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to delete category',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your products into hierarchical categories.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => handleAddCategory()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card text-card-foreground shadow rounded-lg p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-input rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-muted-foreground hover:text-foreground text-sm">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Tree */}
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground shadow rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Category Hierarchy</h3>
            </div>
            <div className="p-6">
              <CategoryTree
                key={refreshKey}
                onCategorySelect={handleCategorySelect}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                selectedCategoryId={selectedCategory?.id}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-1">
          <div className="bg-card text-card-foreground shadow rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Category Details</h3>
            </div>
            <div className="p-6">
              {selectedCategory ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">
                      {selectedCategory.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">Level {selectedCategory.level + 1}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Description</p>
                    <p className="text-muted-foreground">{selectedCategory.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Path</p>
                    <p className="text-sm text-muted-foreground font-mono">{selectedCategory.path}</p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button
                      onClick={() => handleEditCategory(selectedCategory)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                    >
                      Edit Category
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(selectedCategory)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      Delete Category
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select a category to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCategorySave}
        category={editingCategory}
        parentId={parentIdForNew}
      />

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{selectedCategory?.name}"? This action cannot be undone and will also delete all subcategories and their associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;