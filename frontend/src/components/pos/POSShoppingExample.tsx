import { useState } from 'react';
import { ProductSearch } from './ProductSearch';
import { ShoppingCart } from './ShoppingCart';
import { CustomerSelect } from './CustomerSelect';
import { useCartActions } from '@/stores/posCartStore';
import type { Product, Customer } from '@/types/inventory';

/**
 * Example integration component showing how ProductSearch, CustomerSelect and ShoppingCart work together
 * This demonstrates the complete Phase 1 POS functionality (Phases 1.1-1.4)
 */
export function POSShoppingExample() {
  const { addItem } = useCartActions();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleProductSelect = async (product: Product) => {
    const success = await addItem(product, 1);
    if (!success) {
      // Handle error (e.g., show toast notification)
      console.warn('Failed to add product to cart');
    }
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    console.log('Selected customer:', customer);
  };

  const handleCheckout = () => {
    // Placeholder for checkout functionality
    console.log('Proceeding to checkout...');
    console.log('Selected customer:', selectedCustomer);
    // This would integrate with Phase 2 checkout process
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Customer Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Customer Selection</h2>
        <CustomerSelect
          selectedCustomer={selectedCustomer}
          onCustomerSelect={handleCustomerSelect}
        />
      </div>

      {/* Middle Panel - Product Search */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Product Search</h2>
        <ProductSearch
          onProductSelect={handleProductSelect}
          autoFocus={true}
          placeholder="Search products by name, SKU, or scan barcode..."
        />
      </div>

      {/* Right Panel - Shopping Cart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Shopping Cart</h2>
        <ShoppingCart
          onCheckout={handleCheckout}
          showCheckoutButton={true}
          className="min-h-[600px]"
        />
      </div>
    </div>
  );
}