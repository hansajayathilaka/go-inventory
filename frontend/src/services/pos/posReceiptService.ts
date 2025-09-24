import type { TransactionReceipt } from '@/types/pos/transaction';

export interface PrintOptions {
  copies?: number;
  paperSize?: 'thermal' | 'letter' | 'a4';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export class POSReceiptService {
  /**
   * Print receipt using browser's print dialog
   */
  static async printReceipt(receipt: TransactionReceipt, _options: PrintOptions = {}): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600,resizable=yes,scrollbars=yes');

      if (!printWindow) {
        throw new Error('Unable to open print window. Please check your browser\'s popup settings.');
      }

      const printHTML = this.generatePrintHTML(receipt);

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load
      await new Promise<void>((resolve) => {
        printWindow.onload = () => resolve();
        setTimeout(() => resolve(), 1000); // Fallback timeout
      });

      // Focus and print
      printWindow.focus();
      printWindow.print();

      // Close window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Print failed:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for printing
   */
  private static generatePrintHTML(receipt: TransactionReceipt): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(date);
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receiptNumber}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }

          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }

          .receipt-container {
            max-width: 300px;
            margin: 0 auto;
            background: white;
            padding: 20px;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
          }

          .business-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .business-info {
            font-size: 10px;
            margin-bottom: 4px;
          }

          .separator {
            border-top: 1px dashed #000;
            margin: 12px 0;
          }

          .solid-separator {
            border-top: 1px solid #000;
            margin: 8px 0;
          }

          .transaction-info, .customer-info, .payment-info {
            margin-bottom: 16px;
          }

          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }

          .item {
            margin-bottom: 12px;
          }

          .item-name {
            font-weight: bold;
            display: flex;
            justify-content: space-between;
          }

          .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }

          .item-quantity {
            font-size: 10px;
          }

          .discount-text {
            color: #d32f2f;
          }

          .total-row {
            font-weight: bold;
            font-size: 14px;
            margin-top: 8px;
          }

          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
          }

          .footer .thank-you {
            font-weight: bold;
            margin-bottom: 8px;
          }

          .transaction-id {
            color: #666;
            margin-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="header">
            <div class="business-name">${receipt.businessInfo.name}</div>
            ${receipt.businessInfo.address.map(line => `<div class="business-info">${line}</div>`).join('')}
            ${receipt.businessInfo.phone ? `<div class="business-info">${receipt.businessInfo.phone}</div>` : ''}
            ${receipt.businessInfo.email ? `<div class="business-info">${receipt.businessInfo.email}</div>` : ''}
            ${receipt.businessInfo.taxId ? `<div class="business-info">Tax ID: ${receipt.businessInfo.taxId}</div>` : ''}
          </div>

          <div class="separator"></div>

          <!-- Transaction Info -->
          <div class="transaction-info">
            <div class="row">
              <span>Receipt:</span>
              <span style="font-weight: bold;">${receipt.receiptNumber}</span>
            </div>
            <div class="row">
              <span>Date:</span>
              <span>${formatDate(receipt.timestamps.completed).split(',')[0]}</span>
            </div>
            <div class="row">
              <span>Time:</span>
              <span>${formatDate(receipt.timestamps.completed).split(',')[1]?.trim()}</span>
            </div>
            <div class="row">
              <span>Cashier:</span>
              <span>${receipt.cashier.name}</span>
            </div>
          </div>

          <div class="separator"></div>

          <!-- Customer Info -->
          <div class="customer-info">
            <div class="row">
              <span>Customer:</span>
              <span style="font-weight: bold;">${receipt.customer.name}</span>
            </div>
            ${receipt.customer.phone ? `
              <div class="row">
                <span>Phone:</span>
                <span>${receipt.customer.phone}</span>
              </div>
            ` : ''}
            ${receipt.customer.email ? `
              <div class="row">
                <span>Email:</span>
                <span>${receipt.customer.email}</span>
              </div>
            ` : ''}
            <div class="row">
              <span>Type:</span>
              <span style="text-transform: capitalize;">${receipt.customer.type.replace('-', ' ')}</span>
            </div>
          </div>

          <div class="separator"></div>

          <!-- Items -->
          <div class="items">
            <div style="font-weight: bold; margin-bottom: 12px;">ITEMS:</div>
            ${receipt.items.map(item => `
              <div class="item">
                <div class="item-name">
                  <span>${item.productName}</span>
                  <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
                ${receipt.printOptions.showItemCodes && item.productCode ? `
                  <div class="item-details">SKU: ${item.productCode}</div>
                ` : ''}
                ${receipt.printOptions.showCategories && item.categoryName ? `
                  <div class="item-details">Category: ${item.categoryName}</div>
                ` : ''}
                <div class="item-quantity">
                  ${item.quantity} × ${formatCurrency(item.price)}
                  ${item.lineDiscount && item.lineDiscount > 0 ? `
                    <span class="discount-text"> -${formatCurrency(item.lineDiscount)}</span>
                  ` : ''}
                </div>
                ${receipt.printOptions.showDiscountReasons && item.discountReason ? `
                  <div class="item-details discount-text" style="font-style: italic;">
                    Discount: ${item.discountReason}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="solid-separator"></div>

          <!-- Totals -->
          <div class="totals">
            <div class="row">
              <span>Subtotal:</span>
              <span>${formatCurrency(receipt.summary.subtotal)}</span>
            </div>

            ${receipt.summary.lineDiscountAmount > 0 ? `
              <div class="row discount-text">
                <span>Item Discounts:</span>
                <span>-${formatCurrency(receipt.summary.lineDiscountAmount)}</span>
              </div>
            ` : ''}

            ${receipt.summary.billDiscountAmount > 0 ? `
              <div class="row discount-text">
                <span>Bill Discount:</span>
                <span>-${formatCurrency(receipt.summary.billDiscountAmount)}</span>
              </div>
            ` : ''}

            ${receipt.summary.discountAmount > 0 ? `
              <div class="row discount-text" style="font-weight: bold;">
                <span>Total Discounts:</span>
                <span>-${formatCurrency(receipt.summary.discountAmount)}</span>
              </div>
            ` : ''}

            <div class="row">
              <span>Tax (${Math.round(receipt.summary.taxRate * 100)}%):</span>
              <span>${formatCurrency(receipt.summary.taxAmount)}</span>
            </div>

            <div class="solid-separator"></div>

            <div class="row total-row">
              <span>TOTAL:</span>
              <span>${formatCurrency(receipt.summary.total)}</span>
            </div>
          </div>

          <div class="solid-separator"></div>

          <!-- Payment Details -->
          <div class="payment-info">
            <div style="font-weight: bold; margin-bottom: 8px;">PAYMENT:</div>
            ${receipt.payments.map(payment => `
              <div class="row">
                <span style="text-transform: capitalize;">
                  ${payment.method.replace('_', ' ')}:
                </span>
                <span>${formatCurrency(payment.amount)}</span>
              </div>
              ${payment.method === 'cash' && payment.changeDue && payment.changeDue > 0 ? `
                <div class="row" style="font-size: 10px;">
                  <span>Tendered:</span>
                  <span>${formatCurrency(payment.amountTendered || payment.amount)}</span>
                </div>
                <div class="row" style="font-size: 10px; font-weight: bold;">
                  <span>Change:</span>
                  <span>${formatCurrency(payment.changeDue)}</span>
                </div>
              ` : ''}
            `).join('')}
          </div>

          <div class="separator"></div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div>Return Policy: 30 days with receipt</div>
            <div>Visit us: ${receipt.businessInfo.address[0]}</div>
            <div class="transaction-id">
              Transaction ID: ${receipt.transactionId.slice(-12).toUpperCase()}
            </div>
            <div class="transaction-id">
              Generated: ${formatDate(new Date())}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Download receipt as PDF (using browser's print to PDF)
   */
  static async downloadReceiptPDF(receipt: TransactionReceipt): Promise<void> {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');

      if (!printWindow) {
        throw new Error('Unable to open print window for PDF download.');
      }

      const printHTML = this.generatePrintHTML(receipt);

      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Wait for content to load
      await new Promise<void>((resolve) => {
        printWindow.onload = () => resolve();
        setTimeout(() => resolve(), 1000);
      });

      printWindow.focus();

      // Show print dialog (user can select "Save as PDF")
      printWindow.print();

    } catch (error) {
      console.error('PDF download failed:', error);
      throw error;
    }
  }

  /**
   * Get receipt as HTML string for email or other purposes
   */
  static getReceiptHTML(receipt: TransactionReceipt): string {
    return this.generatePrintHTML(receipt);
  }

  /**
   * Email receipt (placeholder - would integrate with email service)
   */
  static async emailReceipt(receipt: TransactionReceipt, recipientEmail: string): Promise<boolean> {
    try {
      // This would integrate with an actual email service
      // For now, we'll just log the action
      console.log(`Email receipt ${receipt.receiptNumber} to ${recipientEmail}`);

      // In a real implementation, this would send the email via backend API
      // const receiptHTML = this.getReceiptHTML(receipt);
      // Example:
      // await fetch('/api/v1/pos/email-receipt', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     receiptId: receipt.transactionId,
      //     recipientEmail,
      //     receiptHTML: this.getReceiptHTML(receipt)
      //   })
      // });

      return true;
    } catch (error) {
      console.error('Email failed:', error);
      throw error;
    }
  }
}