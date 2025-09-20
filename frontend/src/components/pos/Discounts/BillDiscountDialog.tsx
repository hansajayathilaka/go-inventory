import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Percent, DollarSign, Receipt, AlertCircle, Gift } from 'lucide-react';
import { POSDiscountService } from '@/services/pos/posDiscountService';
import type { DiscountType } from '@/types/pos/discount';
import type { CartSummary } from '@/types/pos/cart';

interface BillDiscountDialogProps {
  cartSummary: CartSummary;
  currentBillDiscount: number;
  onApplyDiscount: (discountAmount: number, reason?: string) => void;
  disabled?: boolean;
}

export function BillDiscountDialog({
  cartSummary,
  currentBillDiscount,
  onApplyDiscount,
  disabled = false
}: BillDiscountDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Calculate subtotal after line discounts (before bill discount)
  const subtotalAfterLineDiscounts = cartSummary.subtotal - (cartSummary.discountAmount - currentBillDiscount);
  const hasDiscount = currentBillDiscount > 0;

  const handleDiscountValueChange = (value: string) => {
    setDiscountValue(value);
    setError(null);
  };

  const handleDiscountTypeChange = (type: DiscountType) => {
    setDiscountType(type);
    setError(null);
  };

  const calculatePreview = () => {
    if (!discountValue.trim()) return null;

    const value = parseFloat(discountValue);
    if (isNaN(value)) return null;

    const validation = POSDiscountService.validateDiscount(discountType, value, subtotalAfterLineDiscounts);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid discount');
      return null;
    }

    return POSDiscountService.calculateDiscount(discountType, value, subtotalAfterLineDiscounts);
  };

  const handleApplyDiscount = () => {
    const preview = calculatePreview();
    if (!preview) return;

    onApplyDiscount(preview.discountAmount, discountReason.trim() || undefined);
    setIsOpen(false);
    setDiscountValue('');
    setDiscountReason('');
    setError(null);
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount(0);
    setIsOpen(false);
    setDiscountValue('');
    setDiscountReason('');
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setDiscountValue('');
      setDiscountReason('');
      setError(null);
    }
  };

  const preview = calculatePreview();

  // Quick discount presets
  const quickDiscounts = [
    { label: '5%', type: 'percentage' as const, value: 5 },
    { label: '10%', type: 'percentage' as const, value: 10 },
    { label: '15%', type: 'percentage' as const, value: 15 },
    { label: '20%', type: 'percentage' as const, value: 20 },
  ];

  const applyQuickDiscount = (type: DiscountType, value: number) => {
    setDiscountType(type);
    setDiscountValue(value.toString());
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={hasDiscount ? "default" : "outline"}
          size="sm"
          disabled={disabled || cartSummary.itemCount === 0}
          className="w-full"
        >
          <Receipt className="h-4 w-4 mr-2" />
          {hasDiscount ? (
            <>
              Bill Discount:
              <Badge variant="secondary" className="ml-2">
                -${currentBillDiscount.toFixed(2)}
              </Badge>
            </>
          ) : (
            'Apply Bill Discount'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bill-Level Discount</DialogTitle>
          <DialogDescription>
            Apply a discount to the entire transaction total
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="bg-muted/20 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-3">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items ({cartSummary.itemCount}):</span>
                <span>${cartSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Line Discounts:</span>
                <span>-${(cartSummary.discountAmount - currentBillDiscount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Subtotal (before bill discount):</span>
                <span>${subtotalAfterLineDiscounts.toFixed(2)}</span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-primary">
                  <span>Current Bill Discount:</span>
                  <span>-${currentBillDiscount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Discount Presets */}
          <div className="space-y-2">
            <Label>Quick Discounts</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickDiscounts.map((discount) => (
                <Button
                  key={discount.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickDiscount(discount.type, discount.value)}
                  className="text-xs"
                >
                  {discount.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Discount Type Selection */}
          <div className="space-y-2">
            <Label>Discount Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDiscountTypeChange('percentage')}
                className="flex-1"
              >
                <Percent className="h-4 w-4 mr-2" />
                Percentage
              </Button>
              <Button
                type="button"
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDiscountTypeChange('fixed')}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Fixed Amount
              </Button>
            </div>
          </div>

          {/* Discount Value Input */}
          <div className="space-y-2">
            <Label htmlFor="bill-discount-value">
              {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
            </Label>
            <Input
              id="bill-discount-value"
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : subtotalAfterLineDiscounts}
              step={discountType === 'percentage' ? 1 : 0.01}
              value={discountValue}
              onChange={(e) => handleDiscountValueChange(e.target.value)}
              placeholder={discountType === 'percentage' ? '15' : '10.00'}
            />
          </div>

          {/* Discount Reason */}
          <div className="space-y-2">
            <Label htmlFor="discount-reason">
              <Gift className="h-4 w-4 inline mr-1" />
              Reason (optional)
            </Label>
            <Textarea
              id="discount-reason"
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Customer loyalty, damaged items, manager approval, etc."
              rows={2}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {discountReason.length}/200
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview && !error && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Discount Type:</span>
                  <span>{POSDiscountService.formatDiscountDisplay(discountType, parseFloat(discountValue))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applied to:</span>
                  <span>${preview.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary font-medium">
                  <span>Discount Amount:</span>
                  <span>-${preview.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>New Subtotal:</span>
                  <span>${preview.finalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%):</span>
                  <span>${(preview.finalAmount * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Final Total:</span>
                  <span>${(preview.finalAmount * 1.08).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {hasDiscount && (
              <Button variant="outline" onClick={handleRemoveDiscount}>
                Remove Discount
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyDiscount}
              disabled={!preview || !!error}
            >
              Apply Discount
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}