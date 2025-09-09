import type { ReceiptData } from '@/components/pos/Receipt'
import { format } from 'date-fns'

export interface PrintOptions {
  paperWidth?: number // in mm, default 80mm for thermal printers
  fontSize?: number   // in px, default 12
  fontFamily?: string // default 'Courier New'
  showLogo?: boolean
  logoUrl?: string
  margins?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

export interface PrintResult {
  success: boolean
  error?: string
  printJobId?: string
}

class POSPrintService {
  private defaultOptions: Required<PrintOptions> = {
    paperWidth: 80,
    fontSize: 12,
    fontFamily: 'Courier New, monospace',
    showLogo: false,
    logoUrl: '',
    margins: {
      top: 10,
      bottom: 10,
      left: 5,
      right: 5
    }
  }

  /**
   * Check if printing is available in the current environment
   */
  isPrintingAvailable(): boolean {
    return typeof window !== 'undefined' && 
           'print' in window && 
           typeof window.print === 'function'
  }

  /**
   * Check if the browser supports the Web Print API (experimental)
   */
  hasWebPrintAPI(): boolean {
    return 'navigator' in window && 'printing' in navigator
  }

  /**
   * Generate HTML content for printing
   */
  private generatePrintHTML(receiptData: ReceiptData, options: PrintOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options }
    const { paperWidth, fontSize, fontFamily, showLogo, logoUrl, margins } = opts

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

    const totalPaid = receiptData.payments.reduce((sum, p) => sum + p.amount, 0)
    const change = totalPaid - receiptData.total

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt - ${receiptData.billNumber}</title>
          <style>
            body { 
              font-family: ${fontFamily}; 
              font-size: ${fontSize}px; 
              margin: 0; 
              padding: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px;
              max-width: ${paperWidth}mm;
              line-height: 1.2;
            }
            .receipt-header { 
              text-align: center; 
              margin-bottom: 15px; 
              border-bottom: 1px dashed #000; 
              padding-bottom: 10px;
            }
            .logo { 
              max-width: 60mm; 
              height: auto; 
              margin-bottom: 10px; 
            }
            .store-name { 
              font-size: ${fontSize + 2}px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .store-info { 
              font-size: ${fontSize - 2}px; 
              margin: 2px 0; 
            }
            .receipt-section { 
              margin: 10px 0; 
            }
            .receipt-line { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0; 
              align-items: flex-start;
            }
            .item-line { 
              margin: 5px 0; 
            }
            .item-name { 
              font-weight: bold; 
              margin-bottom: 2px; 
            }
            .item-details { 
              font-size: ${fontSize - 1}px; 
              color: #666; 
              margin-bottom: 2px; 
            }
            .item-price { 
              text-align: right; 
            }
            .total-line { 
              font-weight: bold; 
              font-size: ${fontSize + 1}px; 
              border-top: 1px solid #000; 
              padding-top: 5px; 
              margin-top: 5px; 
            }
            .dashed-line { 
              border-top: 1px dashed #000; 
              margin: 10px 0; 
            }
            .footer { 
              text-align: center; 
              font-size: ${fontSize - 2}px; 
              margin-top: 15px; 
              border-top: 1px dashed #000; 
              padding-top: 10px; 
            }
            @media print {
              body { 
                margin: 0; 
                padding: 5px; 
              }
              .no-print { 
                display: none; 
              }
            }
            @page {
              margin: 0;
              size: ${paperWidth}mm auto;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            ${showLogo && logoUrl ? `<img src="${logoUrl}" alt="Store Logo" class="logo">` : ''}
            <div class="store-name">${receiptData.storeName || 'Hardware Store Inventory'}</div>
            <div class="store-info">${receiptData.storeAddress || '123 Main Street, City, State 12345'}</div>
            <div class="store-info">${receiptData.storePhone || '(555) 123-4567'}</div>
          </div>

          <div class="receipt-section">
            <div class="receipt-line">
              <span>Receipt #:</span>
              <span><strong>${receiptData.billNumber}</strong></span>
            </div>
            <div class="receipt-line">
              <span>Date:</span>
              <span>${format(receiptData.saleDate, 'MMM dd, yyyy HH:mm')}</span>
            </div>
            <div class="receipt-line">
              <span>Cashier:</span>
              <span>${receiptData.cashierName}</span>
            </div>
            ${receiptData.customerName ? `
            <div class="receipt-line">
              <span>Customer:</span>
              <span>${receiptData.customerName}</span>
            </div>
            ` : ''}
            ${receiptData.customerCode ? `
            <div class="receipt-line">
              <span>Customer Code:</span>
              <span>${receiptData.customerCode}</span>
            </div>
            ` : ''}
          </div>

          <div class="dashed-line"></div>

          <div class="receipt-section">
            ${receiptData.items.map(item => `
            <div class="item-line">
              <div class="item-name">${item.product.name}</div>
              ${item.product.sku ? `<div class="item-details">SKU: ${item.product.sku}</div>` : ''}
              <div class="receipt-line">
                <span>${item.quantity} × ${formatCurrency(item.unitPrice)}</span>
                <span class="item-price">${formatCurrency(item.totalPrice)}</span>
              </div>
              ${item.discount && item.discount > 0 ? `
              <div class="item-details" style="color: #d00;">
                Item Discount: -${formatCurrency(item.discount)}
              </div>
              ` : ''}
            </div>
            `).join('')}
          </div>

          <div class="dashed-line"></div>

          <div class="receipt-section">
            <div class="receipt-line">
              <span>Subtotal:</span>
              <span>${formatCurrency(receiptData.subtotal)}</span>
            </div>
            ${receiptData.discount > 0 ? `
            <div class="receipt-line" style="color: #d00;">
              <span>Discount:</span>
              <span>-${formatCurrency(receiptData.discount)}</span>
            </div>
            ` : ''}
            <div class="receipt-line">
              <span>Tax (${(receiptData.taxRate * 100).toFixed(1)}%):</span>
              <span>${formatCurrency(receiptData.tax)}</span>
            </div>
            <div class="receipt-line total-line">
              <span>TOTAL:</span>
              <span>${formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          <div class="dashed-line"></div>

          <div class="receipt-section">
            <div style="font-weight: bold; margin-bottom: 5px;">PAYMENT:</div>
            ${receiptData.payments.map(payment => `
            <div class="receipt-line">
              <span>
                ${getPaymentMethodLabel(payment.method)}
                ${payment.reference ? ` (${payment.reference})` : ''}
              </span>
              <span>${formatCurrency(payment.amount)}</span>
            </div>
            `).join('')}
            ${change > 0 ? `
            <div class="receipt-line total-line">
              <span>CHANGE:</span>
              <span>${formatCurrency(change)}</span>
            </div>
            ` : ''}
          </div>

          ${receiptData.notes ? `
          <div class="dashed-line"></div>
          <div class="receipt-section">
            <div style="font-weight: bold; margin-bottom: 5px;">NOTES:</div>
            <div style="font-size: ${fontSize - 1}px;">${receiptData.notes}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div>Thank you for your business!</div>
            <div>Please keep this receipt for your records</div>
            <div style="margin-top: 5px;">Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</div>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Print receipt using browser's print functionality
   */
  async printReceipt(receiptData: ReceiptData, options: PrintOptions = {}): Promise<PrintResult> {
    try {
      if (!this.isPrintingAvailable()) {
        return {
          success: false,
          error: 'Printing is not available in this browser'
        }
      }

      const printHTML = this.generatePrintHTML(receiptData, options)
      
      // Open print window
      const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes')
      
      if (!printWindow) {
        return {
          success: false,
          error: 'Unable to open print window. Please check popup blockers.'
        }
      }

      // Write content and trigger print
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }

      return {
        success: true,
        printJobId: `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown print error'
      }
    }
  }

  /**
   * Generate print preview URL (data URL)
   */
  generatePrintPreview(receiptData: ReceiptData, options: PrintOptions = {}): string {
    const printHTML = this.generatePrintHTML(receiptData, options)
    return `data:text/html;charset=utf-8,${encodeURIComponent(printHTML)}`
  }

  /**
   * Download receipt as HTML file
   */
  downloadReceiptHTML(receiptData: ReceiptData, options: PrintOptions = {}): void {
    const printHTML = this.generatePrintHTML(receiptData, options)
    const blob = new Blob([printHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt_${receiptData.billNumber}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Check if thermal printer is connected (placeholder for future ESC/POS integration)
   */
  async checkThermalPrinter(): Promise<boolean> {
    // This would integrate with thermal printer APIs
    // For now, return false as we're using browser printing
    return false
  }

  /**
   * Print to thermal printer (placeholder for future ESC/POS integration)
   */
  async printToThermalPrinter(_receiptData: ReceiptData): Promise<PrintResult> {
    return {
      success: false,
      error: 'Thermal printer integration not yet implemented'
    }
  }
}

// Export singleton instance
export const posPrintService = new POSPrintService()

// Export class for testing
export { POSPrintService }