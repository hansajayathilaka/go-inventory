import React, { memo, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Optimized Button component with memo
export const OptimizedButton = memo<React.ComponentProps<typeof Button>>(
  ({ children, onClick, ...props }) => {
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e);
      }
    }, [onClick]);

    return (
      <Button {...props} onClick={handleClick}>
        {children}
      </Button>
    );
  }
);

OptimizedButton.displayName = 'OptimizedButton';

// Optimized Card component with memo
interface OptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const OptimizedCard = memo<OptimizedCardProps>(
  ({ children, className, title, onClick }) => {
    const handleClick = useCallback(() => {
      if (onClick) {
        onClick();
      }
    }, [onClick]);

    const cardContent = useMemo(() => (
      <CardContent>
        {children}
      </CardContent>
    ), [children]);

    return (
      <Card 
        className={cn(onClick && 'cursor-pointer hover:bg-accent/50', className)}
        onClick={handleClick}
      >
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        {cardContent}
      </Card>
    );
  }
);

OptimizedCard.displayName = 'OptimizedCard';

// Memoized list item component
interface ListItemProps {
  id: string | number;
  children: React.ReactNode;
  onClick?: (id: string | number) => void;
  className?: string;
}

export const OptimizedListItem = memo<ListItemProps>(
  ({ id, children, onClick, className }) => {
    const handleClick = useCallback(() => {
      if (onClick) {
        onClick(id);
      }
    }, [id, onClick]);

    return (
      <div 
        className={cn(
          'p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={handleClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {children}
      </div>
    );
  }
);

OptimizedListItem.displayName = 'OptimizedListItem';

// Virtualized list component for large datasets
interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  className
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="listbox"
      aria-label="Virtualized list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div key={actualIndex} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Debounced search input
interface DebouncedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export const DebouncedSearch = memo<DebouncedSearchProps>(
  ({ value, onChange, placeholder = 'Search...', delay = 300, className }) => {
    const [localValue, setLocalValue] = React.useState(value);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, delay);
    }, [onChange, delay]);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        role="searchbox"
        aria-label={placeholder}
      />
    );
  }
);

DebouncedSearch.displayName = 'DebouncedSearch';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

// Memoized expensive calculation hook
export const useMemoizedCalculation = <T,>(
  calculation: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(calculation, dependencies);
};

export { memo, useMemo, useCallback };

export default {
  OptimizedButton,
  OptimizedCard,
  OptimizedListItem,
  VirtualizedList,
  DebouncedSearch,
  usePerformanceMonitor,
  useMemoizedCalculation,
};