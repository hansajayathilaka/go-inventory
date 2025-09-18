import { ProductSearch } from './ProductSearch';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/services/productService';

interface ProductSelectionProps {
  activeSessionId: string | null;
  onProductSelect?: (product: Product) => void;
}

export function ProductSelection({ activeSessionId, onProductSelect }: ProductSelectionProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Unified Search and Filter Header */}
      <div className="p-4 border-b bg-card">
        <ProductSearch
          activeSessionId={activeSessionId}
          onProductSelect={onProductSelect}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <ProductGrid
          activeSessionId={activeSessionId}
          onProductSelect={onProductSelect}
        />
      </div>
    </div>
  );
}