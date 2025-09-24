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
import { ReceiptDialog } from './ReceiptDialog';
import { usePOSTransactionStore } from '@/stores/pos/posTransactionStore';
import { toast } from 'sonner';
import type { TransactionReceipt } from '@/types/pos/transaction';

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
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [currentReceipt, setCurrentReceipt] = useState<TransactionReceipt | null>(null);

  const transaction = transactionId ? getTransactionById(transactionId) : null;

  const handlePrintReceipt = () => {
    if (!transaction) return;

    try {
      const receipt = generateReceipt(transaction.id);
      setCurrentReceipt(receipt);
      setShowReceiptDialog(true);
    } catch (error) {
      toast.error('Failed to generate receipt');
      console.error('Receipt generation error:', error);
    }
  };

  const handleEmailReceipt = () => {
    if (!transaction) return;

    try {
      const receipt = generateReceipt(transaction.id);
      setCurrentReceipt(receipt);
      setShowReceiptDialog(true);
    } catch (error) {
      toast.error('Failed to generate receipt');
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

      <ReceiptDialog
        open={showReceiptDialog}
        onOpenChange={setShowReceiptDialog}
        receipt={currentReceipt}
        onPrintComplete={() => {
          setShowReceiptDialog(false);
          setCurrentReceipt(null);
        }}
      />

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