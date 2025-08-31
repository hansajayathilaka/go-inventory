import React, { useState, useCallback, useEffect } from 'react';
import type { SearchInputProps } from './types';

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  debounceMs,
  loading,
  disabled,
  onClear,
  searchIcon,
  clearIcon,
  ariaLabel,
  ariaDescribedBy
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
    
    setDebounceTimeout(timeout);
  }, [onChange, debounceMs, debounceTimeout]);
  
  // Handle clear action
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear();
    
    // Clear any pending debounce
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
      setDebounceTimeout(null);
    }
  }, [onChange, onClear, debounceTimeout]);
  
  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Escape':
        handleClear();
        break;
      case 'Enter':
        // Immediate search on Enter (bypass debounce)
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
          setDebounceTimeout(null);
        }
        onChange(localValue);
        break;
    }
  }, [handleClear, debounceTimeout, onChange, localValue]);
  
  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);
  
  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-400 text-sm">{searchIcon || '🔍'}</span>
      </div>
      
      {/* Search Input */}
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={`
          w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md
          placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
        `}
        autoComplete="off"
        spellCheck="false"
      />
      
      {/* Right Side Icons */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {/* Loading Spinner */}
        {loading && (
          <div className="mr-2">
            <span className="text-gray-400 text-sm animate-spin inline-block">⧗</span>
          </div>
        )}
        
        {/* Clear Button */}
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={`
              p-1 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
            aria-label="Clear search"
          >
            <span className="text-gray-400 text-xs">{clearIcon || '✕'}</span>
          </button>
        )}
      </div>
      
      {/* Search Hint */}
      {!localValue && !loading && (
        <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
          <span className="text-xs text-gray-400">ESC to clear</span>
        </div>
      )}
    </div>
  );
};

export default SearchInput;