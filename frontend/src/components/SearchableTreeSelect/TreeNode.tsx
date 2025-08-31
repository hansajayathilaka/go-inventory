import React, { useCallback } from 'react';
import type { TreeNodeProps } from './types';
import { getCategoryIcon } from './utils/iconUtils';

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  isSelected,
  isExpanded,
  showProductCounts,
  showIcons,
  showConnectionLines,
  iconConfig,
  levelIndentSize,
  onSelect,
  onToggleExpand,
  onLoadChildren,
  style
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpandable = hasChildren || (!category.isLoaded && onLoadChildren);
  
  // Handle node selection
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(category.id);
  }, [category.id, onSelect]);
  
  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpandable) {
      onToggleExpand(category.id);
      
      // Load children if needed
      if (!category.isLoaded && onLoadChildren) {
        onLoadChildren(category.id);
      }
    }
  }, [category.id, category.isLoaded, isExpandable, onToggleExpand, onLoadChildren]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(category.id);
        break;
      case 'ArrowRight':
        if (isExpandable && !isExpanded) {
          e.preventDefault();
          onToggleExpand(category.id);
        }
        break;
      case 'ArrowLeft':
        if (isExpanded) {
          e.preventDefault();
          onToggleExpand(category.id);
        }
        break;
    }
  }, [category.id, isExpandable, isExpanded, onSelect, onToggleExpand]);
  
  // Get appropriate icon
  const nodeIcon = React.useMemo(() => {
    return getCategoryIcon(category, iconConfig);
  }, [category, iconConfig]);
  
  // Calculate indentation
  const indentStyle = {
    paddingLeft: `${level * levelIndentSize + 12}px`
  };
  
  return (
    <div
      style={style}
      role="treeitem"
      aria-expanded={isExpandable ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-level={level + 1}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`
        relative flex items-center py-2 px-3 cursor-pointer select-none
        hover:bg-gray-50 focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}
        ${showConnectionLines ? 'border-l border-gray-200' : ''}
      `}
      onClick={handleSelect}
    >
      {/* Connection Lines */}
      {showConnectionLines && level > 0 && (
        <>
          {/* Vertical line */}
          <div
            className="absolute border-l border-gray-200"
            style={{
              left: `${(level - 1) * levelIndentSize + 12}px`,
              top: 0,
              bottom: 0,
              width: '1px'
            }}
          />
          {/* Horizontal line */}
          <div
            className="absolute border-t border-gray-200"
            style={{
              left: `${(level - 1) * levelIndentSize + 12}px`,
              top: '50%',
              width: `${levelIndentSize - 4}px`,
              height: '1px'
            }}
          />
        </>
      )}
      
      {/* Content Container */}
      <div className="flex items-center w-full" style={indentStyle}>
        {/* Expand/Collapse Button */}
        {isExpandable ? (
          <button
            type="button"
            onClick={handleToggleExpand}
            className={`
              flex items-center justify-center w-4 h-4 mr-2 
              text-gray-400 hover:text-gray-600 focus:outline-none
              ${isExpanded ? 'transform rotate-90' : ''}
              transition-transform duration-150
            `}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <i className={`${iconConfig.expandIcon} text-xs`}></i>
          </button>
        ) : (
          <div className="w-4 h-4 mr-2" /> // Spacer for alignment
        )}
        
        {/* Icon */}
        {showIcons && (
          <div className="flex items-center justify-center w-4 h-4 mr-2">
            <i className={`${nodeIcon} text-sm ${
              isSelected ? 'text-blue-600' : 'text-gray-500'
            }`}></i>
          </div>
        )}
        
        {/* Category Name with Search Highlighting */}
        <span className={`
          flex-1 text-sm font-medium truncate
          ${isSelected ? 'text-blue-900' : 'text-gray-900'}
        `}>
          {category.matchesSearch && category.highlightedText ? (
            <span dangerouslySetInnerHTML={{ __html: category.highlightedText }} />
          ) : (
            category.name
          )}
        </span>
        
        {/* Product Count Badge */}
        {showProductCounts && typeof category.product_count === 'number' && (
          <span className={`
            ml-2 px-2 py-1 text-xs font-medium rounded-full
            ${isSelected 
              ? 'bg-blue-200 text-blue-800' 
              : 'bg-gray-100 text-gray-600'
            }
          `}>
            {category.product_count}
          </span>
        )}
        
        {/* Loading Indicator */}
        {!category.isLoaded && onLoadChildren && (
          <div className="ml-2">
            <i className={`${iconConfig.loadingIcon} text-gray-400 text-xs`}></i>
          </div>
        )}
        
        {/* Child Indicator */}
        {hasChildren && !isExpandable && (
          <div className="ml-2 text-gray-400">
            <i className="fas fa-folder text-xs"></i>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeNode;