import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import type { TransactionReceipt } from '@/types/pos/transaction';

interface ReceiptPreviewProps {
  receipt: TransactionReceipt;
  className?: string;
}

export const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(
  ({ receipt, className = '' }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    return (
      <div
        ref={ref}
        className={`receipt-container bg-white text-black p-4 max-w-sm mx-auto font-mono text-sm ${className}`}
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          width: '300px',
          minHeight: '400px'
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="font-bold text-lg mb-1">{receipt.businessInfo.name}</div>
          {receipt.businessInfo.address.map((line, index) => (
            <div key={index} className="text-xs">{line}</div>
          ))}
          {receipt.businessInfo.phone && (
            <div className="text-xs">{receipt.businessInfo.phone}</div>
          )}
          {receipt.businessInfo.email && (
            <div className="text-xs">{receipt.businessInfo.email}</div>
          )}
          {receipt.businessInfo.taxId && (
            <div className="text-xs mt-1">Tax ID: {receipt.businessInfo.taxId}</div>
          )}
        </div>

        <Separator className="my-2 border-dashed" />

        {/* Transaction Info */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Receipt:</span>
            <span className="font-bold">{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(receipt.timestamps.completed, 'MM/dd/yyyy')}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{format(receipt.timestamps.completed, 'hh:mm:ss a')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{receipt.cashier.name}</span>
          </div>
        </div>

        <Separator className="my-2 border-dashed" />

        {/* Customer Info */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="font-semibold">{receipt.customer.name}</span>
          </div>
          {receipt.customer.phone && (
            <div className="flex justify-between">
              <span>Phone:</span>
              <span>{receipt.customer.phone}</span>
            </div>
          )}
          {receipt.customer.email && (
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="text-xs break-all">{receipt.customer.email}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="capitalize">{receipt.customer.type.replace('-', ' ')}</span>
          </div>
        </div>

        <Separator className="my-2 border-dashed" />

        {/* Items */}
        <div className="mb-3">
          <div className="font-bold mb-2">ITEMS:</div>
          {receipt.items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{item.productName}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
              {receipt.printOptions.showItemCodes && item.productCode && (
                <div className="text-xs">SKU: {item.productCode}</div>
              )}
              {receipt.printOptions.showCategories && item.categoryName && (
                <div className="text-xs">Category: {item.categoryName}</div>
              )}
              <div className="text-xs">
                {item.quantity} × {formatCurrency(item.price)}
                {item.lineDiscount && item.lineDiscount > 0 && (
                  <span className="ml-2">
                    -{formatCurrency(item.lineDiscount)}
                  </span>
                )}
              </div>
              {receipt.printOptions.showDiscountReasons && item.discountReason && (
                <div className="text-xs italic">
                  Discount: {item.discountReason}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Totals */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(receipt.summary.subtotal)}</span>
          </div>

          {receipt.summary.lineDiscountAmount > 0 && (
            <div className="flex justify-between">
              <span>Item Discounts:</span>
              <span>-{formatCurrency(receipt.summary.lineDiscountAmount)}</span>
            </div>
          )}

          {receipt.summary.billDiscountAmount > 0 && (
            <div className="flex justify-between">
              <span>Bill Discount:</span>
              <span>-{formatCurrency(receipt.summary.billDiscountAmount)}</span>
            </div>
          )}

          {receipt.summary.discountAmount > 0 && (
            <div className="flex justify-between font-semibold">
              <span>Total Discounts:</span>
              <span>-{formatCurrency(receipt.summary.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Tax ({Math.round(receipt.summary.taxRate * 100)}%):</span>
            <span>{formatCurrency(receipt.summary.taxAmount)}</span>
          </div>

          <Separator className="my-1" />

          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>{formatCurrency(receipt.summary.total)}</span>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Payment Details */}
        <div className="mb-4">
          <div className="font-bold mb-2">PAYMENT:</div>
          {receipt.payments.map((payment, index) => (
            <div key={index} className="mb-1">
              <div className="flex justify-between">
                <span className="capitalize">
                  {payment.method.replace('_', ' ')}:
                </span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              {payment.method === 'cash' && payment.changeDue && payment.changeDue > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Tendered:</span>
                    <span>{formatCurrency(payment.amountTendered || payment.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Change:</span>
                    <span>{formatCurrency(payment.changeDue)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-2 border-dashed" />

        {/* Footer */}
        <div className="text-center text-xs mt-4">
          <div className="mb-2">Thank you for your business!</div>
          <div className="mb-1">Return Policy: 30 days with receipt</div>
          <div className="mb-1">Visit us: {receipt.businessInfo.address[0]}</div>
          <div className="text-xs mt-3">
            Transaction ID: {receipt.transactionId.slice(-12).toUpperCase()}
          </div>
          <div className="text-xs">
            Generated: {format(new Date(), 'MM/dd/yyyy hh:mm:ss a')}
          </div>
        </div>
      </div>
    );
  }
);

ReceiptPreview.displayName = 'ReceiptPreview';