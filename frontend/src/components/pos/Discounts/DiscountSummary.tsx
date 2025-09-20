import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingDown,
  Receipt,
  Tag,
  Eye,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { usePOSCartStore } from '@/stores/pos/posCartStore';
import type { CartItem } from '@/types/pos/cart';

interface DiscountSummaryProps {
  sessionId: string;
  cartItems: CartItem[];
  className?: string;
}

interface DiscountBreakdown {
  lineItemDiscounts: {
    item: CartItem;
    discountAmount: number;
    originalAmount: number;
  }[];
  billLevelDiscount: number;
  totalDiscounts: number;
  subtotalBeforeDiscounts: number;
  subtotalAfterDiscounts: number;
}

export function DiscountSummary({ sessionId, cartItems, className }: DiscountSummaryProps) {
  const { sessionDiscounts } = usePOSCartStore();
  const billDiscount = sessionDiscounts[sessionId] || 0;

  // Calculate discount breakdown
  const breakdown: DiscountBreakdown = {
    lineItemDiscounts: cartItems
      .filter(item => item.lineDiscount > 0)
      .map(item => ({
        item,
        discountAmount: item.lineDiscount,
        originalAmount: item.price * item.quantity
      })),
    billLevelDiscount: billDiscount,
    totalDiscounts: 0,
    subtotalBeforeDiscounts: 0,
    subtotalAfterDiscounts: 0
  };

  // Calculate totals
  breakdown.subtotalBeforeDiscounts = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );

  const totalLineDiscounts = breakdown.lineItemDiscounts.reduce(
    (sum, discount) => sum + discount.discountAmount, 0
  );

  breakdown.totalDiscounts = totalLineDiscounts + breakdown.billLevelDiscount;
  breakdown.subtotalAfterDiscounts = breakdown.subtotalBeforeDiscounts - breakdown.totalDiscounts;

  const hasDiscounts = breakdown.totalDiscounts > 0;
  const discountPercentage = breakdown.subtotalBeforeDiscounts > 0
    ? (breakdown.totalDiscounts / breakdown.subtotalBeforeDiscounts) * 100
    : 0;

  if (!hasDiscounts) {
    return (
      <Card className={className}>
        <div className="p-3 text-center text-muted-foreground">
          <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No discounts applied</p>
          <p className="text-xs">Use line-item or bill discounts to save money</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <h3 className="font-medium text-sm">Discounts Applied</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {discountPercentage.toFixed(1)}% OFF
          </Badge>
        </div>

        <div className="space-y-2">
          {/* Summary Stats */}
          <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">Total Savings:</span>
              <span className="text-lg font-bold text-green-600">
                ${breakdown.totalDiscounts.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-green-700">
              <span>Original: ${breakdown.subtotalBeforeDiscounts.toFixed(2)}</span>
              <span>After: ${breakdown.subtotalAfterDiscounts.toFixed(2)}</span>
            </div>
          </div>

          {/* Quick Breakdown */}
          <div className="space-y-1">
            {breakdown.lineItemDiscounts.length > 0 && (
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Line Item Discounts ({breakdown.lineItemDiscounts.length})
                </span>
                <span>-${totalLineDiscounts.toFixed(2)}</span>
              </div>
            )}

            {breakdown.billLevelDiscount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Bill Discount
                </span>
                <span>-${breakdown.billLevelDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Detailed View Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                View Detailed Breakdown
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Discount Breakdown</DialogTitle>
                <DialogDescription>
                  Detailed breakdown of all discounts applied to this transaction
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Summary Card */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-800">Total Savings Summary</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        ${breakdown.totalDiscounts.toFixed(2)}
                      </div>
                      <div className="text-xs text-green-700">Total Saved</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {discountPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-700">Discount Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {breakdown.lineItemDiscounts.length + (breakdown.billLevelDiscount > 0 ? 1 : 0)}
                      </div>
                      <div className="text-xs text-green-700">Discounts Applied</div>
                    </div>
                  </div>
                </div>

                {/* Line Item Discounts */}
                {breakdown.lineItemDiscounts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Line Item Discounts
                    </h4>
                    <div className="space-y-2">
                      {breakdown.lineItemDiscounts.map((discount, index) => (
                        <div key={index} className="border border-gray-200 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{discount.item.productName}</div>
                              <div className="text-xs text-muted-foreground">
                                {discount.item.productSku} • Qty: {discount.item.quantity}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              -${discount.discountAmount.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Original: ${discount.originalAmount.toFixed(2)}</span>
                            <span>
                              After: ${(discount.originalAmount - discount.discountAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bill Level Discount */}
                {breakdown.billLevelDiscount > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Receipt className="h-4 w-4" />
                      Bill-Level Discount
                    </h4>
                    <div className="border border-gray-200 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Applied to entire transaction</span>
                        <Badge variant="outline" className="text-xs">
                          -${breakdown.billLevelDiscount.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Impact */}
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Transaction Impact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal (before discounts):</span>
                      <span>${breakdown.subtotalBeforeDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Total Discounts:</span>
                      <span>-${breakdown.totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Subtotal (after discounts):</span>
                      <span>${breakdown.subtotalAfterDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (8%):</span>
                      <span>${(breakdown.subtotalAfterDiscounts * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Final Total:</span>
                      <span>${(breakdown.subtotalAfterDiscounts * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 text-green-800">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Customer saved ${breakdown.totalDiscounts.toFixed(2)} ({discountPercentage.toFixed(1)}%)
                      on this transaction!
                    </span>
                  </div>
                </div>

                {/* Warning for high discounts */}
                {discountPercentage > 50 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        High discount percentage ({discountPercentage.toFixed(1)}%) -
                        consider manager approval if required.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Card>
  );
}