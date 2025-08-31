import type { CategoryWithMeta, SearchResult, SearchConfig } from '../types';

/**
 * Simple fuzzy string matching
 */
function fuzzyMatch(searchTerm: string, text: string, threshold: number = 0.6): {
  isMatch: boolean;
  score: number;
} {
  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === searchLower) {
    return { isMatch: true, score: 1.0 };
  }

  // Contains match gets good score
  if (textLower.includes(searchLower)) {
    const ratio = searchLower.length / textLower.length;
    return { isMatch: true, score: 0.8 * ratio + 0.2 };
  }

  // Character-by-character fuzzy matching
  let matchCount = 0;
  let searchIndex = 0;
  
  for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
    if (textLower[i] === searchLower[searchIndex]) {
      matchCount++;
      searchIndex++;
    }
  }

  const score = matchCount / Math.max(searchLower.length, textLower.length);
  return {
    isMatch: score >= threshold,
    score: score * 0.6 // Lower score for fuzzy matches
  };
}

/**
 * Search categories by name
 */
function searchByName(
  categories: CategoryWithMeta[],
  searchTerm: string,
  threshold: number
): SearchResult[] {
  const results: SearchResult[] = [];

  categories.forEach(category => {
    const match = fuzzyMatch(searchTerm, category.name, threshold);
    if (match.isMatch) {
      results.push({
        category,
        path: [category], // Will be populated later with full path
        score: match.score,
        matchType: 'name',
        highlightedName: highlightMatches(category.name, searchTerm)
      });
    }
  });

  return results;
}

/**
 * Search categories by description
 */
function searchByDescription(
  categories: CategoryWithMeta[],
  searchTerm: string,
  threshold: number
): SearchResult[] {
  const results: SearchResult[] = [];

  categories.forEach(category => {
    if (!category.description) return;
    
    const match = fuzzyMatch(searchTerm, category.description, threshold);
    if (match.isMatch) {
      results.push({
        category,
        path: [category],
        score: match.score * 0.8, // Slightly lower score for description matches
        matchType: 'description'
      });
    }
  });

  return results;
}

/**
 * Search categories by path
 */
function searchByPath(
  categories: CategoryWithMeta[],
  searchTerm: string,
  threshold: number
): SearchResult[] {
  const results: SearchResult[] = [];

  categories.forEach(category => {
    const match = fuzzyMatch(searchTerm, category.path, threshold);
    if (match.isMatch) {
      results.push({
        category,
        path: [category],
        score: match.score * 0.9, // Good score for path matches
        matchType: 'path'
      });
    }
  });

  return results;
}

/**
 * Highlight matching text in a string
 */
export function highlightMatches(text: string, searchTerm: string): string {
  if (!searchTerm || !text) return text;

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Find the best match position
  let bestMatch = { start: -1, end: -1, score: 0 };
  
  // Try exact match first
  const exactIndex = textLower.indexOf(searchLower);
  if (exactIndex !== -1) {
    bestMatch = {
      start: exactIndex,
      end: exactIndex + searchLower.length,
      score: 1.0
    };
  } else {
    // Try partial matches
    for (let i = 0; i <= textLower.length - searchLower.length; i++) {
      const slice = textLower.slice(i, i + searchLower.length);
      const match = fuzzyMatch(searchTerm, slice);
      if (match.isMatch && match.score > bestMatch.score) {
        bestMatch = {
          start: i,
          end: i + searchLower.length,
          score: match.score
        };
      }
    }
  }

  if (bestMatch.start === -1) return text;

  // Apply highlighting
  return (
    text.slice(0, bestMatch.start) +
    '<mark class="bg-yellow-200 px-1 rounded">' +
    text.slice(bestMatch.start, bestMatch.end) +
    '</mark>' +
    text.slice(bestMatch.end)
  );
}

/**
 * Build full category paths for search results
 */
function buildSearchResultPaths(
  results: SearchResult[],
  allCategories: CategoryWithMeta[]
): SearchResult[] {
  // Create a map for quick parent lookup
  const categoryMap = new Map<string, CategoryWithMeta>();
  allCategories.forEach(cat => categoryMap.set(cat.id, cat));

  return results.map(result => {
    const path: CategoryWithMeta[] = [];
    let current: CategoryWithMeta | undefined = result.category;

    // Build path from child to root
    while (current) {
      path.unshift(current);
      current = current.parent_id ? categoryMap.get(current.parent_id) : undefined;
    }

    return {
      ...result,
      path
    };
  });
}

/**
 * Main search function
 */
export function searchCategories(
  categories: CategoryWithMeta[],
  searchTerm: string,
  config: SearchConfig
): SearchResult[] {
  if (!searchTerm || searchTerm.length < config.minSearchLength) {
    return [];
  }

  const allResults: SearchResult[] = [];
  const { searchFields, fuzzyThreshold, maxResults } = config;

  // Flatten the tree to search all categories
  const flatCategories = flattenCategoriesForSearch(categories);

  // Search by different fields based on configuration
  if (searchFields.includes('name')) {
    allResults.push(...searchByName(flatCategories, searchTerm, fuzzyThreshold));
  }

  if (searchFields.includes('description')) {
    allResults.push(...searchByDescription(flatCategories, searchTerm, fuzzyThreshold));
  }

  if (searchFields.includes('path')) {
    allResults.push(...searchByPath(flatCategories, searchTerm, fuzzyThreshold));
  }

  // Remove duplicates (category might match in multiple fields)
  const uniqueResults = new Map<string, SearchResult>();
  allResults.forEach(result => {
    const existing = uniqueResults.get(result.category.id);
    if (!existing || result.score > existing.score) {
      uniqueResults.set(result.category.id, result);
    }
  });

  // Convert back to array and sort by score
  let results = Array.from(uniqueResults.values())
    .sort((a, b) => b.score - a.score);

  // Limit results
  if (results.length > maxResults) {
    results = results.slice(0, maxResults);
  }

  // Build full paths for results
  return buildSearchResultPaths(results, flatCategories);
}

/**
 * Flatten tree structure for searching
 */
function flattenCategoriesForSearch(tree: CategoryWithMeta[]): CategoryWithMeta[] {
  const result: CategoryWithMeta[] = [];

  const flatten = (nodes: CategoryWithMeta[]) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        flatten(node.children);
      }
    });
  };

  flatten(tree);
  return result;
}

/**
 * Filter search results based on additional criteria
 */
export function filterSearchResults(
  results: SearchResult[],
  filters: {
    minLevel?: number;
    maxLevel?: number;
    hasProductCount?: boolean;
    parentId?: string;
  }
): SearchResult[] {
  return results.filter(result => {
    const { category } = result;

    // Level filters
    if (filters.minLevel !== undefined && category.level < filters.minLevel) {
      return false;
    }
    if (filters.maxLevel !== undefined && category.level > filters.maxLevel) {
      return false;
    }

    // Product count filter
    if (filters.hasProductCount && (!category.product_count || category.product_count === 0)) {
      return false;
    }

    // Parent filter
    if (filters.parentId && category.parent_id !== filters.parentId) {
      return false;
    }

    return true;
  });
}

/**
 * Group search results by match type
 */
export function groupSearchResultsByType(
  results: SearchResult[]
): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {
    name: [],
    description: [],
    path: []
  };

  results.forEach(result => {
    groups[result.matchType].push(result);
  });

  return groups;
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions(
  categories: CategoryWithMeta[],
  partialTerm: string,
  maxSuggestions: number = 5
): string[] {
  if (!partialTerm || partialTerm.length < 2) return [];

  const suggestions = new Set<string>();
  const flatCategories = flattenCategoriesForSearch(categories);
  
  flatCategories.forEach(category => {
    const name = category.name.toLowerCase();
    const partial = partialTerm.toLowerCase();
    
    if (name.startsWith(partial)) {
      suggestions.add(category.name);
    }
  });

  return Array.from(suggestions)
    .sort()
    .slice(0, maxSuggestions);
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}