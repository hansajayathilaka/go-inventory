import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Calendar,
  Info
} from 'lucide-react';
import { usePOSCustomerStore } from '@/stores/pos/posCustomerStore';
import type { Customer } from '@/services/customerService';
import { formatDate, formatCurrency } from '@/lib/utils';

interface CustomerInfoProps {
  sessionId: string;
  className?: string;
}

interface CustomerDetails extends Customer {
  purchase_history?: Array<{
    id: string;
    date: string;
    amount: number;
    items_count: number;
  }>;
}

export function CustomerInfo({ sessionId, className }: CustomerInfoProps) {
  const { getSessionCustomer } = usePOSCustomerStore();
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const selectedCustomer = getSessionCustomer(sessionId);

  const loadCustomerDetails = async (customerId: number) => {
    setIsLoadingDetails(true);
    try {
      // Import here to avoid circular dependencies
      const { customerService } = await import('@/services/customerService');
      const details = await customerService.getCustomer(customerId);

      // For now, we'll use mock purchase history since it's not in the current API
      const detailsWithHistory: CustomerDetails = {
        ...details,
        purchase_history: [
          // Mock data - in real implementation, this would come from the API
          {
            id: '1',
            date: '2024-09-20',
            amount: 45.99,
            items_count: 3,
          },
          {
            id: '2',
            date: '2024-09-15',
            amount: 23.50,
            items_count: 1,
          },
        ],
      };

      setCustomerDetails(detailsWithHistory);
    } catch (error) {
      console.error('Failed to load customer details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (isDetailsDialogOpen && selectedCustomer && typeof selectedCustomer.id === 'number') {
      loadCustomerDetails(selectedCustomer.id);
    }
  }, [isDetailsDialogOpen, selectedCustomer]);

  if (!selectedCustomer) {
    return null;
  }

  const isWalkIn = selectedCustomer.id === 'walk-in';
  const isQuickCustomer = 'isQuickCustomer' in selectedCustomer && selectedCustomer.isQuickCustomer;

  return (
    <div className={className}>
      <Card className="p-3">
        <div className="space-y-3">
          {/* Customer Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{selectedCustomer.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {isWalkIn && (
                <Badge variant="secondary" className="text-xs">
                  Walk-in
                </Badge>
              )}
              {isQuickCustomer && (
                <Badge variant="outline" className="text-xs">
                  Quick
                </Badge>
              )}
              {!isWalkIn && !isQuickCustomer && typeof selectedCustomer.id === 'number' && (
                <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2">
                      <Info className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Customer Details</DialogTitle>
                      <DialogDescription>
                        Complete information for {selectedCustomer.name}
                      </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetails ? (
                      <div className="py-8 text-center text-muted-foreground">
                        Loading customer details...
                      </div>
                    ) : customerDetails ? (
                      <CustomerDetailsView customer={customerDetails} />
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Failed to load customer details
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            {!isWalkIn && 'code' in selectedCustomer && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Code: {selectedCustomer.code}</span>
              </div>
            )}

            {'phone' in selectedCustomer && selectedCustomer.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{selectedCustomer.phone}</span>
              </div>
            )}

            {'email' in selectedCustomer && selectedCustomer.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{selectedCustomer.email}</span>
              </div>
            )}

            {!isWalkIn && !isQuickCustomer && (
              <>
                {(selectedCustomer as Customer).city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{(selectedCustomer as Customer).city}</span>
                  </div>
                )}

                {(selectedCustomer as Customer).total_purchases !== undefined && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    <span>Total: {formatCurrency((selectedCustomer as Customer).total_purchases || 0)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

interface CustomerDetailsViewProps {
  customer: CustomerDetails;
}

function CustomerDetailsView({ customer }: CustomerDetailsViewProps) {
  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="space-y-3">
        <h4 className="font-medium">Contact Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Name</div>
            <div className="font-medium">{customer.name}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Customer Code</div>
            <div className="font-medium">{customer.code}</div>
          </div>
          {customer.phone && (
            <div>
              <div className="text-muted-foreground">Phone</div>
              <div className="font-medium">{customer.phone}</div>
            </div>
          )}
          {customer.email && (
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-medium truncate">{customer.email}</div>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      {(customer.address || customer.city) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Address</h4>
            <div className="text-sm space-y-1">
              {customer.address && (
                <div>{customer.address}</div>
              )}
              <div className="flex gap-2">
                {customer.city && <span>{customer.city}</span>}
                {customer.state && <span>{customer.state}</span>}
                {customer.zip_code && <span>{customer.zip_code}</span>}
              </div>
              {customer.country && (
                <div>{customer.country}</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Account Summary */}
      <Separator />
      <div className="space-y-3">
        <h4 className="font-medium">Account Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Total Purchases</div>
            <div className="font-medium">{formatCurrency(customer.total_purchases || 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last Purchase</div>
            <div className="font-medium">
              {customer.last_purchase_date ? formatDate(customer.last_purchase_date) : 'None'}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Member Since</div>
            <div className="font-medium">{formatDate(customer.created_at)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Status</div>
            <div>
              <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                {customer.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      {customer.purchase_history && customer.purchase_history.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium">Recent Purchases</h4>
            <div className="space-y-2">
              {customer.purchase_history.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{formatDate(purchase.date)}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{formatCurrency(purchase.amount)}</div>
                    <div className="text-muted-foreground">
                      {purchase.items_count} item{purchase.items_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}