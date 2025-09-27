import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
  Tag,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { usePOSTransactionStore } from '@/stores/pos/posTransactionStore';
import { TransactionDialog } from '@/components/pos/Transaction/TransactionDialog';
import type { TransactionReview, TransactionSearchFilters } from '@/types/pos/transaction';
import { toast } from 'sonner';

export function TransactionHistoryPage() {
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

  const getCompletedTransactions = () => {
    return filteredTransactions.filter(txn => txn.status === 'completed');
  };

  const getAverageTransaction = () => {
    const completed = getCompletedTransactions();
    return completed.length > 0 ? getTotalSales() / completed.length : 0;
  };

  const getTotalDiscounts = () => {
    return filteredTransactions
      .filter(txn => txn.status === 'completed')
      .reduce((sum, txn) => sum + txn.summary.discountAmount, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive transaction management and reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {getTotalTransactions()} transactions
          </Badge>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalSales().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {getCompletedTransactions().length} completed transactions
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
              All statuses included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getAverageTransaction().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per completed transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${getTotalDiscounts().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total savings given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getTotalTransactions() > 0
                ? ((getCompletedTransactions().length / getTotalTransactions()) * 100).toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions, customers, products, sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            {(Object.keys(filters).length > 0 || searchTerm) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filter Panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Transaction Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as TransactionReview['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
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
                  <Label>Amount Range ($)</Label>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Discounts</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <History className="h-8 w-8 opacity-50" />
                        <p>No transactions found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {transaction.id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'h:mm:ss a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {transaction.summary.customerName || 'Walk-in Customer'}
                            </span>
                            {transaction.summary.customerType && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {transaction.summary.customerType}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {transaction.summary.sessionName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {transaction.summary.itemCount} item{transaction.summary.itemCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Subtotal: ${transaction.summary.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.summary.discountAmount > 0 ? (
                          <span className="text-sm text-red-600 font-medium">
                            -${transaction.summary.discountAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-lg">
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
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transactionId={selectedTransactionId}
      />
    </div>
  );
}