import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { CategoryWithMeta, SearchableTreeSelectProps, TreeState } from './types';
import { DEFAULT_SEARCH_CONFIG, DEFAULT_ICON_CONFIG } from './types';
import { buildCategoryTree, findCategoryInTree, getCategoryPath } from './utils/treeUtils';
import { searchCategories, highlightMatches } from './utils/searchUtils';
import TreeNode from './TreeNode';
import SearchInput from './SearchInput';
import TreeDropdown from './TreeDropdown';

const SearchableTreeSelect: React.FC<SearchableTreeSelectProps> = ({
  categories,
  selectedValue,
  onChange,
  onLoadMore,
  
  // Configuration
  placeholder = 'Select a category',
  showProductCounts = false,
  allowClear = true,
  multiple = false,
  maxHeight = 300,
  
  // Search
  searchable = true,
  searchPlaceholder = 'Search categories...',
  searchConfig = {},
  
  // Visual
  levelIndentSize = 20,
  expandedByDefault = false,
  showConnectionLines = false,
  
  // State
  loading = false,
  disabled = false,
  error,
  
  // Styling
  className = '',
  dropdownClassName = '',
  
  // Accessibility
  ariaLabel,
  ariaDescribedBy
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [treeState, setTreeState] = useState<TreeState>({
    expandedNodes: new Set<string>(),
    loadedNodes: new Set<string>(),
    searchResults: [],
    searchTerm: '',
    isSearching: false,
    selectedValue
  });
  
  // Merge configurations with defaults
  const finalSearchConfig = { ...DEFAULT_SEARCH_CONFIG, ...searchConfig };
  const finalIconConfig = DEFAULT_ICON_CONFIG;
  
  // Build tree data from flat categories
  const treeData = React.useMemo(() => {
    const tree = buildCategoryTree(categories, {
      preserveExpandedState: true,
      defaultExpanded: expandedByDefault,
      maxDepth: 10
    });
    
    // Apply expanded state
    const applyExpandedState = (nodes: CategoryWithMeta[]): CategoryWithMeta[] => {
      return nodes.map(node => ({
        ...node,
        isExpanded: treeState.expandedNodes.has(node.id) || (expandedByDefault && node.children && node.children.length > 0),
        children: node.children ? applyExpandedState(node.children) : undefined
      }));
    };
    
    return applyExpandedState(tree);
  }, [categories, treeState.expandedNodes, expandedByDefault]);
  
  // Get filtered/searched data
  const visibleData = React.useMemo(() => {
    if (!treeState.isSearching || !treeState.searchTerm) {
      return treeData;
    }
    
    // Use search results to show only matching categories and their paths
    const searchResults = searchCategories(categories, treeState.searchTerm, finalSearchConfig);
    const relevantCategoryIds = new Set<string>();
    
    // Add all search result categories and their paths
    searchResults.forEach(result => {
      relevantCategoryIds.add(result.category.id);
      result.path.forEach(pathCategory => {
        relevantCategoryIds.add(pathCategory.id);
      });
    });
    
    // Filter tree to show only relevant categories
    const filterTree = (nodes: CategoryWithMeta[]): CategoryWithMeta[] => {
      return nodes.filter(node => {
        if (relevantCategoryIds.has(node.id)) {
          return {
            ...node,
            matchesSearch: true,
            highlightedText: highlightMatches(node.name, treeState.searchTerm),
            children: node.children ? filterTree(node.children) : undefined,
            isExpanded: true // Auto-expand search results
          };
        }
        return false;
      }).map(node => ({
        ...node,
        matchesSearch: relevantCategoryIds.has(node.id),
        highlightedText: highlightMatches(node.name, treeState.searchTerm),
        children: node.children ? filterTree(node.children) : undefined,
        isExpanded: true
      }));
    };
    
    return filterTree(treeData);
  }, [treeData, treeState.isSearching, treeState.searchTerm, categories, finalSearchConfig]);
  
  // Get selected category display text
  const selectedCategory = React.useMemo(() => {
    if (!selectedValue) return null;
    return findCategoryInTree(treeData, selectedValue);
  }, [selectedValue, treeData]);
  
  const selectedDisplayText = React.useMemo(() => {
    if (!selectedCategory) return '';
    const path = getCategoryPath(categories, selectedCategory.id);
    return path ? path.map(cat => cat.name).join(' > ') : selectedCategory.name;
  }, [selectedCategory, categories]);
  
  // Handle node selection
  const handleNodeSelect = useCallback((categoryId: string) => {
    const newValue = categoryId === selectedValue ? (allowClear ? null : selectedValue) : categoryId;
    setTreeState(prev => ({ ...prev, selectedValue: newValue }));
    onChange(newValue);
    
    if (!multiple) {
      setIsOpen(false);
    }
  }, [selectedValue, allowClear, multiple, onChange]);
  
  // Handle node expand/collapse
  const handleNodeToggle = useCallback((categoryId: string) => {
    setTreeState(prev => {
      const newExpanded = new Set(prev.expandedNodes);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
        // Load children if needed
        if (onLoadMore && !prev.loadedNodes.has(categoryId)) {
          onLoadMore(categoryId);
        }
      }
      
      return {
        ...prev,
        expandedNodes: newExpanded
      };
    });
  }, [onLoadMore]);
  
  // Handle search
  const handleSearchChange = useCallback((searchTerm: string) => {
    setTreeState(prev => ({
      ...prev,
      searchTerm,
      isSearching: searchTerm.length >= finalSearchConfig.minSearchLength,
      searchResults: searchTerm.length >= finalSearchConfig.minSearchLength 
        ? searchCategories(categories, searchTerm, finalSearchConfig)
        : []
    }));
  }, [categories, finalSearchConfig]);
  
  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setTreeState(prev => ({
      ...prev,
      searchTerm: '',
      isSearching: false,
      searchResults: []
    }));
  }, []);
  
  // Handle clear selection
  const handleClear = useCallback(() => {
    if (allowClear) {
      onChange(null);
      setTreeState(prev => ({ ...prev, selectedValue: null }));
    }
  }, [allowClear, onChange]);
  
  // Handle dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [isOpen, disabled]);
  
  // Handle dropdown close
  const handleDropdownClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Update selected value when prop changes
  useEffect(() => {
    setTreeState(prev => ({ ...prev, selectedValue }));
  }, [selectedValue]);
  
  // Render tree nodes recursively
  const renderTreeNodes = (nodes: CategoryWithMeta[], level: number = 0): React.ReactNode[] => {
    return nodes.map((category) => (
      <React.Fragment key={category.id}>
        <TreeNode
          category={category}
          level={level}
          isSelected={category.id === treeState.selectedValue}
          isExpanded={category.isExpanded || false}
          showProductCounts={showProductCounts}
          showConnectionLines={showConnectionLines}
          iconConfig={finalIconConfig}
          levelIndentSize={levelIndentSize}
          onSelect={handleNodeSelect}
          onToggleExpand={handleNodeToggle}
          onLoadChildren={onLoadMore}
        />
        {category.isExpanded && category.children && category.children.length > 0 && (
          <>{renderTreeNodes(category.children, level + 1)}</>
        )}
      </React.Fragment>
    ));
  };
  
  const dropdownContent = (
    <div className="py-1">
      {searchable && (
        <div className="px-3 pb-2 border-b border-gray-200">
          <SearchInput
            value={treeState.searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            debounceMs={finalSearchConfig.debounceMs}
            loading={treeState.isSearching && loading}
            disabled={disabled}
            onClear={handleClearSearch}
            searchIcon={finalIconConfig.searchIcon}
            clearIcon={finalIconConfig.clearIcon}
            ariaLabel="Search categories"
          />
        </div>
      )}
      
      <div className="max-h-64 overflow-y-auto">
        {visibleData.length > 0 ? (
          <div role="tree" aria-label="Category tree">
            {renderTreeNodes(visibleData)}
          </div>
        ) : (
          <div className="px-3 py-2 text-gray-500 text-center">
            {treeState.isSearching ? 'No categories found' : 'No categories available'}
          </div>
        )}
      </div>
      
      {loading && (
        <div className="px-3 py-2 border-t border-gray-200 text-center">
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
  
  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleDropdownToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="tree"
        aria-label={ariaLabel || 'Select category'}
        aria-describedby={ariaDescribedBy}
        className={`
          w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={selectedDisplayText ? 'text-gray-900' : 'text-gray-500'}>
            {selectedDisplayText || placeholder}
          </span>
          
          <div className="flex items-center space-x-1">
            {allowClear && selectedValue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Clear selection"
              >
                <span className="text-gray-400 text-xs">{finalIconConfig.clearIcon}</span>
              </button>
            )}
            
            <span className={`
              text-gray-400 text-sm transition-transform duration-200
              ${isOpen ? 'transform rotate-180' : ''}
            `}>▼</span>
          </div>
        </div>
      </button>
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Dropdown */}
      <TreeDropdown
        isOpen={isOpen}
        onClose={handleDropdownClose}
        triggerRef={triggerRef as React.RefObject<HTMLElement>}
        maxHeight={maxHeight}
        className={dropdownClassName}
      >
        {dropdownContent}
      </TreeDropdown>
    </div>
  );
};

export default SearchableTreeSelect;