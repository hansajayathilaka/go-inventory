import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  loading?: boolean;
  showClear?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  showClear = true,
  disabled = false,
  className,
  inputClassName,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, debounceMs),
    [onChange, debounceMs]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'pl-9',
            showClear && localValue && 'pr-9',
            inputClassName
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {showClear && localValue && !loading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Advanced search input with suggestions
export interface SearchSuggestion {
  id: string | number;
  label: string;
  value?: string;
  description?: string;
  category?: string;
}

export interface AdvancedSearchInputProps extends Omit<SearchInputProps, 'onChange'> {
  suggestions?: SearchSuggestion[];
  onSelect?: (suggestion: SearchSuggestion) => void;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  groupByCategory?: boolean;
}

export function AdvancedSearchInput({
  suggestions = [],
  onSelect,
  onChange,
  onSearch,
  showSuggestions = true,
  maxSuggestions = 10,
  groupByCategory = false,
  ...searchProps
}: AdvancedSearchInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const filteredSuggestions = suggestions
    .filter((suggestion) =>
      suggestion.label
        .toLowerCase()
        .includes(searchProps.value?.toLowerCase() || '')
    )
    .slice(0, maxSuggestions);

  const groupedSuggestions = groupByCategory
    ? filteredSuggestions.reduce((acc, suggestion) => {
        const category = suggestion.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(suggestion);
        return acc;
      }, {} as Record<string, SearchSuggestion[]>)
    : { All: filteredSuggestions };

  const handleInputChange = (value: string) => {
    onChange?.(value);
    setShowDropdown(value.length > 0 && showSuggestions);
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onSelect?.(suggestion);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredSuggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        onSearch(searchProps.value || '');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionSelect(filteredSuggestions[highlightedIndex]);
        } else if (onSearch) {
          onSearch(searchProps.value || '');
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div onKeyDown={handleKeyDown}>
        <SearchInput
          {...searchProps}
          onChange={handleInputChange}
        />
      </div>

      {showDropdown && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              {groupByCategory && Object.keys(groupedSuggestions).length > 1 && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted">
                  {category}
                </div>
              )}
              {items.map((suggestion) => {
                const globalIndex = filteredSuggestions.findIndex(
                  (s) => s.id === suggestion.id
                );
                return (
                  <button
                    key={suggestion.id}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                      highlightedIndex === globalIndex && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(globalIndex)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{suggestion.label}</span>
                      {suggestion.description && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {suggestion.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default SearchInput;