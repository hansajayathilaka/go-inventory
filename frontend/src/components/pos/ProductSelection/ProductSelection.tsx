import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductSearch } from './ProductSearch';
import { CategoryFilter } from './CategoryFilter';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/services/productService';
import type { Category } from '@/types/category';

interface ProductSelectionProps {
  activeSessionId: string | null;
  onProductSelect?: (product: Product) => void;
}

export function ProductSelection({ activeSessionId, onProductSelect }: ProductSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(true);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleCategoryChange = (category: Category | null) => {
    setSelectedCategory(category);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategoryId;

  return (
    <div className="h-full flex">
      {/* Category Sidebar */}
      {showCategoryFilter && (
        <div className="w-64 border-r bg-card flex-shrink-0">
          <CategoryFilter
            selectedCategoryId={selectedCategoryId}
            onCategorySelect={handleCategorySelect}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Main Product Area */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filter Header */}
        <div className="p-4 border-b bg-card">
          <div className="space-y-3">
            {/* Search Bar */}
            <ProductSearch
              activeSessionId={activeSessionId}
              onProductSelect={onProductSelect}
            />

            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                >
                  {showCategoryFilter ? 'Hide' : 'Show'} Categories
                </Button>

                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Active Filters */}
              <div className="flex items-center space-x-2">
                {selectedCategory && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {selectedCategory.name}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchQuery.trim()}"
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <ProductGrid
            activeSessionId={activeSessionId}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            onProductSelect={onProductSelect}
          />
        </div>
      </div>
    </div>
  );
}