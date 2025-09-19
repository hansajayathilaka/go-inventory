import { useState, useEffect, useCallback } from 'react';
import { Search, Scan, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategorySelector } from '../CategorySelector/CategorySelector';
import { BarcodeScanner } from '../BarcodeScanner/BarcodeScanner';
import type { BarcodeResult, BarcodeProductLookup } from '@/types/pos/barcode';

interface ProductSearchProps {
  onSearchChange?: (query: string, categoryId: string) => void;
}

export function ProductSearch({ onSearchChange }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');


  // Notify parent component of search/filter changes
  const notifySearchChange = useCallback(() => {
    const categoryId = selectedCategoryId === 'all' ? '' : selectedCategoryId;
    onSearchChange?.(searchQuery, categoryId);
  }, [searchQuery, selectedCategoryId, onSearchChange]);

  // Debounce search with useEffect - trigger on query or category changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      notifySearchChange();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategoryId, notifySearchChange]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeDetected = async (result: BarcodeResult, product?: BarcodeProductLookup) => {
    if (product && product.productName) {
      // Set search to the product name or barcode
      setSearchQuery(product.productName || result.text);
    } else {
      // Trigger search with the barcode
      setSearchQuery(result.text);
    }

    setShowBarcodeScanner(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Input and Category Filter Row */}
      <div className="flex items-center space-x-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products, SKU, or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-48">
          <CategorySelector
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
          />
        </div>

        {/* Barcode Scanner Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleBarcodeScanner}
          className="flex items-center space-x-1"
        >
          <Scan className="h-4 w-4" />
          <span>Scan</span>
        </Button>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </div>
  );
}