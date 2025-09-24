import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Receipt,
  User,
  Calendar,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import type { TransactionReview } from '@/types/pos/transaction';
import { cn } from '@/lib/utils';

interface TransactionSummaryProps {
  transaction: TransactionReview;
  onPrintReceipt?: () => void;
  onEmailReceipt?: () => void;
  onVoidTransaction?: () => void;
  className?: string;
}

const statusConfig = {
  draft: {
    icon: Clock,
    color: 'bg-gray-500',
    variant: 'secondary' as const,
    label: 'Draft'
  },
  pending_payment: {
    icon: AlertTriangle,
    color: 'bg-yellow-500',
    variant: 'secondary' as const,
    label: 'Pending Payment'
  },
  paid: {
    icon: CheckCircle2,
    color: 'bg-green-500',
    variant: 'default' as const,
    label: 'Paid'
  },
  completed: {
    icon: CheckCircle2,
    color: 'bg-blue-500',
    variant: 'default' as const,
    label: 'Completed'
  },
  voided: {
    icon: XCircle,
    color: 'bg-red-500',
    variant: 'destructive' as const,
    label: 'Voided'
  }
};

export function TransactionSummary({
  transaction,
  onPrintReceipt,
  onEmailReceipt,
  onVoidTransaction,
  className
}: TransactionSummaryProps) {
  const statusInfo = statusConfig[transaction.status];
  const StatusIcon = statusInfo.icon;

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      store_credit: 'Store Credit',
      gift_card: 'Gift Card'
    };
    return methods[method] || method;
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Transaction Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Session: {transaction.summary.sessionName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transaction Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date & Time</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Created: {formatDateTime(transaction.createdAt)}
            </p>
            {transaction.completedAt && (
              <p className="text-sm text-muted-foreground">
                Completed: {formatDateTime(transaction.completedAt)}
              </p>
            )}
            {transaction.voidedAt && (
              <p className="text-sm text-muted-foreground text-destructive">
                Voided: {formatDateTime(transaction.voidedAt)}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Customer</span>
            </div>
            <p className="font-medium">
              {transaction.summary.customerName || 'Walk-in Customer'}
            </p>
            <Badge variant="outline" className="text-xs mt-1">
              {transaction.summary.customerType || 'walk-in'}
            </Badge>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Items</span>
            </div>
            <p className="font-medium">{transaction.summary.itemCount} items</p>
            <p className="text-sm text-muted-foreground">
              Total: ${transaction.summary.total.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Items List */}
        <div>
          <h3 className="font-medium mb-3">Items Purchased</h3>
          <Card>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1 p-4">
                {transaction.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productSku}
                          {item.categoryName && ` • ${item.categoryName}`}
                          {item.brandName && ` • ${item.brandName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Qty: {item.quantity}</span>
                        <span>${item.price.toFixed(2)}</span>
                        {item.lineDiscount > 0 && (
                          <span className="text-green-600">
                            -${item.lineDiscount.toFixed(2)}
                          </span>
                        )}
                        <span className="font-medium w-16 text-right">
                          ${item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {index < transaction.items.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-medium mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${transaction.summary.subtotal.toFixed(2)}</span>
              </div>
              {transaction.summary.lineDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Line Discounts:</span>
                  <span>-${transaction.summary.lineDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {transaction.summary.billDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Bill Discount:</span>
                  <span>-${transaction.summary.billDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({(transaction.summary.taxRate * 100).toFixed(1)}%):</span>
                <span>${transaction.summary.taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>Total:</span>
                <span>${transaction.summary.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </h3>
            <div className="space-y-2">
              {transaction.payments.length > 0 ? (
                transaction.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{getPaymentMethodDisplay(payment.method)}</span>
                      <Badge variant="outline" className="text-xs">
                        {payment.status}
                      </Badge>
                    </div>
                    <span>${payment.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              )}
            </div>
          </Card>
        </div>

        {/* Void Information */}
        {transaction.status === 'voided' && transaction.voidReason && (
          <Card className="p-4 border-destructive">
            <h3 className="font-medium text-destructive mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Void Information
            </h3>
            <p className="text-sm text-muted-foreground">{transaction.voidReason}</p>
          </Card>
        )}

        {/* Notes */}
        {transaction.notes && (
          <Card className="p-4">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground">{transaction.notes}</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {onPrintReceipt && transaction.status !== 'voided' && (
            <Button onClick={onPrintReceipt} className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Print Receipt
            </Button>
          )}

          {onEmailReceipt && transaction.status !== 'voided' && transaction.summary.customerType !== 'walk-in' && (
            <Button variant="outline" onClick={onEmailReceipt} className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Email Receipt
            </Button>
          )}

          {onVoidTransaction && transaction.status !== 'voided' && transaction.status !== 'draft' && (
            <Button
              variant="destructive"
              onClick={onVoidTransaction}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Void Transaction
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}