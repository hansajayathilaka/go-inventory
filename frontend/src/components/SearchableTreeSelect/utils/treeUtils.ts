import type { Category } from '../../../types/api';
import type { CategoryWithMeta, TreeBuildOptions, SearchResult } from '../types';

/**
 * Build a hierarchical tree structure from flat category array
 */
export function buildCategoryTree(
  categories: Category[],
  options: TreeBuildOptions = {}
): CategoryWithMeta[] {
  const {
    preserveExpandedState = false,
    defaultExpanded = false,
    maxDepth = 5
  } = options;

  // Create a map for quick lookup
  const categoryMap = new Map<string, CategoryWithMeta>();
  const rootCategories: CategoryWithMeta[] = [];

  // First pass: create all nodes
  categories.forEach(category => {
    const node: CategoryWithMeta = {
      ...category,
      children: [],
      isLoaded: true,
      isExpanded: preserveExpandedState ? (category as any).isExpanded : defaultExpanded,
      matchesSearch: false
    };
    categoryMap.set(category.id, node);
  });

  // Second pass: build parent-child relationships
  categories.forEach(category => {
    const node = categoryMap.get(category.id)!;
    
    if (category.parent_id && categoryMap.has(category.parent_id)) {
      const parent = categoryMap.get(category.parent_id)!;
      if (parent.level < maxDepth) {
        parent.children!.push(node);
      }
    } else {
      // Root level category
      rootCategories.push(node);
    }
  });

  // Sort children by name at each level
  const sortChildren = (nodes: CategoryWithMeta[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(rootCategories);
  return rootCategories;
}

/**
 * Flatten tree structure to an array
 */
export function flattenTree(
  tree: CategoryWithMeta[],
  includeCollapsed: boolean = false
): CategoryWithMeta[] {
  const result: CategoryWithMeta[] = [];

  const traverse = (nodes: CategoryWithMeta[], level: number = 0) => {
    nodes.forEach(node => {
      result.push(node);
      
      if (node.children && node.children.length > 0) {
        if (includeCollapsed || node.isExpanded) {
          traverse(node.children, level + 1);
        }
      }
    });
  };

  traverse(tree);
  return result;
}

/**
 * Find a category by ID in the tree
 */
export function findCategoryInTree(
  tree: CategoryWithMeta[],
  categoryId: string
): CategoryWithMeta | null {
  for (const node of tree) {
    if (node.id === categoryId) {
      return node;
    }
    
    if (node.children && node.children.length > 0) {
      const found = findCategoryInTree(node.children, categoryId);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Get the path from root to a specific category
 */
export function getCategoryPath(
  tree: CategoryWithMeta[],
  categoryId: string,
  currentPath: CategoryWithMeta[] = []
): CategoryWithMeta[] | null {
  for (const node of tree) {
    const newPath = [...currentPath, node];
    
    if (node.id === categoryId) {
      return newPath;
    }
    
    if (node.children && node.children.length > 0) {
      const found = getCategoryPath(node.children, categoryId, newPath);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Expand all parent nodes leading to a specific category
 */
export function expandToCategory(
  tree: CategoryWithMeta[],
  categoryId: string
): CategoryWithMeta[] {
  const path = getCategoryPath(tree, categoryId);
  if (!path) return tree;

  // Expand all nodes in the path except the last one (the target category itself)
  path.slice(0, -1).forEach(node => {
    node.isExpanded = true;
  });

  return [...tree]; // Return new array reference
}

/**
 * Update a specific node in the tree
 */
export function updateNodeInTree(
  tree: CategoryWithMeta[],
  categoryId: string,
  updates: Partial<CategoryWithMeta>
): CategoryWithMeta[] {
  return tree.map(node => {
    if (node.id === categoryId) {
      return { ...node, ...updates };
    }
    
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children, categoryId, updates)
      };
    }
    
    return node;
  });
}

/**
 * Toggle expand state of a node
 */
export function toggleNodeExpanded(
  tree: CategoryWithMeta[],
  categoryId: string
): CategoryWithMeta[] {
  return updateNodeInTree(tree, categoryId, {
    isExpanded: !findCategoryInTree(tree, categoryId)?.isExpanded
  });
}

/**
 * Get all visible nodes (considering expanded state)
 */
export function getVisibleNodes(tree: CategoryWithMeta[]): CategoryWithMeta[] {
  return flattenTree(tree, false);
}

/**
 * Get node statistics
 */
export function getTreeStats(tree: CategoryWithMeta[]): {
  totalNodes: number;
  visibleNodes: number;
  maxDepth: number;
  expandedNodes: number;
} {
  let totalNodes = 0;
  let maxDepth = 0;
  let expandedNodes = 0;

  const traverse = (nodes: CategoryWithMeta[], depth: number = 0) => {
    nodes.forEach(node => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, depth);
      if (node.isExpanded) expandedNodes++;
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    });
  };

  traverse(tree);
  const visibleNodes = getVisibleNodes(tree).length;

  return { totalNodes, visibleNodes, maxDepth, expandedNodes };
}

/**
 * Filter tree by search results
 */
export function filterTreeBySearch(
  tree: CategoryWithMeta[],
  searchResults: SearchResult[]
): CategoryWithMeta[] {
  if (searchResults.length === 0) return tree;

  const resultIds = new Set(searchResults.map(r => r.category.id));
  const pathIds = new Set<string>();

  // Collect all IDs in the paths of search results
  searchResults.forEach(result => {
    result.path.forEach(category => {
      pathIds.add(category.id);
    });
  });

  const filterNodes = (nodes: CategoryWithMeta[]): CategoryWithMeta[] => {
    return nodes
      .map(node => {
        const isInResults = resultIds.has(node.id);
        const isInPath = pathIds.has(node.id);
        
        if (!isInResults && !isInPath && node.children) {
          // Check if any children match
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length === 0) {
            return null;
          }
          return {
            ...node,
            children: filteredChildren,
            isExpanded: true, // Always expand when searching
            matchesSearch: false
          };
        }
        
        if (isInResults || isInPath) {
          return {
            ...node,
            children: node.children ? filterNodes(node.children) : [],
            isExpanded: true, // Always expand when searching
            matchesSearch: isInResults
          };
        }
        
        return null;
      })
      .filter((node): node is CategoryWithMeta => node !== null);
  };

  return filterNodes(tree);
}

/**
 * Validate tree structure integrity
 */
export function validateTreeStructure(tree: CategoryWithMeta[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  const validate = (nodes: CategoryWithMeta[], parentId?: string, depth: number = 0) => {
    nodes.forEach(node => {
      // Check for duplicate IDs
      if (seenIds.has(node.id)) {
        errors.push(`Duplicate category ID found: ${node.id}`);
      } else {
        seenIds.add(node.id);
      }

      // Check parent-child relationship consistency
      if (parentId && node.parent_id !== parentId) {
        errors.push(`Category ${node.id} has incorrect parent_id. Expected: ${parentId}, Got: ${node.parent_id}`);
      }

      // Check level consistency
      if (node.level !== depth) {
        errors.push(`Category ${node.id} has incorrect level. Expected: ${depth}, Got: ${node.level}`);
      }

      // Recursively validate children
      if (node.children && node.children.length > 0) {
        validate(node.children, node.id, depth + 1);
      }
    });
  };

  validate(tree);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create an empty tree node template
 */
export function createTreeNode(
  category: Category,
  options: Partial<CategoryWithMeta> = {}
): CategoryWithMeta {
  return {
    ...category,
    children: [],
    isLoaded: true,
    isExpanded: false,
    matchesSearch: false,
    ...options
  };
}

/**
 * Merge product counts into tree nodes
 */
export function mergeProductCounts(
  tree: CategoryWithMeta[],
  productCounts: Record<string, number>
): CategoryWithMeta[] {
  return tree.map(node => ({
    ...node,
    product_count: productCounts[node.id] || 0,
    children: node.children ? mergeProductCounts(node.children, productCounts) : []
  }));
}