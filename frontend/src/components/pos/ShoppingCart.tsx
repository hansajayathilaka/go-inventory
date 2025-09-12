import { useState, useCallback } from 'react';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  AlertTriangle,
  X,
  Receipt,
  PercentIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  usePOSCartStore, 
  useCartTotals, 
  useCartActions, 
  useCartItems,
  type CartItem 
} from '@/stores/posCartStore';
import { 
  useKeyboardShortcuts, 
  SHORTCUT_CONTEXTS,
  type ShortcutHandlers 
} from '@/hooks';
import { ShortcutTooltip, KeyboardShortcutBadge } from '@/components/ui/keyboard-shortcut-badge';
import { cn } from '@/lib/utils';

interface ShoppingCartProps {
  className?: string;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
}

interface RemoveItemDialogProps {
  item: CartItem | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Remove Item Confirmation Dialog
function RemoveItemDialog({ item, isOpen, onConfirm, onCancel }: RemoveItemDialogProps) {
  if (!item) return null;

  const isExpensive = item.product.price > 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isExpensive && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Remove Item?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{item.product.name}</strong> from the cart?
            {isExpensive && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  High-value item (${item.product.price.toFixed(2)})
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm">Quantity: {item.quantity}</span>
            <span className="font-medium">${item.totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Remove Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Discount Dialog Component
interface DiscountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (amount: number, type: 'fixed' | 'percentage') => void;
  currentDiscount?: { amount: number; type: 'fixed' | 'percentage' };
}

function DiscountDialog({ isOpen, onClose, onApply, currentDiscount }: DiscountDialogProps) {
  const [amount, setAmount] = useState(currentDiscount?.amount.toString() || '');
  const [type, setType] = useState<'fixed' | 'percentage'>(currentDiscount?.type || 'percentage');

  const handleApply = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return;
    }
    
    if (type === 'percentage' && numericAmount > 100) {
      return;
    }

    onApply(numericAmount, type);
    onClose();
  };

  const handleClose = () => {
    setAmount(currentDiscount?.amount.toString() || '');
    setType(currentDiscount?.type || 'percentage');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Apply a discount to the entire cart total.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount-type">Discount Type</Label>
            <Select value={type} onValueChange={(value: 'fixed' | 'percentage') => setType(value)}>
              <SelectTrigger id="discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount-amount">
              {type === 'percentage' ? 'Percentage (0-100)' : 'Amount ($)'}
            </Label>
            <Input
              id="discount-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={type === 'percentage' ? '10' : '5.00'}
              min="0"
              max={type === 'percentage' ? '100' : undefined}
              step={type === 'percentage' ? '1' : '0.01'}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Cart Item Component
interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  onRemoveItem: (item: CartItem) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemoveItem }: CartItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (delta: number) => {
    setIsUpdating(true);
    const newQuantity = item.quantity + delta;
    await onUpdateQuantity(item.product.id, newQuantity);
    setIsUpdating(false);
  };

  const isLowStock = item.product.stock_quantity <= (item.product.min_stock_level || 0);
  const isNearStockLimit = item.quantity >= (item.maxQuantity || item.product.stock_quantity) * 0.8;

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
            <span>${item.unitPrice.toFixed(2)}/{item.product.unit}</span>
          </div>
          {(isLowStock || isNearStockLimit) && (
            <div className="flex items-center gap-1 mt-1">
              {isLowStock && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
              {isNearStockLimit && (
                <Badge variant="secondary" className="text-xs">
                  Near Limit
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-1)}
          disabled={isUpdating || item.quantity <= 1}
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
          disabled={isUpdating || item.quantity >= (item.maxQuantity || item.product.stock_quantity)}
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
        onClick={() => onRemoveItem(item)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Main Shopping Cart Component
export function ShoppingCart({ 
  className, 
  onCheckout, 
  showCheckoutButton = true 
}: ShoppingCartProps) {
  const [removeDialogItem, setRemoveDialogItem] = useState<CartItem | null>(null);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);

  // Cart state
  const items = useCartItems();
  const totals = useCartTotals();
  const { updateQuantity, removeItem, applyDiscount, removeDiscount, clearCart } = useCartActions();
  const discountConfig = usePOSCartStore((state) => state.discountConfig);

  // Handlers
  const handleRemoveItem = useCallback((item: CartItem) => {
    const isExpensive = item.product.price > 100;
    
    if (isExpensive) {
      setRemoveDialogItem(item);
    } else {
      removeItem(item.product.id);
    }
  }, [removeItem]);

  const handleConfirmRemove = useCallback(() => {
    if (removeDialogItem) {
      removeItem(removeDialogItem.product.id);
      setRemoveDialogItem(null);
    }
  }, [removeDialogItem, removeItem]);

  const handleApplyDiscount = useCallback((amount: number, type: 'fixed' | 'percentage') => {
    applyDiscount(amount, type);
  }, [applyDiscount]);

  const handleRemoveDiscount = useCallback(() => {
    removeDiscount();
  }, [removeDiscount]);

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  // Keyboard shortcut handlers for shopping cart
  const shortcutHandlers: ShortcutHandlers = {
    onProceedCheckout: useCallback(() => {
      if (items.length > 0 && onCheckout) {
        onCheckout()
      }
    }, [items.length, onCheckout])
  }

  // Initialize keyboard shortcuts for shopping cart
  useKeyboardShortcuts({
    context: SHORTCUT_CONTEXTS.SHOPPING_CART,
    handlers: shortcutHandlers,
    enabled: items.length > 0
  });

  // Empty cart state
  if (items.length === 0) {
    return (
      <Card className={cn("h-full flex flex-col", className)}>
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
    <>
      <Card className={cn("h-full flex flex-col", className)}>
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CartIcon className="h-5 w-5" />
              Shopping Cart
              <Badge variant="secondary" className="ml-2">
                {totals.itemCount} items
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCart}
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
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Totals Section */}
          <div className="border-t pt-4 space-y-3">
            {/* Discount Section */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Discount:</span>
              <div className="flex items-center gap-2">
                {discountConfig ? (
                  <>
                    <span className="text-sm text-green-600">
                      -{totals.discount.toFixed(2)} 
                      {discountConfig.type === 'percentage' 
                        ? ` (${discountConfig.amount}%)` 
                        : ''
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleRemoveDiscount}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscountDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <PercentIcon className="h-3 w-3" />
                    Add Discount
                  </Button>
                )}
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>

            {/* Tax */}
            <div className="flex items-center justify-between text-sm">
              <span>Tax ({(totals.taxRate * 100).toFixed(0)}%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-semibold border-t pt-2">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>

            {/* Checkout Button */}
            {showCheckoutButton && (
              <ShortcutTooltip
                shortcut="F4"
                description="Process payment"
              >
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={onCheckout}
                  disabled={items.length === 0}
                  data-testid="checkout-button"
                  aria-keyshortcuts="f4"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                  <KeyboardShortcutBadge 
                    shortcut="F4" 
                    className="ml-auto"
                    variant="outline"
                  />
                </Button>
              </ShortcutTooltip>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RemoveItemDialog
        item={removeDialogItem}
        isOpen={!!removeDialogItem}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveDialogItem(null)}
      />

      <DiscountDialog
        isOpen={showDiscountDialog}
        onClose={() => setShowDiscountDialog(false)}
        onApply={handleApplyDiscount}
        currentDiscount={discountConfig}
      />
    </>
  );
}