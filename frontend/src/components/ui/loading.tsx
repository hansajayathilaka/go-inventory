import React from 'react';
import { Loader2, Package, Search, Table as TableIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
      aria-hidden="true"
    />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title = 'Loading...',
  description = 'Please wait while we fetch your data.',
  className 
}) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" className="text-primary mb-4" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ 
  rows = 5,
  columns = 4,
  className 
}) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-0">
        <div className="space-y-4 p-6">
          {/* Table header skeleton */}
          <div className="flex items-center space-x-4">
            <TableIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          {/* Table rows skeleton */}
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex items-center space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1">
                    <Skeleton 
                      className={cn(
                        'h-4',
                        colIndex === 0 ? 'w-24' : colIndex === columns - 1 ? 'w-16' : 'w-full'
                      )} 
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface LoadingGridProps {
  items?: number;
  className?: string;
}

export const LoadingGrid: React.FC<LoadingGridProps> = ({ 
  items = 8,
  className 
}) => {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface LoadingFormProps {
  fields?: number;
  className?: string;
}

export const LoadingForm: React.FC<LoadingFormProps> = ({ 
  fields = 6,
  className 
}) => {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <Skeleton className="h-5 w-32 mx-auto" />
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: fields }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface LoadingSearchProps {
  className?: string;
}

export const LoadingSearch: React.FC<LoadingSearchProps> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
          <Skeleton className="h-10 w-full pl-9" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
        <Skeleton className="h-4 w-48 mx-auto mb-2" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>
    </div>
  );
};

// Enhanced loading states with proper ARIA labels
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Card: LoadingCard,
  Table: LoadingTable,
  Grid: LoadingGrid,
  Form: LoadingForm,
  Search: LoadingSearch,
};

export default LoadingStates;