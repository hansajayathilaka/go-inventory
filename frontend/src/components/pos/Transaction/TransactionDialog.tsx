import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TransactionSummary } from './TransactionSummary';
import { usePOSTransactionStore } from '@/stores/pos/posTransactionStore';
import { toast } from 'sonner';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transactionId
}: TransactionDialogProps) {
  const { getTransactionById, generateReceipt, voidTransaction } = usePOSTransactionStore();
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  const transaction = transactionId ? getTransactionById(transactionId) : null;

  const handlePrintReceipt = () => {
    if (!transaction) return;

    try {
      const receipt = generateReceipt(transaction.id);

      // In a real application, this would interface with a printer
      // For now, we'll create a printable version in a new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generateReceiptHTML(receipt));
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      toast.success('Receipt sent to printer');
    } catch (error) {
      toast.error('Failed to generate receipt');
      console.error('Receipt generation error:', error);
    }
  };

  const handleEmailReceipt = () => {
    if (!transaction) return;

    try {
      const receipt = generateReceipt(transaction.id);

      // In a real application, this would send an email via API
      // For now, we'll simulate the email functionality
      toast.success(`Receipt emailed to ${transaction.summary.customerName}`);
      console.log('Email receipt:', receipt);
    } catch (error) {
      toast.error('Failed to email receipt');
      console.error('Email receipt error:', error);
    }
  };

  const handleVoidTransaction = () => {
    if (!transaction || !voidReason.trim()) return;

    try {
      voidTransaction(transaction.id, voidReason.trim());
      toast.success('Transaction voided successfully');
      setShowVoidDialog(false);
      setVoidReason('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to void transaction');
      console.error('Void transaction error:', error);
    }
  };

  const generateReceiptHTML = (receipt: ReturnType<typeof generateReceipt>): string => {
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

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receiptNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .business-name { font-weight: bold; font-size: 18px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .line-item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total-line { font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="business-name">${receipt.businessInfo.name}</div>
          ${receipt.businessInfo.address.map((line: string) => `<div>${line}</div>`).join('')}
          ${receipt.businessInfo.phone ? `<div>${receipt.businessInfo.phone}</div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="line-item">
          <span>Receipt #:</span>
          <span>${receipt.receiptNumber}</span>
        </div>
        <div class="line-item">
          <span>Date:</span>
          <span>${formatDateTime(receipt.timestamps.completed)}</span>
        </div>
        <div class="line-item">
          <span>Cashier:</span>
          <span>${receipt.cashier.name}</span>
        </div>
        <div class="line-item">
          <span>Customer:</span>
          <span>${receipt.customer.name}</span>
        </div>

        <div class="divider"></div>

        ${receipt.items.map((item: { productName: string; quantity: number; price: number; lineTotal: number }) => `
          <div class="line-item">
            <div>
              <div>${item.productName}</div>
              <div style="font-size: 12px;">${item.quantity} x $${item.price.toFixed(2)}</div>
            </div>
            <div>$${item.lineTotal.toFixed(2)}</div>
          </div>
        `).join('')}

        <div class="divider"></div>

        <div class="line-item">
          <span>Subtotal:</span>
          <span>$${receipt.summary.subtotal.toFixed(2)}</span>
        </div>
        ${receipt.summary.discountAmount > 0 ? `
        <div class="line-item">
          <span>Discount:</span>
          <span>-$${receipt.summary.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="line-item">
          <span>Tax:</span>
          <span>$${receipt.summary.taxAmount.toFixed(2)}</span>
        </div>
        <div class="line-item total-line">
          <span>TOTAL:</span>
          <span>$${receipt.summary.total.toFixed(2)}</span>
        </div>

        <div class="divider"></div>

        ${receipt.payments.map((payment: { method: string; amount: number }) => `
        <div class="line-item">
          <span>${payment.method.replace('_', ' ').toUpperCase()}:</span>
          <span>$${payment.amount.toFixed(2)}</span>
        </div>
        `).join('')}

        <div class="footer">
          <div>Thank you for your business!</div>
        </div>
      </body>
      </html>
    `;
  };

  if (!transaction) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Review</DialogTitle>
            <DialogDescription>
              Detailed summary for transaction {transaction.id.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <TransactionSummary
            transaction={transaction}
            onPrintReceipt={handlePrintReceipt}
            onEmailReceipt={handleEmailReceipt}
            onVoidTransaction={() => setShowVoidDialog(true)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please provide a reason for voiding this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="voidReason">Reason for voiding</Label>
              <Textarea
                id="voidReason"
                placeholder="Enter reason for voiding this transaction..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidTransaction}
              disabled={!voidReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Void Transaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}