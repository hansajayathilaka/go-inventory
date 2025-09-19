import { useState } from 'react';
import { ProductSearch } from './ProductSearch';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/services/productService';

interface ProductSelectionProps {
  activeSessionId: string | null;
  onProductSelect?: (product: Product) => void;
}

export function ProductSelection({ activeSessionId, onProductSelect }: ProductSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const handleSearchChange = (query: string, categoryId: string) => {
    setSearchQuery(query);
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Header */}
      <div className="p-4 border-b bg-card">
        <ProductSearch onSearchChange={handleSearchChange} />
      </div>

      {/* Product Table */}
      <div className="flex-1 p-4 overflow-auto">
        <ProductGrid
          activeSessionId={activeSessionId}
          searchQuery={searchQuery}
          selectedCategoryId={selectedCategoryId}
          onProductSelect={onProductSelect}
        />
      </div>
    </div>
  );
}