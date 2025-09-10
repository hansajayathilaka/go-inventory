import { ShoppingCart as CartIcon, Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useCartItems, 
  useCartSubtotal,
  useCartTax,
  useCartTotal,
  useCartItemCount,
  useUpdateQuantity,
  useRemoveItem,
  useClearCart,
  type BasicCartItem 
} from '@/stores/basicCartStore';

interface BasicCartProps {
  onCheckout?: () => void;
}

export function BasicCart({ onCheckout }: BasicCartProps) {
  const items = useCartItems();
  const subtotal = useCartSubtotal();
  const tax = useCartTax();
  const total = useCartTotal();
  const itemCount = useCartItemCount();
  const updateQuantity = useUpdateQuantity();
  const removeItem = useRemoveItem();
  const clearCart = useClearCart();

  if (items.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <CartIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Empty cart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CartIcon className="h-5 w-5" />
            Cart ({itemCount})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-2 overflow-auto">
          {items.map((item: BasicCartItem) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right min-w-[60px]">
                <p className="text-sm font-medium">${item.total.toFixed(2)}</p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 mt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax:</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          {onCheckout && (
            <Button onClick={onCheckout} className="w-full mt-3">
              Checkout
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}