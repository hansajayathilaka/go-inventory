import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  History,
  Search,
  Filter,
  X,
  Receipt,
  Eye,
  FileX,
  DollarSign,
  User,
  Tag
} from 'lucide-react';
import { usePOSTransactionStore } from '@/stores/pos/posTransactionStore';
import { TransactionDialog } from './TransactionDialog';
import type { TransactionReview, TransactionSearchFilters } from '@/types/pos/transaction';
import { toast } from 'sonner';

interface TransactionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionHistory({ open, onOpenChange }: TransactionHistoryProps) {
  const { getAllTransactions, voidTransaction } = usePOSTransactionStore();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TransactionSearchFilters>({});

  const allTransactions = getAllTransactions();

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Text search across multiple fields
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.id.toLowerCase().includes(term) ||
        txn.summary.customerName?.toLowerCase().includes(term) ||
        txn.summary.sessionName.toLowerCase().includes(term) ||
        txn.status.toLowerCase().includes(term) ||
        txn.items.some(item =>
          item.productName.toLowerCase().includes(term) ||
          item.productSku.toLowerCase().includes(term)
        )
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(txn => txn.status === filters.status);
    }

    if (filters.customerId) {
      filtered = filtered.filter(txn => txn.summary.customerId === filters.customerId);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(txn =>
        new Date(txn.createdAt) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(txn =>
        new Date(txn.createdAt) <= endOfDay
      );
    }

    if (filters.amountMin !== undefined) {
      filtered = filtered.filter(txn => txn.summary.total >= filters.amountMin!);
    }

    if (filters.amountMax !== undefined) {
      filtered = filtered.filter(txn => txn.summary.total <= filters.amountMax!);
    }

    return filtered;
  }, [allTransactions, searchTerm, filters]);

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setTransactionDialogOpen(true);
  };

  const handleVoidTransaction = async (transactionId: string) => {
    const reason = prompt('Please enter a reason for voiding this transaction:');
    if (!reason?.trim()) {
      toast.error('Void reason is required');
      return;
    }

    try {
      voidTransaction(transactionId, reason.trim());
      toast.success('Transaction voided successfully');
    } catch (error) {
      console.error('Error voiding transaction:', error);
      toast.error('Failed to void transaction');
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
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

  const getTotalSales = () => {
    return filteredTransactions
      .filter(txn => txn.status === 'completed')
      .reduce((sum, txn) => sum + txn.summary.total, 0);
  };

  const getTotalTransactions = () => filteredTransactions.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
              <Badge variant="outline" className="ml-auto">
                {getTotalTransactions()} transactions
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${getTotalSales().toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    From completed transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getTotalTransactions()}</div>
                  <p className="text-xs text-muted-foreground">
                    Showing filtered results
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${getTotalTransactions() > 0 ? (getTotalSales() / filteredTransactions.filter(t => t.status === 'completed').length || 0).toFixed(2) : '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per completed transaction
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions, customers, products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                {(Object.keys(filters).length > 0 || searchTerm) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Status</Label>
                      <Select
                        value={filters.status || ''}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as TransactionReview['status'] || undefined }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending_payment">Pending Payment</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="voided">Voided</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-from">From Date</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateFrom: e.target.value ? new Date(e.target.value) : undefined
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-to">To Date</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateTo: e.target.value ? new Date(e.target.value) : undefined
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount-range">Amount Range</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          type="number"
                          step="0.01"
                          value={filters.amountMin || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            amountMin: e.target.value ? parseFloat(e.target.value) : undefined
                          }))}
                        />
                        <Input
                          placeholder="Max"
                          type="number"
                          step="0.01"
                          value={filters.amountMax || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            amountMax: e.target.value ? parseFloat(e.target.value) : undefined
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Transaction Table */}
            <div className="flex-1 border rounded-md overflow-hidden min-h-0">
              <div className="overflow-auto h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <History className="h-8 w-8 opacity-50" />
                            <p>No transactions found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(transaction.createdAt), 'h:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {transaction.summary.customerName || 'Walk-in Customer'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.summary.sessionName}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {transaction.summary.itemCount} item{transaction.summary.itemCount !== 1 ? 's' : ''}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${transaction.summary.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                              {transaction.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTransaction(transaction.id)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {transaction.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleVoidTransaction(transaction.id)}
                                  title="Void Transaction"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <FileX className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
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