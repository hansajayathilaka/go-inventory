import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { categoryService } from '@/services/categoryService';
import type { Category, CategoryHierarchy } from '@/types/category';

interface CategoryFilterProps {
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  onCategoryChange?: (category: Category | null) => void;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
}

export function CategoryFilter({
  selectedCategoryId,
  onCategorySelect,
  onCategoryChange
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the category hierarchy from the API
      const hierarchy = await categoryService.getCategoryHierarchy();

      // Transform the hierarchy into a tree structure
      const categoryTree = buildCategoryTree(hierarchy.children ? flattenHierarchy(hierarchy) : []);
      setCategories(categoryTree);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
      // Fallback to mock data for development
      setCategories(getMockCategories());
    } finally {
      setIsLoading(false);
    }
  };

  const flattenHierarchy = (hierarchy: CategoryHierarchy): Category[] => {
    const result: Category[] = [];

    if (hierarchy.category) {
      result.push(hierarchy.category);
    }

    hierarchy.children.forEach((child: CategoryHierarchy) => {
      result.push(...flattenHierarchy(child));
    });

    return result;
  };

  const buildCategoryTree = (flatCategories: Category[]): CategoryNode[] => {
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // First pass: create all category nodes
    flatCategories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        expanded: false
      });
    });

    // Second pass: build the tree structure
    flatCategories.forEach(category => {
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  };

  const getMockCategories = (): CategoryNode[] => [
    {
      id: '1',
      name: 'Auto Parts',
      description: 'Vehicle parts and components',
      parent_id: null,
      level: 0,
      path: '/auto-parts',
      children_count: 2,
      product_count: 150,
      created_at: '',
      updated_at: '',
      children: [
        {
          id: '2',
          name: 'Engine Parts',
          description: 'Engine components and accessories',
          parent_id: '1',
          level: 1,
          path: '/auto-parts/engine-parts',
          children_count: 0,
          product_count: 45,
          created_at: '',
          updated_at: '',
          children: []
        },
        {
          id: '3',
          name: 'Brake System',
          description: 'Brake pads, rotors, and accessories',
          parent_id: '1',
          level: 1,
          path: '/auto-parts/brake-system',
          children_count: 0,
          product_count: 35,
          created_at: '',
          updated_at: '',
          children: []
        }
      ]
    },
    {
      id: '4',
      name: 'Tools & Equipment',
      description: 'Workshop tools and equipment',
      parent_id: null,
      level: 0,
      path: '/tools-equipment',
      children_count: 1,
      product_count: 85,
      created_at: '',
      updated_at: '',
      children: [
        {
          id: '5',
          name: 'Hand Tools',
          description: 'Manual tools and accessories',
          parent_id: '4',
          level: 1,
          path: '/tools-equipment/hand-tools',
          children_count: 0,
          product_count: 30,
          created_at: '',
          updated_at: '',
          children: []
        }
      ]
    }
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  };

  const handleCategorySelect = (category: CategoryNode | null) => {
    const categoryId = category?.id || null;
    onCategorySelect(categoryId);
    onCategoryChange?.(category);
  };

  const renderCategory = (category: CategoryNode) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    const paddingLeft = category.level * 16 + 8;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => handleCategorySelect(category)}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          {/* Category Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Category Name and Count */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {category.name}
            </div>
          </div>

          {/* Product Count Badge */}
          <Badge variant="outline" className="text-xs">
            {category.product_count || 0}
          </Badge>
        </div>

        {/* Children Categories */}
        {hasChildren && isExpanded && (
          <div>
            {category.children?.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Loading categories...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-sm text-destructive mb-2">Error loading categories</div>
        <Button size="sm" variant="outline" onClick={loadCategories}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Categories</h3>
          {selectedCategoryId && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCategorySelect(null)}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Products Option */}
          <div
            className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
              !selectedCategoryId
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => handleCategorySelect(null)}
          >
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium text-sm">All Products</div>
            </div>
          </div>

          {/* Category Tree */}
          {categories.map(category => renderCategory(category))}
        </div>
      </ScrollArea>
    </Card>
  );
}