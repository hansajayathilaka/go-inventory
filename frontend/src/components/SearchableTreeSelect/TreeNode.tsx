import React, { useCallback } from 'react';
import type { TreeNodeProps } from './types';

const TreeNode: React.FC<TreeNodeProps> = ({
  category,
  level,
  isSelected,
  isExpanded,
  showProductCounts,
  showConnectionLines,
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
        relative flex items-center cursor-pointer select-none transition-all duration-150
        ${
          level === 0 
            ? 'py-3 px-4 bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500' 
            : level === 1 
              ? 'py-2.5 px-3 hover:bg-green-50' 
              : 'py-2 px-3 hover:bg-gray-50'
        }
        hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        ${isSelected 
          ? level === 0 
            ? 'bg-blue-100 text-blue-900 shadow-md border-l-4 border-blue-600' 
            : level === 1
              ? 'bg-green-100 text-green-900 border-l-2 border-green-500'
              : 'bg-amber-100 text-amber-900 border-l-2 border-amber-500'
          : 'text-gray-900'
        }
        ${showConnectionLines && level > 0 ? 'border-l border-gray-200' : ''}
      `}
      onClick={handleSelect}
    >
      {/* Enhanced Connection Lines with Level Colors */}
      {showConnectionLines && level > 0 && (
        <>
          {/* Vertical line with level-based color */}
          <div
            className={`absolute border-l ${
              level === 1 
                ? 'border-green-300' 
                : level === 2 
                  ? 'border-amber-300' 
                  : 'border-gray-300'
            }`}
            style={{
              left: `${(level - 1) * levelIndentSize + 12}px`,
              top: 0,
              bottom: 0,
              width: '2px'  // Slightly thicker for better visibility
            }}
          />
          {/* Horizontal line with level-based color */}
          <div
            className={`absolute border-t ${
              level === 1 
                ? 'border-green-300' 
                : level === 2 
                  ? 'border-amber-300' 
                  : 'border-gray-300'
            }`}
            style={{
              left: `${(level - 1) * levelIndentSize + 12}px`,
              top: '50%',
              width: `${levelIndentSize - 4}px`,
              height: '2px'  // Slightly thicker for better visibility
            }}
          />
        </>
      )}
      
      {/* Content Container */}
      <div className="flex items-center w-full" style={indentStyle}>
        {/* Simple Expand/Collapse Button */}
        {isExpandable ? (
          <button
            type="button"
            onClick={handleToggleExpand}
            className={`
              flex items-center justify-center w-4 h-4 mr-3 rounded-sm
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
              text-gray-500 hover:text-gray-700 hover:bg-gray-100
              ${isExpanded ? 'transform rotate-90' : ''}
            `}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            ▶
          </button>
        ) : (
          <div className="w-4 h-4 mr-3" /> // Spacer for alignment
        )}
        
        
        {/* Category Name with Search Highlighting and Level Styling */}
        <span className={`
          flex-1 truncate transition-all duration-150
          ${
            level === 0 
              ? 'text-base font-bold' 
              : level === 1 
                ? 'text-sm font-semibold' 
                : 'text-sm font-medium'
          }
          ${isSelected ? 'text-blue-900' : 'text-gray-900'}
        `}>
          {category.matchesSearch && category.highlightedText ? (
            <span dangerouslySetInnerHTML={{ __html: category.highlightedText }} />
          ) : (
            category.name
          )}
        </span>
        
        {/* Product Count Badge with Level-based Colors */}
        {showProductCounts && typeof category.product_count === 'number' && (
          <span className={`
            ml-2 px-2 py-1 text-xs font-medium rounded-full transition-colors duration-150
            ${
              isSelected 
                ? 'bg-blue-200 text-blue-800' 
                : level === 0
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : level === 1
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }
          `}>
            {category.product_count}
          </span>
        )}
        
        {/* Loading Indicator */}
        {!category.isLoaded && onLoadChildren && (
          <div className="ml-2">
            <span className="text-gray-400 text-xs">Loading...</span>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default TreeNode;