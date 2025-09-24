import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Percent, DollarSign } from 'lucide-react';
import { POSDiscountService } from '@/services/pos/posDiscountService';
import { useDiscountValidation } from '@/hooks/useDiscountValidation';
import type { DiscountType } from '@/types/pos/discount';
import type { CartItem } from '@/types/pos/cart';

interface LineItemDiscountProps {
  item: CartItem;
  onApplyDiscount: (itemId: string, discountAmount: number) => void;
  sessionId: string;
}

export function LineItemDiscount({ item, onApplyDiscount, sessionId }: LineItemDiscountProps) {
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
    if (!discountValue.trim()) {
      onApplyDiscount(item.id, 0);
      return;
    }

    const preview = calculatePreview();
    if (preview && !error) {
      onApplyDiscount(item.id, preview.discountAmount);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        max={getMaxAllowedDiscount(discountType, lineTotal)}
        step={discountType === 'percentage' ? 1 : 0.01}
        value={discountValue}
        onChange={(e) => handleDiscountValueChange(e.target.value)}
        placeholder="0"
        className="w-16 h-6 text-xs px-2"
        onBlur={handleApplyDiscount}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
        className="h-6 w-8 p-0"
      >
        {discountType === 'percentage' ? (
          <Percent className="h-3 w-3" />
        ) : (
          <DollarSign className="h-3 w-3" />
        )}
      </Button>
      {hasDiscount && (
        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
          -${item.lineDiscount.toFixed(2)}
        </Badge>
      )}
      {error && (
        <AlertCircle className="h-3 w-3 text-destructive" />
      )}
    </div>
  );
}