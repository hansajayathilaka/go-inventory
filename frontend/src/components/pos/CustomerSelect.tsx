import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  User, 
  Search, 
  X, 
  UserPlus, 
  Phone, 
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/api';
import type { Customer } from '@/types/inventory';
import type { PaginatedResponse } from '@/types/api';

interface CustomerSelectProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  onQuickCreateCustomer?: (customerData: Partial<Customer>) => Promise<Customer>;
  className?: string;
}

interface CustomerSearchResult {
  customers: Customer[];
  isLoading: boolean;
  searchTerm: string;
  hasMore: boolean;
}

interface QuickCreateCustomerData {
  name: string;
  phone: string;
  email?: string;
}

interface RecentPurchase {
  id: number;
  date: string;
  total: number;
  item_count: number;
}

// Walk-in customer constant
const WALK_IN_CUSTOMER: Customer = {
  id: -1,
  name: "Walk-in Customer",
  email: undefined,
  phone: undefined,
  address: undefined,
  city: undefined,
  country: undefined,
  tax_id: undefined,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Quick Create Customer Dialog
interface QuickCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCustomer: (data: QuickCreateCustomerData) => Promise<void>;
  isCreating: boolean;
}

function QuickCreateDialog({ isOpen, onClose, onCreateCustomer, isCreating }: QuickCreateDialogProps) {
  const [formData, setFormData] = useState<QuickCreateCustomerData>({
    name: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<QuickCreateCustomerData>>({});

  const validateForm = () => {
    const newErrors: Partial<QuickCreateCustomerData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onCreateCustomer(formData);
      setFormData({ name: '', phone: '', email: '' });
      setErrors({});
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quick Create Customer
          </DialogTitle>
          <DialogDescription>
            Add a new customer to the system and automatically select them for this transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name *</Label>
            <Input
              id="customer-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer full name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone *</Label>
            <Input
              id="customer-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email (optional)</Label>
            <Input
              id="customer-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Recent Purchase History Component
interface RecentPurchasesProps {
  customer: Customer;
}

function RecentPurchases({ customer }: RecentPurchasesProps) {
  const [purchases, setPurchases] = useState<RecentPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRecentPurchases = async () => {
      if (customer.id === -1) return; // Skip for walk-in customer
      
      setIsLoading(true);
      try {
        // Mock implementation - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API response
        const mockPurchases: RecentPurchase[] = [
          { id: 1, date: '2024-01-15', total: 89.99, item_count: 3 },
          { id: 2, date: '2024-01-10', total: 45.50, item_count: 1 },
          { id: 3, date: '2024-01-05', total: 156.75, item_count: 5 },
        ];
        
        setPurchases(mockPurchases);
      } catch (error) {
        console.error('Failed to fetch recent purchases:', error);
        setPurchases([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPurchases();
  }, [customer.id]);

  if (customer.id === -1 || isLoading) {
    return null;
  }

  if (purchases.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No recent purchases found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">Recent Purchases:</div>
      {purchases.slice(0, 3).map((purchase) => (
        <div key={purchase.id} className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{new Date(purchase.date).toLocaleDateString()}</span>
            <span className="text-muted-foreground">({purchase.item_count} items)</span>
          </div>
          <span className="font-medium">${purchase.total.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// Customer List Item Component
interface CustomerListItemProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: () => void;
}

function CustomerListItem({ customer, isSelected, onSelect }: CustomerListItemProps) {
  const isWalkIn = customer.id === -1;
  
  return (
    <CommandItem
      key={customer.id}
      value={customer.id.toString()}
      onSelect={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 p-3 cursor-pointer",
        isSelected && "bg-primary/10"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            isWalkIn ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
          )}>
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{customer.name}</div>
            {customer.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSelected && (
            <CheckCircle className="h-4 w-4 text-primary" />
          )}
          {isWalkIn && (
            <Badge variant="secondary" className="text-xs">Walk-in</Badge>
          )}
          {!isWalkIn && customer.is_active && (
            <Badge variant="outline" className="text-xs text-green-600">Active</Badge>
          )}
        </div>
      </div>
      
      {customer.email && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          {customer.email}
        </div>
      )}
      
      {customer.city && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {customer.city}
        </div>
      )}
      
      {!isWalkIn && <RecentPurchases customer={customer} />}
    </CommandItem>
  );
}

// Main CustomerSelect Component
export function CustomerSelect({ 
  selectedCustomer, 
  onCustomerSelect, 
  onQuickCreateCustomer,
  className 
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<CustomerSearchResult>({
    customers: [],
    isLoading: false,
    searchTerm: '',
    hasMore: false,
  });
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length === 0) {
      setSearchResult({
        customers: [WALK_IN_CUSTOMER],
        isLoading: false,
        searchTerm: query,
        hasMore: false,
      });
      return;
    }

    setSearchResult(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await apiClient.get<PaginatedResponse<Customer>>(
        `/customers?search=${encodeURIComponent(query)}&limit=10&page=1`
      );
      
      const customers = response.data.data || [];
      
      // Always include walk-in customer option
      const allCustomers = [WALK_IN_CUSTOMER, ...customers];
      
      setSearchResult({
        customers: allCustomers,
        isLoading: false,
        searchTerm: query,
        hasMore: response.data.pagination?.has_next || false,
      });
    } catch (error) {
      console.error('Failed to search customers:', error);
      setSearchResult({
        customers: [WALK_IN_CUSTOMER],
        isLoading: false,
        searchTerm: query,
        hasMore: false,
      });
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchCustomers(query);
    }, 300);
  }, [searchCustomers]);

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, debouncedSearch]);

  // Load initial customers when opened
  useEffect(() => {
    if (open && searchResult.customers.length === 0) {
      searchCustomers('');
    }
  }, [open, searchResult.customers.length, searchCustomers]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    onCustomerSelect(customer);
    setOpen(false);
  }, [onCustomerSelect]);

  const handleClearSelection = useCallback(() => {
    onCustomerSelect(null);
  }, [onCustomerSelect]);

  const handleQuickCreate = useCallback(async (data: QuickCreateCustomerData) => {
    if (!onQuickCreateCustomer) {
      // If no custom handler provided, use default API call
      setIsCreating(true);
      try {
        const response = await apiClient.post<Customer>('/customers', {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          is_active: true,
        });
        
        const newCustomer = response.data;
        onCustomerSelect(newCustomer);
        
        // Refresh search results to include the new customer
        searchCustomers(searchTerm);
      } catch (error) {
        console.error('Failed to create customer:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    } else {
      setIsCreating(true);
      try {
        const newCustomer = await onQuickCreateCustomer(data);
        onCustomerSelect(newCustomer);
        
        // Refresh search results to include the new customer
        searchCustomers(searchTerm);
      } catch (error) {
        console.error('Failed to create customer:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    }
  }, [onQuickCreateCustomer, onCustomerSelect, searchCustomers, searchTerm]);

  const displayValue = useMemo(() => {
    if (!selectedCustomer) return 'Select customer...';
    if (selectedCustomer.id === -1) return 'Walk-in Customer';
    return selectedCustomer.name;
  }, [selectedCustomer]);

  const selectedCustomerStatus = useMemo(() => {
    if (!selectedCustomer) return null;
    if (selectedCustomer.id === -1) return 'walk-in';
    return selectedCustomer.is_active ? 'active' : 'inactive';
  }, [selectedCustomer]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Selection
          </div>
          {selectedCustomer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-gray-500 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label>Selected Customer</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-auto min-h-[40px] p-3"
              >
                <div className="flex items-center gap-2">
                  {selectedCustomer ? (
                    <>
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full",
                        selectedCustomerStatus === 'walk-in' 
                          ? "bg-orange-100 text-orange-600"
                          : "bg-blue-100 text-blue-600"
                      )}>
                        <User className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{displayValue}</span>
                      {selectedCustomerStatus === 'walk-in' && (
                        <Badge variant="secondary" className="text-xs">Walk-in</Badge>
                      )}
                      {selectedCustomerStatus === 'active' && (
                        <Badge variant="outline" className="text-xs text-green-600">Active</Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{displayValue}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {selectedCustomer && selectedCustomer.id !== -1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelection();
                      }}
                      className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <CommandInput
                    placeholder="Search customers..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <CommandList>
                  {searchResult.isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        Searching customers...
                      </div>
                    </div>
                  ) : (
                    <>
                      {searchResult.customers.length === 0 ? (
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-2 py-6">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium">No customers found</p>
                              <p className="text-xs text-muted-foreground">
                                Try a different search term or create a new customer
                              </p>
                            </div>
                          </div>
                        </CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {searchResult.customers.map((customer) => (
                            <CustomerListItem
                              key={customer.id}
                              customer={customer}
                              isSelected={selectedCustomer?.id === customer.id}
                              onSelect={() => handleCustomerSelect(customer)}
                            />
                          ))}
                        </CommandGroup>
                      )}
                      
                      {/* Quick Create Button */}
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setShowQuickCreate(true);
                            setOpen(false);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create New Customer
                        </Button>
                      </div>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Customer Details */}
        {selectedCustomer && selectedCustomer.id !== -1 && (
          <div className="p-3 bg-blue-50 rounded-md border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{selectedCustomer.name}</h4>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedCustomer.phone}
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.city && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {selectedCustomer.city}
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs text-green-600">
                {selectedCustomer.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="mt-3">
              <RecentPurchases customer={selectedCustomer} />
            </div>
          </div>
        )}

        {/* Walk-in Customer Notice */}
        {selectedCustomer && selectedCustomer.id === -1 && (
          <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600">
                <User className="h-3 w-3" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-orange-800">Walk-in Customer</h4>
                <p className="text-xs text-orange-600">
                  This transaction will be processed without storing customer information.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Quick Create Dialog */}
      <QuickCreateDialog
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onCreateCustomer={handleQuickCreate}
        isCreating={isCreating}
      />
    </Card>
  );
}