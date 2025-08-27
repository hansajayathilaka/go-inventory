import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Category } from '../types/api';
import { api } from '../services/api';

interface CategoryTreeProps {
  onCategorySelect?: (category: Category) => void;
  onAddCategory?: (parentId?: string) => void;
  onEditCategory?: (category: Category) => void;
  onDeleteCategory?: (category: Category) => void;
  selectedCategoryId?: string;
  searchQuery?: string;
}

interface TreeNode extends Category {
  children: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
}

const CategoryTree: React.FC<CategoryTreeProps> = ({
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  selectedCategoryId,
  searchQuery = '',
}) => {
  const [rootCategories, setRootCategories] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load root categories on mount
  useEffect(() => {
    loadRootCategories();
  }, []);

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery) {
      searchCategories(searchQuery);
    } else {
      loadRootCategories();
    }
  }, [searchQuery]);

  const loadRootCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories?parent_id=null');
      // API returns data in nested structure: { data: { categories: [...] } }
      const apiResponse = response.data as any;
      const categories = apiResponse?.data?.categories || [];
      const treeNodes = categories.map((category: Category) => ({
        ...category,
        children: [],
        isExpanded: false,
        isLoading: false,
      }));
      setRootCategories(treeNodes);
      setError(null);
    } catch (err: any) {
      // Extract the specific error message from the API response
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load categories';
      setError(errorMessage);
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchCategories = async (query: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/categories/search?q=${encodeURIComponent(query)}`);
      // API returns data in nested structure: { data: { categories: [...] } }
      const apiResponse = response.data as any;
      const categories = apiResponse?.data?.categories || [];
      const treeNodes = categories.map((category: Category) => ({
        ...category,
        children: [],
        isExpanded: true, // Expand all when searching
        isLoading: false,
      }));
      setRootCategories(treeNodes);
      setError(null);
    } catch (err: any) {
      // Extract the specific error message from the API response
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to search categories';
      setError(errorMessage);
      console.error('Error searching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async (parentId: string): Promise<TreeNode[]> => {
    try {
      const response = await api.get(`/categories?parent_id=${parentId}`);
      // API returns data in nested structure: { data: { categories: [...] } }
      const apiResponse = response.data as any;
      const categories = apiResponse?.data?.categories || [];
      return categories.map((category: Category) => ({
        ...category,
        children: [],
        isExpanded: false,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Error loading child categories:', err);
      return [];
    }
  };

  const toggleExpansion = async (categoryId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.id === categoryId) {
          if (!node.isExpanded && node.children.length === 0) {
            // Load children if not loaded
            const updatedNode = { ...node, isLoading: true };
            loadChildren(categoryId).then(children => {
              setRootCategories(prevNodes => 
                updateNodeInTree(prevNodes, categoryId, { 
                  ...updatedNode, 
                  children, 
                  isExpanded: true, 
                  isLoading: false 
                })
              );
            });
            return updatedNode;
          } else {
            return { ...node, isExpanded: !node.isExpanded };
          }
        }
        return {
          ...node,
          children: updateNode(node.children)
        };
      });
    };

    setRootCategories(updateNode);
  };

  const updateNodeInTree = (nodes: TreeNode[], targetId: string, updatedNode: TreeNode): TreeNode[] => {
    return nodes.map(node => {
      if (node.id === targetId) {
        return updatedNode;
      }
      return {
        ...node,
        children: updateNodeInTree(node.children, targetId, updatedNode)
      };
    });
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.level < 3; // Assuming max 3 levels
    const isSelected = node.id === selectedCategoryId;
    const paddingLeft = depth * 20 + 12;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 rounded-md cursor-pointer group hover:bg-gray-50 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => onCategorySelect?.(node)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              className="p-1 rounded hover:bg-gray-200 mr-1"
              disabled={node.isLoading}
            >
              {node.isLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              ) : node.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Folder Icon */}
          <div className="mr-2">
            {node.isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
          </div>

          {/* Category Name */}
          <span className="flex-1 text-sm font-medium text-gray-900 truncate">
            {node.name}
          </span>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCategory?.(node.id);
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-green-600"
              title="Add subcategory"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory?.(node);
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-blue-600"
              title="Edit category"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory?.(node);
              }}
              className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600"
              title="Delete category"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Children */}
        {node.isExpanded && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading categories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">{error}</div>
        <button
          onClick={loadRootCategories}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rootCategories.length === 0) {
    return (
      <div className="p-6 text-center">
        <Folder className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
        <p className="text-gray-500 mb-4">
          {searchQuery ? 'No categories match your search.' : 'Start by creating your first category.'}
        </p>
        {!searchQuery && (
          <button
            onClick={() => onAddCategory?.()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootCategories.map(category => renderTreeNode(category))}
    </div>
  );
};

export default CategoryTree;