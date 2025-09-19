import { useState, useEffect, useCallback } from 'react';
import { Search, Scan, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryService } from '@/services/categoryService';
import { BarcodeScanner } from '../BarcodeScanner/BarcodeScanner';
import type { BarcodeResult, BarcodeProductLookup } from '@/types/pos/barcode';
import type { Category } from '@/types/category';

interface ProductSearchProps {
  onSearchChange?: (query: string, categoryId: string) => void;
}

export function ProductSearch({ onSearchChange }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Loading categories...');

      // Try hierarchy first
      try {
        const hierarchy = await categoryService.getCategoryHierarchy();
        console.log('Received hierarchy:', hierarchy);

        const flatCategories = flattenCategories(hierarchy);
        console.log('Flattened categories:', flatCategories);

        if (flatCategories.length > 0) {
          setCategories(flatCategories);
          return;
        }
      } catch (hierarchyError) {
        console.warn('Hierarchy failed, trying list approach:', hierarchyError);
      }

      // Fallback to list categories
      const categoriesResponse = await categoryService.listCategories({ page_size: 100 });
      console.log('Received categories list:', categoriesResponse);

      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data);
      } else {
        console.warn('Categories response has no data array');
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const flattenCategories = (categoryData: any): Category[] => {
    const result: Category[] = [];

    // Handle different response structures
    let category = categoryData;

    // If the response is wrapped in a data property
    if (categoryData && categoryData.data && !categoryData.id) {
      category = categoryData.data;
    }

    // If category is an array (flat list)
    if (Array.isArray(category)) {
      return category.filter(cat => cat && cat.id);
    }

    // Handle single category with potential children
    if (category && category.id) {
      result.push(category);
    }

    // Process children recursively
    if (category && category.children && Array.isArray(category.children)) {
      category.children.forEach((child: any) => {
        result.push(...flattenCategories(child));
      });
    }

    return result;
  };

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
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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