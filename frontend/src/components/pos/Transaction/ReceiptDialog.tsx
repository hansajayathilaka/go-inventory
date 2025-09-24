import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Printer, Download, Mail, Eye, Settings, Copy } from 'lucide-react';
import { ReceiptPreview } from './ReceiptPreview';
import { POSReceiptService } from '@/services/pos/posReceiptService';
import type { TransactionReceipt } from '@/types/pos/transaction';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: TransactionReceipt | null;
  onPrintComplete?: () => void;
}

export function ReceiptDialog({ open, onOpenChange, receipt, onPrintComplete }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [printOptions, setPrintOptions] = useState({
    showItemCodes: true,
    showCategories: false,
    showDiscountReasons: true,
    includeBusinessLogo: false
  });
  const [loading, setLoading] = useState({
    print: false,
    email: false,
    download: false
  });

  if (!receipt) return null;

  const handlePrintReceipt = async () => {
    try {
      setLoading(prev => ({ ...prev, print: true }));

      // Update receipt with current print options
      const updatedReceipt: TransactionReceipt = {
        ...receipt,
        printOptions: { ...receipt.printOptions, ...printOptions }
      };

      await POSReceiptService.printReceipt(updatedReceipt);

      toast.success(`Receipt ${receipt.receiptNumber} has been sent to the printer.`);

      onPrintComplete?.();

    } catch (error) {
      console.error('Print error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to print receipt");
    } finally {
      setLoading(prev => ({ ...prev, print: false }));
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(prev => ({ ...prev, download: true }));

      const updatedReceipt: TransactionReceipt = {
        ...receipt,
        printOptions: { ...receipt.printOptions, ...printOptions }
      };

      await POSReceiptService.downloadReceiptPDF(updatedReceipt);

      toast.success("Receipt PDF download should start shortly.");

    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to download receipt");
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  const handleEmailReceipt = async () => {
    if (!emailAddress) {
      toast.error("Please enter an email address to send the receipt.");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, email: true }));

      const updatedReceipt: TransactionReceipt = {
        ...receipt,
        printOptions: { ...receipt.printOptions, ...printOptions }
      };

      await POSReceiptService.emailReceipt(updatedReceipt, emailAddress);

      toast.success(`Receipt has been sent to ${emailAddress}`);

      setEmailAddress('');

    } catch (error) {
      console.error('Email error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setLoading(prev => ({ ...prev, email: false }));
    }
  };

  const copyReceiptNumber = () => {
    navigator.clipboard.writeText(receipt.receiptNumber);
    toast.success("Receipt number copied to clipboard");
  };

  const copyTransactionId = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    toast.success("Transaction ID copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Receipt Preview - {receipt.receiptNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Receipt Preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
              <ReceiptPreview
                ref={receiptRef}
                receipt={{
                  ...receipt,
                  printOptions: { ...receipt.printOptions, ...printOptions }
                }}
                className="border-none bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Receipt Info */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Receipt Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{receipt.receiptNumber}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyReceiptNumber}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transaction ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-600">
                    {receipt.transactionId.slice(-12).toUpperCase()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyTransactionId}
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer:</span>
                <span className="text-sm">{receipt.customer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-sm font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
                    .format(receipt.summary.total)}
                </span>
              </div>
            </div>

            {/* Print Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <Label className="text-sm font-medium">Print Options</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showItemCodes"
                    checked={printOptions.showItemCodes}
                    onChange={(e) => setPrintOptions(prev => ({
                      ...prev,
                      showItemCodes: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="showItemCodes" className="text-sm">
                    Show item codes (SKU)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showCategories"
                    checked={printOptions.showCategories}
                    onChange={(e) => setPrintOptions(prev => ({
                      ...prev,
                      showCategories: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="showCategories" className="text-sm">
                    Show categories
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showDiscountReasons"
                    checked={printOptions.showDiscountReasons}
                    onChange={(e) => setPrintOptions(prev => ({
                      ...prev,
                      showDiscountReasons: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <Label htmlFor="showDiscountReasons" className="text-sm">
                    Show discount reasons
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Email Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Email Receipt</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleEmailReceipt}
                  disabled={loading.email || !emailAddress}
                  size="sm"
                  variant="outline"
                >
                  {loading.email ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handlePrintReceipt}
                disabled={loading.print}
                className="w-full justify-center"
                size="lg"
              >
                {loading.print ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Print Receipt
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={loading.download}
                variant="outline"
                className="w-full justify-center"
                size="lg"
              >
                {loading.download ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}