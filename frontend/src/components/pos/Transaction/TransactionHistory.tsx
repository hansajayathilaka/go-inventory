import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  History,
  Eye,
  ExternalLink,
  User
} from 'lucide-react';
import { usePOSTransactionStore } from '@/stores/pos/posTransactionStore';
import { TransactionDialog } from './TransactionDialog';
import type { TransactionReview } from '@/types/pos/transaction';

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionHistory({ open, onOpenChange }: TransactionHistoryProps) {
  const { getAllTransactions } = usePOSTransactionStore();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const navigate = useNavigate();

  // Get only the 10 most recent transactions
  const recentTransactions = getAllTransactions().slice(0, 10);

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setTransactionDialogOpen(true);
  };

  const handleViewAllTransactions = () => {
    onOpenChange(false);
    // Navigate to the full transaction history page
    navigate('/transaction-history');
  };

  const getStatusBadgeVariant = (status: TransactionReview['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'paid':
        return 'secondary';
      case 'pending_payment':
        return 'outline';
      case 'voided':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Transactions
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewAllTransactions}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View All History
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <p className="text-sm text-muted-foreground mb-4">
              Showing the 10 most recent transactions. Use "View All History" for advanced search and filtering.
            </p>

            {/* Transaction Table */}
            <div className="flex-1 border rounded-md overflow-hidden min-h-0">
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <History className="h-8 w-8 opacity-50" />
                            <p>No recent transactions</p>
                            <p className="text-sm">Complete some transactions to see them here</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            {transaction.id.slice(-6).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(transaction.createdAt), 'MMM dd')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(transaction.createdAt), 'h:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-32">
                                {transaction.summary.customerName || 'Walk-in'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {transaction.summary.itemCount}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${transaction.summary.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)} className="text-xs">
                              {transaction.status === 'completed' ? 'Done' :
                               transaction.status === 'pending_payment' ? 'Pending' :
                               transaction.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTransaction(transaction.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {recentTransactions.length > 0 && (
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={handleViewAllTransactions}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Transactions & Advanced Search
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transactionId={selectedTransactionId}
      />
    </>
  );
}