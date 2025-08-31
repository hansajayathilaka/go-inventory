# Hybrid Searchable Tree Component - Architecture Design

## Overview
A comprehensive React component for hierarchical category selection with advanced search capabilities, visual enhancements, and product count integration.

## Component Architecture

### Core Components

#### 1. SearchableTreeSelect (Main Component)
**Purpose**: Primary interface component that manages state and orchestrates sub-components
**Props Interface**:
```typescript
interface SearchableTreeSelectProps {
  // Data
  categories: Category[];
  selectedValue?: string;
  
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
  searchDebounceMs?: number;
  
  // Visual
  iconMapping?: Record<string, string>; // category name/id to icon class
  levelIndentSize?: number;
  expandedByDefault?: boolean;
  
  // State
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  
  // Styling
  className?: string;
  dropdownClassName?: string;
}
```

#### 2. TreeNode (Recursive Tree Item)
**Purpose**: Individual tree item with expand/collapse, selection, and icon display
**Props Interface**:
```typescript
interface TreeNodeProps {
  category: CategoryWithMeta;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  showProductCounts: boolean;
  showIcons: boolean;
  iconMapping: Record<string, string>;
  levelIndentSize: number;
  
  onSelect: (categoryId: string) => void;
  onToggleExpand: (categoryId: string) => void;
  onLoadChildren?: (categoryId: string) => void;
}
```

#### 3. SearchInput (Search Interface)
**Purpose**: Dedicated search input with debouncing and clear functionality
**Props Interface**:
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  debounceMs: number;
  loading: boolean;
  onClear: () => void;
}
```

#### 4. TreeDropdown (Dropdown Container)
**Purpose**: Handles dropdown positioning, keyboard navigation, and virtual scrolling
**Props Interface**:
```typescript
interface TreeDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement>;
  maxHeight: number;
  className?: string;
}
```

## Extended Type Definitions

### CategoryWithMeta
```typescript
interface CategoryWithMeta extends Category {
  product_count?: number;
  children?: CategoryWithMeta[];
  isLoaded?: boolean;
  isExpanded?: boolean;
  matchesSearch?: boolean;
  highlightedText?: string;
}
```

### SearchResult
```typescript
interface SearchResult {
  category: CategoryWithMeta;
  path: CategoryWithMeta[];
  score: number;
  matchType: 'name' | 'description' | 'path';
}
```

### TreeState
```typescript
interface TreeState {
  expandedNodes: Set<string>;
  loadedNodes: Set<string>;
  searchResults: SearchResult[];
  searchTerm: string;
  isSearching: boolean;
}
```

## Search Implementation

### Search Capabilities
1. **Fuzzy Name Search**: Match category names with typo tolerance
2. **Path Search**: Search within category paths (e.g., "Electronics > Computers")
3. **Description Search**: Match within category descriptions
4. **Real-time Highlighting**: Highlight matching text in results

### Search Algorithm
```typescript
interface SearchConfig {
  fuzzyThreshold: number; // 0.6 default
  maxResults: number; // 50 default
  minSearchLength: number; // 2 default
  searchFields: ('name' | 'description' | 'path')[];
}
```

### Search Features
- **Debounced Input**: 300ms default delay
- **Progressive Loading**: Load more results on scroll
- **Context Preservation**: Show parent path for search results
- **Keyboard Navigation**: Arrow keys, Enter, Escape support

## Visual Design

### Icons System
```typescript
interface IconConfig {
  defaultIcon: string;
  levelIcons: Record<number, string>; // Icons by hierarchy level
  categoryIcons: Record<string, string>; // Icons by category name/id
  expandIcon: string;
  collapseIcon: string;
  searchIcon: string;
  clearIcon: string;
}

// Default icon mapping for automotive categories
const DEFAULT_AUTOMOTIVE_ICONS = {
  'engine': 'fas fa-cog',
  'transmission': 'fas fa-tools',
  'brakes': 'fas fa-circle',
  'suspension': 'fas fa-car-side',
  'electrical': 'fas fa-bolt',
  'body': 'fas fa-car',
  'interior': 'fas fa-couch',
  'tools': 'fas fa-wrench'
};
```

### Visual Hierarchy
- **Level Indentation**: 20px default per level
- **Connection Lines**: Optional visual tree lines
- **Expand/Collapse Icons**: Consistent arrow/chevron icons
- **Selection Highlighting**: Clear selected state
- **Hover States**: Interactive feedback
- **Loading States**: Skeleton loaders for async operations

## Performance Optimizations

### Virtual Scrolling
```typescript
interface VirtualScrollConfig {
  itemHeight: number; // 40px default
  containerHeight: number; // 300px default
  overscan: number; // 5 items default
  enabled: boolean; // Auto-enable for >100 items
}
```

### Memoization Strategy
- **Tree Structure**: Memoize tree building from flat category list
- **Search Results**: Cache search results by term
- **Expanded State**: Optimize re-renders on expand/collapse
- **Selection State**: Prevent unnecessary child re-renders

### Lazy Loading
- **On-Demand Children**: Load child categories when parent expands
- **Progressive Search**: Load search results progressively
- **Image/Icon Loading**: Lazy load category icons

## Integration Points

### ProductModal Integration
```typescript
// Replace existing category select
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Category *
  </label>
  <SearchableTreeSelect
    categories={categories}
    selectedValue={formData.category_id}
    onChange={(categoryId) => handleInputChange('category_id', categoryId)}
    placeholder="Select a category"
    showProductCounts={true}
    showIcons={true}
    searchable={true}
    allowClear={false}
    iconMapping={AUTOMOTIVE_CATEGORY_ICONS}
  />
  {errors.category_id && (
    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
  )}
</div>
```

### ProductList Filter Integration
```typescript
// Replace existing category filter
<SearchableTreeSelect
  categories={categories}
  selectedValue={filters.category_id}
  onChange={(categoryId) => setFilters(prev => ({ ...prev, category_id: categoryId }))}
  placeholder="Filter by category"
  showProductCounts={true}
  showIcons={true}
  searchable={true}
  allowClear={true}
  multiple={false}
  className="w-64"
/>
```

### CategoryModal Parent Selection
```typescript
// Enhanced parent category selection
<SearchableTreeSelect
  categories={availableParents}
  selectedValue={formData.parent_id}
  onChange={(parentId) => handleInputChange('parent_id', parentId)}
  placeholder="Select parent category"
  showProductCounts={false}
  showIcons={true}
  searchable={true}
  allowClear={true}
  iconMapping={AUTOMOTIVE_CATEGORY_ICONS}
/>
```

## API Enhancement Requirements

### Product Count Integration
Extend Category API to include product counts:
```sql
-- Add product_count to category responses
SELECT 
  c.*,
  COALESCE(p.product_count, 0) as product_count
FROM categories c
LEFT JOIN (
  SELECT category_id, COUNT(*) as product_count 
  FROM products 
  WHERE deleted_at IS NULL 
  GROUP BY category_id
) p ON c.id = p.category_id
```

### Search API Enhancement
Add dedicated category search endpoint:
```
GET /api/v1/categories/search?q={term}&include_counts=true&max_results=50
```

## Accessibility Features

### Keyboard Navigation
- **Tab**: Focus search input → tree items
- **Arrow Keys**: Navigate tree items
- **Enter/Space**: Select category
- **Escape**: Close dropdown
- **Home/End**: First/last item

### Screen Reader Support
- **ARIA Labels**: Proper labeling for tree structure
- **Role Attributes**: tree, treeitem, group roles
- **State Announcements**: Selected, expanded states
- **Live Regions**: Search results announcements

### Color & Contrast
- **High Contrast**: Meets WCAG AA standards
- **Focus Indicators**: Clear keyboard focus
- **Color Independence**: Not relying solely on color for meaning

## Testing Strategy

### Unit Tests
- Tree building from flat category list
- Search algorithm accuracy
- State management (expand/collapse)
- Keyboard navigation handlers

### Integration Tests
- ProductModal category selection
- ProductList filtering
- CategoryModal parent selection
- API integration with product counts

### Performance Tests
- Large dataset rendering (1000+ categories)
- Search performance with large trees
- Virtual scrolling behavior
- Memory usage optimization

## File Structure
```
frontend/src/components/SearchableTreeSelect/
├── index.ts                    # Main export
├── SearchableTreeSelect.tsx    # Main component
├── TreeNode.tsx               # Individual tree item
├── SearchInput.tsx            # Search interface
├── TreeDropdown.tsx           # Dropdown container
├── VirtualizedTree.tsx        # Virtual scrolling wrapper
├── hooks/
│   ├── useTreeState.ts        # Tree state management
│   ├── useSearch.ts           # Search functionality
│   ├── useKeyboardNav.ts      # Keyboard navigation
│   └── useVirtualScroll.ts    # Virtual scrolling logic
├── utils/
│   ├── searchUtils.ts         # Search algorithms
│   ├── treeUtils.ts           # Tree manipulation
│   └── iconUtils.ts           # Icon mapping utilities
├── types.ts                   # Component-specific types
├── styles.css                 # Component styles
└── __tests__/                 # Test files
    ├── SearchableTreeSelect.test.tsx
    ├── searchUtils.test.ts
    └── treeUtils.test.ts
```

## Implementation Phases

### Phase 1: Core Architecture
- Basic TreeSelect component with search
- TreeNode recursive rendering
- Search functionality with highlighting
- Basic keyboard navigation

### Phase 2: Visual Enhancements
- Icon system integration
- Visual hierarchy improvements
- Loading states and animations
- Responsive design

### Phase 3: Performance & Advanced Features
- Virtual scrolling implementation
- Advanced search capabilities
- Product count integration
- Accessibility enhancements

### Phase 4: Integration & Testing
- Replace existing category selectors
- API enhancements for product counts
- Comprehensive testing suite
- Performance optimization

This architecture provides a scalable, accessible, and feature-rich solution for hierarchical category selection that will significantly improve the user experience across the vehicle spare parts management system.