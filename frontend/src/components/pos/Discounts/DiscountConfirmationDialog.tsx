import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Receipt,
  Tag
} from 'lucide-react';
import type { CartItem } from '@/types/pos/cart';

interface DiscountConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cartItems: CartItem[];
  billDiscount: number;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: 'apply' | 'remove' | 'change';
}

export function DiscountConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  cartItems,
  billDiscount,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  type = 'apply'
}: DiscountConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Calculate discount breakdown
  const subtotalBeforeDiscounts = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  const lineItemDiscounts = cartItems.reduce(
    (sum, item) => sum + item.lineDiscount, 0
  );

  const totalDiscounts = lineItemDiscounts + billDiscount;
  const subtotalAfterDiscounts = subtotalBeforeDiscounts - totalDiscounts;
  const taxAmount = subtotalAfterDiscounts * 0.08;
  const finalTotal = subtotalAfterDiscounts + taxAmount;

  const discountPercentage = subtotalBeforeDiscounts > 0
    ? (totalDiscounts / subtotalBeforeDiscounts) * 100
    : 0;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'apply':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'remove':
        return { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      case 'change':
        return { icon: Calculator, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      default:
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const { icon: Icon, color, bgColor } = getIconAndColor();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Impact Preview */}
          <div className={`p-4 rounded-lg border ${bgColor}`}>
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingDown className={`h-4 w-4 ${color}`} />
              Transaction Impact Preview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    ${subtotalBeforeDiscounts.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Original Subtotal</div>
                </div>
              </div>
              <div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${color}`}>
                    ${subtotalAfterDiscounts.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">After Discounts</div>
                </div>
              </div>
            </div>

            {totalDiscounts > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Savings:</span>
                  <Badge variant="secondary" className={`${color} font-bold`}>
                    ${totalDiscounts.toFixed(2)} ({discountPercentage.toFixed(1)}%)
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Discount Breakdown */}
          {totalDiscounts > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Discount Breakdown</h4>

              {lineItemDiscounts > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Line Item Discounts
                  </span>
                  <span>-${lineItemDiscounts.toFixed(2)}</span>
                </div>
              )}

              {billDiscount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    Bill-Level Discount
                  </span>
                  <span>-${billDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Final Transaction Summary */}
          <div className="bg-muted/20 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Final Transaction Total</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal (after discounts):</span>
                <span>${subtotalAfterDiscounts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-1">
                <span>Final Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* High Discount Warning */}
          {discountPercentage > 50 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High discount percentage ({discountPercentage.toFixed(1)}%).
                Please ensure manager approval if required by store policy.
              </AlertDescription>
            </Alert>
          )}

          {/* Large Discount Warning */}
          {totalDiscounts > 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Large discount amount (${totalDiscounts.toFixed(2)}).
                Please verify authorization for significant discounts.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="min-w-[100px]"
          >
            {isConfirming ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}