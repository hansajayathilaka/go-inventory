export { default as SearchableTreeSelect } from './SearchableTreeSelect';
export { default as TreeNode } from './TreeNode';
export { default as SearchInput } from './SearchInput';
export { default as TreeDropdown } from './TreeDropdown';

// Export all types
export type {
  CategoryWithMeta,
  SearchResult,
  TreeState,
  SearchConfig,
  IconConfig,
  VirtualScrollConfig,
  SearchableTreeSelectProps,
  TreeNodeProps,
  SearchInputProps,
  TreeDropdownProps,
  KeyboardNavContext,
  UseTreeStateReturn,
  UseSearchReturn,
  UseKeyboardNavReturn,
  TreeBuildOptions
} from './types';

// Export default configurations
export {
  DEFAULT_SEARCH_CONFIG,
  DEFAULT_ICON_CONFIG,
  DEFAULT_VIRTUAL_SCROLL_CONFIG
} from './types';

// Export utility functions
export {
  buildCategoryTree,
  findCategoryInTree,
  getCategoryPath,
  flattenTree,
  expandToCategory,
  updateNodeInTree,
  toggleNodeExpanded,
  getVisibleNodes,
  getTreeStats,
  filterTreeBySearch,
  validateTreeStructure,
  createTreeNode,
  mergeProductCounts
} from './utils/treeUtils';

export {
  searchCategories,
  highlightMatches,
  filterSearchResults,
  groupSearchResultsByType,
  getSearchSuggestions,
  debounce
} from './utils/searchUtils';

// Icon utilities removed for cleaner interface