import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/stores/posCartStore'

export interface ReceiptData {
  id?: string
  billNumber: string
  customerName?: string
  customerCode?: string
  cashierName: string
  saleDate: Date
  items: CartItem[]
  subtotal: number
  tax: number
  taxRate: number
  discount: number
  total: number
  payments: PaymentMethod[]
  notes?: string
  storeName?: string
  storeAddress?: string
  storePhone?: string
}

export interface PaymentMethod {
  method: 'cash' | 'card' | 'bank_transfer' | 'ewallet' | 'check'
  amount: number
  reference?: string
}

interface ReceiptProps {
  receiptData: ReceiptData
  className?: string
  showPrintButton?: boolean
  onPrint?: () => void
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    ewallet: 'E-Wallet',
    check: 'Check'
  }
  return labels[method] || method
}

export function Receipt({ 
  receiptData, 
  className, 
  showPrintButton = true, 
  onPrint 
}: ReceiptProps) {
  const {
    billNumber,
    customerName,
    customerCode,
    cashierName,
    saleDate,
    items,
    subtotal,
    tax,
    taxRate,
    discount,
    total,
    payments,
    notes,
    storeName = 'Hardware Store Inventory',
    storeAddress = '123 Main Street, City, State 12345',
    storePhone = '(555) 123-4567'
  } = receiptData

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      // Default print behavior
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        const receiptContent = document.getElementById('receipt-content')?.innerHTML
        if (receiptContent) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Receipt - ${billNumber}</title>
                <style>
                  body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 12px; 
                    margin: 0; 
                    padding: 20px;
                    max-width: 300px;
                  }
                  .receipt-header { text-align: center; margin-bottom: 20px; }
                  .receipt-line { border-bottom: 1px dashed #000; margin: 10px 0; }
                  .receipt-item { display: flex; justify-content: space-between; margin: 5px 0; }
                  .receipt-total { font-weight: bold; font-size: 14px; }
                  @media print {
                    body { margin: 0; padding: 10px; }
                  }
                </style>
              </head>
              <body onload="window.print(); window.close();">
                ${receiptContent}
              </body>
            </html>
          `)
          printWindow.document.close()
        }
      }
    }
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Print Button */}
      {showPrintButton && (
        <div className="p-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Print Receipt
          </button>
        </div>
      )}

      {/* Receipt Content */}
      <div id="receipt-content" className="p-6 font-mono text-sm">
        {/* Store Header */}
        <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
          <h2 className="text-lg font-bold">{storeName}</h2>
          <p className="text-xs text-gray-600 mt-1">{storeAddress}</p>
          <p className="text-xs text-gray-600">{storePhone}</p>
        </div>

        {/* Transaction Details */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-semibold">{billNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{format(saleDate, 'MMM dd, yyyy HH:mm')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{cashierName}</span>
          </div>
          {customerName && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{customerName}</span>
            </div>
          )}
          {customerCode && (
            <div className="flex justify-between">
              <span>Customer Code:</span>
              <span>{customerCode}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-dashed border-gray-300 pt-2 mb-4">
          <div className="mb-2">
            <div className="flex justify-between font-semibold text-xs">
              <span>ITEM</span>
              <span>QTY × PRICE</span>
              <span>TOTAL</span>
            </div>
          </div>
          
          {items.map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="flex-1 pr-2 text-xs">{item.product.name}</span>
                <span className="text-xs whitespace-nowrap">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
                <span className="text-xs ml-2 whitespace-nowrap">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
              {item.product.sku && (
                <div className="text-xs text-gray-500 pl-2">
                  SKU: {item.product.sku}
                </div>
              )}
              {item.discount && item.discount > 0 && (
                <div className="text-xs text-red-600 pl-2">
                  Item Discount: -{formatCurrency(item.discount)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-2 mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          
          <div className="flex justify-between font-bold text-lg border-t border-solid border-gray-400 pt-2">
            <span>TOTAL:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-dashed border-gray-300 pt-2 mb-4">
          <div className="font-semibold mb-2">PAYMENT:</div>
          {payments.map((payment, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {getPaymentMethodLabel(payment.method)}
                {payment.reference && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({payment.reference})
                  </span>
                )}
              </span>
              <span>{formatCurrency(payment.amount)}</span>
            </div>
          ))}
          
          {/* Calculate and show change for cash payments */}
          {(() => {
            const cashPayment = payments.find(p => p.method === 'cash')
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
            const change = totalPaid - total
            
            return cashPayment && change > 0 ? (
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-solid border-gray-400">
                <span>CHANGE:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            ) : null
          })()}
        </div>

        {/* Notes */}
        {notes && (
          <div className="border-t border-dashed border-gray-300 pt-2 mb-4">
            <div className="font-semibold mb-1">NOTES:</div>
            <div className="text-xs text-gray-600">{notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6 border-t border-dashed border-gray-300 pt-4">
          <p>Thank you for your business!</p>
          <p>Please keep this receipt for your records</p>
          <p className="mt-2">Generated on {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
        </div>
      </div>
    </div>
  )
}