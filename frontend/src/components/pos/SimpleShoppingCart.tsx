import { ShoppingCart as CartIcon, Plus, Minus, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  useSimpleCartItems, 
  useSimpleCartSubtotal,
  useSimpleCartTax,
  useSimpleCartTotal,
  useSimpleCartItemCount,
  useSimpleUpdateQuantity,
  useSimpleRemoveItem,
  useSimpleClearCart,
  type SimpleCartItem 
} from '@/stores/simplePOSStore';

interface SimpleShoppingCartProps {
  className?: string;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
}

// Cart Item Row Component
interface CartItemRowProps {
  item: SimpleCartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  const handleQuantityChange = (delta: number) => {
    const newQuantity = item.quantity + delta;
    onUpdateQuantity(item.product.id, newQuantity);
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
      {/* Product Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0">
          <Package className="h-8 w-8 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {item.product.sku && <span>SKU: {item.product.sku}</span>}
            <span>•</span>
            <span>${item.unitPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-1)}
          disabled={item.quantity <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <div className="w-12 text-center">
          <span className="text-sm font-medium">{item.quantity}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(1)}
          disabled={item.quantity >= item.product.stock_quantity}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Price */}
      <div className="text-right min-w-[80px]">
        <div className="font-semibold text-sm">${item.totalPrice.toFixed(2)}</div>
        <div className="text-xs text-muted-foreground">
          {item.quantity} × ${item.unitPrice.toFixed(2)}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-500"
        onClick={() => onRemoveItem(item.product.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Main Simple Shopping Cart Component
export function SimpleShoppingCart({ 
  className, 
  onCheckout, 
  showCheckoutButton = true 
}: SimpleShoppingCartProps) {
  const items = useSimpleCartItems();
  const subtotal = useSimpleCartSubtotal();
  const tax = useSimpleCartTax();
  const total = useSimpleCartTotal();
  const itemCount = useSimpleCartItemCount();
  const updateQuantity = useSimpleUpdateQuantity();
  const removeItem = useSimpleRemoveItem();
  const clearCart = useSimpleClearCart();

  // Empty cart state
  if (items.length === 0) {
    return (
      <Card className={`h-full flex flex-col ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CartIcon className="h-5 w-5" />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <CartIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">Cart is Empty</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Search for products above and add them to start building your order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CartIcon className="h-5 w-5" />
            Shopping Cart
            <Badge variant="secondary" className="ml-2">
              {itemCount} items
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-gray-500 hover:text-red-500"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>

      {/* Cart Items */}
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {items.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
              />
            ))}
          </div>
        </ScrollArea>

        {/* Totals Section */}
        <div className="border-t pt-4 space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {/* Tax */}
          <div className="flex items-center justify-between text-sm">
            <span>Tax (10%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-semibold border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Checkout Button */}
          {showCheckoutButton && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={onCheckout}
              disabled={items.length === 0}
            >
              <CartIcon className="h-4 w-4 mr-2" />
              Proceed to Checkout
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}