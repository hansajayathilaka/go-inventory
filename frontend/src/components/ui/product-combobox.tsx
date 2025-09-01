import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  quantity_on_hand?: number;
  category?: {
    name: string;
  };
}

interface ProductComboboxProps {
  products: Product[];
  value?: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showCategory?: boolean;
  searchPlaceholder?: string;
}

export function ProductCombobox({
  products,
  value,
  onSelect,
  placeholder = "Search products...",
  className,
  disabled = false,
  showCategory = false,
  searchPlaceholder = "Search products..."
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  
  const selectedProduct = products.find(product => product.id === value);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full h-auto min-h-[2.5rem] py-2 justify-between font-normal",
              className
            )}
          >
            {selectedProduct ? (
              <div className="flex flex-col gap-0.5 items-start">
                <span className="font-medium text-sm">{selectedProduct.name}</span>
                <span className="text-xs text-muted-foreground">
                  SKU: {selectedProduct.sku} • Cost: ${selectedProduct.cost_price}
                  {selectedProduct.quantity_on_hand !== undefined && (
                    <> • Stock: {selectedProduct.quantity_on_hand}</>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => {
                      onSelect(product.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        SKU: {product.sku} • Cost: ${product.cost_price}
                        {product.quantity_on_hand !== undefined && (
                          <> • Stock: {product.quantity_on_hand}</>
                        )}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Optional category display */}
      {showCategory && selectedProduct && selectedProduct.category?.name && (
        <div className="text-xs text-muted-foreground mt-1">
          {selectedProduct.category.name}
        </div>
      )}
    </div>
  );
}

export default ProductCombobox;