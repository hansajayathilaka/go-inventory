import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Percent, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { POSDiscountService } from '@/services/pos/posDiscountService';
import { useDiscountValidation } from '@/hooks/useDiscountValidation';
import type { DiscountType } from '@/types/pos/discount';
import type { CartItem } from '@/types/pos/cart';

interface LineItemDiscountProps {
  item: CartItem;
  onApplyDiscount: (itemId: string, discountAmount: number) => void;
  disabled?: boolean;
  sessionId: string;
}

export function LineItemDiscount({ item, onApplyDiscount, disabled = false, sessionId }: LineItemDiscountProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Enhanced validation
  const { validateSingleDiscount, getMaxAllowedDiscount, requiresReason } = useDiscountValidation(sessionId, {
    userRole: 'cashier', // This would come from auth context in real app
    customerType: 'regular'
  });

  const lineTotal = item.price * item.quantity;
  const hasDiscount = item.lineDiscount > 0;

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

    // Use enhanced validation
    const validation = validateSingleDiscount(discountType, value, lineTotal);
    if (!validation.isValid) {
      setError(validation.errorMessage || 'Invalid discount');
      return null;
    }

    // Check if reason is required
    const discountPercentage = discountType === 'percentage' ? value : (value / lineTotal) * 100;
    if (requiresReason(discountPercentage)) {
      setError('Discount reason required for discounts above 15%');
      return null;
    }

    return POSDiscountService.calculateDiscount(discountType, value, lineTotal);
  };

  const handleApplyDiscount = () => {
    const preview = calculatePreview();
    if (!preview) return;

    onApplyDiscount(item.id, preview.discountAmount);
    setIsOpen(false);
    setDiscountValue('');
    setError(null);
  };

  const handleRemoveDiscount = () => {
    onApplyDiscount(item.id, 0);
    setIsOpen(false);
    setDiscountValue('');
    setError(null);
  };

  const preview = calculatePreview();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasDiscount ? "secondary" : "outline"}
          size="sm"
          className="h-6 px-2"
          disabled={disabled}
        >
          <Tag className="h-3 w-3 mr-1" />
          {hasDiscount ? (
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              -${item.lineDiscount.toFixed(2)}
            </Badge>
          ) : (
            <span className="text-xs">Discount</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Line Item Discount</DialogTitle>
          <DialogDescription>
            Apply a discount to this item: {item.productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Details */}
          <div className="bg-muted/20 p-3 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Item Price:</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity:</span>
              <span>{item.quantity}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Line Total:</span>
              <span>${lineTotal.toFixed(2)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Current Discount:</span>
                <span>-${item.lineDiscount.toFixed(2)}</span>
              </div>
            )}
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
            <Label htmlFor="discount-value">
              {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
            </Label>
            <Input
              id="discount-value"
              type="number"
              min="0"
              max={getMaxAllowedDiscount(discountType, lineTotal)}
              step={discountType === 'percentage' ? 1 : 0.01}
              value={discountValue}
              onChange={(e) => handleDiscountValueChange(e.target.value)}
              placeholder={discountType === 'percentage' ? '10' : '5.00'}
            />
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
            <div className="bg-primary/10 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Preview</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span>${preview.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Discount:</span>
                  <span>-${preview.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Final Amount:</span>
                  <span>${preview.finalAmount.toFixed(2)}</span>
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