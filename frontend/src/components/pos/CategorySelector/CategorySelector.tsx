import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, ChevronDown, Folder, FolderOpen, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types/category';

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
  visible?: boolean;
  matchesSearch?: boolean;
}

interface CategorySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function CategorySelector({
  value = 'all',
  onValueChange,
  className
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);

      // Try hierarchy first for tree structure
      try {
        const hierarchy = await categoryService.getCategoryHierarchy();
        console.log('Category hierarchy:', hierarchy);

        const treeData = buildCategoryTree(hierarchy);
        setCategories(treeData);

        // Also create flat list for searching
        const flat = flattenCategoryTree(treeData);
        setFlatCategories(flat);
      } catch (hierarchyError) {
        console.warn('Hierarchy failed, using flat list:', hierarchyError);

        // Fallback to flat list
        const response = await categoryService.listCategories({ page_size: 100 });
        const flatList = response.data || [];
        setFlatCategories(flatList);

        // Convert flat list to simple tree structure
        const treeFromFlat = buildTreeFromFlatList(flatList);
        setCategories(treeFromFlat);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
      setFlatCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildCategoryTree = (data: any): CategoryNode[] => {
    if (!data) return [];

    // If data is wrapped
    if (data.data && !data.id) {
      return buildCategoryTree(data.data);
    }

    // If data is array
    if (Array.isArray(data)) {
      return data.map(item => ({
        ...item,
        children: item.children ? buildCategoryTree(item.children) : [],
        expanded: false,
        visible: true,
        matchesSearch: false
      }));
    }

    // If data is single object with children
    if (data.id) {
      return [{
        ...data,
        children: data.children ? buildCategoryTree(data.children) : [],
        expanded: false,
        visible: true,
        matchesSearch: false
      }];
    }

    return [];
  };

  const buildTreeFromFlatList = (flatList: Category[]): CategoryNode[] => {
    const itemMap = new Map<string, CategoryNode>();
    const rootItems: CategoryNode[] = [];

    // First pass: create all nodes
    flatList.forEach(item => {
      itemMap.set(item.id, {
        ...item,
        children: [],
        expanded: false,
        visible: true,
        matchesSearch: false
      });
    });

    // Second pass: build tree structure
    flatList.forEach(item => {
      const node = itemMap.get(item.id);
      if (!node) return;

      if (item.parent_id && itemMap.has(item.parent_id)) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        rootItems.push(node);
      }
    });

    return rootItems;
  };

  const flattenCategoryTree = (tree: CategoryNode[]): Category[] => {
    const result: Category[] = [];

    const traverse = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        result.push(node);
        if (node.children) {
          traverse(node.children);
        }
      });
    };

    traverse(tree);
    return result;
  };

  // Filter categories based on search
  const filterCategories = useCallback((query: string) => {
    if (!query.trim()) {
      // Reset visibility and search matches
      const resetVisibility = (nodes: CategoryNode[]): CategoryNode[] => {
        return nodes.map(node => ({
          ...node,
          visible: true,
          matchesSearch: false,
          children: node.children ? resetVisibility(node.children) : []
        }));
      };
      setCategories(resetVisibility(categories));
      return;
    }

    const searchLower = query.toLowerCase();

    const markMatches = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.map(node => {
        const matches = node.name.toLowerCase().includes(searchLower);
        const childResults = node.children ? markMatches(node.children) : [];
        const hasMatchingChildren = childResults.some(child => child.visible);

        return {
          ...node,
          matchesSearch: matches,
          visible: matches || hasMatchingChildren,
          children: childResults
        };
      });
    };

    setCategories(markMatches(categories));

    // Auto-expand nodes with matches
    const newExpanded = new Set(expandedNodes);
    const expandMatches = (nodes: CategoryNode[], parentMatches = false) => {
      nodes.forEach(node => {
        if (node.matchesSearch || parentMatches) {
          newExpanded.add(node.id);
        }
        if (node.children) {
          expandMatches(node.children, node.matchesSearch || parentMatches);
        }
      });
    };
    expandMatches(categories);
    setExpandedNodes(newExpanded);
  }, [categories, expandedNodes]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterCategories(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filterCategories]);

  const toggleExpanded = (categoryId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    onValueChange?.(categoryId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSelection = () => {
    onValueChange?.('all');
  };

  const renderCategoryNode = (node: CategoryNode, level = 0) => {
    if (!node.visible) return null;

    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = value === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          } ${node.matchesSearch ? 'bg-yellow-50' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleCategorySelect(node.id)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}

          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="flex-1 text-sm">{node.name}</span>

          {node.product_count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {node.product_count}
            </Badge>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children?.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getSelectedCategoryName = () => {
    if (value === 'all') return 'All categories';
    const selected = flatCategories.find(cat => cat.id === value);
    return selected?.name || 'Select category';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={`justify-between ${className}`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{getSelectedCategoryName()}</span>
          </div>
          {value !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col">
          {/* Search Header */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tree */}
          <ScrollArea className="h-80">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Package className="h-8 w-8 text-muted-foreground animate-pulse" />
                </div>
              ) : (
                <>
                  {/* All Categories Option */}
                  <div
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 mb-2 ${
                      value === 'all' ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => handleCategorySelect('all')}
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">All Categories</span>
                  </div>

                  {/* Category Tree */}
                  {categories.length > 0 ? (
                    categories.map(category => renderCategoryNode(category))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No categories found</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}