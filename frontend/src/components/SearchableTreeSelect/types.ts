import type { Category } from '../../types/api';

// Extended category with metadata for tree operations
export interface CategoryWithMeta extends Category {
  product_count?: number;
  children?: CategoryWithMeta[];
  isLoaded?: boolean;
  isExpanded?: boolean;
  matchesSearch?: boolean;
  highlightedText?: string;
}

// Search result with context and scoring
export interface SearchResult {
  category: CategoryWithMeta;
  path: CategoryWithMeta[];
  score: number;
  matchType: 'name' | 'description' | 'path';
  highlightedName?: string;
}

// Tree state management
export interface TreeState {
  expandedNodes: Set<string>;
  loadedNodes: Set<string>;
  searchResults: SearchResult[];
  searchTerm: string;
  isSearching: boolean;
  selectedValue?: string | null;
}

// Search configuration
export interface SearchConfig {
  fuzzyThreshold: number; // 0.6 default
  maxResults: number; // 50 default
  minSearchLength: number; // 2 default
  searchFields: ('name' | 'description' | 'path')[];
  debounceMs: number; // 300ms default
}

// Icon configuration
export interface IconConfig {
  defaultIcon: string;
  levelIcons: Record<number, string>; // Icons by hierarchy level
  categoryIcons: Record<string, string>; // Icons by category name/id
  expandIcon: string;
  collapseIcon: string;
  searchIcon: string;
  clearIcon: string;
  loadingIcon: string;
}

// Virtual scrolling configuration
export interface VirtualScrollConfig {
  itemHeight: number; // 40px default
  containerHeight: number; // 300px default
  overscan: number; // 5 items default
  enabled: boolean; // Auto-enable for >100 items
}

// Main component props
export interface SearchableTreeSelectProps {
  // Data
  categories: Category[];
  selectedValue?: string | null;
  
  // Callbacks
  onChange: (categoryId: string | null) => void;
  onLoadMore?: (parentId?: string) => void;
  
  // Configuration
  placeholder?: string;
  showProductCounts?: boolean;
  showIcons?: boolean;
  allowClear?: boolean;
  multiple?: boolean;
  maxHeight?: number;
  
  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  searchConfig?: Partial<SearchConfig>;
  
  // Visual
  iconMapping?: Partial<IconConfig>;
  levelIndentSize?: number;
  expandedByDefault?: boolean;
  showConnectionLines?: boolean;
  
  // State
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  
  // Styling
  className?: string;
  dropdownClassName?: string;
  
  // Virtual scrolling
  virtualScrollConfig?: Partial<VirtualScrollConfig>;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Tree node props
export interface TreeNodeProps {
  category: CategoryWithMeta;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  showProductCounts: boolean;
  showIcons: boolean;
  showConnectionLines: boolean;
  iconConfig: IconConfig;
  levelIndentSize: number;
  
  onSelect: (categoryId: string) => void;
  onToggleExpand: (categoryId: string) => void;
  onLoadChildren?: (categoryId: string) => void;
  
  // Virtual scrolling props
  style?: React.CSSProperties;
  index?: number;
}

// Search input props
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  debounceMs: number;
  loading: boolean;
  disabled: boolean;
  onClear: () => void;
  searchIcon: string;
  clearIcon: string;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Tree dropdown props
export interface TreeDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement>;
  maxHeight: number;
  className?: string;
  
  // Positioning
  placement?: 'bottom' | 'top' | 'auto';
  offset?: number;
}

// Keyboard navigation context
export interface KeyboardNavContext {
  focusedIndex: number;
  visibleItems: CategoryWithMeta[];
  onNavigate: (direction: 'up' | 'down' | 'first' | 'last') => void;
  onSelect: (index: number) => void;
  onToggleExpand: (index: number) => void;
  onEscape: () => void;
}

// Hook return types
export interface UseTreeStateReturn {
  treeState: TreeState;
  treeData: CategoryWithMeta[];
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  toggleNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  reset: () => void;
}

export interface UseSearchReturn {
  searchResults: SearchResult[];
  isSearching: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  highlightMatch: (text: string, searchTerm: string) => string;
}

export interface UseKeyboardNavReturn {
  focusedIndex: number;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  setFocusedIndex: (index: number) => void;
  resetFocus: () => void;
}

// Default configurations
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  fuzzyThreshold: 0.6,
  maxResults: 50,
  minSearchLength: 2,
  searchFields: ['name', 'description', 'path'],
  debounceMs: 300
};

export const DEFAULT_ICON_CONFIG: IconConfig = {
  defaultIcon: 'fas fa-folder',
  levelIcons: {
    0: 'fas fa-folder',
    1: 'fas fa-folder-open', 
    2: 'fas fa-file'
  },
  categoryIcons: {
    // Automotive-specific icons
    'engine': 'fas fa-cog',
    'transmission': 'fas fa-tools',
    'brakes': 'fas fa-circle',
    'suspension': 'fas fa-car-side',
    'electrical': 'fas fa-bolt',
    'body': 'fas fa-car',
    'interior': 'fas fa-couch',
    'tools': 'fas fa-wrench',
    'filters': 'fas fa-filter',
    'fluids': 'fas fa-tint',
    'belts': 'fas fa-circle',
    'hoses': 'fas fa-grip-lines'
  },
  expandIcon: 'fas fa-chevron-right',
  collapseIcon: 'fas fa-chevron-down',
  searchIcon: 'fas fa-search',
  clearIcon: 'fas fa-times',
  loadingIcon: 'fas fa-spinner fa-spin'
};

export const DEFAULT_VIRTUAL_SCROLL_CONFIG: VirtualScrollConfig = {
  itemHeight: 40,
  containerHeight: 300,
  overscan: 5,
  enabled: false // Will be auto-enabled for large datasets
};

// Utility type for tree building
export interface TreeBuildOptions {
  preserveExpandedState?: boolean;
  defaultExpanded?: boolean;
  maxDepth?: number;
}