import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  UserPlus,
  Search,
  Clock,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { usePOSCustomerStore } from '@/stores/pos/posCustomerStore';
import type { Customer } from '@/services/customerService';

interface CustomerSelectProps {
  sessionId: string;
  className?: string;
}

interface QuickCustomerFormData {
  name: string;
  phone: string;
  email: string;
}

export function CustomerSelect({ sessionId, className }: CustomerSelectProps) {
  const {
    recentCustomers: rawRecentCustomers,
    searchResults: rawSearchResults,
    isSearching,
    searchError,
    selectCustomer,
    clearCustomer,
    getSessionCustomer,
    searchCustomers,
    clearSearch,
    createQuickCustomer,
    selectWalkInCustomer,
    loadRecentCustomers,
  } = usePOSCustomerStore();

  // Deduplicate customers to prevent duplicate rows in UI
  const recentCustomers = rawRecentCustomers.filter((customer, index, array) =>
    array.findIndex(c => String(c.id) === String(customer.id)) === index
  );

  const searchResults = rawSearchResults.filter((customer, index, array) =>
    array.findIndex(c => String(c.id) === String(customer.id)) === index
  );

  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isQuickCustomerDialogOpen, setIsQuickCustomerDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCustomerData, setQuickCustomerData] = useState<QuickCustomerFormData>({
    name: '',
    phone: '',
    email: '',
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedCustomer = getSessionCustomer(sessionId);

  // Load recent customers on component mount and set walk-in as default
  useEffect(() => {
    if (recentCustomers.length === 0) {
      loadRecentCustomers();
    }

    // Set walk-in as default customer if no customer is selected
    if (!selectedCustomer) {
      selectWalkInCustomer(sessionId);
    }
  }, [loadRecentCustomers, recentCustomers.length, selectedCustomer, selectWalkInCustomer, sessionId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(async () => {
        await searchCustomers(searchQuery);
      }, 300);
    } else {
      clearSearch();
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchCustomers, clearSearch]);

  const handleCustomerSelect = (customer: Customer) => {
    selectCustomer(sessionId, customer);
    setIsCustomerDialogOpen(false);
    setSearchQuery('');
  };

  const handleWalkInSelect = () => {
    selectWalkInCustomer(sessionId);
    setIsCustomerDialogOpen(false);
  };

  const handleQuickCustomerCreate = () => {
    if (!quickCustomerData.name.trim()) return;

    createQuickCustomer(
      sessionId,
      quickCustomerData.name,
      quickCustomerData.phone || undefined,
      quickCustomerData.email || undefined
    );

    setIsQuickCustomerDialogOpen(false);
    setIsCustomerDialogOpen(false);
    setQuickCustomerData({ name: '', phone: '', email: '' });
  };

  const handleClearCustomer = () => {
    clearCustomer(sessionId);
  };

  const formatCustomerDisplay = (customer: Customer | { id: string | number; name: string; isQuickCustomer?: boolean; code?: string }) => {
    if (customer.id === 'walk-in') {
      return customer.name;
    }
    if ('isQuickCustomer' in customer && customer.isQuickCustomer) {
      return `${customer.name} (Quick)`;
    }
    return `${customer.name} (${customer.code || ''})`;
  };

  const getCustomerIcon = (customer: Customer | { id: string | number; isQuickCustomer?: boolean }) => {
    if (customer.id === 'walk-in') {
      return <User className="h-4 w-4" />;
    }
    if ('isQuickCustomer' in customer && customer.isQuickCustomer) {
      return <UserPlus className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  return (
    <div className={className}>
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogTrigger asChild>
          {selectedCustomer ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-1 justify-start">
                {getCustomerIcon(selectedCustomer)}
                <span className="ml-2 truncate">{formatCustomerDisplay(selectedCustomer)}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCustomer}
                className="px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Select Customer
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>
              Choose a customer for this transaction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleWalkInSelect}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Walk-in</div>
                  <div className="text-xs text-muted-foreground">No customer info</div>
                </div>
              </Button>

              <Dialog open={isQuickCustomerDialogOpen} onOpenChange={setIsQuickCustomerDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="text-center">
                      <UserPlus className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">Quick Customer</div>
                      <div className="text-xs text-muted-foreground">Name only</div>
                    </div>
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Quick Customer</DialogTitle>
                    <DialogDescription>
                      Add customer with basic information
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div>
                      <Input
                        placeholder="Customer name *"
                        value={quickCustomerData.name}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Phone number (optional)"
                        value={quickCustomerData.phone}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Email (optional)"
                        type="email"
                        value={quickCustomerData.email}
                        onChange={(e) => setQuickCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsQuickCustomerDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleQuickCustomerCreate}
                        disabled={!quickCustomerData.name.trim()}
                        className="flex-1"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {/* Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchError && (
                <div className="text-sm text-destructive">{searchError}</div>
              )}
            </div>

            {/* Results */}
            <div className="h-64 overflow-y-auto">
              <div className="space-y-2">
                {/* Recent Customers (when no search) */}
                {!searchQuery && recentCustomers.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      Recent Customers
                    </div>
                    {recentCustomers.map((customer, index) => (
                      <CustomerCard
                        key={`recent-${customer.id}-${index}`}
                        customer={customer}
                        onSelect={handleCustomerSelect}
                      />
                    ))}
                  </>
                )}

                {/* Search Results */}
                {searchQuery && (
                  <>
                    {isSearching && (
                      <div className="text-center py-4 text-muted-foreground">
                        Searching...
                      </div>
                    )}

                    {!isSearching && searchResults.length === 0 && searchQuery && (
                      <div className="text-center py-4 text-muted-foreground">
                        No customers found for "{searchQuery}"
                      </div>
                    )}

                    {searchResults.map((customer, index) => (
                      <CustomerCard
                        key={`search-${customer.id}-${index}`}
                        customer={customer}
                        onSelect={handleCustomerSelect}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CustomerCardProps {
  customer: Customer;
  onSelect: (customer: Customer) => void;
}

function CustomerCard({ customer, onSelect }: CustomerCardProps) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelect(customer)}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">{customer.name}</div>
          <Badge variant="secondary" className="text-xs">
            {customer.code}
          </Badge>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          {customer.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{customer.city}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}